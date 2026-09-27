<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

interface Opcion {
    value: string
    label: string
}

const props = defineProps<{
    modelValue: string
    opciones: Opcion[]
}>()

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

const abierto = ref(false)
const contenedor = ref<HTMLElement | null>(null)

const etiquetaActual = computed(
    () => props.opciones.find((o) => o.value === props.modelValue)?.label ?? '',
)

function seleccionar(value: string) {
    emit('update:modelValue', value)
    abierto.value = false
}

function alHacerClicFuera(evento: MouseEvent) {
    if (contenedor.value && !contenedor.value.contains(evento.target as Node)) {
        abierto.value = false
    }
}

onMounted(() => document.addEventListener('click', alHacerClicFuera))
onUnmounted(() => document.removeEventListener('click', alHacerClicFuera))
</script>

<template>
    <div ref="contenedor" class="relative">
        <button type="button"
            class="flex items-center gap-2 rounded-card border border-border bg-panel px-3 py-2 text-sm text-text-primary"
            @click="abierto = !abierto">
            {{ etiquetaActual }}
            <ChevronDown class="h-4 w-4 text-text-secondary" />
        </button>

        <Transition enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 scale-95 -translate-y-1" enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 -translate-y-1">
            <div v-if="abierto" class="glass absolute right-0 z-10 mt-2 w-40 overflow-hidden rounded-card">
                <button v-for="opcion in opciones" :key="opcion.value" type="button"
                    class="block w-full px-3 py-2 text-left text-sm text-text-secondary hover:bg-panel-2"
                    :class="{ 'bg-panel-2 text-text-primary': opcion.value === modelValue }"
                    @click="seleccionar(opcion.value)">
                    {{ opcion.label }}
                </button>
            </div>
        </Transition>
    </div>
</template>