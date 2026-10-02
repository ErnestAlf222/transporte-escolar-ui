<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { verPagosSemana } from '@/api/pagos'
import type { PagosSemana, EscuelaPagoSemana } from '@/types/pago'
import { useAuthStore } from '@/stores/auth'
import { formatearMonto } from '@/utils/moneda'
import { moverSemana, rangoSemana } from '@/utils/semana'
import { ETIQUETAS, ETIQUETAS_METODO, METODO_DIGITAL, estaAtenuado, etiquetaDe } from '@/utils/pagos'
import DropdownSelect from '@/components/DropdownSelect.vue'
import PagoDetalleModal from '@/components/PagoDetalleModal.vue'
import Spinner from '@/components/Spinner.vue'

const CLAVE_SIN_ESCUELA = 'sin-escuela'



const datos = ref<PagosSemana | null>(null)
const cargando = ref(true) // solo la primera carga (spinner)
const cambiando = ref(false) // al cambiar de semana: se conserva lo mostrado y solo se atenúa
const error = ref('')
const semanaPedida = ref<string | undefined>(undefined) // undefined = semana en curso
const filtroEscuela = ref('')

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

const opcionesEscuela = computed(() => [
    { value: '', label: 'Todas las escuelas' },
    ...(datos.value?.escuelas ?? []).map((e) => ({ value: claveEscuela(e.escuela_id), label: etiquetaEscuela(e) })),
])

const escuelasVisibles = computed(() =>
    (datos.value?.escuelas ?? []).filter((e) => !filtroEscuela.value || claveEscuela(e.escuela_id) === filtroEscuela.value),
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


let ultimaSolicitud = 0

async function cargar(silencioso = false) {
    const solicitud = ++ultimaSolicitud
    cambiando.value = datos.value !== null && !silencioso
    error.value = ''
    try {
        const nuevos = await verPagosSemana(semanaPedida.value)
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

// Recarga sin atenuar la pantalla: se usa al resolver un pago y, después, con los avisos en tiempo real
function refrescar() {
    cargar(true)
}

onMounted(cargar)
</script>

<template>
    <div>
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 class="text-2xl font-semibold text-text-primary">Pagos</h1>
            <DropdownSelect v-model="filtroEscuela" :opciones="opcionesEscuela" />
        </div>

        <div v-if="cargando" class="flex items-center gap-2 text-text-secondary">
            <Spinner />
            Cargando...
        </div>
        <p v-else-if="error && !datos" class="text-danger">{{ error }}</p>

        <div v-else-if="datos" class="space-y-5 transition-opacity duration-150" :class="{ 'opacity-60': cambiando }">
            <p v-if="error" class="text-sm text-danger">{{ error }}</p>

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
                        <button v-if="!datos.es_actual" type="button" class="ml-1 text-accent underline"
                            @click="volverAEstaSemana">
                            Volver a esta semana
                        </button>
                    </p>
                </div>
                <button type="button" aria-label="Semana siguiente" :disabled="datos.es_actual"
                    class="rounded-full p-2 text-text-secondary hover:bg-panel-2 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30"
                    @click="irASemana(1)">
                    <ChevronRight class="h-5 w-5" />
                </button>
            </div>

            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div v-for="c in contadores" :key="c.estatus" class="glass flex flex-col gap-1 rounded-card p-3">
                    <span class="w-fit rounded-card px-2 py-0.5 text-xs font-medium"
                        :class="ETIQUETAS[c.estatus].clases">
                        {{ ETIQUETAS[c.estatus].texto }}
                    </span>
                    <span class="text-2xl font-semibold text-text-primary">{{ c.valor }}</span>
                </div>
            </div>
            <p v-if="datos.resumen.archivados > 0" class="text-xs text-text-secondary">
                {{ datos.resumen.archivados }} archivado{{ datos.resumen.archivados === 1 ? '' : 's' }} no
                suma{{ datos.resumen.archivados === 1 ? '' : 'n' }} a esta semana.
            </p>

            <p v-if="escuelasVisibles.length === 0" class="text-text-secondary">
                No hay alumnos que cobrar esta semana.
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
                            <p v-if="a.estatus !== 'confirmado' && !a.sin_cuota"
                                class="text-sm font-semibold text-text-primary"
                                :class="{ 'line-through': estaAtenuado(a) }">
                                {{ formatearMonto(a.monto) }}
                                <span v-if="a.con_recargo && !estaAtenuado(a)" class="text-xs font-normal text-sun">
                                    con recargo
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>

        <PagoDetalleModal :alumno="alumnoActivo" :escuela="escuelaActiva" :semana-inicio="datos?.semana_inicio ?? ''"
            :puede-resolver="puedeResolver" @close="clienteActivoId = null" @resuelto="refrescar" />
    </div>
</template>