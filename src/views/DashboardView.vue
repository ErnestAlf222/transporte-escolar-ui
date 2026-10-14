<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNavegacionStore } from '@/stores/navegacion'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { verPagosSemana } from '@/api/pagos'
import { moverSemana, rangoSemana, soloFecha, lunesDe } from '@/utils/semana'
import { verDashboard } from '@/api/dashboard'
import { ETIQUETAS } from '@/utils/pagos'
import type { PagosSemana, EstatusSemana } from '@/types/pago'
import type { DashboardResumen } from '@/types/dashboard'
import LoaderVan from '@/components/LoaderVan.vue'
import ListaEstatusModal from '@/components/ListaEstatusModal.vue'
import SelectorSemana from '@/components/SelectorSemana.vue'

const pagos = ref<PagosSemana | null>(null)
const resumen = ref<DashboardResumen | null>(null)
const cargandoInicial = ref(true)
const cambiando = ref(false) // al cambiar de semana: se conserva lo mostrado y se ve la camioneta encima
const errorPagos = ref(false)
const errorResumen = ref(false)
const semanaPedida = ref<string | undefined>(undefined) // undefined = semana en curso

const hayError = computed(() => errorPagos.value || errorResumen.value)

// Antes de la primera semana con registros no hay nada que mostrar
const fechaMinima = computed(() => (pagos.value?.primera_fecha ? lunesDe(pagos.value.primera_fecha) : undefined))

// En la primera semana con registros no hay nada más atrás
const esPrimeraSemana = computed(
    () => !!pagos.value && !!fechaMinima.value && soloFecha(pagos.value.semana_inicio) <= fechaMinima.value,
)
const router = useRouter()
const navegacion = useNavegacionStore()

// El estatus cuya lista está abierta; null = cerrada
const estatusAbierto = ref<EstatusSemana | null>(null)

// Abre Pagos con ese alumno ya abierto en su detalle, en la misma semana que se ve aquí
function verAlumno(id: number) {
    if (!pagos.value) return
    const semana = soloFecha(pagos.value.semana_inicio)
    estatusAbierto.value = null
    irA(`/pagos?alumno=${id}&semana=${semana}`)
}

// Lleva a Pagos con el mismo estatus y la misma semana que se ve aquí (los lee la URL de Pagos)
function verEnPagos() {
    if (!pagos.value || !estatusAbierto.value) return
    const estatus = estatusAbierto.value
    const semana = soloFecha(pagos.value.semana_inicio)
    estatusAbierto.value = null
    irA(`/pagos?estatus=${estatus}&semana=${semana}`)
}

// Al tocar una tarjeta se ve el loader de pantalla al menos este tiempo, y luego se cambia de sección
const PAUSA_NAVEGACION_MS = 500

async function irA(ruta: string) {
    navegacion.mostrar()
    await new Promise((resolver) => setTimeout(resolver, PAUSA_NAVEGACION_MS))
    router.push(ruta)
}

let ultimaSolicitud = 0

// Solo los pagos dependen de la semana elegida; al cambiar de semana solo se cambian los datos
async function cargarPagos() {
    const solicitud = ++ultimaSolicitud
    cambiando.value = pagos.value !== null
    try {
        const nuevos = await verPagosSemana(semanaPedida.value)
        if (solicitud !== ultimaSolicitud) return
        pagos.value = nuevos
        errorPagos.value = false
    } catch {
        if (solicitud === ultimaSolicitud) errorPagos.value = true
    } finally {
        if (solicitud === ultimaSolicitud) cambiando.value = false
    }
}

// Lo demás que entrega /dashboard no depende de la semana: se pide una sola vez
async function cargarResumen() {
    try {
        resumen.value = await verDashboard()
        errorResumen.value = false
    } catch {
        errorResumen.value = true
    }
}

onMounted(async () => {
    await Promise.allSettled([cargarPagos(), cargarResumen()])
    cargandoInicial.value = false
})

function irASemana(desplazamiento: number) {
    if (!pagos.value || cambiando.value) return
    estatusAbierto.value = null
    semanaPedida.value = moverSemana(soloFecha(pagos.value.semana_inicio), desplazamiento)
    cargarPagos()
}

