<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

// Se trabaja en matiz / saturación / brillo; hacia afuera siempre sale un #RRGGBB
const h = ref(0)
const s = ref(0)
const v = ref(1)
const texto = ref('')

function hexAHsv(hex: string): [number, number, number] {
    const n = parseInt(hex.slice(1), 16)
    const r = ((n >> 16) & 255) / 255
    const g = ((n >> 8) & 255) / 255
    const b = (n & 255) / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const d = max - min
    let matiz = 0
    if (d !== 0) {
        if (max === r) matiz = ((g - b) / d) % 6
        else if (max === g) matiz = (b - r) / d + 2
        else matiz = (r - g) / d + 4
        matiz *= 60
        if (matiz < 0) matiz += 360
    }
    return [matiz, max === 0 ? 0 : d / max, max]
}

function hsvAHex(matiz: number, sat: number, val: number): string {
    const c = val * sat
    const x = c * (1 - Math.abs(((matiz / 60) % 2) - 1))
    const m = val - c
    const [r, g, b] =
        matiz < 60 ? [c, x, 0] : matiz < 120 ? [x, c, 0] : matiz < 180 ? [0, c, x] : matiz < 240 ? [0, x, c] : matiz < 300 ? [x, 0, c] : [c, 0, x]
    const hex = (k: number) => Math.round((k + m) * 255).toString(16).padStart(2, '0')
    return `#${hex(r)}${hex(g)}${hex(b)}`
}

const formatoHex = /^#[0-9a-fA-F]{6}$/

// Cuando el color cambia desde afuera (un color listo, restablecer) el selector lo sigue
watch(
    () => props.modelValue,
    (c) => {
        if (!formatoHex.test(c)) return
        if (c.toLowerCase() === hsvAHex(h.value, s.value, v.value).toLowerCase()) return
            ;[h.value, s.value, v.value] = hexAHsv(c)
        texto.value = c
    },
    { immediate: true },
)

function emitir() {
    const hex = hsvAHex(h.value, s.value, v.value)
    texto.value = hex
    emit('update:modelValue', hex)
}

const fondoPanel = computed(() => `hsl(${h.value}, 100%, 50%)`)
const posicion = computed(() => ({ left: `${s.value * 100}%`, top: `${(1 - v.value) * 100}%` }))

function mover(e: PointerEvent, el: HTMLElement, alMover: (x: number, y: number) => void) {
    const caja = el.getBoundingClientRect()
    const x = Math.min(1, Math.max(0, (e.clientX - caja.left) / caja.width))
    const y = Math.min(1, Math.max(0, (e.clientY - caja.top) / caja.height))
    alMover(x, y)
    emitir()
}

function arrastrar(e: PointerEvent, alMover: (x: number, y: number) => void) {
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
    mover(e, el, alMover)
    const seguir = (ev: PointerEvent) => mover(ev, el, alMover)
    const soltar = () => {
        el.removeEventListener('pointermove', seguir)
        el.removeEventListener('pointerup', soltar)
    }
    el.addEventListener('pointermove', seguir)
    el.addEventListener('pointerup', soltar)
}

const alPanel = (e: PointerEvent) =>
    arrastrar(e, (x, y) => {
        s.value = x
        v.value = 1 - y
    })
const alMatiz = (e: PointerEvent) =>
    arrastrar(e, (x) => {
        h.value = x * 360
    })

function alEscribir() {
    const t = texto.value.startsWith('#') ? texto.value : `#${texto.value}`
    if (!formatoHex.test(t)) return
        ;[h.value, s.value, v.value] = hexAHsv(t)
    emit('update:modelValue', t.toLowerCase())
}
</script>

<template>
    <div class="space-y-3">
        <div class="relative h-36 w-full cursor-crosshair touch-none overflow-hidden rounded-card"
            :style="{ backgroundColor: fondoPanel }" @pointerdown="alPanel">
            <div class="absolute inset-0" style="background: linear-gradient(to right, #fff, transparent)" />
            <div class="absolute inset-0" style="background: linear-gradient(to top, #000, transparent)" />
            <span
                class="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                :style="posicion" />
        </div>

        <div class="relative h-4 w-full cursor-pointer touch-none rounded-full"
            style="background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)"
            @pointerdown="alMatiz">
            <span
                class="pointer-events-none absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                :style="{ left: `${(h / 360) * 100}%`, backgroundColor: fondoPanel }" />
        </div>

        <div class="flex items-center gap-2">
            <span class="h-9 w-9 shrink-0 rounded-full border border-border" :style="{ backgroundColor: modelValue }" />
            <input v-model="texto" type="text" maxlength="7" aria-label="Código del color" @input="alEscribir"
                class="w-28 rounded-card border border-border bg-panel/40 px-3 py-2 text-sm uppercase text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
        </div>
    </div>
</template>