<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { escucharEventosProspectos, listarProspectos } from '@/api/prospectos'
import { listarEscuelas } from '@/api/escuelas'
import type { ProspectoListItem, EstatusProspecto } from '@/types/prospecto'
import DropdownSelect from '@/components/DropdownSelect.vue'
import Spinner from '@/components/Spinner.vue'
import SinResultados from '@/components/SinResultados.vue'
import ProspectoDetalleModal from '@/components/ProspectoDetalleModal.vue'
import { Search, X } from 'lucide-vue-next'
import WhatsappIcon from '@/components/icons/WhatsappIcon.vue'
import TelegramIcon from '@/components/icons/TelegramIcon.vue'
import { telefonoInternacional } from '@/utils/telefono'
import { coincideBusqueda } from '@/utils/busqueda'

const route = useRoute()
const router = useRouter()

// Escuela va primero: es el filtro de primer nivel del negocio, tal como se definió desde
// la planeación original (cada escuela se gestiona como su propio universo de prospectos)
const opcionesEscuela = ref([{ value: '', label: 'Todas las escuelas' }])
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

// Primero se busca entre los alumnos; solo si ninguno coincide se busca por el nombre del tutor
const prospectosFiltrados = computed(() => {
    if (!busqueda.value.trim()) return prospectos.value

    const porAlumno = prospectos.value.filter((p) => coincidePorAlumno(p))
    if (porAlumno.length > 0) return porAlumno

    return prospectos.value.filter((p) => coincideBusqueda(busqueda.value, [p.nombre_tutor], []))
})

interface Familia {
    clave: string
    nombre_tutor: string
    telefono_tutor: string
    alumnos: ProspectoListItem[]
}

// Una tarjeta por tutor con sus alumnos dentro. Quien se registró solo (sin tutor) va como tarjeta individual.
// El listado llega ordenado por fecha, así que las familias quedan ordenadas por su registro más reciente.
const familias = computed<Familia[]>(() => {
    const mapa = new Map<string, Familia>()
    for (const p of prospectosFiltrados.value) {
        const clave = p.tutor_id ? `t-${p.tutor_id}` : `a-${p.id}`
        let familia = mapa.get(clave)
        if (!familia) {
            familia = { clave, nombre_tutor: p.nombre_tutor, telefono_tutor: p.telefono_tutor, alumnos: [] }
            mapa.set(clave, familia)
        }
        familia.alumnos.push(p)
    }
    return [...mapa.values()]
})

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

// Un alumno coincide por su nombre y apellidos (los apellidos pueden venir vacíos) o por el teléfono del tutor
function coincidePorAlumno(p: ProspectoListItem): boolean {
    return coincideBusqueda(
        busqueda.value,
        [p.nombre_alumno, p.apellido_paterno_alumno ?? '', p.apellido_materno_alumno ?? ''],
        [p.telefono_tutor],
    )
}

function nombreAlumno(p: ProspectoListItem): string {
    return [p.nombre_alumno, p.apellido_paterno_alumno ?? '', p.apellido_materno_alumno ?? '']
        .map((s) => s.trim())
        .filter(Boolean)
        .join(' ')
}

// El alumno que da la cara por la familia: el primero que coincide con lo buscado, o el primero de la lista
function alumnoPrincipal(f: Familia): ProspectoListItem {
    if (busqueda.value.trim()) {
        const coincide = f.alumnos.find((p) => coincidePorAlumno(p))
        if (coincide) return coincide
    }
    return f.alumnos[0]!
}

// La búsqueda coincidió con el tutor y con ningún alumno: la tarjeta se titula con el tutor
function coincidePorTutor(f: Familia): boolean {
    if (!busqueda.value.trim() || !f.nombre_tutor) return false
    return !f.alumnos.some((p) => coincidePorAlumno(p))
}

// Dos primeras palabras del nombre: "Rosa Vega Soto" -> "RV"
function inicialesTexto(texto: string): string {
    return texto
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((palabra) => palabra[0] ?? '')
        .join('')
        .toUpperCase()
}

// Qué iluminar al abrir el detalle: lo que se buscó, 3 segundos y se apaga
const DURACION_DESTELLO_MS = 3000
const resaltado = ref<'tutor' | 'alumno' | ''>('')
let temporizadorDestello: ReturnType<typeof setTimeout> | undefined

function abrirDesdeTarjeta(f: Familia) {
    clearTimeout(temporizadorDestello)
    resaltado.value = !busqueda.value.trim() ? '' : coincidePorTutor(f) ? 'tutor' : 'alumno'
    abrirDetalle(alumnoPrincipal(f).id)
    temporizadorDestello = setTimeout(() => (resaltado.value = ''), DURACION_DESTELLO_MS)
}

async function cargarEscuelas() {
    const escuelas = await listarEscuelas()
    opcionesEscuela.value = [
        { value: '', label: 'Todas las escuelas' },
        ...escuelas.map((e) => ({
            value: String(e.id),
            label: e.turno ? `${e.nombre} (${e.turno})` : e.nombre,
        })),
    ]
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

const ESPERA_RECONEXION_MS = 3000
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
        <div
            class="sticky top-cabecera z-20 -mx-6 mb-2 flex flex-wrap items-center justify-between gap-3 bg-bg px-6 pb-4 pt-2">
            <h1 class="text-2xl font-semibold text-text-primary">Prospectos</h1>
            <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                <div class="flex gap-3">
                    <DropdownSelect v-model="filtroEscuela" :opciones="opcionesEscuela" @update:model-value="cargar" />
                    <DropdownSelect v-model="filtroEstatus" :opciones="opcionesEstatus" @update:model-value="cargar" />
                </div>
                <div class="relative w-full sm:w-80 sm:flex-none">
                    <Search
                        class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                    <input v-model="busqueda" type="text" placeholder="Buscar por alumno, tutor o teléfono"
                        class="w-full rounded-card border border-border bg-panel py-2 pl-9 pr-8 text-sm text-text-primary" />
                    <button v-if="busqueda" type="button" @click="busqueda = ''"
                        class="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary">
                        <X class="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>

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
                                {{ coincidePorTutor(familia) ? inicialesTexto(familia.nombre_tutor) :
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
                                <p v-if="alumnoPrincipal(familia).nombre_escuela" class="text-xs text-text-secondary">
                                    {{ alumnoPrincipal(familia).nombre_escuela }}
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