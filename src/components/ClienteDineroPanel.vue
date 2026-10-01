<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import axios from 'axios'
import { Wallet, X, Save } from 'lucide-vue-next'
import { configurarCliente, verAdeudoFamilia } from '@/api/clientes'
import type {
    ClienteDetalle,
    AdeudoAlumno,
    AdeudoFamilia,
    MetodoPago,
    ConfigurarClientePayload,
} from '@/types/cliente'
import Spinner from '@/components/Spinner.vue'

const props = defineProps<{ detalle: ClienteDetalle; puedeEditar: boolean }>()
const emit = defineEmits<{ guardado: [] }>()

const abierto = ref(false)

const DIAS = [
    { valor: 0, etiqueta: 'Dom' },
    { valor: 1, etiqueta: 'Lun' },
    { valor: 2, etiqueta: 'Mar' },
    { valor: 3, etiqueta: 'Mié' },
    { valor: 4, etiqueta: 'Jue' },
    { valor: 5, etiqueta: 'Vie' },
    { valor: 6, etiqueta: 'Sáb' },
]

const METODOS: { valor: MetodoPago; etiqueta: string }[] = [
    { valor: 'digital', etiqueta: 'Digital' },
    { valor: 'efectivo', etiqueta: 'Efectivo' },
]

interface FormDinero {
    cuota: string
    recargo: string
    dia: number
    metodo: MetodoPago
}

const form = ref<FormDinero>({ cuota: '', recargo: '', dia: 3, metodo: 'digital' })
const original = ref<FormDinero>({ ...form.value })
const aplicarHermanos = ref(false)
const guardando = ref(false)
const errorGuardar = ref('')
const guardadoOk = ref(false)

const adeudo = ref<AdeudoFamilia | null>(null)
const errorAdeudo = ref('')
let solicitudAdeudo = 0
let temporizadorOk: ReturnType<typeof setTimeout> | null = null

function parseMonto(texto: string): number | null {
    const limpio = texto.trim().replace(',', '.')
    if (limpio === '') return null
    const n = Number(limpio)
    return Number.isFinite(n) && n >= 0 && n <= 100000 ? n : null
}

const cuotaMal = computed(() => parseMonto(form.value.cuota) === null)
const recargoMal = computed(() => parseMonto(form.value.recargo) === null)

const cambiaMontos = computed(
    () =>
        form.value.cuota.trim() !== original.value.cuota.trim() ||
        form.value.recargo.trim() !== original.value.recargo.trim(),
)

const hayCambios = computed(
    () =>
        cambiaMontos.value ||
        form.value.dia !== original.value.dia ||
        form.value.metodo !== original.value.metodo,
)

const hermanosActivos = computed(
    () => (props.detalle.alumnos ?? []).filter((a) => a.id !== props.detalle.id && a.estatus === 'activo').length,
)

const textoHermanos = computed(() =>
    hermanosActivos.value === 1
        ? 'Aplicar esta configuración a su hermano activo'
        : `Aplicar esta configuración a sus ${hermanosActivos.value} hermanos activos`,
)

const totalFamilia = computed(() => adeudo.value?.total_familia ?? 0)
const nombreCorto = computed(() => props.detalle.nombre_alumno.trim())

// Con la casilla marcada: si cambiaste algo, a los hermanos solo les llega eso;
// si no cambiaste nada, se les copia la configuración completa de este alumno
const copiaTodo = computed(() => aplicarHermanos.value && !hayCambios.value)

const textoAyudaHermanos = computed(() =>
    copiaTodo.value
        ? `No cambiaste nada: se copiarán la cuota, el recargo, el día límite y el método de pago de ${nombreCorto.value}.`
        : 'A sus hermanos solo se les aplicará lo que cambiaste.',
)

const puedeGuardar = computed(
    () =>
        props.puedeEditar &&
        !guardando.value &&
        !cuotaMal.value &&
        !recargoMal.value &&
        (hayCambios.value || (aplicarHermanos.value && hermanosActivos.value > 0)),
)