function volverAEstaSemana() {
    if (cambiando.value) return
    semanaPedida.value = undefined
    cargarPagos()
}

// Elegir cualquier día del calendario salta a la semana que lo contiene
function alElegirFecha(fecha: string) {
    if (cambiando.value) return
    semanaPedida.value = lunesDe(fecha)
    cargarPagos()
}

// Solo lo que hay que atender para cobrar la semana
const contadoresPagos = computed(() => {
    const r = pagos.value?.resumen
    if (!r) return []
    return [
        { estatus: 'pendiente_revision' as const, valor: r.por_verificar },
        { estatus: 'no_reportada' as const, valor: r.sin_reportar },
        { estatus: 'pago_parcial' as const, valor: r.pago_parcial },
        { estatus: 'confirmado' as const, valor: r.pagados },
    ]
})

// Barra de avance: el ancho de cada tramo es proporcional a los alumnos de ese estatus
const COLOR_TRAMO = {
    confirmado: 'bg-mint',
    pago_parcial: 'bg-servicio',
    pendiente_revision: 'bg-sun',
    no_reportada: 'bg-text-muted',
} as const

const totalBarra = computed(() => contadoresPagos.value.reduce((suma, c) => suma + c.valor, 0))

const tramos = computed(() =>
    [...contadoresPagos.value]
        .sort((a, b) => Object.keys(COLOR_TRAMO).indexOf(a.estatus) - Object.keys(COLOR_TRAMO).indexOf(b.estatus))
        .filter((c) => c.valor > 0)
        .map((c) => ({ ...c, ancho: (c.valor / totalBarra.value) * 100 })),
)

// Medidor circular: el arco verde es la parte de los alumnos ya pagados
const RADIO_MEDIDOR = 40
const CIRCUNFERENCIA = 2 * Math.PI * RADIO_MEDIDOR

const porcentajeCobrado = computed(() => {
    if (totalBarra.value === 0) return 0
    const pagados = contadoresPagos.value.find((c) => c.estatus === 'confirmado')?.valor ?? 0
    return Math.round((pagados / totalBarra.value) * 100)
})

const arcoMedidor = computed(() => (porcentajeCobrado.value / 100) * CIRCUNFERENCIA)

// Lo que lee un lector de pantalla en la barra de avance
const descripcionBarra = computed(
    () => 'Avance de cobro: ' + tramos.value.map((t) => `${ETIQUETAS[t.estatus].texto} ${t.valor}`).join(', '),
)

// Lo demás que entrega /dashboard; sin "to" la tarjeta no es un enlace
const tarjetas = computed(() => {
    const r = resumen.value
    if (!r) return []
    return [
        { texto: 'Prospectos nuevos (7 días)', valor: r.prospectos_nuevos_7_dias, to: '/prospectos' },
        { texto: 'Ausencias de hoy', valor: r.ausencias_hoy, to: '' },
        { texto: 'Clientes activos', valor: r.clientes_activos, to: '/clientes' },
    ]
})
</script>

