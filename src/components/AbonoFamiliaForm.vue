<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import axios from 'axios'
import { Banknote, CalendarDays } from 'lucide-vue-next'
import { registrarAbono } from '@/api/pagos'
import type { AbonoPayload, AlumnoPagoSemana, ParteAbono } from '@/types/pago'
import { formatearMonto } from '@/utils/moneda'
import { soloFecha } from '@/utils/semana'
import Spinner from '@/components/Spinner.vue'

const MAX_MENSAJE = 300
const ESPERA_VISTA_MS = 350

const METODOS: { value: 'efectivo' | 'digital'; texto: string }[] = [
    { value: 'efectivo', texto: 'Efectivo' },
    { value: 'digital', texto: 'Digital' },
]

const props = defineProps<{
    alumno: AlumnoPagoSemana
    hermanos: AlumnoPagoSemana[] // quienes comparten tutor esa semana, incluido el alumno
    semanaInicio: string
}>()
const emit = defineEmits<{ registrado: [] }>()

function hoyTexto(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const hoy = hoyTexto()
// La fecha del registro la pone el servidor: aquí solo se muestra
const textoHoy = `Hoy, ${new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}`

// Identificador único del envío: frena el doble toque. Funciona también donde randomUUID no existe
function uuid(): string {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
    const b = crypto.getRandomValues(new Uint8Array(16))
    b[6] = (b[6]! & 0x0f) | 0x40
    b[8] = (b[8]! & 0x3f) | 0x80
    const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}
let lote = uuid()

const monto = ref('')
const fecha = ref(hoy)
const metodo = ref<'efectivo' | 'digital'>('efectivo')
const mensaje = ref('')
const enviando = ref(false)
const error = ref('')

const vista = ref<ParteAbono[]>([])
const errorVista = ref('')
const calculando = ref(false)
let temporizador: ReturnType<typeof setTimeout> | undefined
let solicitud = 0

// Lo que falta de la familia esa semana: solo cuentan los hermanos con algo pendiente
const conDeuda = computed(() =>
    props.hermanos.filter((h) => h.estatus !== 'confirmado' && !h.archivado && h.monto > 0),
)

const totalSugerido = computed(() => {
    const centavos = conDeuda.value.reduce((suma, h) => suma + Math.round(h.monto * 100), 0)
    return centavos > 0 ? (centavos / 100).toFixed(2) : ''
})

const montoNumero = computed<number | null>(() => {
    const texto = monto.value.trim().replace(',', '.')
    if (!/^\d+(\.\d{1,2})?$/.test(texto)) return null
    const n = Number(texto)
    return n > 0 ? n : null
})

function nombrePor(id: number): string {
    return props.hermanos.find((h) => h.cliente_id === id)?.alumno ?? 'Alumno'
}

interface Fila {
    id: number
    nombre: string
    monto: number
    saldo: number
    pagada: boolean
}

const filas = computed<Fila[]>(() => {
    const resultado: Fila[] = conDeuda.value.map((h) => {
        const p = vista.value.find((x) => x.cliente_id === h.cliente_id)
        return {
            id: h.cliente_id,
            nombre: h.alumno,
            monto: p?.monto ?? 0,
            saldo: p ? p.saldo : h.monto,
            pagada: p?.pagada ?? false,
        }
    })
    for (const p of vista.value) {
        if (!resultado.some((f) => f.id === p.cliente_id)) {
            resultado.push({ id: p.cliente_id, nombre: nombrePor(p.cliente_id), monto: p.monto, saldo: p.saldo, pagada: p.pagada })
        }
    }
    return resultado
})

// Lo que todavía faltaría de la familia con este monto: si es cero, la semana queda pagada
const faltaCentavos = computed(() => filas.value.reduce((suma, f) => suma + Math.round(f.saldo * 100), 0))
const cubreTodo = computed(() => vista.value.length > 0 && faltaCentavos.value === 0)

const puedeConfirmar = computed(
    () => montoNumero.value !== null && !calculando.value && !errorVista.value && vista.value.length > 0 && !enviando.value,
)

function mensajeDe(e: unknown, defecto: string): string {
    return axios.isAxiosError(e) && typeof e.response?.data === 'string' && e.response.data.trim()
        ? e.response.data.trim()
        : defecto
}

function cuerpo(simular: boolean): AbonoPayload {
    return {
        lote,
        semana_inicio: soloFecha(props.semanaInicio),
        monto: montoNumero.value!,
        metodo: metodo.value,
        mensaje: mensaje.value.trim() || undefined,
        simular,
    }
}

function pedirVista() {
    clearTimeout(temporizador)
    const mia = ++solicitud
    vista.value = []
    errorVista.value = ''
    if (montoNumero.value === null) {
        calculando.value = false
        if (monto.value.trim() !== '') errorVista.value = 'Escribe un monto mayor a cero, con a lo más dos decimales'
        return
    }
    calculando.value = true
    temporizador = setTimeout(async () => {
        try {
            const r = await registrarAbono(props.alumno.cliente_id, cuerpo(true))
            if (mia === solicitud) vista.value = r.partes
        } catch (e) {
            if (mia === solicitud) errorVista.value = mensajeDe(e, 'No se pudo calcular el reparto')
        } finally {
            if (mia === solicitud) calculando.value = false
        }
    }, ESPERA_VISTA_MS)
}

// Al abrir a otro alumno todo vuelve a empezar; los datos que se refrescan solos no borran lo escrito
function reiniciar() {
    monto.value = totalSugerido.value
    fecha.value = hoy
    metodo.value = props.alumno.metodo_semana === 'digital' ? 'digital' : 'efectivo'
    mensaje.value = ''
    error.value = ''
}

watch(() => props.alumno.cliente_id, reiniciar, { immediate: true })

// Cada cambio de monto o de fecha es un envío nuevo: otro identificador y otra vista previa
watch(
    [monto, fecha, () => props.alumno.cliente_id],
    () => {
        lote = uuid()
        pedirVista()
    },
    { immediate: true },
)

async function confirmar() {
    if (!puedeConfirmar.value) return
    enviando.value = true
    error.value = ''
    try {
        await registrarAbono(props.alumno.cliente_id, cuerpo(false))
        emit('registrado')
    } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 409 && String(e.response.data).includes('ya se registró')) {
            emit('registrado') // doble toque: el primer envío ya quedó guardado
        } else {
            error.value = mensajeDe(e, 'No se pudo guardar el pago')
        }
    } finally {
        enviando.value = false
    }
}

