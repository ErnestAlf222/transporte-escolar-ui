<script setup lang="ts">
import { ref, nextTick } from 'vue'
import axios from 'axios'
import { Save, Wallet, X } from 'lucide-vue-next'
import { configurarCliente } from '@/api/clientes'
import type { AlumnoPagoSemana } from '@/types/pago'
import type { MetodoPago, ConfigurarClientePayload } from '@/types/cliente'
import { parseMonto } from '@/utils/moneda'
import { ETIQUETAS_METODO } from '@/utils/pagos'
import Spinner from '@/components/Spinner.vue'

const props = defineProps<{ alumno: AlumnoPagoSemana }>()
const emit = defineEmits<{ guardado: [] }>()

// La semana es de lunes a viernes: el día límite no puede caer en fin de semana (0 = domingo ... 6 = sábado)
const DIAS_LIMITE = [
    { valor: 1, etiqueta: 'Lun' },
    { valor: 2, etiqueta: 'Mar' },
    { valor: 3, etiqueta: 'Mié' },
    { valor: 4, etiqueta: 'Jue' },
    { valor: 5, etiqueta: 'Vie' },
]
const METODOS: MetodoPago[] = ['digital', 'efectivo']

const clasesCampo =
    'mt-1 w-full rounded-card border border-border bg-panel/40 px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/70 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent'

// Parte de lo que el alumno ya tiene, para no pisar nada: la cuota empieza vacía porque es lo que falta
const form = ref({
    cuota: '',
    recargo: String(props.alumno.monto_recargo),
    dia: props.alumno.dia_limite_pago,
    metodo: props.alumno.metodo_pago as MetodoPago,
})
const enviando = ref(false)
const error = ref('')
const abierto = ref(false)
const campoCuota = ref<HTMLInputElement | null>(null)
const burbuja = ref<HTMLElement | null>(null)
// Dónde está la burbuja en la pantalla al abrir: de ahí crece el panel y hacia ahí se encoge
const caja = ref({ left: 0, top: 0, lado: 0 })

async function abrir() {
    const r = burbuja.value?.getBoundingClientRect()
    if (r) caja.value = { left: r.left, top: r.top, lado: r.width }
    abierto.value = true
    await nextTick()
    campoCuota.value?.focus()
}

// El origen de la animación del panel es el centro de la burbuja
function acomodarOrigen(el: Element) {
    const panel = el as HTMLElement
    const x = caja.value.left + caja.value.lado / 2 - panel.offsetLeft
    const y = caja.value.top + caja.value.lado / 2 - panel.offsetTop
    panel.style.transformOrigin = `${x}px ${y}px`
}

function cerrar() {
    abierto.value = false
}

function validar(): { payload?: ConfigurarClientePayload; mensaje?: string } {
    const cuota = parseMonto(form.value.cuota)
    if (cuota === null || cuota <= 0) return { mensaje: 'Escribe la cuota semanal (mayor a 0)' }
    const recargo = parseMonto(form.value.recargo)
    if (recargo === null) return { mensaje: 'Escribe el recargo por atraso (puede ser 0)' }
    if (!DIAS_LIMITE.some((d) => d.valor === form.value.dia)) {
        return { mensaje: 'Elige el día límite de pago, de lunes a viernes' }
    }
    return {
        payload: {
            monto_cuota: cuota,
            monto_recargo: recargo,
            dia_limite_pago: form.value.dia,
            metodo_pago: form.value.metodo,
        },
    }
}

async function guardar() {
    const { payload, mensaje } = validar()
    if (!payload) {
        error.value = mensaje ?? ''
        return
    }
    enviando.value = true
    error.value = ''
    try {
        await configurarCliente(props.alumno.cliente_id, payload)
        cerrar()
        emit('guardado')
    } catch (e) {
        error.value =
            axios.isAxiosError(e) && e.response?.status === 400 && typeof e.response.data === 'string'
                ? e.response.data.trim()
                : 'No se pudo guardar la configuración'
    } finally {
        enviando.value = false
    }
}
</script>

