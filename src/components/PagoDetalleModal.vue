<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import axios from 'axios'
import { X, Check, Ban, Banknote, ImageOff, ExternalLink } from 'lucide-vue-next'
import { confirmarPago, rechazarPago, marcarPagado } from '@/api/pagos'
import type { AlumnoPagoSemana } from '@/types/pago'
import { formatearMonto } from '@/utils/moneda'
import { rangoSemana, soloFecha } from '@/utils/semana'
import { textoFechaHora } from '@/utils/fecha'
import { ETIQUETAS_METODO, METODO_DIGITAL, estaAtenuado, etiquetaDe } from '@/utils/pagos'
import Spinner from '@/components/Spinner.vue'

const MAX_MENSAJE = 300

const props = defineProps<{
    alumno: AlumnoPagoSemana | null
    escuela: string
    semanaInicio: string
    puedeResolver: boolean
}>()
const emit = defineEmits<{ close: []; resuelto: [] }>()

const mensaje = ref('')
const motivo = ref('')
const rechazando = ref(false)
const enviando = ref(false)
const error = ref('')
const capturaFallida = ref(false)

// Al abrir otro alumno, o si cambia su captura, se limpia lo escrito
watch(
    () => [props.alumno?.cliente_id, props.alumno?.evidencia_url],
    () => {
        mensaje.value = ''
        motivo.value = ''
        rechazando.value = false
        error.value = ''
        capturaFallida.value = false
    },
)

// Solo se abren enlaces http(s): la captura la manda el cliente y no debe poder ejecutar nada al tocarla
const capturaUrl = computed(() => {
    const url = props.alumno?.evidencia_url ?? ''
    return /^https?:\/\//i.test(url) ? url : ''
})

const pagoPorVerificar = computed(
    () => props.puedeResolver && props.alumno?.estatus === 'pendiente_revision' && props.alumno.pago_id !== undefined,
)

// Semanas sin pago confirmado que el admin puede dar por pagadas (efectivo, o pagó en persona)
const puedeMarcarPagado = computed(() => {
    const a = props.alumno
    return props.puedeResolver && !!a && (a.estatus === 'no_reportada' || a.estatus === 'rechazado') && !estaAtenuado(a)
})

async function ejecutar(accion: () => Promise<void>) {
    enviando.value = true
    error.value = ''
    try {
        await accion()
        emit('resuelto')
        emit('close')
    } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 409 && typeof e.response.data === 'string') {
            error.value = e.response.data.trim()
            emit('resuelto') // otro admin ya resolvió este pago: se refresca para mostrar el estado real
        } else {
            error.value = 'No se pudo guardar el cambio'
        }
    } finally {
        enviando.value = false
    }
}

function confirmar() {
    const pagoId = props.alumno?.pago_id
    if (pagoId === undefined) return
    ejecutar(() => confirmarPago(pagoId, mensaje.value.trim()))
}

function rechazar() {
    const pagoId = props.alumno?.pago_id
    if (pagoId === undefined) return
    if (!motivo.value.trim()) {
        error.value = 'Escribe por qué se rechaza para que el cliente lo sepa'
        return
    }
    ejecutar(() => rechazarPago(pagoId, motivo.value.trim()))
}

function marcarComoPagado() {
    const a = props.alumno
    if (!a) return
    ejecutar(() => marcarPagado(a.cliente_id, soloFecha(props.semanaInicio), mensaje.value.trim()))
}

function empezarRechazo() {
    error.value = ''
    rechazando.value = true
}

function cancelarRechazo() {
    error.value = ''
    rechazando.value = false
}

function alTeclaEsc(evento: KeyboardEvent) {
    if (evento.key === 'Escape') emit('close')
}

const clasesCampo =
    'w-full resize-none rounded-card border border-border bg-panel/40 px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/70 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent'
</script>

