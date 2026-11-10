<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { escucharEventosProspectos, listarProspectos } from '@/features/prospectos/api/prospectos'
import type { ProspectoListItem, EstatusProspecto } from '@/features/prospectos/types/prospecto'
import DropdownSelect from '@/shared/ui/DropdownSelect.vue'
import Spinner from '@/shared/ui/Spinner.vue'
import SinResultados from '@/shared/ui/SinResultados.vue'
import BuscadorInput from '@/shared/ui/BuscadorInput.vue'
import EncabezadoFijo from '@/shared/ui/EncabezadoFijo.vue'
import ProspectoDetalleModal from '@/features/prospectos/components/ProspectoDetalleModal.vue'
import WhatsappIcon from '@/shared/ui/icons/WhatsappIcon.vue'
import TelegramIcon from '@/shared/ui/icons/TelegramIcon.vue'
import { telefonoInternacional } from '@/shared/utils/telefono'
import { filtrarPorAlumnoOTutor, type CamposDeBusqueda } from '@/shared/utils/busqueda'
import { inicialesDeTexto } from '@/shared/utils/nombres'
import { useDestello } from '@/shared/composables/useDestello'
import { useFamilias } from '@/shared/composables/useFamilias'
import { useOpcionesEscuela } from '@/shared/composables/useOpcionesEscuela'
import type { Familia as FamiliaDe } from '@/shared/utils/familias'
import { ESPERA_RECONEXION_MS } from '@/shared/constants/tiempo'
import { TEXTO_SIN_ASIGNAR } from '@/features/prospectos/constants/prospectos'

const route = useRoute()
const router = useRouter()

// Escuela va primero: es el filtro de primer nivel del negocio, tal como se definió desde
// la planeación original (cada escuela se gestiona como su propio universo de prospectos)
const { opciones: opcionesEscuela, cargar: cargarEscuelas } = useOpcionesEscuela('Todas las escuelas')
const opcionesEstatus = [
    { value: '', label: 'Todos' },
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'convertido', label: 'Convertidos' },
    { value: 'descartado', label: 'Descartados' },
]

const prospectos = ref<ProspectoListItem[]>([])
const cargando = ref(true)
const error = ref('')
const filtroEscuela = ref('')
const filtroEstatus = ref<EstatusProspecto | ''>('')
const busqueda = ref('')

const prospectoIdActivo = computed(() => {
    const id = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
    const numero = Number(id)
    return id !== undefined && Number.isFinite(numero) ? numero : null
})

function abrirDetalle(id: number) {
    router.push({ name: 'prospecto-detalle', params: { id } })
}

function cerrarDetalle() {
    router.push({ name: 'prospectos' })
}

// Los apellidos pueden venir vacíos
const CAMPOS_BUSQUEDA: CamposDeBusqueda<ProspectoListItem> = {
    nombresAlumno: (p) => [p.nombre_alumno, p.apellido_paterno_alumno, p.apellido_materno_alumno],
    telefonoTutor: (p) => p.telefono_tutor,
    nombreTutor: (p) => p.nombre_tutor,
}

// Primero se busca entre los alumnos; solo si ninguno coincide se busca por el nombre del tutor
const prospectosFiltrados = computed(() =>
    filtrarPorAlumnoOTutor(prospectos.value, busqueda.value, CAMPOS_BUSQUEDA),
)

// Una tarjeta por tutor con sus alumnos dentro. Quien se registró solo (sin tutor) va como tarjeta individual.
// El listado llega ordenado por fecha, así que las familias quedan ordenadas por su registro más reciente.
type Familia = FamiliaDe<ProspectoListItem>
const { familias, alumnoPrincipal, coincidePorTutor } = useFamilias(
    () => prospectosFiltrados.value,
    () => busqueda.value,
    CAMPOS_BUSQUEDA,
    'a',
)