<template>
    <!-- Burbuja: queda en la esquina de la ventana de detalle -->
    <div class="absolute bottom-4 right-4 z-30">
        <span
            class="absolute -left-3 -top-2 rounded-full bg-sun px-1.5 py-0.5 text-[10px] font-bold leading-none text-bg">
            Sin cuota
        </span>
        <button ref="burbuja" type="button" aria-label="Configurar el pago"
            class="grid h-14 w-14 place-items-center rounded-full bg-accent text-bg shadow-lg shadow-black/40 transition hover:opacity-90 active:scale-95"
            @click="abrir">
            <Wallet class="h-6 w-6" />
        </button>
    </div>

    <!-- El panel va en el body, por encima de la ventana de detalle: así el desenfoque cubre toda la pantalla
         y el panel no queda limitado al alto de la ventana -->
    <Teleport to="body">
        <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
            enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="abierto"
                class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 pb-24 supports-backdrop-filter:bg-black/30 supports-backdrop-filter:backdrop-blur-sm"
                tabindex="-1" @click.self="cerrar" @keydown.esc="cerrar">
                <Transition appear enter-active-class="transition duration-300 ease-out motion-reduce:transition-none"
                    enter-from-class="opacity-0 scale-50" @enter="acomodarOrigen" enter-to-class="opacity-100 scale-100"
                    leave-active-class="transition duration-200 ease-in motion-reduce:transition-none"
                    leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-50">
                    <div role="dialog" aria-label="Configurar el pago del alumno"
                        class="glass max-h-full w-full max-w-md space-y-4 overflow-y-auto overscroll-contain scroll-fino rounded-card p-5 shadow-xl shadow-black/40">
                        <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0">
                                <p class="text-base font-semibold text-text-primary">Configura el pago</p>
                                <p class="truncate text-xs text-text-secondary">{{ alumno.alumno }}</p>
                            </div>
                            <button type="button" aria-label="Cerrar"
                                class="shrink-0 text-text-secondary hover:text-text-primary" @click="cerrar">
                                <X class="h-5 w-5" />
                            </button>
                        </div>

                        <form class="space-y-4" @submit.prevent="guardar">
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-xs text-text-secondary" for="config-cuota">Cuota
                                        semanal</label>
                                    <input id="config-cuota" ref="campoCuota" v-model="form.cuota" type="text"
                                        inputmode="decimal" placeholder="0.00" :class="clasesCampo" />
                                </div>
                                <div>
                                    <label class="block text-xs text-text-secondary" for="config-recargo">Recargo por
                                        atraso</label>
                                    <input id="config-recargo" v-model="form.recargo" type="text" inputmode="decimal"
                                        placeholder="0.00" :class="clasesCampo" />
                                </div>
                            </div>

                            <div>
                                <p class="text-xs text-text-secondary">Día límite de pago</p>
                                <div class="mt-1 grid grid-cols-5 gap-1.5">
                                    <button v-for="d in DIAS_LIMITE" :key="d.valor" type="button"
                                        class="rounded-card border py-2 text-xs transition"
                                        :class="form.dia === d.valor ? 'border-accent bg-accent/15 text-accent' : 'border-border text-text-secondary hover:bg-panel-2'"
                                        @click="form.dia = d.valor">
                                        {{ d.etiqueta }}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <p class="text-xs text-text-secondary">Método de pago</p>
                                <div class="mt-1 grid grid-cols-2 gap-2">
                                    <button v-for="m in METODOS" :key="m" type="button"
                                        class="rounded-card border py-2 text-sm transition"
                                        :class="form.metodo === m ? 'border-accent bg-accent/15 text-accent' : 'border-border text-text-secondary hover:bg-panel-2'"
                                        @click="form.metodo = m">
                                        {{ ETIQUETAS_METODO[m] ?? m }}
                                    </button>
                                </div>
                            </div>

                            <p v-if="error" class="text-sm text-danger">{{ error }}</p>

                            <div class="flex justify-end">
                                <button type="submit" :disabled="enviando"
                                    class="flex items-center gap-2 rounded-card bg-accent px-5 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                                    <Spinner v-if="enviando" />
                                    <Save v-else class="h-4 w-4" />
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </Transition>
            </div>
        </Transition>

        <!-- La burbuja sigue a la vista sobre el desenfoque: tocarla minimiza el panel hacia ella -->
        <button v-if="abierto" type="button" aria-label="Minimizar"
            class="fixed z-[62] grid place-items-center rounded-full bg-accent text-bg shadow-lg shadow-black/40 transition hover:opacity-90 active:scale-95"
            :style="{ left: `${caja.left}px`, top: `${caja.top}px`, width: `${caja.lado}px`, height: `${caja.lado}px` }"
            @click="cerrar">
            <X class="h-6 w-6" />
        </button>
    </Teleport>
</template>