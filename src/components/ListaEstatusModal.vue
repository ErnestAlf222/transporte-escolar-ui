<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Search } from 'lucide-vue-next'
import { ETIQUETAS, ETIQUETAS_METODO, estaAtenuado } from '@/utils/pagos'
import { colorEscuela } from '@/utils/escuelas'
import { coincideBusqueda } from '@/utils/busqueda'
import { rangoSemana, soloFecha } from '@/utils/semana'
import type { PagosSemana, EstatusSemana } from '@/types/pago'

const props = defineProps<{
    pagos: PagosSemana | null
    estatus: EstatusSemana | null // null = cerrado
}>()
const emit = defineEmits<{ close: []; verEnPagos: []; verAlumno: [id: number] }>()

const TODAS = 'todas'
const escuelaElegida = ref<string | number>(TODAS)
const busqueda = ref('')

// Cada vez que se abre (o cambia el estatus) se parte de cero
watch(
    () => props.estatus,
    () => {
        escuelaElegida.value = TODAS
        busqueda.value = ''
    },
)

// Dos primeras palabras del nombre: "Ana Paula Pérez Jiménez" -> "AP"
function iniciales(nombre: string): string {
    return nombre
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((palabra) => palabra[0] ?? '')
        .join('')
        .toUpperCase()
}

// Los alumnos de ese estatus agrupados por escuela; los archivados atenuados no cuentan, igual que en Pagos
const gruposCompletos = computed(() => {
    if (!props.pagos || !props.estatus) return []
    return props.pagos.escuelas
        .map((e) => ({
            clave: e.escuela_id ?? 'sin-escuela',
            nombre: e.turno ? `${e.nombre} (${e.turno})` : e.nombre,
            color: colorEscuela(e.escuela_id),
            alumnos: e.alumnos
                .filter((a) => a.estatus === props.estatus && !estaAtenuado(a))
                .map((a) => ({
                    id: a.cliente_id,
                    nombre: a.alumno,
                    iniciales: iniciales(a.alumno),
                    metodo: ETIQUETAS_METODO[a.metodo_semana] ?? a.metodo_semana,
                    // Para el buscador: por alumno, por tutor o por teléfono, como en Pagos
                    coincide: (texto: string) =>
                        coincideBusqueda(texto, [a.alumno, a.tutor ?? ''], [a.telefono_tutor ?? '', a.telefono_alumno ?? '']),
                })),
        }))
        .filter((g) => g.alumnos.length > 0)
})

const totalEstatus = computed(() => gruposCompletos.value.reduce((suma, g) => suma + g.alumnos.length, 0))

// Lo que se ve: la escuela elegida y lo que coincida con la búsqueda
const grupos = computed(() =>
    gruposCompletos.value
        .filter((g) => escuelaElegida.value === TODAS || g.clave === escuelaElegida.value)
        .map((g) => ({ ...g, alumnos: g.alumnos.filter((a) => a.coincide(busqueda.value)) }))
        .filter((g) => g.alumnos.length > 0),
)

const totalVisible = computed(() => grupos.value.reduce((suma, g) => suma + g.alumnos.length, 0))

function alTeclaEsc(evento: KeyboardEvent) {
    if (evento.key === 'Escape') emit('close')
}
</script>

