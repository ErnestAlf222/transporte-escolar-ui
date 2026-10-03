<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { verPagosSemana } from '@/api/pagos'
import type { PagosSemana, EscuelaPagoSemana, EstatusSemana } from '@/types/pago'
import { useAuthStore } from '@/stores/auth'
import { moverSemana, rangoSemana, lunesDe } from '@/utils/semana'
import { compararTexto } from '@/utils/orden'
import { ETIQUETAS, ETIQUETAS_METODO, METODO_DIGITAL, estaAtenuado, etiquetaDe } from '@/utils/pagos'
import DropdownSelect from '@/components/DropdownSelect.vue'
import LoaderVan from '@/components/LoaderVan.vue'
import PagoDetalleModal from '@/components/PagoDetalleModal.vue'
import SelectorSemana from '@/components/SelectorSemana.vue'
import Spinner from '@/components/Spinner.vue'

const CLAVE_SIN_ESCUELA = 'sin-escuela'

// Contador seleccionado: fondo y borde suaves con el color de su estatus. No usa `glass`,
// porque esa clase fija su propio fondo y taparía el color
const CLASES_CONTADOR_NORMAL = 'glass hover:bg-panel-2'
const CLASES_TODOS_SELECCIONADO = 'border border-accent/40 bg-accent/10'
const CLASES_CONTADOR_SELECCIONADO: Record<EstatusSemana, string> = {
    pendiente_revision: 'border border-sun/40 bg-sun/10',
    no_reportada: 'border border-text-secondary/40 bg-text-secondary/10',
    rechazado: 'border border-danger/40 bg-danger/10',
    confirmado: 'border border-mint/40 bg-mint/10',
}



const datos = ref<PagosSemana | null>(null)
const cargando = ref(true) // solo la primera carga (spinner)
const cambiando = ref(false) // al cambiar de semana: se conserva lo mostrado y solo se atenúa
const error = ref('')
const semanaPedida = ref<string | undefined>(undefined) // undefined = semana en curso
const filtroEscuela = ref('')
const filtroEstatus = ref<EstatusSemana | ''>('')


// El primer día elegible: el lunes de la semana del primer alumno registrado
const fechaMinima = computed(() =>
    datos.value?.primera_fecha ? lunesDe(datos.value.primera_fecha) : undefined,
)

const auth = useAuthStore()
const puedeResolver = computed(() => auth.rol === 'admin')

const clienteActivoId = ref<number | null>(null)

// El alumno abierto se busca en los datos vigentes: si cambian (otro admin resolvió, tiempo real) el detalle se actualiza solo
const grupoActivo = computed(() =>
    (datos.value?.escuelas ?? []).find((e) => e.alumnos.some((a) => a.cliente_id === clienteActivoId.value)),
)
const alumnoActivo = computed(
    () => grupoActivo.value?.alumnos.find((a) => a.cliente_id === clienteActivoId.value) ?? null,
)
const escuelaActiva = computed(() => (grupoActivo.value ? etiquetaEscuela(grupoActivo.value) : ''))

function claveEscuela(id: number | null): string {
    return id === null ? CLAVE_SIN_ESCUELA : String(id)
}

function etiquetaEscuela(e: EscuelaPagoSemana): string {
    return e.turno ? `${e.nombre} (${e.turno})` : e.nombre
}

// "Sin escuela" siempre al final; el resto por nombre, con su turno
function compararEscuelas(a: EscuelaPagoSemana, b: EscuelaPagoSemana): number {
    if (a.escuela_id === null || b.escuela_id === null) {
        return Number(a.escuela_id === null) - Number(b.escuela_id === null)
    }
    return compararTexto(etiquetaEscuela(a), etiquetaEscuela(b))
}

const opcionesEscuela = computed(() => [
    { value: '', label: 'Todas las escuelas' },
    ...[...(datos.value?.escuelas ?? [])]
        .sort(compararEscuelas)
        .map((e) => ({ value: claveEscuela(e.escuela_id), label: etiquetaEscuela(e) })),
])

// Un archivado sin pago por verificar no es deuda de la semana: no se lista.
// Escuelas y alumnos van en orden alfabético; "Sin escuela" siempre al final
const escuelasVisibles = computed(() =>
    (datos.value?.escuelas ?? [])
        .filter((e) => !filtroEscuela.value || claveEscuela(e.escuela_id) === filtroEscuela.value)
        .map((e) => ({
            ...e,
            alumnos: e.alumnos
                .filter((a) => !estaAtenuado(a) && (!filtroEstatus.value || a.estatus === filtroEstatus.value))
                .sort((a, b) => compararTexto(a.alumno, b.alumno)),
        }))
        .filter((e) => e.alumnos.length > 0)
        .sort(compararEscuelas),
)

