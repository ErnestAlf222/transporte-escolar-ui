<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { listarClientes } from '@/features/clientes/api/clientes'
import type { ClienteListItem, EstatusCliente } from '@/features/clientes/types/cliente'
import DropdownSelect from '@/shared/ui/DropdownSelect.vue'
import Spinner from '@/shared/ui/Spinner.vue'
import SinResultados from '@/shared/ui/SinResultados.vue'
import BuscadorInput from '@/shared/ui/BuscadorInput.vue'
import EncabezadoFijo from '@/shared/ui/EncabezadoFijo.vue'
import ClienteDetalleModal from '@/features/clientes/components/ClienteDetalleModal.vue'
import WhatsappIcon from '@/shared/ui/icons/WhatsappIcon.vue'
import TelegramIcon from '@/shared/ui/icons/TelegramIcon.vue'
import { telefonoInternacional } from '@/shared/utils/telefono'
import { filtrarPorAlumnoOTutor, type CamposDeBusqueda } from '@/shared/utils/busqueda'
import { inicialesDeTexto, nombreCompletoEstricto } from '@/shared/utils/nombres'
import { useDestello } from '@/shared/composables/useDestello'
import { useFamilias } from '@/shared/composables/useFamilias'
import { useOpcionesEscuela } from '@/shared/composables/useOpcionesEscuela'
import type { Familia as FamiliaDe } from '@/shared/utils/familias'

const opcionesEstatus = [
    { value: 'activo', label: 'Activos' },
    { value: 'archivado', label: 'Archivados' },
]

const { opciones: opcionesEscuela, cargar: cargarEscuelas } = useOpcionesEscuela('Todas las escuelas')

const clientes = ref<ClienteListItem[]>([])
const cargando = ref(true)
const error = ref('')
const filtroEstatus = ref<EstatusCliente>('activo')
const filtroEscuela = ref('')
const busqueda = ref('')

const CAMPOS_BUSQUEDA: CamposDeBusqueda<ClienteListItem> = {
    nombresAlumno: (c) => [c.nombre_alumno, c.apellido_paterno_alumno, c.apellido_materno_alumno],
    telefonoTutor: (c) => c.telefono_tutor,
    nombreTutor: (c) => c.nombre_tutor,
}

// Primero se busca entre los alumnos; solo si ninguno coincide se busca por el nombre del tutor
const clientesFiltrados = computed(() =>
    filtrarPorAlumnoOTutor(clientes.value, busqueda.value, CAMPOS_BUSQUEDA),
)

// Una fila por tutor con sus alumnos; quien no tiene tutor va solo.
// El backend ordena por nombre de alumno, así que alumnos[0] es el primero alfabéticamente.
// alumnoPrincipal: el alumno que da la cara por la familia (el primero que coincide con lo buscado, o el primero de la lista).
// coincidePorTutor: la búsqueda coincidió con el tutor y con ningún alumno, y la tarjeta se titula con el tutor.
type Familia = FamiliaDe<ClienteListItem>
const { familias, alumnoPrincipal, coincidePorTutor } = useFamilias(
    () => clientesFiltrados.value,
    () => busqueda.value,
    CAMPOS_BUSQUEDA,
    'c',
)

// Qué iluminar al abrir el detalle: lo que se buscó, 3 segundos y se apaga
const { resaltado, iluminar } = useDestello<'tutor' | 'alumno' | ''>('')

function abrirDesdeTarjeta(f: Familia) {
    iluminar(!busqueda.value.trim() ? '' : coincidePorTutor(f) ? 'tutor' : 'alumno', () =>
        abrirDetalle(alumnoPrincipal(f).id),
    )
}

// Índice alfabético tipo Contactos: por la primera letra del primer alumno de cada familia
const clientesAgrupados = computed(() => {
    const grupos: Record<string, Familia[]> = {}
    for (const familia of familias.value) {
        const letra = (familia.alumnos[0]!.nombre_alumno.trim()[0] ?? '#').toUpperCase()
        if (!grupos[letra]) grupos[letra] = []
        grupos[letra].push(familia)
    }
    return grupos
})

