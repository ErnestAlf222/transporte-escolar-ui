<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { Search, X, Check, BadgeDollarSign } from 'lucide-vue-next'
import { listarClientes } from '@/api/clientes'
import { listarCasosEspeciales, registrarCasoEspecial } from '@/api/casos-especiales'
import { coincideBusqueda } from '@/utils/busqueda'
import { colorEscuela } from '@/utils/escuelas'
import { formatearMonto, parseMonto } from '@/utils/moneda'
import Spinner from '@/components/Spinner.vue'
import type { ClienteListItem } from '@/types/cliente'
import type { CasoEspecial } from '@/types/caso-especial'

const clientes = ref<ClienteListItem[]>([])
const casos = ref<CasoEspecial[]>([])
const cargando = ref(true)
const errorCarga = ref('')

async function cargarCasos() {
    try {
        casos.value = await listarCasosEspeciales()
    } catch {
        errorCarga.value = 'No se pudieron cargar los casos de la semana'
    }
}

onMounted(async () => {
    try {
        // Solo alumnos activos: no se registra un cobro a quien está dado de baja
        clientes.value = await listarClientes({ estatus: 'activo' })
    } catch {
        errorCarga.value = 'No se pudieron cargar los alumnos'
    }
    await cargarCasos()
    cargando.value = false
})

function nombreAlumno(c: ClienteListItem): string {
    return [c.nombre_alumno, c.apellido_paterno_alumno, c.apellido_materno_alumno]
        .map((s) => s.trim())
        .filter(Boolean)
        .join(' ')
}

// Elegir al alumno: se busca por nombre y apellidos, con acentos y mayúsculas indistintos
const busqueda = ref('')
const MAX_RESULTADOS = 30

const resultados = computed(() =>
    busqueda.value.trim() === ''
        ? []
        : clientes.value
            .filter((c) =>
                coincideBusqueda(
                    busqueda.value,
                    [c.nombre_alumno, c.apellido_paterno_alumno, c.apellido_materno_alumno, c.nombre_escuela ?? ''],
                    [],
                ),
            )
            .slice(0, MAX_RESULTADOS),
)

const alumno = ref<ClienteListItem | null>(null)

// Formulario
const monto = ref('')
const motivo = ref('')
const tocado = ref({ monto: false, motivo: false })
const MOTIVO_MAXIMO = 200

const montoNumero = computed(() => parseMonto(monto.value))

const errores = computed(() => ({
    monto:
        monto.value.trim() === ''
            ? 'Escribe cuánto se cobró esta semana'
            : montoNumero.value === null || montoNumero.value <= 0
                ? 'Escribe un monto mayor a cero, como 125 o 125.50'
                : '',
    motivo: motivo.value.trim() === '' ? 'Escribe por qué se cobró otro monto' : '',
}))

const puedeGuardar = computed(() => !!alumno.value && !errores.value.monto && !errores.value.motivo)

function elegirAlumno(c: ClienteListItem) {
    alumno.value = c
    busqueda.value = ''
    exito.value = ''
    errorGuardar.value = ''
}

function cambiarAlumno() {
    alumno.value = null
    exito.value = ''
}

function limpiarFormulario() {
    monto.value = ''
    motivo.value = ''
    tocado.value = { monto: false, motivo: false }
}

// Confirmación antes de guardar
const confirmando = ref(false)
const guardando = ref(false)
const errorGuardar = ref('')
const exito = ref('')

function pedirConfirmacion() {
    tocado.value = { monto: true, motivo: true }
    if (!puedeGuardar.value) return
    errorGuardar.value = ''
    confirmando.value = true
}

async function guardar() {
    if (!alumno.value || !puedeGuardar.value || montoNumero.value === null) return
    const nombre = nombreAlumno(alumno.value)
    guardando.value = true
    errorGuardar.value = ''
    try {
        await registrarCasoEspecial(alumno.value.id, { monto: montoNumero.value, motivo: motivo.value.trim() })
        exito.value = `Se registró el pago de ${nombre} por ${formatearMonto(montoNumero.value)}`
        limpiarFormulario()
        alumno.value = null
        confirmando.value = false
        await cargarCasos()
    } catch (e) {
        // La API explica el problema (por ejemplo, si la semana ya tiene abonos)
        errorGuardar.value =
            axios.isAxiosError(e) && typeof e.response?.data === 'string' && e.response.data.trim()
                ? e.response.data.trim()
                : 'No se pudo registrar el caso especial'
        confirmando.value = false
    } finally {
        guardando.value = false
    }
}