const contadores = computed(() => {
    const r = datos.value?.resumen
    return [
        { estatus: 'pendiente_revision' as const, valor: r?.por_verificar ?? 0 },
        { estatus: 'no_reportada' as const, valor: r?.sin_reportar ?? 0 },
        { estatus: 'rechazado' as const, valor: r?.rechazados ?? 0 },
        { estatus: 'confirmado' as const, valor: r?.pagados ?? 0 },
    ]
})

const totalAlumnos = computed(() => contadores.value.reduce((suma, c) => suma + c.valor, 0))

// Tocar el contador activo otra vez quita el filtro
function alternarFiltro(estatus: EstatusSemana) {
    cambiarFiltro(filtroEstatus.value === estatus ? '' : estatus)
}

const PAUSA_CARGA_MS = 300
const filtrando = ref(false)
let temporizadorFiltro: ReturnType<typeof setTimeout> | undefined

function esperar(ms: number): Promise<void> {
    return new Promise((resolver) => setTimeout(resolver, Math.max(0, ms)))
}

// Los filtros (escuela y estatus) se aplican al instante en el navegador; esta pausa corta
// muestra el loader para que el cambio de la lista no sea brusco
function mostrarPausa() {
    filtrando.value = true
    clearTimeout(temporizadorFiltro)
    temporizadorFiltro = setTimeout(() => {
        filtrando.value = false
    }, PAUSA_CARGA_MS)
}

watch([filtroEscuela, filtroEstatus], mostrarPausa)

function cambiarFiltro(estatus: EstatusSemana | '') {
    filtroEstatus.value = estatus
}


let ultimaSolicitud = 0

async function cargar(silencioso = false) {
    const solicitud = ++ultimaSolicitud
    const inicio = Date.now()
    const conLoader = datos.value !== null && !silencioso
    cambiando.value = conLoader
    error.value = ''

    try {
        const nuevos = await verPagosSemana(semanaPedida.value)
        // En un cambio de semana el loader se ve al menos la pausa completa, aunque el servidor responda al instante
        if (conLoader) await esperar(PAUSA_CARGA_MS - (Date.now() - inicio))
        if (solicitud !== ultimaSolicitud) return
        datos.value = nuevos
        // Si la escuela filtrada no existe en esta semana, se vuelve a "Todas"
        if (!opcionesEscuela.value.some((o) => o.value === filtroEscuela.value)) filtroEscuela.value = ''
    } catch {
        if (solicitud === ultimaSolicitud) error.value = 'No se pudieron cargar los pagos de la semana'
    } finally {
        if (solicitud === ultimaSolicitud) {
            cargando.value = false
            cambiando.value = false
        }
    }
}

function irASemana(desplazamiento: number) {
    if (!datos.value) return
    semanaPedida.value = moverSemana(datos.value.semana_inicio, desplazamiento)
    cargar()
}

function volverAEstaSemana() {
    semanaPedida.value = undefined
    cargar()
}



// Elegir cualquier día salta a la semana que lo contiene
function alElegirFecha(fecha: string) {
    semanaPedida.value = lunesDe(fecha)
    cargar()
}

// Recarga sin atenuar la pantalla: se usa al resolver un pago y, después, con los avisos en tiempo real
function refrescar() {
    cargar(true)
}

onMounted(cargar)

onUnmounted(() => {
    clearTimeout(temporizadorFiltro)
})
</script>

