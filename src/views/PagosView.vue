<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-vue-next'
import { verPagosSemana, escucharEventosPagos } from '@/api/pagos'
import type { PagosSemana, EscuelaPagoSemana, EstatusSemana, AlumnoPagoSemana } from '@/types/pago'
import { useAuthStore } from '@/stores/auth'
import { moverSemana, rangoSemana, lunesDe, soloFecha } from '@/utils/semana'
import { compararTexto } from '@/utils/orden'
import { coincideBusqueda } from '@/utils/busqueda'
import { ETIQUETAS, ETIQUETAS_METODO, METODO_DIGITAL, estaAtenuado, etiquetaDe } from '@/utils/pagos'
import DropdownSelect from '@/components/DropdownSelect.vue'
import LoaderVan from '@/components/LoaderVan.vue'
import LoaderVanJuego from '@/components/LoaderVanJuego.vue'
import PagoDetalleModal from '@/components/PagoDetalleModal.vue'
import SelectorSemana from '@/components/SelectorSemana.vue'
import SinResultados from '@/components/SinResultados.vue'
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
const busqueda = ref('')
const campoBusqueda = ref<HTMLInputElement | null>(null)
const busquedaActiva = computed(() => busqueda.value.trim() !== '')

// Por nombre del alumno o del tutor, o por cualquiera de sus teléfonos
function coincideConBusqueda(a: AlumnoPagoSemana): boolean {
    return coincideBusqueda(
        busqueda.value,
        [a.alumno, a.tutor ?? ''],
        [a.telefono_tutor ?? '', a.telefono_alumno ?? ''],
    )
}

function limpiarBusqueda() {
    busqueda.value = ''
    campoBusqueda.value?.focus()
}

const mensajeVacio = computed(() =>
    filtroEstatus.value
        ? 'No hay alumnos con este estatus esta semana.'
        : 'No hay alumnos que cobrar esta semana.',
)


// El primer día elegible: el lunes de la semana del primer alumno registrado
const fechaMinima = computed(() =>
    datos.value?.primera_fecha ? lunesDe(datos.value.primera_fecha) : undefined,
)