function alTeclaEsc(evento: KeyboardEvent) {
    if (evento.key === 'Escape') confirmando.value = false
}

const clasesCampo = (error: string, tocadoCampo: boolean) =>
    tocadoCampo && error
        ? 'border-danger focus:border-danger focus:ring-danger'
        : 'border-border focus:border-accent focus:ring-accent'
const CLASES_BASE_CAMPO =
    'mt-1 w-full rounded-card border bg-panel/40 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1'
</script>

<template>
    <h1 class="text-2xl font-semibold text-text-primary">Casos especiales</h1>
    <p class="mt-1 text-sm text-text-secondary">
        Un pago de esta semana por otro monto. La semana siguiente se cobra normal.
    </p>

    <div v-if="cargando" class="mt-6 flex items-center gap-2 text-text-secondary">
        <Spinner />
        Cargando...
    </div>
    <p v-else-if="errorCarga && !clientes.length" class="mt-6 text-danger">{{ errorCarga }}</p>

    <div v-else class="mt-6 grid max-w-5xl gap-6 lg:grid-cols-2 lg:items-start">
        <div class="space-y-6">
            <!-- 1. Elegir al alumno -->
            <section class="glass space-y-3 rounded-card p-4">
                <p class="text-sm font-medium text-text-primary">Alumno</p>

                <div v-if="alumno" class="flex items-start justify-between gap-3 rounded-card bg-panel-2 p-3">
                    <div class="min-w-0">
                        <p class="truncate text-sm font-semibold text-text-primary">{{ nombreAlumno(alumno) }}</p>
                        <p class="text-xs text-text-secondary">{{ alumno.nombre_escuela || 'Sin escuela' }}</p>
                    </div>
                    <button type="button" class="shrink-0 text-xs font-medium text-accent hover:opacity-80"
                        @click="cambiarAlumno">
                        Cambiar
                    </button>
                </div>

                <div v-else class="space-y-2">
                    <div class="relative">
                        <Search
                            class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                        <input v-model="busqueda" type="text" placeholder="Buscar alumno o escuela"
                            class="w-full rounded-card border border-border bg-panel/40 py-2 pl-9 pr-8 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
                        <button v-if="busqueda" type="button" aria-label="Borrar búsqueda" @click="busqueda = ''"
                            class="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary">
                            <X class="h-4 w-4" />
                        </button>
                    </div>

                    <ul v-if="resultados.length" class="space-y-2">
                        <li v-for="c in resultados" :key="c.id">
                            <button type="button"
                                class="flex w-full items-center gap-3 rounded-card bg-panel-2 p-3 text-left transition hover:opacity-80"
                                @click="elegirAlumno(c)">
                                <span class="h-2 w-2 shrink-0 rounded-full" :class="colorEscuela(c.escuela_id).punto" />
                                <div class="min-w-0 flex-1">
                                    <p class="truncate text-sm font-semibold text-text-primary">{{ nombreAlumno(c) }}
                                    </p>
                                    <p class="truncate text-xs text-text-secondary">
                                        {{ c.nombre_escuela || 'Sin escuela' }}
                                    </p>
                                </div>
                            </button>
                        </li>
                    </ul>
                    <p v-else-if="busqueda.trim()" class="text-sm text-text-secondary">
                        No hay alumnos que coincidan con "{{ busqueda }}"
                    </p>
                </div>
            </section>

            <p v-if="exito" class="flex items-center gap-2 text-sm text-mint">
                <Check class="h-4 w-4" />
                {{ exito }}
            </p>

            <!-- 2. Monto y motivo -->
            <form v-if="alumno" class="glass space-y-4 rounded-card p-4" novalidate @submit.prevent="pedirConfirmacion">
                <p class="text-sm font-medium text-text-primary">Pago de esta semana</p>

                <div>
                    <label class="block text-xs text-text-secondary" for="caso-monto">Monto que se cobró</label>
                    <input id="caso-monto" v-model="monto" type="text" inputmode="decimal" autocomplete="off"
                        placeholder="0.00" :class="[CLASES_BASE_CAMPO, clasesCampo(errores.monto, tocado.monto)]"
                        @blur="tocado.monto = true" />
                    <p v-if="tocado.monto && errores.monto" class="mt-1 text-xs text-danger">{{ errores.monto }}</p>
                </div>

                <div>
                    <label class="block text-xs text-text-secondary" for="caso-motivo">Motivo</label>
                    <input id="caso-motivo" v-model="motivo" type="text" autocomplete="off" :maxlength="MOTIVO_MAXIMO"
                        placeholder="Ej. No asistió tres días"
                        :class="[CLASES_BASE_CAMPO, clasesCampo(errores.motivo, tocado.motivo)]"
                        @blur="tocado.motivo = true" />
                    <p v-if="tocado.motivo && errores.motivo" class="mt-1 text-xs text-danger">{{ errores.motivo }}</p>
                </div>

                <p v-if="errorGuardar" class="text-sm text-danger">{{ errorGuardar }}</p>

                <div class="flex justify-end">
                    <button type="submit" :disabled="!puedeGuardar"
                        class="flex items-center gap-2 rounded-card bg-accent px-5 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                        <BadgeDollarSign class="h-4 w-4" />
                        Registrar caso especial
                    </button>
                </div>
            </form>
        </div>

        <!-- 3. Casos de la semana en curso -->
        <section class="glass space-y-3 rounded-card p-4">
            <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-medium text-text-primary">Esta semana</p>
                <span class="text-xs text-text-secondary">{{ casos.length }}
                    {{ casos.length === 1 ? 'caso' : 'casos' }}</span>
            </div>

            <ul v-if="casos.length" class="space-y-2">
                <li v-for="c in casos" :key="c.pago_id" class="rounded-card bg-panel-2 p-3">
                    <div class="flex items-start justify-between gap-3">
                        <p class="min-w-0 truncate text-sm font-semibold text-text-primary">{{ c.alumno }}</p>
                        <p class="shrink-0 text-sm font-semibold text-mint">{{ formatearMonto(c.monto) }}</p>
                    </div>
                    <p class="text-xs text-text-secondary">{{ c.escuela }}</p>
                    <p class="mt-1 text-xs text-text-primary">{{ c.motivo }}</p>
                </li>
            </ul>
            <p v-else class="text-sm text-text-secondary">Todavía no hay casos especiales esta semana.</p>
        </section>
    </div>

    <!-- Confirmación antes de guardar -->
    <Teleport to="body">
        <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
            leave-active-class="transition duration-200 ease-in" leave-to-class="opacity-0">
            <div v-if="confirmando"
                class="fixed inset-0 z-40 bg-black/40 supports-backdrop-filter:bg-black/30 supports-backdrop-filter:backdrop-blur-sm"
                @click="confirmando = false"></div>
        </Transition>

        <div class="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
            <Transition enter-active-class="transition duration-300 ease-out motion-reduce:transition-none"
                enter-from-class="opacity-0 scale-50" enter-to-class="opacity-100 scale-100"
                leave-active-class="transition duration-200 ease-in motion-reduce:transition-none"
                leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-50">
                <div v-if="confirmando && alumno && montoNumero !== null" role="dialog"
                    aria-label="Registrar caso especial" tabindex="-1"
                    class="pointer-events-auto w-full max-w-md space-y-4 rounded-card border border-border bg-panel p-5 shadow-xl shadow-black/40"
                    @keydown="alTeclaEsc">
                    <p class="text-base font-semibold text-text-primary">
                        ¿Registrar <strong>{{ formatearMonto(montoNumero) }}</strong> como el pago de esta semana de
                        <strong>{{ nombreAlumno(alumno) }}</strong>?
                    </p>
                    <p class="text-sm text-text-secondary">
                        La semana quedará como pagada con ese monto. La siguiente se cobra normal.
                    </p>

                    <div class="flex justify-end gap-3">
                        <button type="button"
                            class="rounded-card border border-border px-4 py-2 text-sm text-text-secondary hover:bg-panel-2"
                            @click="confirmando = false">
                            Cancelar
                        </button>
                        <button type="button" :disabled="guardando"
                            class="flex items-center gap-2 rounded-card bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            @click="guardar">
                            <Spinner v-if="guardando" />
                            <BadgeDollarSign v-else class="h-4 w-4" />
                            Registrar
                        </button>
                    </div>
                </div>
            </Transition>
        </div>
    </Teleport>
</template>