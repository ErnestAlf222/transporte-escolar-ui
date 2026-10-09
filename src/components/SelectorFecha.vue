<script setup lang="ts">
import { ref, computed } from 'vue'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{
    modelValue: string // "AAAA-MM-DD"
    min: string // antes de esta fecha no se puede elegir
    max: string // después de esta fecha tampoco (normalmente hoy)
    id?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [fecha: string] }>()

const ENCABEZADO_DIAS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
const MESES_POR_ANIO = 12
const FORMATO_MES = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' })
const FORMATO_DIA = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })

interface Mes {
    anio: number
    mes: number // 0 = enero
}

interface Dia {
    iso: string
    dia: number
    delMes: boolean
}

function aIso(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function mesDe(iso: string): Mes {
    const [anio, mes] = iso.slice(0, 10).split('-').map(Number)
    return { anio: anio!, mes: mes! - 1 }
}

function posicion(m: Mes): number {
    return m.anio * MESES_POR_ANIO + m.mes
}

function fechaDe(iso: string): Date {
    const [a, m, d] = iso.slice(0, 10).split('-').map(Number)
    return new Date(a!, m! - 1, d!)
}

const abierto = ref(false)
const visible = ref<Mes>(mesDe(props.modelValue))

const texto = computed(() => {
    const base = FORMATO_DIA.format(fechaDe(props.modelValue))
    return props.modelValue === props.max ? `Hoy, ${base}` : base
})

const titulo = computed(() => {
    const t = FORMATO_MES.format(new Date(visible.value.anio, visible.value.mes, 1))
    return t.charAt(0).toUpperCase() + t.slice(1)
})

// Semanas de lunes a domingo; la última fila se quita si todo ya es del mes siguiente
const semanas = computed<Dia[][]>(() => {
    const { anio, mes } = visible.value
    const desfase = (new Date(anio, mes, 1).getDay() + 6) % 7
    const filas: Dia[][] = []
    for (let f = 0; f < 6; f++) {
        const fila: Dia[] = []
        for (let c = 0; c < 7; c++) {
            const d = new Date(anio, mes, 1 - desfase + f * 7 + c)
            fila.push({ iso: aIso(d), dia: d.getDate(), delMes: d.getMonth() === mes })
        }
        filas.push(fila)
    }
    while (filas.length > 4 && filas[filas.length - 1]!.every((d) => !d.delMes)) filas.pop()
    return filas
})

const puedeIrAtras = computed(() => posicion(visible.value) > posicion(mesDe(props.min)))
const puedeIrAdelante = computed(() => posicion(visible.value) < posicion(mesDe(props.max)))

function moverMes(desplazamiento: number) {
    const total = posicion(visible.value) + desplazamiento
    visible.value = { anio: Math.floor(total / MESES_POR_ANIO), mes: total % MESES_POR_ANIO }
}

function estaDeshabilitado(iso: string): boolean {
    return iso < props.min || iso > props.max
}

function alternar() {
    if (!abierto.value) visible.value = mesDe(props.modelValue)
    abierto.value = !abierto.value
}

function cerrar() {
    abierto.value = false
}

function elegir(iso: string) {
    emit('update:modelValue', iso)
    cerrar()
}
</script>

<template>
    <div>
        <button :id="id" type="button" :aria-expanded="abierto"
            class="flex w-full items-center justify-between gap-2 rounded-card border bg-panel/40 px-3 py-2 text-left text-sm text-text-primary transition hover:bg-panel-2"
            :class="abierto ? 'border-accent' : 'border-border'" @click="alternar" @keydown.esc.stop="cerrar">
            <span>{{ texto }}</span>
            <CalendarDays class="h-4 w-4 shrink-0 text-accent" />
        </button>

        <div v-if="abierto" role="dialog" aria-label="Elegir cuándo llegó el dinero"
            class="mt-2 rounded-card border border-border bg-panel p-3" @keydown.esc.stop="cerrar">
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

            <div class="mb-1 grid grid-cols-7 text-center text-xs font-medium text-text-secondary">
                <span v-for="d in ENCABEZADO_DIAS" :key="d">{{ d }}</span>
            </div>

            <div class="space-y-1">
                <div v-for="semana in semanas" :key="semana[0]!.iso" class="grid grid-cols-7 py-0.5">
                    <button v-for="d in semana" :key="d.iso" type="button" :disabled="estaDeshabilitado(d.iso)"
                        :aria-label="d.iso" class="mx-auto h-9 w-9 rounded-full text-sm transition" :class="[
                            d.iso === modelValue ? 'bg-accent font-semibold text-bg' : d.delMes ? 'text-text-primary' : 'text-text-muted',
                            estaDeshabilitado(d.iso) ? 'cursor-not-allowed opacity-30' : d.iso === modelValue ? '' : 'hover:bg-panel-2',
                            d.iso === max && d.iso !== modelValue ? 'ring-1 ring-accent' : '',
                        ]" @click="elegir(d.iso)">
                        {{ d.dia }}
                    </button>
                </div>
            </div>

            <button type="button" :disabled="modelValue === max"
                class="mt-3 w-full rounded-card border border-border py-2 text-sm text-accent transition hover:bg-panel-2 disabled:cursor-not-allowed disabled:opacity-40"
                @click="elegir(max)">
                Hoy
            </button>
        </div>
    </div>
</template>