// La familia se ve "pendiente" mientras al menos un alumno lo esté
function estatusFamilia(f: Familia): EstatusProspecto {
    if (f.alumnos.some((a) => a.estatus === 'pendiente')) return 'pendiente'
    return f.alumnos.every((a) => a.estatus === 'descartado') ? 'descartado' : 'convertido'
}

function textoTutor(f: Familia): string {
    return f.nombre_tutor ? `Tutor: ${f.nombre_tutor}` : 'Registro del propio alumno'
}

function iniciales(p: ProspectoListItem): string {
    return `${p.nombre_alumno[0] ?? ''}${p.apellido_paterno_alumno?.[0] ?? ''}`.toUpperCase()
}

function nombreAlumno(p: ProspectoListItem): string {
    return [p.nombre_alumno, p.apellido_paterno_alumno ?? '', p.apellido_materno_alumno ?? '']
        .map((s) => s.trim())
        .filter(Boolean)
        .join(' ')
}

// Qué iluminar al abrir el detalle: lo que se buscó, 3 segundos y se apaga
const { resaltado, iluminar } = useDestello<'tutor' | 'alumno' | ''>('')

function abrirDesdeTarjeta(f: Familia) {
    iluminar(!busqueda.value.trim() ? '' : coincidePorTutor(f) ? 'tutor' : 'alumno', () =>
        abrirDetalle(alumnoPrincipal(f).id),
    )
}

async function cargar() {
    cargando.value = true
    error.value = ''
    try {
        prospectos.value = await listarProspectos({
            escuela_id: filtroEscuela.value ? Number(filtroEscuela.value) : undefined,
            estatus: filtroEstatus.value || undefined,
        })
    } catch {
        error.value = 'No se pudo cargar el listado de prospectos'
    } finally {
        cargando.value = false
    }
}

function alConvertido() {
    cargar()
}

// Recarga sin el spinner de carga, para que la lista no parpadee al llegar un aviso
async function refrescar() {
    try {
        prospectos.value = await listarProspectos({
            escuela_id: filtroEscuela.value ? Number(filtroEscuela.value) : undefined,
            estatus: filtroEstatus.value || undefined,
        })
    } catch {
        // se conserva lo que ya se muestra
    }
}

let detener: AbortController | null = null

// Mantiene la conexión de tiempo real; si se cae, espera y reconecta, y refresca por si se perdió un aviso
async function suscribirEventos() {
    detener = new AbortController()
    const { signal } = detener
    while (!signal.aborted) {
        try {
            await escucharEventosProspectos(refrescar, signal)
        } catch {
            if (signal.aborted) return
        }
        if (signal.aborted) return
        await refrescar()
        await new Promise((resolver) => setTimeout(resolver, ESPERA_RECONEXION_MS))
    }
}

onMounted(() => {
    cargar()
    cargarEscuelas()
    suscribirEventos()
})

onUnmounted(() => {
    detener?.abort()
})
</script>