// En la primera semana con registros no hay nada más atrás
const esPrimeraSemana = computed(
    () => !!datos.value && !!fechaMinima.value && soloFecha(datos.value.semana_inicio) <= fechaMinima.value,
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

function esDeLaEscuelaElegida(e: EscuelaPagoSemana): boolean {
    return !filtroEscuela.value || claveEscuela(e.escuela_id) === filtroEscuela.value
}

// Un archivado sin pago por verificar no es deuda de la semana: no se lista.
// Escuelas y alumnos van en orden alfabético; "Sin escuela" siempre al final
const escuelasVisibles = computed(() =>
    (datos.value?.escuelas ?? [])
        .filter(esDeLaEscuelaElegida)
        .map((e) => ({
            ...e,
            alumnos: e.alumnos
                .filter(
                    (a) =>
                        !estaAtenuado(a) &&
                        coincideConBusqueda(a) &&
                        (!filtroEstatus.value || a.estatus === filtroEstatus.value),
                )
                .sort((a, b) => compararTexto(a.alumno, b.alumno)),
        }))
        .filter((e) => e.alumnos.length > 0)
        .sort(compararEscuelas),
)

const TANDA = 2
const PAUSA_TANDA_MS = 900
const MARGEN_CARGA = '0px 0px 120px 0px' // empieza a cargar un poco antes de llegar al final

const visibles = ref(TANDA)
const cargandoMas = ref(false)
const centinela = ref<HTMLElement | null>(null)
let temporizadorTanda: ReturnType<typeof setTimeout> | undefined
let observador: IntersectionObserver | undefined

const totalVisibles = computed(() => escuelasVisibles.value.reduce((suma, e) => suma + e.alumnos.length, 0))
const hayMas = computed(() => visibles.value < totalVisibles.value)

// Se muestran de a TANDA alumnos, de corrido entre escuelas; cada escuela conserva su total real
const escuelasMostradas = computed(() => {
    let restantes = visibles.value
    const resultado: (EscuelaPagoSemana & { total: number; desde: number })[] = []
    for (const escuela of escuelasVisibles.value) {
        if (restantes <= 0) break
        const desde = visibles.value - restantes // cuántos alumnos se muestran antes de esta escuela
        const alumnos = escuela.alumnos.slice(0, restantes)
        restantes -= alumnos.length
        resultado.push({ ...escuela, alumnos, total: escuela.alumnos.length, desde })
    }
    return resultado
})

function reiniciarTandas() {
    clearTimeout(temporizadorTanda)
    cargandoMas.value = false
    visibles.value = TANDA
}

// Si al mostrar una tanda el final de la lista sigue a la vista, hay que pedir la siguiente
function reobservar() {
    nextTick(() => {
        if (!centinela.value || !observador) return
        observador.unobserve(centinela.value)
        observador.observe(centinela.value)
    })
}

function cargarMas() {
    if (cargandoMas.value || !hayMas.value) return
    cargandoMas.value = true
    temporizadorTanda = setTimeout(() => {
        visibles.value += TANDA
        cargandoMas.value = false
        reobservar()
    }, PAUSA_TANDA_MS)
}

watch(centinela, (nuevo, anterior) => {
    if (anterior) observador?.unobserve(anterior)
    if (nuevo) observador?.observe(nuevo)
})

// Un cambio de filtro, de búsqueda o de semana vuelve a empezar con los primeros 5.
// Refrescar los datos de la misma semana (por ejemplo al resolver un pago) no reinicia nada
watch([filtroEscuela, filtroEstatus, busqueda, () => datos.value?.semana_inicio], reiniciarTandas)

// Alumnos que cuentan esta semana en la escuela elegida y que coinciden con la búsqueda:
// es la base de los contadores
const alumnosDeLaEscuela = computed(() =>
    (datos.value?.escuelas ?? [])
        .filter(esDeLaEscuelaElegida)
        .flatMap((e) => e.alumnos)
        .filter((a) => !estaAtenuado(a) && coincideConBusqueda(a)),
)

function contarPorEstatus(estatus: EstatusSemana): number {
    return alumnosDeLaEscuela.value.filter((a) => a.estatus === estatus).length
}

const contadores = computed(() => [
    { estatus: 'pendiente_revision' as const, valor: contarPorEstatus('pendiente_revision') },
    { estatus: 'no_reportada' as const, valor: contarPorEstatus('no_reportada') },
    { estatus: 'rechazado' as const, valor: contarPorEstatus('rechazado') },
    { estatus: 'confirmado' as const, valor: contarPorEstatus('confirmado') },
])

const totalAlumnos = computed(() => alumnosDeLaEscuela.value.length)

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
    // Con 5 alumnos o menos no hay nada que cargar: se cambia al instante
    if (totalVisibles.value <= TANDA) return
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

const ESPERA_RECONEXION_MS = 3000
let detener: AbortController | null = null

// Mantiene la conexión de tiempo real; si se cae, espera, reconecta y refresca por si se perdió un aviso
async function suscribirEventos() {
    detener = new AbortController()
    const { signal } = detener
    while (!signal.aborted) {
        try {
            await escucharEventosPagos(refrescar, signal)
        } catch {
            if (signal.aborted) return
        }
        if (signal.aborted) return
        refrescar()
        await esperar(ESPERA_RECONEXION_MS)
    }
}

onMounted(() => {
    cargar()
    suscribirEventos()
    observador = new IntersectionObserver(
        (entradas) => {
            if (entradas.some((e) => e.isIntersecting)) cargarMas()
        },
        { rootMargin: MARGEN_CARGA },
    )
    if (centinela.value) observador.observe(centinela.value)
})

onUnmounted(() => {
    clearTimeout(temporizadorFiltro)
    clearTimeout(temporizadorTanda)
    observador?.disconnect()
    detener?.abort()
})
</script>

<template>
    <div>
        <!-- Encabezado fijo: se queda debajo de la barra superior mientras se desliza la lista -->
        <div class="sticky top-cabecera z-20 -mx-6 bg-bg px-6 pb-4 pt-2">
            <div class="mb-4 space-y-2">
                <div class="flex items-center justify-between gap-3">
                    <h1 class="text-2xl font-semibold text-text-primary">Pagos</h1>
                    <DropdownSelect v-model="filtroEscuela" :opciones="opcionesEscuela" />
                </div>
                <div class="flex items-center gap-3">
                    <div class="relative min-w-0 flex-1">
                        <Search
                            class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                        <input ref="campoBusqueda" v-model="busqueda" type="text"
                            placeholder="Buscar alumno, tutor o teléfono"
                            class="w-full rounded-card border border-border bg-panel py-2 pl-9 pr-8 text-sm text-text-primary"
                            @keydown.esc="limpiarBusqueda" />
                        <button v-if="busqueda" type="button" aria-label="Limpiar búsqueda"
                            class="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                            @click="limpiarBusqueda">
                            <X class="h-4 w-4" />
                        </button>
                    </div>
                    <SelectorSemana v-if="datos" :semana-inicio="datos.semana_inicio" :es-actual="datos.es_actual"
                        :fecha-minima="fechaMinima" @elegir="alElegirFecha" />
                </div>
            </div>

            <div v-if="datos" class="space-y-4">
                <div class="glass flex items-center justify-between gap-3 rounded-card p-3">
                    <button type="button" aria-label="Semana anterior" :disabled="esPrimeraSemana"
                        class="rounded-full p-2 text-text-secondary hover:bg-panel-2 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30"
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
                <SinResultados v-if="escuelasVisibles.length === 0 && busquedaActiva"
                    :mensaje="`No encontramos coincidencias para &quot;${busqueda.trim()}&quot;`" />
                <p v-else-if="escuelasVisibles.length === 0" class="text-text-secondary">
                    {{ mensajeVacio }}
                </p>

                <section v-for="escuela in escuelasMostradas" :key="claveEscuela(escuela.escuela_id)" class="space-y-2">
                    <h2
                        class="w-fit rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
                        {{ etiquetaEscuela(escuela) }} · {{ escuela.total }}
                    </h2>
                    <div class="flex flex-col gap-2">
                        <div v-for="(a, j) in escuela.alumnos" :key="a.cliente_id" role="button" tabindex="0"
                            class="entra-suave glass-plano flex cursor-pointer items-center justify-between gap-3 rounded-card p-4 transition hover:bg-panel-2"
                            :class="{ 'opacity-60': estaAtenuado(a) }" @click="clienteActivoId = a.cliente_id"
                            :style="{ '--i': (escuela.desde + j) % TANDA }"
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

                <div v-if="hayMas" ref="centinela" class="flex min-h-28 items-center justify-center">
                    <LoaderVanJuego v-if="cargandoMas" compacto texto="Cargando alumnos" />
                </div>
            </div>
        </div>

        <PagoDetalleModal :alumno="alumnoActivo" :escuela="escuelaActiva" :semana-inicio="datos?.semana_inicio ?? ''"
            :puede-resolver="puedeResolver" @close="clienteActivoId = null" @resuelto="refrescar" />
    </div>
</template>