<template>
    <h1 class="text-2xl font-semibold text-text-primary">Dashboard</h1>

    <div class="relative mt-6 space-y-6">
        <p v-if="hayError" class="text-sm text-danger">No se pudo cargar una parte del resumen</p>


        <section v-if="pagos || cargandoInicial" class="glass space-y-4 rounded-card p-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-1">
                    <button type="button" aria-label="Semana anterior"
                        :disabled="!pagos || cambiando || esPrimeraSemana"
                        class="grid h-8 w-8 place-items-center rounded-full text-text-secondary hover:bg-panel-2 disabled:opacity-30"
                        @click="irASemana(-1)">
                        <ChevronLeft class="h-4 w-4" />
                    </button>
                    <div class="text-center">
                        <h2 class="text-sm font-medium text-text-primary">Pagos de la semana</h2>
                        <p v-if="pagos" class="text-xs text-text-secondary">
                            {{ rangoSemana(soloFecha(pagos.semana_inicio)) }}{{ pagos.es_actual ? ' · en curso' : '' }}
                        </p>
                    </div>
                    <button type="button" aria-label="Semana siguiente"
                        :disabled="!pagos || pagos.es_actual || cambiando"
                        class="grid h-8 w-8 place-items-center rounded-full text-text-secondary hover:bg-panel-2 disabled:opacity-30"
                        @click="irASemana(1)">
                        <ChevronRight class="h-4 w-4" />
                    </button>
                </div>

                <div class="flex items-center gap-3">
                    <button v-if="pagos && !pagos.es_actual" type="button" :disabled="cambiando"
                        class="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent hover:opacity-80 disabled:opacity-50"
                        @click="volverAEstaSemana">
                        Semana actual
                    </button>
                    <SelectorSemana v-if="pagos" :semana-inicio="pagos.semana_inicio" :es-actual="pagos.es_actual"
                        :fecha-minima="fechaMinima" @elegir="alElegirFecha" />
                </div>
            </div>

            <div v-if="pagos" class="space-y-4">
                <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <button v-for="c in contadoresPagos" :key="c.estatus" type="button"
                        class="flex flex-col gap-1 rounded-card bg-panel-2 p-3 text-left transition hover:opacity-80"
                        @click="estatusAbierto = c.estatus">
                        <span class="w-fit rounded-card px-2 py-0.5 text-xs font-medium"
                            :class="ETIQUETAS[c.estatus].clases">
                            {{ ETIQUETAS[c.estatus].texto }}
                        </span>
                        <span class="text-2xl font-semibold text-text-primary">{{ c.valor }}</span>
                    </button>
                </div>

                <div class="flex items-center gap-4">
                    <svg viewBox="0 0 100 100" class="h-24 w-24 shrink-0 -rotate-90" role="img"
                        :aria-label="`${porcentajeCobrado} % de los alumnos ya pagó`">
                        <circle cx="50" cy="50" :r="RADIO_MEDIDOR" fill="none" stroke-width="10"
                            class="stroke-panel-2" />
                        <circle cx="50" cy="50" :r="RADIO_MEDIDOR" fill="none" stroke-width="10" stroke-linecap="round"
                            class="stroke-mint transition-all duration-500"
                            :stroke-dasharray="`${arcoMedidor} ${CIRCUNFERENCIA}`" />
                    </svg>
                    <div>
                        <p class="text-3xl font-semibold text-text-primary">{{ porcentajeCobrado }} %</p>
                        <p class="text-xs text-text-secondary">de los alumnos ya pagó esta semana</p>
                    </div>
                </div>

                <div v-if="totalBarra > 0" class="space-y-2">
                    <div class="flex h-3 w-full overflow-hidden rounded-full bg-panel-2" role="img"
                        :aria-label="descripcionBarra">
                        <div v-for="t in tramos" :key="t.estatus" :class="COLOR_TRAMO[t.estatus]"
                            :style="{ width: `${t.ancho}%` }" />
                    </div>
                    <p class="text-xs text-text-secondary">{{ totalBarra }} alumnos a cobrar esta semana</p>
                </div>
            </div>

            <div v-else class="flex items-center justify-center py-10">
                <LoaderVan variante="inline" />
            </div>
        </section>

        <div v-if="tarjetas.length" class="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <component :is="t.to ? 'button' : 'div'" v-for="t in tarjetas" :key="t.texto"
                :type="t.to ? 'button' : undefined"
                class="glass flex flex-col gap-1 rounded-card p-4 text-left transition"
                :class="t.to ? 'cursor-pointer hover:bg-panel-2' : ''" @click="t.to && irA(t.to)">
                <span class="text-xs text-text-secondary">{{ t.texto }}</span>
                <span class="text-2xl font-semibold text-text-primary">{{ t.valor }}</span>
            </component>
        </div>
    </div>

    <ListaEstatusModal :pagos="pagos" :estatus="estatusAbierto" @close="estatusAbierto = null"
        @ver-en-pagos="verEnPagos" @ver-alumno="verAlumno" />
</template>