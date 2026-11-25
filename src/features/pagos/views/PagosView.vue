<script setup lang="ts">
import { useEstadoPantalla } from '@/shared/composables/useEstadoPantalla'
import { PANTALLAS } from '@/shared/constants/estadoPantalla'
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { verPagosSemana, escucharEventosPagos } from '@/features/pagos/api/pagos'
import type { PagosSemana, EscuelaPagoSemana, AlumnoPagoSemana, FamiliaPago } from '@/features/pagos/types/pago'
import { useAuthStore } from '@/features/auth'
import { moverSemana, rangoSemana, lunesDe, soloFecha } from '@/shared/utils/semana'
import { compararTexto } from '@/shared/utils/orden'
import { coincideBusqueda } from '@/shared/utils/busqueda'
import { PAUSA_CARGA_MS, esperar } from '@/shared/utils/tiempo'
import { agruparFamilias, estaAtenuado, estadoDe } from '@/features/pagos/utils/pagos'
import { ESTADO_CICLO, ORDEN_ESTADOS_CICLO, type EstadoCiclo } from '@/shared/constants/estadoCiclo'
import { estadoDeTexto } from '@/shared/utils/estadoCiclo'
import { useEventosEnVivo } from '@/shared/composables/useEventosEnVivo'
import DropdownSelect from '@/shared/ui/DropdownSelect.vue'
import LoaderVan from '@/shared/ui/LoaderVan.vue'
import LoaderVanJuego from '@/shared/ui/LoaderVanJuego.vue'
import PagoDetalleModal from '@/features/pagos/components/PagoDetalleModal.vue'
import FilaFamiliaPago from '@/features/pagos/components/FilaFamiliaPago.vue'
import PanelDineroFamilia from '@/features/pagos/components/PanelDineroFamilia.vue'
import SelectorSemana from '@/shared/ui/SelectorSemana.vue'
import SinResultados from '@/shared/ui/SinResultados.vue'
import BuscadorInput from '@/shared/ui/BuscadorInput.vue'
import EncabezadoEscuela from '@/shared/ui/EncabezadoEscuela.vue'
import EncabezadoFijo from '@/shared/ui/EncabezadoFijo.vue'
import Spinner from '@/shared/ui/Spinner.vue'

const CLAVE_SIN_ESCUELA = 'sin-escuela'

// Contador seleccionado: fondo y borde suaves con el color de su estatus. No usa `glass`,
// porque esa clase fija su propio fondo y taparía el color
const CLASES_CONTADOR_NORMAL = 'glass hover:bg-panel-2'
const CLASES_TODOS_SELECCIONADO = 'border border-accent/40 bg-accent/10'


const datos = ref<PagosSemana | null>(null)
const cargando = ref(true) // solo la primera carga (spinner)
const cambiando = ref(false) // al cambiar de semana: se conserva lo mostrado y solo se atenúa
const error = ref('')
const route = useRoute()
const router = useRouter()
const textoDe = (valor: unknown) => (typeof valor === 'string' ? valor : '')
const estatusDeUrl = textoDe(route.query.estatus)
const semanaDeUrl = textoDe(route.query.semana)

const semanaPedida = ref<string | undefined>(/^\d{4}-\d{2}-\d{2}$/.test(semanaDeUrl) ? semanaDeUrl : undefined) // undefined = semana en curso
const filtroEscuela = ref(textoDe(route.query.escuela))
// El filtro acepta los estados del ciclo; los valores viejos (de enlaces o de lo recordado) se traducen
const filtroEstatus = ref<EstadoCiclo | ''>(estadoDeTexto(estatusDeUrl))
const busqueda = ref(textoDe(route.query.q))
useEstadoPantalla(PANTALLAS.pagos, { semanaPedida, filtroEscuela, filtroEstatus, busqueda }, cargando)
filtroEstatus.value = estadoDeTexto(filtroEstatus.value)
const busquedaActiva = computed(() => busqueda.value.trim() !== '')