onUnmounted(() => clearTimeout(temporizador))

const clasesCampo =
    'w-full rounded-card border border-border bg-panel/40 px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/70 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent'
</script>

<template>
    <div class="space-y-3 border-t border-border pt-4">
        <p v-if="(alumno.abonado ?? 0) > 0" class="text-sm text-sun">
            Ya se abonaron {{ formatearMonto(alumno.abonado ?? 0) }} de esta semana.
        </p>

        <div class="grid gap-3 sm:grid-cols-2">
            <div>
                <label class="block text-xs text-text-secondary" for="abono-monto">¿Cuánto recibiste?</label>
                <div class="relative mt-1">
                    <span
                        class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary">$</span>
                    <input id="abono-monto" v-model="monto" type="text" inputmode="decimal" autocomplete="off"
                        :class="[clasesCampo, 'pl-7']" />
                </div>
            </div>
            <div>
                <p class="block text-xs text-text-secondary">Fecha del registro</p>
                <p
                    class="mt-1 flex items-center gap-2 rounded-card border border-border px-3 py-2 text-sm text-text-secondary">
                    <CalendarDays class="h-4 w-4 shrink-0" />
                    {{ textoHoy }}
                </p>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
            <button v-for="m in METODOS" :key="m.value" type="button"
                class="rounded-card border px-3 py-2 text-sm transition"
                :class="metodo === m.value ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:bg-panel-2'"
                @click="metodo = m.value">
                {{ m.texto }}
            </button>
        </div>

        <div class="space-y-1.5 rounded-card bg-panel-2 p-3 text-sm">
            <p class="text-xs text-text-secondary">Así se reparte</p>
            <p v-if="calculando" class="flex items-center gap-2 text-text-secondary">
                <Spinner />
                Calculando...
            </p>
            <p v-else-if="errorVista" class="text-danger">{{ errorVista }}</p>
            <p v-else-if="vista.length === 0" class="text-text-secondary">
                Escribe cuánto recibiste para ver el reparto.
            </p>
            <template v-else>
                <div v-for="f in filas" :key="f.id" class="flex items-center justify-between gap-3">
                    <span class="min-w-0 truncate text-text-primary">{{ f.nombre }}</span>
                    <span class="shrink-0 text-right">
                        <span class="text-text-primary">{{ formatearMonto(f.monto) }}</span>
                        <span class="block text-xs" :class="f.pagada ? 'text-mint' : 'text-text-secondary'">
                            {{ f.pagada ? 'Queda pagado' : `Debe ${formatearMonto(f.saldo)}` }}
                        </span>
                    </span>
                </div>
            </template>
        </div>

        <div>
            <label class="block text-xs text-text-secondary" for="abono-mensaje">
                Mensaje para el cliente (opcional)
            </label>
            <textarea id="abono-mensaje" v-model="mensaje" rows="2" :maxlength="MAX_MENSAJE"
                placeholder="Ej. Recibido en efectivo" :class="[clasesCampo, 'mt-1 resize-none']"></textarea>
        </div>

        <p v-if="vista.length > 0 && !cubreTodo" class="text-xs text-text-secondary">
            Quedará como pago parcial: aún faltan {{ formatearMonto(faltaCentavos / 100) }}.
        </p>

        <p v-if="error" class="text-sm text-danger">{{ error }}</p>

        <div class="flex justify-end">
            <button type="button" :disabled="!puedeConfirmar"
                class="flex items-center gap-2 rounded-card bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                @click="confirmar">
                <Spinner v-if="enviando" />
                <Banknote v-else class="h-4 w-4" />
                {{ cubreTodo ? 'Registrar pago' : `Registrar abono · falta ${formatearMonto(faltaCentavos / 100)}` }}
            </button>
        </div>
    </div>
</template>