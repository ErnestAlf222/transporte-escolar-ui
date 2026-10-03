<script setup lang="ts">
import { ref, computed } from 'vue'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-vue-next'
import { hoyIso, semanasDelMes, soloFecha } from '@/utils/semana'

const props = defineProps<{
    semanaInicio: string // lunes de la semana que se está viendo
    esActual: boolean
    fechaMinima?: string // "AAAA-MM-DD": antes de esta fecha no hay registros
}>()
const emit = defineEmits<{ elegir: [fecha: string] }>()

const ENCABEZADO_DIAS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi']
const MESES_POR_ANIO = 12
const FORMATO_MES = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' })

interface MesVisible {
    anio: number
    mes: number // 0 = enero
}

function mesDe(iso: string): MesVisible {
    const [anio, mes] = iso.slice(0, 10).split('-').map(Number)
    return { anio: anio!, mes: mes! - 1 }
}

function posicion(m: MesVisible): number {
    return m.anio * MESES_POR_ANIO + m.mes
}

const abierto = ref(false)
const visible = ref<MesVisible>(mesDe(props.semanaInicio))

const semanas = computed(() => semanasDelMes(visible.value.anio, visible.value.mes))

const titulo = computed(() => {
    const texto = FORMATO_MES.format(new Date(visible.value.anio, visible.value.mes, 1))
    return texto.charAt(0).toUpperCase() + texto.slice(1)
})

const puedeIrAtras = computed(
    () => !props.fechaMinima || posicion(visible.value) > posicion(mesDe(props.fechaMinima)),
)
const puedeIrAdelante = computed(() => posicion(visible.value) < posicion(mesDe(hoyIso())))

function moverMes(desplazamiento: number) {
    const total = posicion(visible.value) + desplazamiento
    visible.value = { anio: Math.floor(total / MESES_POR_ANIO), mes: total % MESES_POR_ANIO }
}

// No se puede elegir una fecha futura ni anterior al primer registro
function estaDeshabilitado(iso: string): boolean {
    return iso > hoyIso() || (!!props.fechaMinima && iso < props.fechaMinima)
}

function esSemanaVista(lunes: string): boolean {
    return lunes === soloFecha(props.semanaInicio)
}

function alternar() {
    if (!abierto.value) visible.value = mesDe(props.semanaInicio)
    abierto.value = !abierto.value
}

function cerrar() {
    abierto.value = false
}

function elegir(iso: string) {
    emit('elegir', iso)
    cerrar()
}
</script>

<template>
    <div class="relative">
        <!-- Capa de desenfoque: queda dentro del componente para que el encabezado fijo la tape completa -->

        <Transition enter-active-class="transition-opacity duration-200 motion-reduce:transition-none"
            enter-from-class="opacity-0"
            leave-active-class="transition-opacity duration-150 motion-reduce:transition-none"
            leave-to-class="opacity-0">
            <div v-if="abierto"
                class="fixed inset-0 z-40 bg-black/40 supports-backdrop-filter:bg-black/30 supports-backdrop-filter:backdrop-blur-sm"
                @click="cerrar"></div>
        </Transition>


        <button type="button" :aria-label="abierto ? 'Cerrar calendario' : 'Elegir una semana'" :aria-expanded="abierto"
            class="relative z-50 grid h-11 w-11 place-items-center rounded-full bg-accent text-bg shadow-lg shadow-black/40 transition hover:opacity-90 active:scale-95"
            @click="alternar" @keydown.esc="cerrar">
            <X v-if="abierto" class="h-5 w-5" />
            <CalendarDays v-else class="h-5 w-5" />
        </button>

        <!-- Panel: crece desde la burbuja y se encoge hacia ella, igual que el de Clientes -->
        <Transition enter-active-class="transition duration-300 ease-out motion-reduce:transition-none"
            enter-from-class="opacity-0 scale-50" enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-200 ease-in motion-reduce:transition-none"
            leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-50">
            <div v-if="abierto" role="dialog" aria-label="Elegir una semana"
                class="absolute right-0 top-full z-50 mt-3 w-72 rounded-card border border-border bg-panel p-4 shadow-xl shadow-black/40"
                :style="{ transformOrigin: 'calc(100% - 1.375rem) -2.125rem' }" @keydown.esc="cerrar">
                <div class="mb-3 flex items-center justify-between">
                    <button type="button" aria-label="Mes anterior" :disabled="!puedeIrAtras"
                        class="rounded-full p-1.5 text-text-secondary hover:bg-panel-2 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30"
                        @click="moverMes(-1)">
                        <ChevronLeft class="h-5 w-5" />
                    </button>
                    <p class="text-sm font-semibold text-text-primary">{{ titulo }}</p>
                    <button type="button" aria-label="Mes siguiente" :disabled="!puedeIrAdelante"
                        class="rounded-full p-1.5 text-text-secondary hover:bg-panel-2 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30"
                        @click="moverMes(1)">
                        <ChevronRight class="h-5 w-5" />
                    </button>
                </div>

                <div class="mb-1 grid grid-cols-5 text-center text-xs font-medium text-text-secondary">
                    <span v-for="dia in ENCABEZADO_DIAS" :key="dia">{{ dia }}</span>
                </div>

                <div class="space-y-1">
                    <div v-for="semana in semanas" :key="semana[0]!.iso" class="grid grid-cols-5 rounded-card py-0.5"
                        :class="esSemanaVista(semana[0]!.iso) ? 'bg-accent/15' : ''">
                        <button v-for="dia in semana" :key="dia.iso" type="button"
                            :disabled="estaDeshabilitado(dia.iso)" :aria-label="dia.iso"
                            class="mx-auto h-9 w-9 rounded-full text-sm transition" :class="[
                                dia.delMes ? 'text-text-primary' : 'text-text-muted',
                                estaDeshabilitado(dia.iso) ? 'cursor-not-allowed opacity-30' : 'hover:bg-panel-2',
                                dia.iso === hoyIso() ? 'ring-1 ring-accent' : '',
                            ]" @click="elegir(dia.iso)">
                            {{ dia.dia }}
                        </button>
                    </div>
                </div>

                <button type="button" :disabled="esActual"
                    class="mt-3 w-full rounded-card border border-border py-2 text-sm text-accent transition hover:bg-panel-2 disabled:cursor-not-allowed disabled:opacity-40"
                    @click="elegir(hoyIso())">
                    Esta semana
                </button>
            </div>
        </Transition>
    </div>
</template>