<template>
    <Teleport to="body">
        <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
            leave-active-class="transition duration-200 ease-in" leave-to-class="opacity-0">
            <div v-if="estatus" class="fixed inset-0 z-50 bg-black/60 supports-backdrop-filter:backdrop-blur-sm"
                @click="emit('close')"></div>
        </Transition>

        <Transition enter-active-class="transition duration-300 ease-out motion-reduce:transition-none"
            enter-from-class="opacity-0 translate-y-4 sm:scale-95"
            enter-to-class="opacity-100 translate-y-0 sm:scale-100"
            leave-active-class="transition duration-200 ease-in motion-reduce:transition-none"
            leave-from-class="opacity-100 translate-y-0 sm:scale-100"
            leave-to-class="opacity-0 translate-y-4 sm:scale-95">
            <div v-if="estatus && pagos"
                class="pointer-events-none fixed inset-0 z-51 flex items-end justify-center p-4 sm:items-center"
                tabindex="-1" @keydown="alTeclaEsc">
                <div
                    class="pointer-events-auto flex max-h-[85dvh] w-full max-w-md flex-col gap-4 rounded-card border border-border bg-panel p-5 shadow-lg">
                    <div class="flex shrink-0 items-start justify-between gap-3">
                        <div class="min-w-0">
                            <span class="w-fit rounded-card px-2 py-0.5 text-xs font-medium"
                                :class="ETIQUETAS[estatus].clases">
                                {{ ETIQUETAS[estatus].texto }}
                            </span>
                            <p class="mt-2 text-2xl font-semibold text-text-primary">
                                {{ totalVisible }}
                                <span class="text-sm font-normal text-text-secondary">
                                    {{ totalVisible === 1 ? 'alumno' : 'alumnos' }} ·
                                    {{ rangoSemana(soloFecha(pagos.semana_inicio)) }}
                                </span>
                            </p>
                        </div>
                        <button type="button" aria-label="Cerrar"
                            class="shrink-0 text-text-secondary hover:text-text-primary" @click="emit('close')">
                            <X class="h-5 w-5" />
                        </button>
                    </div>

                    <div class="relative shrink-0">
                        <Search
                            class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                        <input v-model="busqueda" type="text" placeholder="Buscar alumno, tutor o teléfono"
                            class="w-full rounded-card border border-border bg-panel-2 py-2 pl-9 pr-8 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
                        <button v-if="busqueda" type="button" aria-label="Borrar búsqueda" @click="busqueda = ''"
                            class="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary">
                            <X class="h-4 w-4" />
                        </button>
                    </div>

                    <div v-if="gruposCompletos.length > 1"
                        class="scroll-fino -mx-1 flex shrink-0 gap-2 overflow-x-auto px-1 pb-1">
                        <button type="button"
                            class="shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition"
                            :class="escuelaElegida === TODAS ? 'border-accent bg-accent/15 text-accent' : 'border-border text-text-secondary hover:bg-panel-2'"
                            @click="escuelaElegida = TODAS">
                            Todas · {{ totalEstatus }}
                        </button>
                        <button v-for="g in gruposCompletos" :key="g.clave" type="button"
                            class="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition"
                            :class="escuelaElegida === g.clave ? [g.color.etiqueta, 'border-transparent'] : 'border-border text-text-secondary hover:bg-panel-2'"
                            @click="escuelaElegida = g.clave">
                            <span class="h-2 w-2 rounded-full" :class="g.color.punto" />
                            {{ g.nombre }} · {{ g.alumnos.length }}
                        </button>
                    </div>

                    <div class="scroll-fino -mr-2 min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
                        <section v-for="g in grupos" :key="g.clave" class="space-y-2">
                            <p v-if="escuelaElegida === TODAS && gruposCompletos.length > 1"
                                class="flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase"
                                :class="g.color.etiqueta">
                                <span class="h-2 w-2 rounded-full" :class="g.color.punto" />
                                {{ g.nombre }} · {{ g.alumnos.length }}
                            </p>

                            <ul class="space-y-2">
                                <li v-for="a in g.alumnos" :key="a.id"
                                    class="flex cursor-pointer items-center gap-3 rounded-card bg-panel-2 p-3 transition hover:opacity-80"
                                    role="button" tabindex="0" @click="emit('verAlumno', a.id)"
                                    @keydown.enter="emit('verAlumno', a.id)">
                                    <span
                                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                                        :class="g.color.etiqueta">
                                        {{ a.iniciales }}
                                    </span>
                                    <div class="min-w-0 flex-1">
                                        <p class="truncate text-sm font-semibold text-text-primary">{{ a.nombre }}</p>
                                    </div>
                                    <span
                                        class="shrink-0 rounded-card bg-panel px-2 py-0.5 text-xs text-text-secondary">
                                        {{ a.metodo }}
                                    </span>
                                </li>
                            </ul>
                        </section>

                        <p v-if="grupos.length === 0" class="text-sm text-text-secondary">
                            {{ busqueda ? `No hay coincidencias para "${busqueda}"` : `No hay alumnos con este estatus
                            esta semana.` }}
                        </p>
                    </div>

                    <button type="button"
                        class="shrink-0 rounded-card bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90"
                        @click="emit('verEnPagos')">
                        Ver en Pagos
                    </button>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>