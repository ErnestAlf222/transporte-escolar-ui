<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, ImageOff, ExternalLink } from 'lucide-vue-next'
import Spinner from '@/components/Spinner.vue'

const props = defineProps<{ url: string; abierto: boolean }>()
const emit = defineEmits<{ close: [] }>()

const cargando = ref(true)
const fallo = ref(false)

// Cada vez que se abre, la imagen vuelve a mostrar su loader mientras llega
watch(
    () => [props.abierto, props.url],
    () => {
        cargando.value = true
        fallo.value = false
    },
)

function alTerminar() {
    cargando.value = false
}

function alFallar() {
    fallo.value = true
    cargando.value = false
}

function alTeclaEsc(evento: KeyboardEvent) {
    if (evento.key === 'Escape') emit('close')
}
</script>

<template>
    <Teleport to="body">
        <!-- Fondo oscuro: tocarlo cierra el visor -->
        <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
            leave-active-class="transition duration-200 ease-in" leave-to-class="opacity-0">
            <div v-if="abierto" class="fixed inset-0 z-[70] bg-black/80 supports-backdrop-filter:backdrop-blur-sm"
                @click="emit('close')"></div>
        </Transition>

        <!-- La imagen aparece creciendo y, al cerrar, se encoge y vuelve a la pantalla de atrás -->
        <Transition enter-active-class="transition duration-300 ease-out motion-reduce:transition-none"
            enter-from-class="opacity-0 scale-90" enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-200 ease-in motion-reduce:transition-none"
            leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-90">
            <div v-if="abierto" class="pointer-events-none fixed inset-0 z-[71] flex items-center justify-center p-4"
                tabindex="-1" @keydown="alTeclaEsc">
                <div class="pointer-events-auto relative flex max-h-full w-full max-w-3xl items-center justify-center">
                    <button type="button" aria-label="Cerrar la captura"
                        class="absolute -top-1 right-0 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-text-primary hover:bg-black/80"
                        @click="emit('close')">
                        <X class="h-5 w-5" />
                    </button>

                    <div v-if="cargando && !fallo && url" class="absolute inset-0 grid place-items-center text-accent">
                        <Spinner />
                    </div>

                    <img v-if="url && !fallo" :src="url" alt="Captura de pantalla del pago" referrerpolicy="no-referrer"
                        class="max-h-[85dvh] max-w-full rounded-card object-contain transition-opacity duration-200"
                        :class="cargando ? 'opacity-0' : 'opacity-100'" @load="alTerminar" @error="alFallar" />

                    <p v-else class="glass flex items-center gap-2 rounded-card p-4 text-sm text-text-secondary">
                        <ImageOff class="h-4 w-4 shrink-0" />
                        No se pudo mostrar la captura.
                        <a v-if="url" :href="url" target="_blank" rel="noopener noreferrer"
                            class="ml-2 flex items-center gap-1 text-accent underline">
                            Abrir
                            <ExternalLink class="h-3.5 w-3.5" />
                        </a>
                    </p>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>