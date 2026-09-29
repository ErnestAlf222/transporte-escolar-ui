<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ArrowDown, ArrowUp } from 'lucide-vue-next'

const UMBRAL = 80
const modo = ref<'abajo' | 'arriba' | null>(null)
const escribiendo = ref(false)
let ultimoY = 0
let bajando = true
let observador: ResizeObserver | null = null

function actualizar() {
    const el = document.documentElement
    if (el.scrollHeight - window.innerHeight <= UMBRAL) {
        modo.value = null
        return
    }
    const y = window.scrollY
    if (y !== ultimoY) bajando = y > ultimoY
    ultimoY = y

    if (y <= UMBRAL) modo.value = 'abajo'
    else if (y + window.innerHeight >= el.scrollHeight - UMBRAL) modo.value = 'arriba'
    else modo.value = bajando ? 'abajo' : 'arriba'
}

function ir() {
    const top = modo.value === 'abajo' ? document.documentElement.scrollHeight : 0
    window.scrollTo({ top, behavior: 'smooth' })
}

function esCampo(t: EventTarget | null) {
    return t instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)
}
const alEnfocar = (e: FocusEvent) => { if (esCampo(e.target)) escribiendo.value = true }
const alDesenfocar = () => { escribiendo.value = false }

onMounted(() => {
    window.addEventListener('scroll', actualizar, { passive: true })
    window.addEventListener('resize', actualizar)
    document.addEventListener('focusin', alEnfocar)
    document.addEventListener('focusout', alDesenfocar)
    observador = new ResizeObserver(actualizar)
    observador.observe(document.body)
    actualizar()
})

onUnmounted(() => {
    window.removeEventListener('scroll', actualizar)
    window.removeEventListener('resize', actualizar)
    document.removeEventListener('focusin', alEnfocar)
    document.removeEventListener('focusout', alDesenfocar)
    observador?.disconnect()
})
</script>

<template>
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 translate-y-2"
        leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0 translate-y-2">
        <button v-if="modo && !escribiendo" type="button" :aria-label="modo === 'abajo' ? 'Ir al final' : 'Ir arriba'"
            class="glass fixed bottom-24 right-4 z-30 grid h-10 w-10 place-items-center rounded-full text-text-secondary opacity-60 hover:opacity-100 active:opacity-100 sm:right-6"
            @click="ir">
            <ArrowDown v-if="modo === 'abajo'" class="h-4 w-4" />
            <ArrowUp v-else class="h-4 w-4" />
        </button>
    </Transition>
</template>