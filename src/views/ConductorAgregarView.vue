<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, Check, Plus, Search, X } from 'lucide-vue-next'
import { verAsignaciones } from '@/api/asignaciones'
import { verRutaConductor, guardarRutaConductor } from '@/api/conductores'
import type { AlumnoAsignacion } from '@/types/asignacion'
import { compararTexto } from '@/utils/orden'
import { inicial } from '@/utils/conductores'
import { colorEscuela } from '@/utils/escuelas'
import LoaderVan from '@/components/LoaderVan.vue'
import SinResultados from '@/components/SinResultados.vue'

const route = useRoute()
const router = useRouter()

const conductorId = computed(() => Number(route.params.id))

const alumnos = ref<AlumnoAsignacion[]>([])
const idsRuta = ref<number[]>([])
const nombreConductor = ref('')
const cargando = ref(true)
const error = ref('')
const errorAgregar = ref('')
const agregando = ref<number | null>(null)
const filtro = ref('') // vacío = todas las escuelas

async function cargar() {
    cargando.value = true
    error.value = ''
    try {
        const [asignaciones, ruta] = await Promise.all([verAsignaciones(), verRutaConductor(conductorId.value)])
        alumnos.value = asignaciones.alumnos
        idsRuta.value = ruta.paradas.map((p) => p.alumno_id)
        nombreConductor.value = ruta.conductor.nombre
    } catch {
        error.value = 'No se pudo cargar la lista de alumnos'
    } finally {
        cargando.value = false
    }
}

onMounted(cargar)

onUnmounted(() => {
    if (temporizadorGuardado) clearTimeout(temporizadorGuardado)
})

function volver() {
    router.push({ name: 'conductor-alumnos', params: { id: conductorId.value } })
}

function claveEscuela(a: AlumnoAsignacion): string {
    return a.escuela_id === null ? 'sin-escuela' : String(a.escuela_id)
}

// El botón de cada escuela usa el mismo color que sus etiquetas
function colorDe(clave: string) {
    return colorEscuela(clave === 'sin-escuela' ? null : Number(clave))
}

function etiquetaEscuela(a: AlumnoAsignacion): string {
    return a.turno ? `${a.escuela} (${a.turno})` : a.escuela
}

// Los que ya van con otro conductor no se ofrecen: solo los libres y los de este conductor
const disponibles = computed(() =>
    alumnos.value.filter((a) => a.conductor_id === null || a.conductor_id === conductorId.value),
)

const escuelas = computed(() => {
    const mapa = new Map<string, { clave: string; etiqueta: string; faltan: number }>()
    for (const a of disponibles.value) {
        const clave = claveEscuela(a)
        const escuela = mapa.get(clave) ?? { clave, etiqueta: etiquetaEscuela(a), faltan: 0 }
        if (a.conductor_id === null) escuela.faltan++
        mapa.set(clave, escuela)
    }
    return [...mapa.values()].sort((x, y) => compararTexto(x.etiqueta, y.etiqueta))
})

const busqueda = ref('')
const busquedaActiva = computed(() => busqueda.value.trim() !== '')

