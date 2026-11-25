<script setup lang="ts">
import { ref } from 'vue'
import { ACEPTA_IMAGENES } from '@/shared/constants/imagen'
import { prepararImagen } from '@/shared/utils/imagen'

// Elegir una imagen: valida tipo y tamaño, la reduce en el navegador y entrega el archivo listo para subir.
// El contenido (slot) es lo que se ve como botón; al tocarlo se abre el selector de archivos del teléfono.
defineProps<{ deshabilitado?: boolean; clases?: string }>()
const emit = defineEmits<{ elegida: [archivo: File]; error: [mensaje: string] }>()

const entrada = ref<HTMLInputElement | null>(null)
const preparando = ref(false)

async function alElegir() {
    const original = entrada.value?.files?.[0]
    if (entrada.value) entrada.value.value = '' // permite volver a elegir el mismo archivo
    if (!original) return
    preparando.value = true
    try {
        const r = await prepararImagen(original)
        if (r.error !== undefined) emit('error', r.error)
        else emit('elegida', r.archivo)
    } finally {
        preparando.value = false
    }
}
</script>

<template>
    <button type="button" :disabled="deshabilitado || preparando" :class="clases" @click="entrada?.click()">
        <slot :preparando="preparando" />
    </button>
    <input ref="entrada" type="file" :accept="ACEPTA_IMAGENES" class="hidden" @change="alElegir" />
</template>