// Un solo alumno: no se repite la lista y el total dice de quién es
const unSoloAlumno = computed(() => (adeudo.value?.alumnos.length ?? 0) === 1)
const textoTotal = computed(() =>
    unSoloAlumno.value ? `Total adeudado de ${nombreCorto.value}` : 'Total de la familia',
)
const tituloAdeudo = computed(() =>
    unSoloAlumno.value ? `Adeudo de ${nombreCorto.value}` : 'Adeudo de la familia',
)
const textoUnico = computed(() => {
    const a = adeudo.value?.alumnos[0]
    return a && unSoloAlumno.value ? detalleAdeudo(a) : ''
})

function formatearMonto(monto: number): string {
    return monto.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
}

function nombreAdeudo(a: AdeudoAlumno): string {
    return [a.nombre_alumno, a.apellido_paterno_alumno, a.apellido_materno_alumno]
        .map((s) => (s ?? '').trim())
        .filter(Boolean)
        .join(' ')
}

function detalleAdeudo(a: AdeudoAlumno): string {
    if (a.estatus === 'archivado') return 'Archivado, no suma al total'
    if (a.semanas_pendientes === 0) return 'Al corriente'
    return a.semanas_pendientes === 1 ? '1 semana por cubrir' : `${a.semanas_pendientes} semanas por cubrir`
}

// Esc cierra solo el panel; sin esto el evento llegaría al modal y lo cerraría completo
function alEsc(evento: KeyboardEvent) {
    if (!abierto.value) return
    evento.stopPropagation()
    abierto.value = false
}

function precargar(d: ClienteDetalle) {
    form.value = {
        cuota: String(d.monto_cuota),
        recargo: String(d.monto_recargo),
        dia: d.dia_limite_pago,
        metodo: d.metodo_pago,
    }
    original.value = { ...form.value }
    aplicarHermanos.value = false
    errorGuardar.value = ''
}

async function cargarAdeudo() {
    const solicitud = ++solicitudAdeudo
    errorAdeudo.value = ''
    try {
        const resultado = await verAdeudoFamilia(props.detalle.id)
        if (solicitud === solicitudAdeudo) adeudo.value = resultado
    } catch {
        if (solicitud === solicitudAdeudo) errorAdeudo.value = 'No se pudo calcular el adeudo'
    }
}

// Cada vez que llega un detalle nuevo (otro alumno o tras guardar) se recarga el formulario y el adeudo
watch(
    () => props.detalle,
    (d) => {
        precargar(d)
        cargarAdeudo()
    },
    { immediate: true },
)

async function guardar() {
    if (!puedeGuardar.value) return

    const cuota = parseMonto(form.value.cuota)
    const recargo = parseMonto(form.value.recargo)
    if (cuota === null || recargo === null) {
        errorGuardar.value = 'Escribe montos válidos: de 0 a 100,000'
        return
    }

    // Se manda lo que cambió. Si no cambió nada pero se marcó "aplicar a hermanos",
    // se manda la configuración completa de este alumno para copiarla a sus hermanos.
    const todo = copiaTodo.value
    const payload: ConfigurarClientePayload = {}
    if (todo || form.value.cuota.trim() !== original.value.cuota.trim()) payload.monto_cuota = cuota
    if (todo || form.value.recargo.trim() !== original.value.recargo.trim()) payload.monto_recargo = recargo
    if (todo || form.value.dia !== original.value.dia) payload.dia_limite_pago = form.value.dia
    if (todo || form.value.metodo !== original.value.metodo) payload.metodo_pago = form.value.metodo
    if (aplicarHermanos.value) payload.aplicar_a_hermanos = true

    guardando.value = true
    errorGuardar.value = ''
    try {
        await configurarCliente(props.detalle.id, payload)
        original.value = { ...form.value }
        aplicarHermanos.value = false
        guardadoOk.value = true
        if (temporizadorOk) clearTimeout(temporizadorOk)
        temporizadorOk = setTimeout(() => (guardadoOk.value = false), 2500)
        emit('guardado')
    } catch (e) {
        errorGuardar.value =
            axios.isAxiosError(e) && e.response?.status === 400 && typeof e.response.data === 'string'
                ? e.response.data.trim()
                : 'No se pudo guardar el dinero'
    } finally {
        guardando.value = false
    }
}