<template>
    <div>
        <EncabezadoFijo :relleno="4" class="mb-2 flex flex-wrap items-center justify-between gap-3">
            <h1 class="text-2xl font-semibold text-text-primary">Prospectos</h1>
            <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                <div class="flex gap-3">
                    <DropdownSelect v-model="filtroEscuela" :opciones="opcionesEscuela" @update:model-value="cargar" />
                    <DropdownSelect v-model="filtroEstatus" :opciones="opcionesEstatus" @update:model-value="cargar" />
                </div>
                <BuscadorInput v-model="busqueda" placeholder="Buscar por alumno, tutor o teléfono"
                    class="w-full sm:w-80 sm:flex-none" />
            </div>
        </EncabezadoFijo>

        <div v-if="cargando" class="flex items-center gap-2 text-text-secondary">
            <Spinner />
            Cargando...
        </div>
        <p v-else-if="error" class="text-danger">{{ error }}</p>
        <p v-else-if="prospectos.length === 0" class="text-text-secondary">No hay prospectos en esta categoría.</p>

        <Transition v-else enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-1" enter-to-class="opacity-100 translate-y-0" mode="out-in">
            <SinResultados v-if="prospectosFiltrados.length === 0" key="vacio"
                :mensaje="`No encontramos coincidencias para &quot;${busqueda}&quot;`" />

            <div v-else key="lista" class="flex flex-col gap-3">
                <div v-for="familia in familias" :key="familia.clave"
                    class="glass flex cursor-pointer flex-col gap-3 rounded-card p-4 transition hover:bg-panel-2 sm:flex-row sm:items-center sm:gap-4"
                    @click="abrirDesdeTarjeta(familia)">
                    <div class="flex items-start justify-between gap-3 sm:contents">
                        <div class="flex items-center gap-3 sm:min-w-0 sm:flex-1">
                            <div
                                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-panel-2 text-base font-semibold text-accent">
                                {{ coincidePorTutor(familia) ? inicialesDeTexto(familia.nombre_tutor) :
                                    iniciales(alumnoPrincipal(familia)) }}
                            </div>
                            <div class="min-w-0 flex-1">
                                <p class="font-semibold text-text-primary">
                                    {{ coincidePorTutor(familia) ? familia.nombre_tutor :
                                        nombreAlumno(alumnoPrincipal(familia)) }}
                                    <span v-if="coincidePorTutor(familia)"
                                        class="ml-1 rounded-card bg-accent/15 px-2 py-0.5 align-middle text-xs font-medium text-accent">
                                        Tutor · {{ familia.alumnos.length }}
                                    </span>
                                    <span v-else-if="familia.alumnos.length > 1"
                                        class="ml-1 rounded-card bg-accent/15 px-2 py-0.5 align-middle text-xs font-medium text-accent">
                                        +{{ familia.alumnos.length - 1 }}
                                    </span>
                                </p>
                                <p class="text-sm text-text-secondary">
                                    {{ coincidePorTutor(familia) ? `${familia.alumnos.length} ${familia.alumnos.length
                                        === 1 ? 'alumno' : 'alumnos'}` : textoTutor(familia) }}
                                </p>
                                <p class="text-xs text-text-secondary">
                                    {{ alumnoPrincipal(familia).nombre_escuela || TEXTO_SIN_ASIGNAR }}
                                </p>
                            </div>
                        </div>

                        <span class="shrink-0 rounded-card px-2 py-1 text-xs font-medium"
                            :class="estatusFamilia(familia) === 'pendiente' ? 'bg-sun/15 text-sun' : estatusFamilia(familia) === 'descartado' ? 'bg-danger/15 text-danger' : 'bg-mint/15 text-mint'">
                            {{ estatusFamilia(familia) === 'pendiente' ? 'Pendiente' : estatusFamilia(familia) ===
                                'descartado' ? 'Descartado' : 'Convertido' }}
                        </span>
                    </div>

                    <div class="flex flex-wrap items-center gap-3">
                        <p class="text-sm text-text-secondary">{{ familia.telefono_tutor }}</p>
                        <div class="flex items-center gap-3">
                            <a :href="`https://wa.me/${telefonoInternacional(familia.telefono_tutor)}`" target="_blank"
                                rel="noopener" title="Abrir WhatsApp" @click.stop>
                                <WhatsappIcon class="h-5 w-5" />
                            </a>
                            <a :href="`https://t.me/+${telefonoInternacional(familia.telefono_tutor)}`" target="_blank"
                                rel="noopener" title="Abrir Telegram" @click.stop>
                                <TelegramIcon class="h-5 w-5" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>

        <ProspectoDetalleModal :prospecto-id="prospectoIdActivo" :resaltar="resaltado" @close="cerrarDetalle"
            @convertido="alConvertido" @estatus-cambiado="alConvertido" @guardado="alConvertido"
            @abrir="abrirDetalle" />
    </div>
</template>