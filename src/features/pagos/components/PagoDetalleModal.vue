<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Check, Ban, ChevronRight, Image as IconoImagen, HandCoins } from 'lucide-vue-next'
import { confirmarPago, rechazarPago } from '@/features/pagos/api/pagos'
import { textoDeEstado } from '@/shared/utils/errores'
import { useAviso } from '@/shared/composables/useAviso'
import ModalBase from '@/shared/ui/ModalBase.vue'
import { MAX_MENSAJE } from '@/shared/constants/pagos'
import type { AlumnoPagoSemana } from '@/features/pagos/types/pago'
import { formatearMonto } from '@/shared/utils/moneda'
import { rangoSemana, soloFecha } from '@/shared/utils/semana'
import { textoFechaHora } from '@/shared/utils/fecha'
import { ETIQUETAS_METODO, METODO_DIGITAL, estaAtenuado, estadoDe, etiquetaDe, saldoDe } from '@/features/pagos/utils/pagos'
import PagoConfiguracionForm from '@/features/pagos/components/PagoConfiguracionForm.vue'
import AbonoFamiliaForm from '@/features/pagos/components/AbonoFamiliaForm.vue'
import RecibosSemana from '@/features/pagos/components/RecibosSemana.vue'
import RecibiMenosForm from '@/features/pagos/components/RecibiMenosForm.vue'
import BotonDinero from '@/features/pagos/components/BotonDinero.vue'
import {
    TEXTO_MONTO_CARGO,
    TEXTO_MONTO_ABONADO,
    TEXTO_MONTO_FALTA,
    TEXTO_MONTO_POR_VERIFICAR,
    TEXTO_MONTO_TOTAL_FAMILIA,
    TEXTO_CAPTURA_ALT,
} from '@/features/pagos/constants/dinero'
import ServicioEtiqueta from '@/shared/ui/ServicioEtiqueta.vue'
import LeyendaEstados from '@/shared/ui/LeyendaEstados.vue'
import { ESTADO_CICLO } from '@/shared/constants/estadoCiclo'
import { TAMANO_MODAL } from '@/shared/constants/modal'
import Spinner from '@/shared/ui/Spinner.vue'
import VisorCaptura from '@/shared/ui/VisorCaptura.vue'

const props = defineProps<{
    alumno: AlumnoPagoSemana | null
    hermanos?: AlumnoPagoSemana[] // quienes comparten tutor con este alumno esa semana, incluido él
    escuela: string
    semanaInicio: string
    puedeResolver: boolean
}>()
const emit = defineEmits<{ close: []; resuelto: []; abrir: [id: number]; dinero: [id: number] }>()

const { mostrarAviso } = useAviso()

const mensaje = ref('')
const motivo = ref('')
const rechazando = ref(false)
const recibiendoMenos = ref(false)
const enviando = ref(false)
const error = ref('')
const verCaptura = ref(false)
// Cuenta cuántas veces se refrescaron los datos del alumno: los recibos se vuelven a pedir cada vez
const refrescos = ref(0)
watch(() => props.alumno, () => refrescos.value++)

// Al abrir otro alumno, o si cambia su captura, se limpia lo escrito
watch(
    () => [props.alumno?.cliente_id, props.alumno?.evidencia_url],
    () => {
        mensaje.value = ''
        motivo.value = ''
        rechazando.value = false
        recibiendoMenos.value = false
        error.value = ''
        verCaptura.value = false
    },
)

// Solo se abren enlaces http(s): la captura la manda el cliente y no debe poder ejecutar nada al tocarla
const capturaUrl = computed(() => {
    const url = props.alumno?.evidencia_url ?? ''
    return /^https?:\/\//i.test(url) ? url : ''
})

const estado = computed(() => (props.alumno ? estadoDe(props.alumno) : null))
const saldo = computed(() => (props.alumno ? saldoDe(props.alumno) : 0))

// Los pagos digitales reportados se revisan aquí; el efectivo se registra con lo que se recibió
const pagoPorVerificar = computed(
    () =>
        props.puedeResolver &&
        estado.value === 'por_verificar' &&
        props.alumno?.pago_id !== undefined &&
        props.alumno.metodo_semana === METODO_DIGITAL,
)

// Confirmar solo con comprobante: el servidor no deja marcar pagada una semana con tarjeta sin captura
const puedeConfirmar = computed(() => capturaUrl.value !== '')
const pagoId = computed(() => props.alumno?.pago_id)