// Por nombre del alumno o del tutor, o por cualquiera de sus teléfonos
function coincideConBusqueda(a: AlumnoPagoSemana): boolean {
    return coincideBusqueda(
        busqueda.value,
        [a.alumno, a.tutor ?? ''],
        [a.telefono_tutor ?? '', a.telefono_alumno ?? ''],
    )
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

const alumnoDeUrl = Number(textoDe(route.query.alumno))
// El panel de dinero de la familia (la burbuja): qué alumno de la familia está abierto; null = cerrado
const dineroActivoId = ref<number | null>(null)
const clienteActivoId = ref<number | null>(Number.isInteger(alumnoDeUrl) && alumnoDeUrl > 0 ? alumnoDeUrl : null)

// La URL refleja la vista (semana, filtros, búsqueda y alumno abierto): al recargar se regresa al mismo punto
watch([semanaPedida, filtroEscuela, filtroEstatus, busqueda, clienteActivoId], () => {
    const query: Record<string, string> = {}
    if (semanaPedida.value) query.semana = semanaPedida.value
    if (filtroEscuela.value) query.escuela = filtroEscuela.value
    if (filtroEstatus.value) query.estatus = filtroEstatus.value
    if (busqueda.value.trim()) query.q = busqueda.value
    if (clienteActivoId.value !== null) query.alumno = String(clienteActivoId.value)
    router.replace({ query })
})

// El alumno abierto se busca en los datos vigentes: si cambian (otro admin resolvió, tiempo real) el detalle se actualiza solo
const grupoActivo = computed(() =>
    (datos.value?.escuelas ?? []).find((e) => e.alumnos.some((a) => a.cliente_id === clienteActivoId.value)),
)
const alumnoActivo = computed(
    () => grupoActivo.value?.alumnos.find((a) => a.cliente_id === clienteActivoId.value) ?? null,
)
const escuelaActiva = computed(() => (grupoActivo.value ? etiquetaEscuela(grupoActivo.value) : ''))

// Los hermanos del alumno abierto (mismo tutor, aunque vayan a otra escuela), incluido él
const hermanosActivo = computed<AlumnoPagoSemana[]>(() => {
    const a = alumnoActivo.value
    if (!a) return []
    if (a.tutor_id === null || a.tutor_id === undefined) return [a]
    return (datos.value?.escuelas ?? []).flatMap((e) => e.alumnos).filter((x) => x.tutor_id === a.tutor_id)
})

const alumnoDinero = computed(
    () => (datos.value?.escuelas ?? []).flatMap((e) => e.alumnos).find((a) => a.cliente_id === dineroActivoId.value) ?? null,
)
const hermanosDinero = computed<AlumnoPagoSemana[]>(() => {
    const a = alumnoDinero.value
    if (!a) return []
    if (a.tutor_id === null || a.tutor_id === undefined) return [a]
    return (datos.value?.escuelas ?? []).flatMap((e) => e.alumnos).filter((x) => x.tutor_id === a.tutor_id)
})

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
                        (!filtroEstatus.value || estadoDe(a) === filtroEstatus.value),
                )
                .sort((a, b) => compararTexto(a.alumno, b.alumno)),
        }))
        .filter((e) => e.alumnos.length > 0)
        .map((e) => ({ ...e, familias: agruparFamilias(e.alumnos) }))
        .sort(compararEscuelas),
)

// Tope de alumnos que se dibujan de una vez: con el tamaño de hoy entra toda la lista de un golpe.
// Solo si algún día hubiera más de este número, seguiría mostrándose por tandas
const TANDA = 500
const PAUSA_TANDA_MS = 900
// Las primeras filas entran escalonadas (hasta 8 pasos de 70 ms); el resto entra junto con la última
const ESCALON_ENTRADA = 8
const MARGEN_CARGA = '0px 0px 120px 0px' // empieza a cargar un poco antes de llegar al final

const visibles = ref(TANDA)
const cargandoMas = ref(false)
const centinela = ref<HTMLElement | null>(null)
let temporizadorTanda: ReturnType<typeof setTimeout> | undefined
let observador: IntersectionObserver | undefined

// La tanda cuenta familias (una fila por familia); el encabezado de cada escuela cuenta sus alumnos
const totalVisibles = computed(() => escuelasVisibles.value.reduce((suma, e) => suma + e.familias.length, 0))
const hayMas = computed(() => visibles.value < totalVisibles.value)