onUnmounted(() => {
    if (temporizadorOk) clearTimeout(temporizadorOk)
})
</script>

<template>
    <!-- Capa de desenfoque: solo cubre la tarjeta del detalle y entra con un fundido (el blur no se anima) -->
    <Transition enter-active-class="transition-opacity duration-200 motion-reduce:transition-none"
        enter-from-class="opacity-0" leave-active-class="transition-opacity duration-150 motion-reduce:transition-none"
        leave-to-class="opacity-0">
        <div v-if="abierto"
            class="fixed inset-0 z-10 bg-black/40 supports-backdrop-filter:bg-black/30 supports-backdrop-filter:backdrop-blur-sm"
            @click="abierto = false"></div>
    </Transition>

    <!-- Panel: crece desde la burbuja y se encoge hacia ella -->
    <Transition enter-active-class="transition duration-300 ease-out motion-reduce:transition-none"
        enter-from-class="opacity-0 scale-50" enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-200 ease-in motion-reduce:transition-none"
        leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-50">
        <div v-if="abierto" role="dialog" aria-label="Dinero del cliente"
            class="absolute inset-x-4 bottom-20 z-20 max-h-[calc(100%-6rem)] overflow-y-auto overscroll-contain rounded-card border border-border bg-panel p-5 shadow-xl shadow-black/40"
            :style="{ transformOrigin: '100% calc(100% + 2.25rem)' }" @keydown.esc="alEsc">
            <p class="mb-4 truncate text-base font-semibold text-text-primary">Dinero de {{ nombreCorto }}</p>

            <form @submit.prevent="guardar">
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs text-text-secondary" for="dinero-cuota">Cuota semanal</label>
                        <input id="dinero-cuota" v-model="form.cuota" type="text" inputmode="decimal"
                            :disabled="!puedeEditar"
                            class="mt-1 w-full rounded-card border bg-panel-2 px-3 py-2.5 text-base text-text-primary disabled:opacity-60"
                            :class="cuotaMal ? 'border-danger' : 'border-border'" />
                    </div>
                    <div>
                        <label class="block text-xs text-text-secondary" for="dinero-recargo">Recargo por
                            atraso</label>
                        <input id="dinero-recargo" v-model="form.recargo" type="text" inputmode="decimal"
                            :disabled="!puedeEditar"
                            class="mt-1 w-full rounded-card border bg-panel-2 px-3 py-2.5 text-base text-text-primary disabled:opacity-60"
                            :class="recargoMal ? 'border-danger' : 'border-border'" />
                    </div>
                </div>

                <p v-if="puedeEditar && cambiaMontos" class="mt-2 text-xs text-sun">
                    El cambio de monto afecta a todas las semanas que aún no están confirmadas.
                </p>

                <div class="mt-4">
                    <p class="text-xs text-text-secondary">Día límite de pago</p>
                    <div class="mt-1 grid grid-cols-7 gap-1.5">
                        <button v-for="d in DIAS" :key="d.valor" type="button" :disabled="!puedeEditar"
                            class="rounded-card border py-2 text-xs transition disabled:cursor-default"
                            :class="form.dia === d.valor ? 'border-accent bg-accent/15 text-accent' : 'border-border text-text-secondary hover:bg-panel-2'"
                            @click="form.dia = d.valor">
                            {{ d.etiqueta }}
                        </button>
                    </div>
                </div>

                <div class="mt-4">
                    <p class="text-xs text-text-secondary">Método de pago</p>
                    <div class="mt-1 grid grid-cols-2 gap-2">
                        <button v-for="m in METODOS" :key="m.valor" type="button" :disabled="!puedeEditar"
                            class="rounded-card border py-2.5 text-sm transition disabled:cursor-default"
                            :class="form.metodo === m.valor ? 'border-accent bg-accent/15 text-accent' : 'border-border text-text-secondary hover:bg-panel-2'"
                            @click="form.metodo = m.valor">
                            {{ m.etiqueta }}
                        </button>
                    </div>
                </div>

                <div v-if="puedeEditar && hermanosActivos > 0" class="mt-4 rounded-card bg-panel-2 p-3">
                    <label class="flex items-start gap-2 text-sm text-text-primary">
                        <input v-model="aplicarHermanos" type="checkbox" class="mt-0.5 h-4 w-4 accent-accent" />
                        <span>{{ textoHermanos }}</span>
                    </label>
                    <p v-if="aplicarHermanos" class="mt-2 text-xs text-text-secondary">{{ textoAyudaHermanos }}</p>
                </div>

                <p v-if="errorGuardar" class="mt-3 text-xs text-danger">{{ errorGuardar }}</p>

                <div v-if="puedeEditar" class="mt-5 flex items-center justify-end gap-3">
                    <span v-if="guardadoOk" class="mr-auto flex items-center gap-1 text-xs text-mint">
                        <Save class="h-3.5 w-3.5" />
                        Guardado
                    </span>
                    <button type="submit" :disabled="!puedeGuardar"
                        class="flex items-center gap-2 rounded-card bg-accent px-5 py-2.5 text-sm font-medium text-bg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                        <Spinner v-if="guardando" />
                        <Save v-else class="h-4 w-4" />
                        Guardar
                    </button>
                </div>
                <p v-else class="mt-4 text-xs text-text-secondary">
                    Solo el administrador puede modificar estos valores.
                </p>
            </form>

            <div class="mt-5 space-y-3 border-t border-border pt-4">
                <p class="text-xs font-semibold uppercase tracking-wide text-text-secondary">{{ tituloAdeudo }}</p>
                <p v-if="errorAdeudo" class="text-sm text-danger">{{ errorAdeudo }}</p>
                <template v-else-if="adeudo">
                    <div v-if="!unSoloAlumno" class="space-y-3">
                        <div v-for="a in adeudo.alumnos" :key="a.id"
                            class="flex items-center justify-between gap-3 text-sm">
                            <div class="min-w-0">
                                <p class="truncate text-text-primary">{{ nombreAdeudo(a) }}</p>
                                <p class="text-xs text-text-secondary">{{ detalleAdeudo(a) }}</p>
                            </div>
                            <p class="shrink-0 font-semibold"
                                :class="a.estatus === 'activo' ? 'text-text-primary' : 'text-text-secondary'">
                                {{ formatearMonto(a.total_adeudo) }}
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center justify-between gap-3"
                        :class="unSoloAlumno ? '' : 'border-t border-border pt-3'">
                        <div class="min-w-0">
                            <p class="truncate text-sm font-semibold text-text-primary">{{ textoTotal }}</p>
                            <p v-if="textoUnico" class="text-xs text-text-secondary">{{ textoUnico }}</p>
                        </div>
                        <p class="shrink-0 text-xl font-bold text-accent">{{ formatearMonto(adeudo.total_familia) }}</p>
                    </div>
                </template>
                <p v-else class="text-sm text-text-secondary">Calculando...</p>
            </div>
        </div>
    </Transition>

    <!-- Burbuja -->
    <div class="absolute bottom-4 right-4 z-30">
        <span v-if="totalFamilia > 0 && !abierto"
            class="absolute -left-3 -top-2 whitespace-nowrap rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
            {{ formatearMonto(totalFamilia) }}
        </span>
        <button type="button" :aria-label="abierto ? 'Cerrar dinero' : 'Abrir dinero'" :aria-expanded="abierto"
            class="grid h-14 w-14 place-items-center rounded-full bg-accent text-bg shadow-lg shadow-black/40 transition hover:opacity-90 active:scale-95"
            @click="abierto = !abierto" @keydown.esc="alEsc">
            <X v-if="abierto" class="h-6 w-6" />
            <Wallet v-else class="h-6 w-6" />
        </button>
    </div>
</template>