// Semanas sin pago confirmado que el admin puede dar por pagadas (efectivo, o pagó en persona)
const puedeMarcarPagado = computed(() => {
    const a = props.alumno
    return props.puedeResolver && !!a && (estado.value === 'sin_reportar' ||
        estado.value === 'rechazada' ||
        estado.value === 'parcial' ||
        (estado.value === 'por_verificar' && a.metodo_semana !== METODO_DIGITAL)) && !estaAtenuado(a)
})

// Un alumno sin cuota no tiene monto que cobrar: el admin la configura aquí mismo
const puedeConfigurar = computed(() => props.puedeResolver && !!props.alumno?.sin_cuota)

async function ejecutar(accion: () => Promise<void>) {
    enviando.value = true
    error.value = ''
    try {
        await accion()
        emit('resuelto')
        emit('close')
    } catch (e) {
        const texto = textoDeEstado(e, 409)
        if (texto !== null) {
            error.value = texto
            mostrarAviso(texto, 'error') // p. ej. el servidor no deja confirmar un pago digital sin comprobante
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

// Al registrar lo recibido se refresca la lista y se cierra el detalle
function alRegistrar() {
    emit('resuelto')
    emit('close')
}

function empezarRechazo() {
    error.value = ''
    recibiendoMenos.value = false
    rechazando.value = true
}

function empezarRecibiMenos() {
    error.value = ''
    rechazando.value = false
    recibiendoMenos.value = true
}

function cancelarRechazo() {
    error.value = ''
    rechazando.value = false
}

const clasesCampo =
    'w-full resize-none rounded-card border border-border bg-panel/40 px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/70 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent'
</script>

<template>
    <ModalBase :abierto="!!alumno" @cerrar="emit('close')">
        <div v-if="alumno"
            class="glass relative flex max-h-[calc(100dvh-2rem)] w-full flex-col rounded-card p-5 sm:p-6"
            :class="TAMANO_MODAL.muyAncho">
            <div class="mb-4 flex shrink-0 items-start justify-between gap-3">
                <div class="min-w-0">
                    <h2 class="truncate text-lg font-semibold text-text-primary">{{ alumno.alumno }}</h2>
                    <p class="text-xs text-text-secondary">{{ escuela }}</p>
                </div>
                <div class="flex shrink-0 items-center gap-3">
                    <BotonDinero v-if="puedeResolver" @click="emit('dinero', alumno.cliente_id)" />
                    <button class="text-text-secondary hover:text-text-primary" aria-label="Cerrar" @click="emit('close')">
                        <X class="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div :class="{ 'pb-16': puedeConfigurar }"
                class="-mr-4 min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-fino pr-4 sm:-mr-5 sm:pr-5">
                <!-- Escritorio: izquierda, familia y montos; derecha, comprobante y acciones. En móvil, una columna -->
                <div class="space-y-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0">
                    <div class="space-y-4">
                        <div class="glass space-y-2 rounded-card p-4">
                            <div class="flex items-center justify-between gap-3">
                                <span class="rounded-card px-2 py-1 text-xs font-medium" :class="etiquetaDe(alumno).clases">
                                    {{ etiquetaDe(alumno).texto }}
                                </span>
                                <p v-if="estado === 'pagada' || !alumno.sin_cuota"
                                    class="text-lg font-semibold text-text-primary"
                                    :class="{ 'line-through': estaAtenuado(alumno) }">
                                    {{ formatearMonto(alumno.monto) }}
                                    <span v-if="alumno.con_recargo && !estaAtenuado(alumno)"
                                        class="text-xs font-normal text-sun">con recargo</span>
                                </p>
                            </div>
                            <p class="text-sm text-text-secondary">Semana del {{ rangoSemana(semanaInicio) }}</p>
                            <ServicioEtiqueta :servicio="alumno.servicio" />
                            <p class="text-sm text-text-secondary">
                                <span :class="{ 'font-medium text-accent': alumno.metodo_semana === METODO_DIGITAL }">
                                    {{ ETIQUETAS_METODO[alumno.metodo_semana] ?? alumno.metodo_semana }}
                                </span>
                                <span v-if="alumno.sin_cuota" class="text-sun"> · Cuota sin configurar</span>
                            </p>
                            <p v-if="alumno.fecha_reporte" class="text-sm text-text-secondary">
                                Registrado el {{ textoFechaHora(alumno.fecha_reporte) }}
                            </p>
                        </div>

                        <p v-if="estado" class="rounded-card bg-panel-2 p-3 text-sm text-text-primary">
                            {{ ESTADO_CICLO[estado].significado }}
                        </p>

                        <dl v-if="alumno.cargo !== undefined"
                            class="grid grid-cols-2 gap-3 rounded-card bg-panel-2 p-3 text-sm">
                            <div>
                                <dt class="text-xs text-text-secondary">{{ TEXTO_MONTO_CARGO }}</dt>
                                <dd class="font-semibold text-text-primary">{{ formatearMonto(alumno.cargo) }}</dd>
                            </div>
                            <div>
                                <dt class="text-xs text-text-secondary">{{ TEXTO_MONTO_ABONADO }}</dt>
                                <dd class="font-semibold text-text-primary">{{ formatearMonto(alumno.abonado_confirmado ?? 0) }}</dd>
                            </div>
                            <div>
                                <dt class="text-xs text-text-secondary">{{ TEXTO_MONTO_FALTA }}</dt>
                                <dd class="font-semibold text-text-primary">{{ formatearMonto(saldo) }}</dd>
                            </div>
                            <div v-if="(alumno.por_verificar ?? 0) > 0">
                                <dt class="text-xs text-text-secondary">{{ TEXTO_MONTO_POR_VERIFICAR }}</dt>
                                <dd class="font-semibold text-sun">{{ formatearMonto(alumno.por_verificar ?? 0) }}</dd>
                            </div>
                            <div v-if="hermanos && hermanos.length > 1 && alumno.total_familia !== undefined">
                                <dt class="text-xs text-text-secondary">{{ TEXTO_MONTO_TOTAL_FAMILIA }}</dt>
                                <dd class="font-semibold text-text-primary">{{ formatearMonto(alumno.total_familia) }}</dd>
                            </div>
                        </dl>

                        <div v-if="hermanos && hermanos.length > 1" class="glass space-y-2 rounded-card p-3">
                            <p class="text-xs font-semibold uppercase tracking-wide text-text-secondary">Familia</p>
                            <button v-for="h in hermanos" :key="h.cliente_id" type="button"
                                class="flex w-full items-center justify-between gap-3 rounded-card px-2 py-1.5 text-left text-sm transition hover:bg-panel-2"
                                :class="h.cliente_id === alumno.cliente_id ? 'bg-panel-2' : ''"
                                @click="h.cliente_id !== alumno.cliente_id && emit('abrir', h.cliente_id)">
                                <span class="min-w-0 truncate text-text-primary">{{ h.alumno }}</span>
                                <span class="shrink-0 rounded-card px-2 py-0.5 text-xs font-medium" :class="etiquetaDe(h).clases">
                                    {{ etiquetaDe(h).texto }}
                                </span>
                            </button>
                        </div>

                        <LeyendaEstados v-if="estado" :actual="estado" />
                    </div>

                    <div class="space-y-4">
                        <button v-if="alumno.evidencia_url" type="button"
                            class="glass-plano flex w-full items-center justify-between gap-3 rounded-card p-3 text-left text-sm text-text-primary transition hover:bg-panel-2 lg:hidden"
                            @click="verCaptura = true">
                            <span class="flex items-center gap-2">
                                <IconoImagen class="h-4 w-4 text-accent" />
                                Ver captura del cliente
                            </span>
                            <ChevronRight class="h-4 w-4 text-text-secondary" />
                        </button>
                        <button v-if="capturaUrl" type="button" aria-label="Ampliar la captura del cliente"
                            class="hidden w-full overflow-hidden rounded-card border border-border bg-panel-2 lg:block"
                            @click="verCaptura = true">
                            <img :src="capturaUrl" :alt="TEXTO_CAPTURA_ALT"
                                class="mx-auto max-h-[50vh] w-full object-contain" />
                        </button>
                        <p v-else-if="estado === 'por_verificar'" class="text-sm text-text-secondary">
                            {{ alumno.metodo_semana === METODO_DIGITAL
                                ? 'El cliente no adjuntó captura.'
                                : 'Pago en efectivo: se recibe en persona, no lleva captura.' }}
                        </p>

                        <div v-if="alumno.nota" class="space-y-1">
                            <p class="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                Nota del cliente
                            </p>
                            <p class="whitespace-pre-line wrap-break-word rounded-card bg-panel-2 p-3 text-sm text-text-primary">
                                {{ alumno.nota }}
                            </p>
                        </div>

                        <div v-if="estado === 'rechazada'"
                            class="rounded-card border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
                            <p class="font-medium">Pago rechazado</p>
                            <p v-if="alumno.motivo_rechazo">{{ alumno.motivo_rechazo }}</p>
                            <p class="text-xs">El cliente puede enviar otra captura esta semana.</p>
                        </div>

                        <div v-if="estado === 'pagada'" class="rounded-card bg-mint/10 p-3 text-sm text-mint">
                            <p class="font-medium">Pago confirmado</p>
                            <p v-if="alumno.mensaje_admin">Mensaje para el cliente: {{ alumno.mensaje_admin }}</p>
                        </div>

                        <RecibosSemana v-if="puedeResolver" :cliente-id="alumno.cliente_id"
                            :semana-inicio="soloFecha(semanaInicio)" :version="refrescos" @anulado="emit('resuelto')" />

                        <template v-if="pagoPorVerificar">
                            <div v-if="!rechazando && !recibiendoMenos" class="space-y-3 border-t border-border pt-4">
                                <p v-if="puedeConfirmar" class="text-sm text-text-secondary">
                                    Al confirmar se da por cubierto lo que falta:
                                    <span class="font-semibold text-text-primary">{{ formatearMonto(saldo) }}</span>.
                                </p>
                                <p v-else class="text-sm text-sun">
                                    Sin comprobante no se puede confirmar: puedes rechazarlo o registrar lo que llegó.
                                </p>
                                <div v-if="puedeConfirmar">
                                    <label class="block text-xs text-text-secondary" for="mensaje-pago">
                                        Mensaje para el cliente (opcional)
                                    </label>
                                    <textarea id="mensaje-pago" v-model="mensaje" rows="2" :maxlength="MAX_MENSAJE"
                                        placeholder="Ej. Ok, pago recibido" :class="[clasesCampo, 'mt-1']"></textarea>
                                </div>
                                <p v-if="error" class="text-sm text-danger">{{ error }}</p>
                                <div class="flex flex-wrap justify-end gap-3">
                                    <button type="button" :disabled="enviando"
                                        class="flex items-center gap-2 rounded-card border border-danger/40 px-4 py-2 text-sm text-danger/90 hover:bg-danger/10 disabled:opacity-50"
                                        @click="empezarRechazo">
                                        <Ban class="h-4 w-4" />
                                        Rechazar
                                    </button>
                                    <button type="button" :disabled="enviando"
                                        class="flex items-center gap-2 rounded-card border border-border px-4 py-2 text-sm text-text-primary hover:bg-panel-2 disabled:opacity-50"
                                        @click="empezarRecibiMenos">
                                        <HandCoins class="h-4 w-4" />
                                        Recibí menos
                                    </button>
                                    <button v-if="puedeConfirmar" type="button" :disabled="enviando"
                                        class="flex items-center gap-2 rounded-card bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50"
                                        @click="confirmar">
                                        <Spinner v-if="enviando" />
                                        <Check v-else class="h-4 w-4" />
                                        Confirmar pago
                                    </button>
                                </div>
                            </div>

                            <RecibiMenosForm v-else-if="recibiendoMenos && pagoId !== undefined" :pago-id="pagoId"
                                :saldo="saldo" @registrado="alRegistrar" @conflicto="emit('resuelto')"
                                @cancelar="recibiendoMenos = false" />

                            <div v-else class="space-y-3 rounded-card border border-danger/30 bg-danger/10 p-4">
                                <div>
                                    <label class="block text-xs text-text-secondary" for="motivo-rechazo">
                                        ¿Por qué se rechaza? (el cliente lo verá)
                                    </label>
                                    <textarea id="motivo-rechazo" v-model="motivo" rows="2" :maxlength="MAX_MENSAJE"
                                        placeholder="Ej. La captura se ve borrosa" :class="[clasesCampo, 'mt-1']"></textarea>
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

                        <AbonoFamiliaForm v-else-if="puedeMarcarPagado" :alumno="alumno"
                            :hermanos="hermanos ?? [alumno]" :semana-inicio="semanaInicio" @registrado="alRegistrar" />

                        <p v-else-if="!puedeResolver && estado !== 'pagada'" class="text-xs text-text-secondary">
                            Solo el administrador puede validar pagos.
                        </p>
                    </div>
                </div>
            </div>

            <PagoConfiguracionForm v-if="puedeConfigurar" :key="alumno.cliente_id" :alumno="alumno"
                @guardado="emit('resuelto')" />
        </div>
    </ModalBase>

    <VisorCaptura :url="capturaUrl" :abierto="verCaptura" @close="verCaptura = false" />
</template>
