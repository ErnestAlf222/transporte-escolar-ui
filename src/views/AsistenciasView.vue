<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Check, X, CircleAlert, Search } from 'lucide-vue-next'
import { verAsistenciasHoy, marcarAsistencia } from '@/api/asistencias'
import { colorEscuela } from '@/utils/escuelas'
import { coincideBusqueda } from '@/utils/busqueda'
import Spinner from '@/components/Spinner.vue'
import DropdownSelect from '@/components/DropdownSelect.vue'
import type { AsistenciasDia, AlumnoAsistencia } from '@/types/asistencia'

const dia = ref<AsistenciasDia | null>(null)
const cargando = ref(true)
const error = ref('')

async function cargar() {
    try {
        dia.value = await verAsistenciasHoy()
        error.value = ''
    } catch {
        error.value = 'No se pudo cargar la asistencia de hoy'
    }
}

// Si la pantalla se quedó abierta de un día a otro, al volver a verla se pide la lista del día nuevo
function alVolverAVer() {
    if (document.visibilityState !== 'visible' || !dia.value) return
    const hoy = new Date()
    const clave = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
    if (clave !== dia.value.fecha) cargar()
}

onMounted(async () => {
    document.addEventListener('visibilitychange', alVolverAVer)
    await cargar()
    cargando.value = false
})

onUnmounted(() => document.removeEventListener('visibilitychange', alVolverAVer))

const FORMATO_FECHA = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })

// "2026-10-27" -> "martes, 27 de octubre"; se arma con partes para no depender de la zona horaria del navegador
const fechaTexto = computed(() => {
    if (!dia.value) return ''
    const [anio, mes, d] = dia.value.fecha.split('-').map(Number)
    const texto = FORMATO_FECHA.format(new Date(anio!, mes! - 1, d!))
    return texto.charAt(0).toUpperCase() + texto.slice(1)
})

interface GrupoEscuela {
    clave: string
    nombre: string
    escuelaId: number | null
    alumnos: AlumnoAsistencia[]
}

// Una sección por escuela, en el orden en que la API las entrega
const grupos = computed<GrupoEscuela[]>(() => {
    const mapa = new Map<string, GrupoEscuela>()
    for (const a of dia.value?.alumnos ?? []) {
        const clave = a.escuela_id === null ? 'sin-escuela' : String(a.escuela_id)
        let g = mapa.get(clave)
        if (!g) {
            g = {
                clave,
                nombre: a.turno ? `${a.escuela} (${a.turno})` : a.escuela,
                escuelaId: a.escuela_id,
                alumnos: [],
            }
            mapa.set(clave, g)
        }
        g.alumnos.push(a)
    }
    return [...mapa.values()]
})

// "" = todas las escuelas; si no, la clave de la escuela elegida. Se recuerda en este navegador
const CLAVE_ESCUELA = 'asistencias-escuela'

function escuelaGuardada(): string {
    try {
        return localStorage.getItem(CLAVE_ESCUELA) ?? ''
    } catch {
        return ''
    }
}

const filtroEscuela = ref(escuelaGuardada())
const busqueda = ref('')

watch(filtroEscuela, (valor) => {
    try {
        localStorage.setItem(CLAVE_ESCUELA, valor)
    } catch {
        // sin almacenamiento: el filtro vale solo para esta sesión
    }
})

const opcionesEscuela = computed(() => [
    { value: '', label: 'Todas las escuelas' },
    ...grupos.value.map((g) => ({ value: g.clave, label: g.nombre })),
])

// Si la escuela guardada ya no existe en la lista, se vuelve a "Todas"
watch(grupos, (lista) => {
    if (filtroEscuela.value && !lista.some((g) => g.clave === filtroEscuela.value)) filtroEscuela.value = ''
})

// Lo que se ve: la escuela elegida y los alumnos que coinciden con la búsqueda
const gruposVisibles = computed(() =>
    grupos.value
        .filter((g) => !filtroEscuela.value || g.clave === filtroEscuela.value)
        .map((g) => ({ ...g, alumnos: g.alumnos.filter((a) => coincideBusqueda(busqueda.value, [a.alumno], [])) }))
        .filter((g) => g.alumnos.length > 0),
)

const alumnosVisibles = computed(() => gruposVisibles.value.flatMap((g) => g.alumnos))
const totalMarcados = computed(() => alumnosVisibles.value.filter((a) => a.asistio !== null).length)
const totalAlumnos = computed(() => alumnosVisibles.value.length)

function marcados(g: GrupoEscuela): number {
    return g.alumnos.filter((a) => a.asistio !== null).length
}

// Se marca en pantalla al instante y se confirma con el servidor; si falla, vuelve a lo anterior
const guardando = ref<Set<number>>(new Set())