<template>
    <Teleport to="body">
        <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
            enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="alumno" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                @click.self="emit('close')" @keydown="alTeclaEsc" tabindex="-1">
                <Transition appear enter-active-class="transition duration-200 ease-out"
                    enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100"
                    leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 scale-100"
                    leave-to-class="opacity-0 scale-95">
                    <div
                        class="glass flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-card p-5 sm:p-6 md:max-w-2xl">
                        <div class="mb-4 flex shrink-0 items-start justify-between gap-3">
                            <div class="min-w-0">
                                <h2 class="truncate text-lg font-semibold text-text-primary">{{ alumno.alumno }}</h2>
                                <p class="text-xs text-text-secondary">{{ escuela }}</p>
                            </div>
                            <button class="shrink-0 text-text-secondary hover:text-text-primary" aria-label="Cerrar"
                                @click="emit('close')">
                                <X class="h-5 w-5" />
                            </button>
                        </div>

                        <div
                            class="-mr-4 min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain scroll-fino pr-4 sm:-mr-5 sm:pr-5">
                            <div class="glass space-y-2 rounded-card p-4">
                                <div class="flex items-center justify-between gap-3">
                                    <span class="rounded-card px-2 py-1 text-xs font-medium"
                                        :class="etiquetaDe(alumno).clases">
                                        {{ etiquetaDe(alumno).texto }}
                                    </span>
                                    <p v-if="alumno.estatus !== 'confirmado' && !alumno.sin_cuota"
                                        class="text-lg font-semibold text-text-primary"
                                        :class="{ 'line-through': estaAtenuado(alumno) }">
                                        {{ formatearMonto(alumno.monto) }}
                                        <span v-if="alumno.con_recargo && !estaAtenuado(alumno)"
                                            class="text-xs font-normal text-sun">con recargo</span>
                                    </p>
                                </div>
                                <p class="text-sm text-text-secondary">Semana del {{ rangoSemana(semanaInicio) }}</p>
                                <p class="text-sm text-text-secondary">
                                    <span :class="{ 'font-medium text-accent': alumno.metodo_pago === METODO_DIGITAL }">
                                        {{ ETIQUETAS_METODO[alumno.metodo_pago] ?? alumno.metodo_pago }}
                                    </span>
                                    <span v-if="alumno.sin_cuota" class="text-sun"> · Cuota sin configurar</span>
                                </p>
                                <p v-if="alumno.fecha_reporte" class="text-sm text-text-secondary">
                                    Registrado el {{ textoFechaHora(alumno.fecha_reporte) }}
                                </p>
                            </div>

                            <div v-if="alumno.evidencia_url" class="space-y-2">
                                <p class="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                    Captura del cliente
                                </p>
                                <a v-if="capturaUrl && !capturaFallida" :href="capturaUrl" target="_blank"
                                    rel="noopener noreferrer" title="Abrir en tamaño completo">
                                    <img :src="capturaUrl" alt="Captura de pantalla del pago" loading="lazy"
                                        referrerpolicy="no-referrer"
                                        class="max-h-96 w-full rounded-card bg-panel-2 object-contain"
                                        @error="capturaFallida = true" />
                                </a>
                                <p v-else
                                    class="flex items-center gap-2 rounded-card bg-panel-2 p-3 text-sm text-text-secondary">
                                    <ImageOff class="h-4 w-4 shrink-0" />
                                    No se pudo mostrar la captura.
                                    <a v-if="capturaUrl" :href="capturaUrl" target="_blank" rel="noopener noreferrer"
                                        class="ml-auto flex items-center gap-1 text-accent underline">
                                        Abrir
                                        <ExternalLink class="h-3.5 w-3.5" />
                                    </a>
                                </p>
                            </div>
                            <p v-else-if="alumno.estatus === 'pendiente_revision'" class="text-sm text-text-secondary">
                                El cliente no adjuntó captura.
                            </p>

                            <div v-if="alumno.nota" class="space-y-1">
                                <p class="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                    Nota del cliente
                                </p>
                                <p
                                    class="whitespace-pre-line break-words rounded-card bg-panel-2 p-3 text-sm text-text-primary">
                                    {{ alumno.nota }}
                                </p>
                            </div>

                            <div v-if="alumno.estatus === 'rechazado'"
                                class="rounded-card border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
                                <p class="font-medium">Pago rechazado</p>
                                <p v-if="alumno.motivo_rechazo">{{ alumno.motivo_rechazo }}</p>
                                <p class="text-xs">El cliente puede enviar otra captura esta semana.</p>
                            </div>

                            <div v-if="alumno.estatus === 'confirmado'"
                                class="rounded-card bg-mint/10 p-3 text-sm text-mint">
                                <p class="font-medium">Pago confirmado</p>
                                <p v-if="alumno.mensaje_admin">Mensaje para el cliente: {{ alumno.mensaje_admin }}</p>
                            </div>

                            <template v-if="pagoPorVerificar">
                                <div v-if="!rechazando" class="space-y-3 border-t border-border pt-4">
                                    <div>
                                        <label class="block text-xs text-text-secondary" for="mensaje-pago">
                                            Mensaje para el cliente (opcional)
                                        </label>
                                        <textarea id="mensaje-pago" v-model="mensaje" rows="2" :maxlength="MAX_MENSAJE"
                                            placeholder="Ej. Ok, pago recibido"
                                            :class="[clasesCampo, 'mt-1']"></textarea>
                                    </div>
                                    <p v-if="error" class="text-sm text-danger">{{ error }}</p>
                                    <div class="flex justify-end gap-3">
                                        <button type="button" :disabled="enviando"
                                            class="flex items-center gap-2 rounded-card border border-danger/40 px-4 py-2 text-sm text-danger/90 hover:bg-danger/10 disabled:opacity-50"
                                            @click="empezarRechazo">
                                            <Ban class="h-4 w-4" />
                                            Rechazar
                                        </button>
                                        <button type="button" :disabled="enviando"
                                            class="flex items-center gap-2 rounded-card bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50"
                                            @click="confirmar">
                                            <Spinner v-if="enviando" />
                                            <Check v-else class="h-4 w-4" />
                                            Confirmar pago
                                        </button>
                                    </div>
                                </div>

                                <div v-else class="space-y-3 rounded-card border border-danger/30 bg-danger/10 p-4">
                                    <div>
                                        <label class="block text-xs text-text-secondary" for="motivo-rechazo">
                                            ¿Por qué se rechaza? (el cliente lo verá)
                                        </label>
                                        <textarea id="motivo-rechazo" v-model="motivo" rows="2" :maxlength="MAX_MENSAJE"
                                            placeholder="Ej. La captura se ve borrosa"
                                            :class="[clasesCampo, 'mt-1']"></textarea>
                                    </div>
                                    <p v-if="error" class="text-sm text-danger">{{ error }}</p>
                                    <div class="flex justify-end gap-3">
                                        <button type="button" :disabled="enviando"
                                            class="rounded-card border border-border px-4 py-2 text-sm text-text-secondary hover:bg-panel-2 disabled:opacity-50"
                                            @click="cancelarRechazo">
                                            Cancelar
                                        </button>
                                        <button type="button" :disabled="enviando"
                                            class="flex items-center gap-2 rounded-card bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                                            @click="rechazar">
                                            <Spinner v-if="enviando" />
                                            <Ban v-else class="h-4 w-4" />
                                            Rechazar
                                        </button>
                                    </div>
                                </div>
                            </template>

                            <div v-else-if="puedeMarcarPagado" class="space-y-3 border-t border-border pt-4">
                                <div>
                                    <label class="block text-xs text-text-secondary" for="mensaje-manual">
                                        Mensaje para el cliente (opcional)
                                    </label>
                                    <textarea id="mensaje-manual" v-model="mensaje" rows="2" :maxlength="MAX_MENSAJE"
                                        placeholder="Ej. Recibido en efectivo"
                                        :class="[clasesCampo, 'mt-1']"></textarea>
                                </div>
                                <p v-if="error" class="text-sm text-danger">{{ error }}</p>
                                <div class="flex justify-end">
                                    <button type="button" :disabled="enviando"
                                        class="flex items-center gap-2 rounded-card bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50"
                                        @click="marcarComoPagado">
                                        <Spinner v-if="enviando" />
                                        <Banknote v-else class="h-4 w-4" />
                                        Marcar como pagado
                                    </button>
                                </div>
                            </div>

                            <p v-else-if="!puedeResolver && alumno.estatus !== 'confirmado'"
                                class="text-xs text-text-secondary">
                                Solo el administrador puede validar pagos.
                            </p>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>