<template>
    <div>
        <!-- Encabezado fijo: se queda debajo de la barra superior mientras se desliza la lista -->
        <div class="sticky top-cabecera z-20 -mx-6 bg-bg px-6 pb-4 pt-2">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h1 class="text-2xl font-semibold text-text-primary">Pagos</h1>
                <div class="flex flex-col items-end gap-2">
                    <DropdownSelect v-model="filtroEscuela" :opciones="opcionesEscuela" />
                    <SelectorSemana v-if="datos" :semana-inicio="datos.semana_inicio" :es-actual="datos.es_actual"
                        :fecha-minima="fechaMinima" @elegir="alElegirFecha" />
                </div>
            </div>

            <div v-if="datos" class="space-y-4">
                <div class="glass flex items-center justify-between gap-3 rounded-card p-3">
                    <button type="button" aria-label="Semana anterior"
                        class="rounded-full p-2 text-text-secondary hover:bg-panel-2 hover:text-text-primary"
                        @click="irASemana(-1)">
                        <ChevronLeft class="h-5 w-5" />
                    </button>
                    <div class="text-center">
                        <p class="text-sm font-semibold text-text-primary">{{ rangoSemana(datos.semana_inicio) }}</p>
                        <p class="text-xs text-text-secondary">
                            {{ datos.es_actual ? 'Semana en curso' : 'Historial' }}
                            <button v-if="!datos.es_actual" type="button" class="ml-1 text-accent"
                                @click="volverAEstaSemana">
                                Volver a la semana actual
                            </button>
                        </p>
                    </div>
                    <button type="button" aria-label="Semana siguiente" :disabled="datos.es_actual"
                        class="rounded-full p-2 text-text-secondary hover:bg-panel-2 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30"
                        @click="irASemana(1)">
                        <ChevronRight class="h-5 w-5" />
                    </button>
                </div>

                <div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <button type="button"
                        class="col-span-2 flex flex-col gap-1 rounded-card p-3 text-left transition sm:col-span-1"
                        :class="!filtroEstatus ? CLASES_TODOS_SELECCIONADO : CLASES_CONTADOR_NORMAL"
                        :aria-pressed="!filtroEstatus" @click="cambiarFiltro('')">
                        <span class="w-fit rounded-card bg-panel-2 px-2 py-0.5 text-xs font-medium text-text-secondary">
                            Todos
                        </span>
                        <span class="text-2xl font-semibold text-text-primary">{{ totalAlumnos }}</span>
                    </button>
                    <button v-for="c in contadores" :key="c.estatus" type="button"
                        class="flex flex-col gap-1 rounded-card p-3 text-left transition"
                        :class="filtroEstatus === c.estatus ? CLASES_CONTADOR_SELECCIONADO[c.estatus] : CLASES_CONTADOR_NORMAL"
                        :aria-pressed="filtroEstatus === c.estatus" @click="alternarFiltro(c.estatus)">
                        <span class="w-fit rounded-card px-2 py-0.5 text-xs font-medium"
                            :class="ETIQUETAS[c.estatus].clases">
                            {{ ETIQUETAS[c.estatus].texto }}
                        </span>
                        <span class="text-2xl font-semibold text-text-primary">{{ c.valor }}</span>
                    </button>
                </div>
            </div>
        </div>

        <div v-if="cargando" class="flex items-center gap-2 text-text-secondary">
            <Spinner />
            Cargando...
        </div>
        <p v-else-if="error && !datos" class="text-danger">{{ error }}</p>

        <div v-else-if="datos" class="space-y-5">
            <p v-if="error" class="text-sm text-danger">{{ error }}</p>



            <div v-if="filtrando || cambiando" class="flex justify-center py-10">
                <LoaderVan variante="inline" />
            </div>

            <div v-show="!filtrando && !cambiando" class="space-y-5">
                <p v-if="escuelasVisibles.length === 0" class="text-text-secondary">
                    {{ filtroEstatus ? 'No hay alumnos con este estatus esta semana.' : `No hay alumnos que cobrar esta
                    semana.` }}
                </p>

                <section v-for="escuela in escuelasVisibles" :key="claveEscuela(escuela.escuela_id)" class="space-y-2">
                    <h2 class="px-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        {{ etiquetaEscuela(escuela) }} · {{ escuela.alumnos.length }}
                    </h2>
                    <div class="flex flex-col gap-2">
                        <div v-for="a in escuela.alumnos" :key="a.cliente_id" role="button" tabindex="0"
                            class="glass flex cursor-pointer items-center justify-between gap-3 rounded-card p-4 transition hover:bg-panel-2"
                            :class="{ 'opacity-60': estaAtenuado(a) }" @click="clienteActivoId = a.cliente_id"
                            @keydown.enter="clienteActivoId = a.cliente_id">
                            <div class="min-w-0">
                                <p class="truncate font-semibold text-text-primary">{{ a.alumno }}</p>
                                <p class="text-xs text-text-secondary">
                                    <span :class="{ 'font-medium text-accent': a.metodo_pago === METODO_DIGITAL }">
                                        {{ ETIQUETAS_METODO[a.metodo_pago] ?? a.metodo_pago }}
                                    </span>
                                    <span v-if="a.sin_cuota" class="text-sun"> · Cuota sin configurar</span>
                                </p>
                            </div>
                            <div class="flex shrink-0 flex-col items-end gap-1">
                                <span class="rounded-card px-2 py-1 text-xs font-medium" :class="etiquetaDe(a).clases">
                                    {{ etiquetaDe(a).texto }}
                                </span>
                                <p v-if="a.con_recargo && a.estatus !== 'confirmado' && !estaAtenuado(a)"
                                    class="text-xs text-sun">
                                    con recargo
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>

        <PagoDetalleModal :alumno="alumnoActivo" :escuela="escuelaActiva" :semana-inicio="datos?.semana_inicio ?? ''"
            :puede-resolver="puedeResolver" @close="clienteActivoId = null" @resuelto="refrescar" />
    </div>
</template>