async function marcar(a: AlumnoAsistencia, valor: boolean) {
    if (guardando.value.has(a.cliente_id)) return
    const anterior = a.asistio
    // Tocar el botón que ya está activo quita la marca
    const nuevo = anterior === valor ? null : valor
    guardando.value.add(a.cliente_id)
    a.asistio = nuevo
    error.value = ''
    try {
        await marcarAsistencia(a.cliente_id, nuevo)
    } catch {
        a.asistio = anterior
        error.value = `No se pudo guardar la asistencia de ${a.alumno}`
    } finally {
        guardando.value.delete(a.cliente_id)
    }
}
</script>

<template>
    <div v-if="cargando" class="flex items-center gap-2 text-text-secondary">
        <Spinner />
        Cargando...
    </div>
    <template v-else>
        <div class="sticky top-cabecera z-20 -mx-6 bg-bg px-6 pb-3 pt-2">
            <h1 class="text-2xl font-semibold text-text-primary">Asistencias</h1>
            <p v-if="dia" class="mt-1 text-sm text-text-secondary">{{ fechaTexto }}</p>

            <div v-if="dia && dia.es_habil && dia.alumnos.length" class="mt-3 space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <p class="text-sm text-text-secondary">
                        <span class="text-2xl font-semibold text-text-primary">{{ totalMarcados }}</span>
                        de {{ totalAlumnos }} marcados
                    </p>
                    <DropdownSelect v-model="filtroEscuela" :opciones="opcionesEscuela" />
                </div>

                <div class="relative">
                    <Search
                        class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                    <input v-model="busqueda" type="text" placeholder="Buscar alumno"
                        class="w-full rounded-card border border-border bg-panel py-2 pl-9 pr-8 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
                    <button v-if="busqueda" type="button" aria-label="Borrar búsqueda" @click="busqueda = ''"
                        class="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary">
                        <X class="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>

        <p v-if="error && !dia" class="mt-4 text-danger">{{ error }}</p>

        <div v-else-if="dia" class="mt-2 max-w-3xl space-y-5">
            <p v-if="error" class="text-sm text-danger">{{ error }}</p>

            <p v-if="!dia.es_habil" class="text-sm text-text-secondary">
                Hoy no hay recorrido: la asistencia se toma de lunes a viernes.
            </p>
            <p v-else-if="dia.alumnos.length === 0" class="text-sm text-text-secondary">
                No hay alumnos activos para hoy.
            </p>
            <p v-else-if="gruposVisibles.length === 0" class="text-sm text-text-secondary">
                No encontramos alumnos que coincidan con "{{ busqueda.trim() }}".
            </p>

            <section v-for="g in gruposVisibles" :key="g.clave" class="space-y-2">
                <h2 class="w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                    :class="colorEscuela(g.escuelaId).etiqueta">
                    {{ g.nombre }} · {{ marcados(g) }} de {{ g.alumnos.length }}
                </h2>

                <div class="flex flex-col gap-2">
                    <div v-for="a in g.alumnos" :key="a.cliente_id"
                        class="glass-plano flex flex-col gap-3 rounded-card p-4 transition sm:flex-row sm:items-center sm:justify-between"
                        :class="a.asistio === true ? 'border-mint/40' : a.asistio === false ? 'border-danger/40' : ''">
                        <div class="min-w-0">
                            <p class="truncate font-semibold text-text-primary">{{ a.alumno }}</p>
                            <p v-if="a.tiene_ausencia" class="flex items-center gap-1 text-xs text-sun">
                                <CircleAlert class="h-3.5 w-3.5 shrink-0" />
                                Avisó que no va{{ a.ausencia_motivo ? `: ${a.ausencia_motivo}` : '' }}
                            </p>
                        </div>

                        <div class="grid shrink-0 grid-cols-2 gap-2 sm:w-64">
                            <button type="button" :disabled="guardando.has(a.cliente_id)"
                                class="flex items-center justify-center gap-1.5 rounded-card border py-2 text-sm font-medium transition disabled:opacity-50"
                                :class="a.asistio === true ? 'border-mint bg-mint/15 text-mint' : 'border-border text-text-secondary hover:bg-panel-2'"
                                @click="marcar(a, true)">
                                <Check class="h-4 w-4" />
                                Vino
                            </button>
                            <button type="button" :disabled="guardando.has(a.cliente_id)"
                                class="flex items-center justify-center gap-1.5 rounded-card border py-2 text-sm font-medium transition disabled:opacity-50"
                                :class="a.asistio === false ? 'border-danger bg-danger/15 text-danger' : 'border-border text-text-secondary hover:bg-panel-2'"
                                @click="marcar(a, false)">
                                <X class="h-4 w-4" />
                                No vino
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </template>
</template>