const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function irALetra(letra: string) {
    if (!clientesAgrupados.value[letra]) return
    document.getElementById(`letra-${letra}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const route = useRoute()
const router = useRouter()

// El detalle/edición se maneja por URL, no por variable local — así el navegador recuerda
// el historial y "regresar" desde editar te devuelve exacto al cliente que estabas viendo
const clienteIdActivo = computed(() => {
    const id = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
    const numero = Number(id)
    return id !== undefined && Number.isFinite(numero) ? numero : null
})

const modoEdicion = computed(() => route.name === 'cliente-editar')

function abrirDetalle(id: number) {
    router.push({ name: 'cliente-detalle', params: { id } })
}

function cerrarDetalle() {
    router.push({ name: 'clientes' })
}

function abrirEdicion() {
    if (clienteIdActivo.value !== null) {
        router.push({ name: 'cliente-editar', params: { id: clienteIdActivo.value } })
    }
}

function cancelarEdicion() {
    router.back()
}

function alGuardar() {
    recargarSilencioso()
    router.back()
}

function iniciales(cliente: ClienteListItem): string {
    return `${cliente.nombre_alumno[0] ?? ''}${cliente.apellido_paterno_alumno[0] ?? ''}`.toUpperCase()
}

function textoTutorFamilia(f: Familia): string {
    return f.nombre_tutor ? `Tutor: ${f.nombre_tutor}` : 'Registro del propio alumno'
}

// Si todos van a la misma escuela sale una vez; si no, se listan separadas por un punto
function textoEscuelas(f: Familia): string {
    const nombres = new Set(f.alumnos.map((a) => a.nombre_escuela).filter(Boolean))
    return [...nombres].join(' · ')
}

function textoPago(f: Familia): string {
    const metodos = new Set(f.alumnos.map((a) => a.metodo_pago))
    if (metodos.size > 1) return 'Pago mixto'
    return f.alumnos[0]!.metodo_pago === 'digital' ? 'Pago digital' : 'Pago en efectivo'
}

async function cargar() {
    cargando.value = true
    error.value = ''
    try {
        clientes.value = await listarClientes({
            estatus: filtroEstatus.value,
            escuela_id: filtroEscuela.value ? Number(filtroEscuela.value) : undefined,
        })
    } catch {
        error.value = 'No se pudo cargar el listado de clientes'
    } finally {
        cargando.value = false
    }
}
// Refresca el listado sin spinner ni parpadeo (al guardar una edición)
async function recargarSilencioso() {
    try {
        clientes.value = await listarClientes({
            estatus: filtroEstatus.value,
            escuela_id: filtroEscuela.value ? Number(filtroEscuela.value) : undefined,
        })
    } catch {
        // Se conserva el listado actual
    }
}

onMounted(() => {
    cargar()
    cargarEscuelas()
})
</script>

<template>
    <div>
        <EncabezadoFijo :relleno="4" class="mb-2 flex flex-wrap items-center justify-between gap-3">
            <h1 class="text-2xl font-semibold text-text-primary">Clientes</h1>
            <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                <BuscadorInput v-model="busqueda" placeholder="Buscar por alumno, tutor o teléfono"
                    class="w-full sm:w-80 sm:flex-none" />
                <div class="flex gap-3">
                    <DropdownSelect v-model="filtroEscuela" :opciones="opcionesEscuela" @update:model-value="cargar" />
                    <DropdownSelect v-model="filtroEstatus" :opciones="opcionesEstatus" @update:model-value="cargar" />
                </div>
            </div>
        </EncabezadoFijo>

        <div v-if="cargando" class="flex items-center gap-2 text-text-secondary">
            <Spinner />
            Cargando...
        </div>
        <p v-else-if="error" class="text-danger">{{ error }}</p>
        <p v-else-if="clientes.length === 0" class="text-text-secondary">No hay clientes en esta categoría.</p>

        <Transition v-else enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-1" enter-to-class="opacity-100 translate-y-0" mode="out-in">
            <SinResultados v-if="clientesFiltrados.length === 0" key="vacio"
                :mensaje="`No encontramos coincidencias para &quot;${busqueda}&quot;`" />

            <div v-else key="lista" class="flex gap-3">
                <nav class="sticky top-0 -ml-2 flex shrink-0 flex-col items-center gap-0.5 self-start py-1 sm:ml-0">
                    <button v-for="letra in alfabeto" :key="letra" type="button" :disabled="!clientesAgrupados[letra]"
                        class="text-base font-semibold leading-tight sm:text-sm"
                        :class="clientesAgrupados[letra] ? 'text-accent hover:opacity-70' : 'text-text-secondary/30 cursor-default'"
                        @click="irALetra(letra)">
                        {{ letra }}
                    </button>
                </nav>

                <div class="flex flex-1 flex-col gap-3">
                    <template v-for="letra in Object.keys(clientesAgrupados).sort()" :key="letra">
                        <p :id="`letra-${letra}`"
                            class="scroll-mt-4 text-xs font-semibold uppercase text-text-secondary">
                            {{ letra }}
                        </p>
                        <div v-for="familia in clientesAgrupados[letra]" :key="familia.clave"
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
                                                nombreCompletoEstricto(alumnoPrincipal(familia)) }}
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
                                            {{ coincidePorTutor(familia) ? `${familia.alumnos.length}
                                            ${familia.alumnos.length === 1 ? 'alumno' : 'alumnos'}` :
                                                textoTutorFamilia(familia) }}
                                        </p>
                                        <p v-if="textoEscuelas(familia)" class="text-xs text-text-secondary">
                                            {{ textoEscuelas(familia) }}
                                        </p>
                                    </div>
                                </div>

                                <span
                                    class="shrink-0 rounded-card bg-accent/15 px-2 py-1 text-xs font-medium text-accent">
                                    {{ textoPago(familia) }}
                                </span>
                            </div>

                            <div class="flex flex-wrap items-center gap-3">
                                <p class="text-sm text-text-secondary">{{ familia.telefono_tutor }}</p>

                                <div class="flex items-center gap-3">
                                    <a :href="`https://wa.me/${telefonoInternacional(familia.telefono_tutor)}`"
                                        target="_blank" rel="noopener" class="hover:opacity-80" title="Abrir WhatsApp"
                                        @click.stop>
                                        <WhatsappIcon class="h-5 w-5" />
                                    </a>
                                    <a :href="`https://t.me/+${telefonoInternacional(familia.telefono_tutor)}`"
                                        target="_blank" rel="noopener" class="hover:opacity-80" title="Abrir Telegram"
                                        @click.stop>
                                        <TelegramIcon class="h-5 w-5" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </Transition>

        <!-- Modal de detalle del cliente -->
        <ClienteDetalleModal :cliente-id="clienteIdActivo" :modo-edicion="modoEdicion" :resaltar="resaltado"
            @close="cerrarDetalle" @editar="abrirEdicion" @cancelar-edicion="cancelarEdicion" @guardado="alGuardar"
            @abrir="abrirDetalle" @dinero-guardado="recargarSilencioso" @estatus-cambiado="recargarSilencioso" />
    </div>
</template>