// Sin acentos ni mayúsculas: "angel" encuentra "Ángel"
function limpiar(texto: string): string {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

const visibles = computed(() => {
    const palabras = limpiar(busqueda.value).split(/\s+/).filter(Boolean)
    return disponibles.value
        .filter((a) => !filtro.value || claveEscuela(a) === filtro.value)
        .filter((a) => {
            const texto = limpiar(`${a.alumno} ${a.colonia ?? ''} ${etiquetaEscuela(a)}`)
            return palabras.every((p) => texto.includes(p))
        })
        .sort((x, y) => compararTexto(x.alumno, y.alumno))
})

const totalFaltan = computed(() => disponibles.value.filter((a) => a.conductor_id === null).length)

function yaEsta(a: AlumnoAsignacion): boolean {
    return a.conductor_id === conductorId.value
}

const guardado = ref(false)
let temporizadorGuardado: ReturnType<typeof setTimeout> | null = null

function avisarGuardado() {
    guardado.value = true
    if (temporizadorGuardado) clearTimeout(temporizadorGuardado)
    temporizadorGuardado = setTimeout(() => (guardado.value = false), 2500)
}

// El alumno entra al final de la ruta; el orden se cambia después, en la lista
async function agregar(a: AlumnoAsignacion) {
    if (agregando.value !== null || yaEsta(a)) return
    agregando.value = a.id
    errorAgregar.value = ''
    const nuevos = [...idsRuta.value, a.id]
    try {
        await guardarRutaConductor(conductorId.value, nuevos)
        idsRuta.value = nuevos
        a.conductor_id = conductorId.value
        avisarGuardado()
    } catch {
        errorAgregar.value = 'No se pudo agregar. Recarga la pantalla e inténtalo de nuevo'
    } finally {
        agregando.value = null
    }
}
</script>

<template>
    <div class="mx-auto max-w-5xl space-y-4">
        <button type="button" class="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
            @click="volver">
            <ChevronLeft class="h-5 w-5" />
            Sus alumnos
        </button>

        <LoaderVan v-if="cargando" />
        <p v-else-if="error" class="text-sm text-danger">{{ error }}</p>

        <template v-else>
            <div class="sticky top-cabecera z-25 -mx-6 space-y-4 bg-bg px-6 pb-3 pt-2">
                <div>
                    <h1 class="text-2xl font-semibold text-text-primary">Agregar alumnos</h1>
                    <p class="mt-1 text-sm text-text-secondary">
                        Escoge la escuela y pulsa Agregar · {{ totalFaltan }} sin conductor
                    </p>
                </div>

                <div class="glass-plano flex items-center gap-2 rounded-full px-4 py-2.5">
                    <Search class="h-4 w-4 shrink-0 text-text-secondary" />
                    <input v-model="busqueda" type="text" inputmode="search"
                        placeholder="Buscar alumno, colonia o escuela"
                        class="min-w-0 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary/70 focus:outline-none" />
                    <button v-if="busqueda" type="button" class="shrink-0 text-text-secondary hover:text-text-primary"
                        aria-label="Borrar búsqueda" @click="busqueda = ''">
                        <X class="h-4 w-4" />
                    </button>
                </div>

                <div
                    class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible">
                    <button type="button" class="shrink-0 rounded-full px-3.5 py-1.5 text-sm transition"
                        :class="filtro === '' ? 'bg-accent font-semibold text-bg' : 'glass-plano text-text-secondary hover:text-text-primary'"
                        @click="filtro = ''">
                        Todas
                    </button>
                    <button v-for="e in escuelas" :key="e.clave" type="button"
                        class="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition"
                        :class="filtro === e.clave
                            ? [colorDe(e.clave).punto, 'font-semibold text-bg']
                            : [colorDe(e.clave).etiqueta, 'hover:opacity-80']" @click="filtro = e.clave">
                        <span v-if="filtro !== e.clave" class="h-1.5 w-1.5 shrink-0 rounded-full"
                            :class="colorDe(e.clave).punto"></span>
                        {{ e.etiqueta }} · {{ e.faltan }}
                    </button>
                </div>

            </div>

            <p v-if="errorAgregar" class="text-sm text-danger">{{ errorAgregar }}</p>

            <SinResultados v-if="visibles.length === 0 && busquedaActiva"
                :mensaje="`No encontramos coincidencias para &quot;${busqueda.trim()}&quot;`" />
            <p v-else-if="visibles.length === 0" class="py-10 text-center text-sm text-text-secondary">
                No hay alumnos sin conductor aquí.
            </p>

            <ul v-else
                class="glass-plano divide-y divide-border rounded-card px-3 lg:grid lg:grid-cols-2 lg:gap-x-4 lg:divide-y-0 lg:p-3">
                <li v-for="a in visibles" :key="a.id"
                    class="flex items-center gap-3 py-3 lg:rounded-xl lg:px-3 lg:py-2.5 lg:hover:bg-panel-2/60">
                    <span
                        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                        {{ inicial(a.alumno) }}
                    </span>
                    <div class="min-w-0 flex-1">
                        <p class="truncate font-medium text-text-primary">{{ a.alumno }}</p>
                        <span
                            class="mt-1 inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs"
                            :class="colorEscuela(a.escuela_id).etiqueta">
                            <span class="h-1.5 w-1.5 shrink-0 rounded-full"
                                :class="colorEscuela(a.escuela_id).punto"></span>
                            <span class="truncate">{{ etiquetaEscuela(a) }}</span>
                        </span>
                    </div>
                    <span v-if="yaEsta(a)" class="flex shrink-0 items-center gap-1 text-sm font-medium text-mint">
                        <Check class="h-4 w-4" />
                        Agregado
                    </span>
                    <button v-else type="button" :disabled="agregando !== null"
                        class="flex shrink-0 items-center gap-1 rounded-card border border-accent px-3 py-2 text-sm font-medium text-accent transition hover:bg-accent/10 disabled:opacity-50"
                        @click="agregar(a)">
                        <Plus class="h-4 w-4" />
                        Agregar
                    </button>
                </li>
            </ul>

            <div class="sticky bottom-4 pt-2">
                <button type="button"
                    class="w-full rounded-card bg-accent px-4 py-3 text-sm font-semibold text-bg hover:opacity-90"
                    @click="volver">
                    Listo
                </button>
            </div>
        </template>

        <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 translate-y-2"
            enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="guardado" role="status"
                class="glass pointer-events-none fixed inset-x-4 bottom-20 z-40 mx-auto flex max-w-sm items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm text-text-primary">
                <Check class="h-4 w-4 text-mint" />
                Se guardaron los cambios
            </div>
        </Transition>
    </div>
</template>