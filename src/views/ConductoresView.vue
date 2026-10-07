<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { verAsignaciones } from '@/api/asignaciones'
import type { Asignaciones, AlumnoAsignacion } from '@/types/asignacion'
import { compararTexto } from '@/utils/orden'
import DropdownSelect from '@/components/DropdownSelect.vue'
import Spinner from '@/components/Spinner.vue'

const CLAVE_SIN_ESCUELA = 'sin-escuela'

const datos = ref<Asignaciones>({ conductores: [], alumnos: [] })
const cargando = ref(true)
const error = ref('')
const filtroEscuela = ref('')

async function cargar() {
    cargando.value = true
    error.value = ''
    try {
        datos.value = await verAsignaciones()
    } catch {
        error.value = 'No se pudo cargar la asignación de conductores'
    } finally {
        cargando.value = false
    }
}

onMounted(cargar)

function claveEscuela(id: number | null): string {
    return id === null ? CLAVE_SIN_ESCUELA : String(id)
}

function etiquetaEscuela(a: AlumnoAsignacion): string {
    return a.turno ? `${a.escuela} (${a.turno})` : a.escuela
}

// "Sin escuela" siempre al final; el resto por nombre, con su turno
function compararClaves(ka: string, la: string, kb: string, lb: string): number {
    if (ka === CLAVE_SIN_ESCUELA || kb === CLAVE_SIN_ESCUELA) {
        return Number(ka === CLAVE_SIN_ESCUELA) - Number(kb === CLAVE_SIN_ESCUELA)
    }
    return compararTexto(la, lb)
}

const opcionesEscuela = computed(() => {
    const mapa = new Map<string, string>()
    for (const a of datos.value.alumnos) mapa.set(claveEscuela(a.escuela_id), etiquetaEscuela(a))
    const ordenadas = [...mapa.entries()].sort(([ka, la], [kb, lb]) => compararClaves(ka, la, kb, lb))
    return [
        { value: '', label: 'Todas las escuelas' },
        ...ordenadas.map(([value, label]) => ({ value, label })),
    ]
})

const alumnosVisibles = computed(() =>
    datos.value.alumnos.filter((a) => !filtroEscuela.value || claveEscuela(a.escuela_id) === filtroEscuela.value),
)

const sinAsignar = computed(() => alumnosVisibles.value.filter((a) => a.conductor_id === null))

interface GrupoEscuela {
    clave: string
    etiqueta: string
    alumnos: AlumnoAsignacion[]
}

const gruposSinAsignar = computed<GrupoEscuela[]>(() => {
    const mapa = new Map<string, GrupoEscuela>()
    for (const a of sinAsignar.value) {
        const clave = claveEscuela(a.escuela_id)
        let grupo = mapa.get(clave)
        if (!grupo) {
            grupo = { clave, etiqueta: etiquetaEscuela(a), alumnos: [] }
            mapa.set(clave, grupo)
        }
        grupo.alumnos.push(a)
    }
    const grupos = [...mapa.values()]
    for (const g of grupos) g.alumnos.sort((a, b) => compararTexto(a.alumno, b.alumno))
    return grupos.sort((a, b) => compararClaves(a.clave, a.etiqueta, b.clave, b.etiqueta))
})

const tarjetas = computed(() =>
    datos.value.conductores.map((conductor) => ({
        conductor,
        alumnos: alumnosVisibles.value.filter((a) => a.conductor_id === conductor.id),
    })),
)

function inicial(nombre: string): string {
    return nombre.trim().charAt(0).toUpperCase()
}
</script>

<template>
    <div class="space-y-5">
        <div class="flex items-center justify-between gap-3">
            <h1 class="text-2xl font-semibold text-text-primary">Conductores</h1>
            <DropdownSelect v-model="filtroEscuela" :opciones="opcionesEscuela" />
        </div>

        <div v-if="cargando" class="flex justify-center py-10">
            <Spinner />
        </div>
        <p v-else-if="error" class="text-sm text-danger">{{ error }}</p>

        <template v-else>
            <section class="space-y-3">
                <h2 class="text-sm font-semibold text-text-primary">Sin asignar · {{ sinAsignar.length }}</h2>
                <p v-if="sinAsignar.length === 0" class="text-sm text-text-secondary">
                    Todos los alumnos tienen conductor.
                </p>

                <div v-for="grupo in gruposSinAsignar" :key="grupo.clave" class="space-y-2">
                    <h3
                        class="w-fit rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
                        {{ grupo.etiqueta }} · {{ grupo.alumnos.length }}
                    </h3>
                    <div class="flex flex-col gap-2">
                        <div v-for="a in grupo.alumnos" :key="a.id"
                            class="glass-plano flex items-center justify-between gap-3 rounded-card p-3">
                            <div class="min-w-0">
                                <p class="truncate font-medium text-text-primary">{{ a.alumno }}</p>
                                <p v-if="a.colonia" class="truncate text-xs text-text-secondary">{{ a.colonia }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="space-y-3">
                <h2 class="text-sm font-semibold text-text-primary">Conductores · {{ tarjetas.length }}</h2>
                <p v-if="tarjetas.length === 0" class="text-sm text-text-secondary">
                    Aún no hay conductores activos.
                </p>

                <div v-for="t in tarjetas" :key="t.conductor.id" class="glass-plano space-y-3 rounded-card p-4">
                    <div class="flex items-center gap-3">
                        <div
                            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-panel-2 text-sm font-semibold text-accent">
                            {{ inicial(t.conductor.nombre) }}
                        </div>
                        <div class="min-w-0">
                            <p class="truncate font-semibold text-text-primary">{{ t.conductor.nombre }}</p>
                            <p class="text-xs text-text-secondary">{{ t.alumnos.length }} alumnos</p>
                        </div>
                    </div>

                    <p v-if="t.alumnos.length === 0" class="text-xs text-text-secondary">Sin alumnos asignados</p>
                    <ul v-else class="space-y-1">
                        <li v-for="a in t.alumnos" :key="a.id"
                            class="flex items-center justify-between gap-2 text-sm text-text-secondary">
                            <span class="truncate">{{ a.alumno }}</span>
                            <span class="shrink-0 text-xs">{{ etiquetaEscuela(a) }}</span>
                        </li>
                    </ul>
                </div>
            </section>
        </template>
    </div>
</template>