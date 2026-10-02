<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { ArrowDown, ArrowUp } from 'lucide-vue-next'

// Si se pasa un contenedor, el botón controla el scroll de ese contenedor; si no, el de la página
const props = defineProps<{ objetivo?: HTMLElement | null }>()

const UMBRAL = 80
const modo = ref<'abajo' | 'arriba' | null>(null)
const escribiendo = ref(false)
let ultimoY = 0
let bajando = true
let observador: ResizeObserver | null = null

function medidas() {
    const el = props.objetivo
    if (el) return { y: el.scrollTop, visible: el.clientHeight, total: el.scrollHeight }
    return { y: window.scrollY, visible: window.innerHeight, total: document.documentElement.scrollHeight }
}

function actualizar() {
    const { y, visible, total } = medidas()
    if (total - visible <= UMBRAL) {
        modo.value = null
        return
    }
    if (y !== ultimoY) bajando = y > ultimoY
    ultimoY = y

    if (y <= UMBRAL) modo.value = 'abajo'
    else if (y + visible >= total - UMBRAL) modo.value = 'arriba'
    else modo.value = bajando ? 'abajo' : 'arriba'
}

function ir() {
    const top = modo.value === 'abajo' ? medidas().total : 0
    if (props.objetivo) props.objetivo.scrollTo({ top, behavior: 'smooth' })
    else window.scrollTo({ top, behavior: 'smooth' })
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

// Si se pasa un contenedor con scroll propio, se escucha ese además de la ventana
let observadorContenedor: ResizeObserver | null = null

watch(
    () => props.objetivo,
    (nuevo, anterior) => {
        anterior?.removeEventListener('scroll', actualizar)
        observadorContenedor?.disconnect()
        observadorContenedor = null
        if (nuevo) {
            nuevo.addEventListener('scroll', actualizar, { passive: true })
            observadorContenedor = new ResizeObserver(actualizar)
            observadorContenedor.observe(nuevo)
            Array.from(nuevo.children).forEach((hijo) => observadorContenedor?.observe(hijo))
        }
        ultimoY = 0
        actualizar()
    },
    { immediate: true },
)

onUnmounted(() => {
    props.objetivo?.removeEventListener('scroll', actualizar)
    window.removeEventListener('scroll', actualizar)
    window.removeEventListener('resize', actualizar)
    document.removeEventListener('focusin', alEnfocar)
    document.removeEventListener('focusout', alDesenfocar)
    observador?.disconnect()
    observadorContenedor?.disconnect()
})
</script>

<template>
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 translate-y-2"
        leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0 translate-y-2">
        <button v-if="modo && !escribiendo" type="button" :aria-label="modo === 'abajo' ? 'Ir al final' : 'Ir arriba'"
            class="glass grid h-10 w-10 place-items-center rounded-full text-text-secondary opacity-60 hover:opacity-100 active:opacity-100"
            :class="objetivo ? 'absolute bottom-16 right-8 z-10' : 'fixed bottom-24 right-4 z-30 sm:right-6'"
            @click="ir">
            <ArrowDown v-if="modo === 'abajo'" class="h-4 w-4" />
            <ArrowUp v-else class="h-4 w-4" />
        </button>
    </Transition>
</template>