// Se muestran de a TANDA familias, de corrido entre escuelas; cada escuela conserva su total real de alumnos
const escuelasMostradas = computed(() => {
    let restantes = visibles.value
    const resultado: (EscuelaPagoSemana & { familias: FamiliaPago[]; total: number; desde: number })[] = []
    for (const escuela of escuelasVisibles.value) {
        if (restantes <= 0) break
        const desde = visibles.value - restantes // cuántas familias se muestran antes de esta escuela
        const familias = escuela.familias.slice(0, restantes)
        restantes -= familias.length
        resultado.push({ ...escuela, familias, total: escuela.alumnos.length, desde })
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

function contarPorEstatus(estatus: EstadoCiclo): number {
    return alumnosDeLaEscuela.value.filter((a) => estadoDe(a) === estatus).length
}

const contadores = computed(() =>
    ORDEN_ESTADOS_CICLO.map((estatus) => ({ estatus, valor: contarPorEstatus(estatus) })),
)

const totalAlumnos = computed(() => alumnosDeLaEscuela.value.length)

// Tocar el contador activo otra vez quita el filtro
function alternarFiltro(estatus: EstadoCiclo) {
    cambiarFiltro(filtroEstatus.value === estatus ? '' : estatus)
}

const filtrando = ref(false)
let temporizadorFiltro: ReturnType<typeof setTimeout> | undefined

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

function cambiarFiltro(estatus: EstadoCiclo | '') {
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

// Tiempo real: cualquier aviso de pagos (pago_cambiado, pago_actualizado...) recarga la semana completa;
// si la conexión se cae, el composable reconecta y se vuelve a cargar por si se perdió un aviso
const { iniciar: suscribirEventos } = useEventosEnVivo({
    conectar: escucharEventosPagos,
    alEvento: () => refrescar(),
    alReconectar: refrescar,
})

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
})
</script>

<template>
    <div>
        <!-- Encabezado fijo: se queda debajo de la barra superior mientras se desliza la lista -->
        <EncabezadoFijo :relleno="4">
            <div class="mb-4 space-y-2">
                <div class="flex items-center justify-between gap-3">
                    <h1 class="text-2xl font-semibold text-text-primary">Pagos</h1>
                    <DropdownSelect v-model="filtroEscuela" :opciones="opcionesEscuela" />
                </div>
                <div class="flex items-center gap-3">
                    <BuscadorInput v-model="busqueda" placeholder="Buscar alumno, tutor o teléfono"
                        etiqueta-limpiar="Limpiar búsqueda" limpiar-con-esc class="min-w-0 flex-1" />
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

                <div class="grid grid-cols-2 gap-3 sm:grid-cols-6">
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
                        class="flex flex-col gap-1 rounded-card p-3 text-left transition last:col-span-2 sm:last:col-span-1"
                        :class="filtroEstatus === c.estatus ? ESTADO_CICLO[c.estatus].seleccionado : CLASES_CONTADOR_NORMAL"
                        :aria-pressed="filtroEstatus === c.estatus" @click="alternarFiltro(c.estatus)">
                        <span class="w-fit rounded-card px-2 py-0.5 text-xs font-medium"
                            :class="ESTADO_CICLO[c.estatus].clases">
                            {{ ESTADO_CICLO[c.estatus].texto }}
                        </span>
                        <span class="text-2xl font-semibold text-text-primary">{{ c.valor }}</span>
                    </button>
                </div>
            </div>
        </EncabezadoFijo>

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
                    <EncabezadoEscuela>
                        {{ etiquetaEscuela(escuela) }} · {{ escuela.total }}
                    </EncabezadoEscuela>
                    <div class="flex flex-col gap-2">
                        <FilaFamiliaPago v-for="(f, j) in escuela.familias" :key="f.clave" :familia="f"
                            :puede-resolver="puedeResolver" class="entra-suave"
                            :style="{ '--i': Math.min(escuela.desde + j, ESCALON_ENTRADA) }"
                            @abrir="clienteActivoId = $event" @dinero="dineroActivoId = $event" />
                    </div>
                </section>

                <div v-if="hayMas" ref="centinela" class="flex min-h-28 items-center justify-center">
                    <LoaderVanJuego v-if="cargandoMas" compacto texto="Cargando alumnos" />
                </div>
            </div>
        </div>

        <PagoDetalleModal :alumno="alumnoActivo" :hermanos="hermanosActivo" :escuela="escuelaActiva"
            :semana-inicio="datos?.semana_inicio ?? ''" :puede-resolver="puedeResolver" @close="clienteActivoId = null"
            @resuelto="refrescar" @abrir="clienteActivoId = $event"
            @dinero="dineroActivoId = $event" />

        <PanelDineroFamilia :alumno="alumnoDinero" :hermanos="hermanosDinero" :semana-inicio="datos?.semana_inicio ?? ''"
            @cerrar="dineroActivoId = null" @cambiado="refrescar" @elegir="dineroActivoId = $event" />
    </div>
</template>