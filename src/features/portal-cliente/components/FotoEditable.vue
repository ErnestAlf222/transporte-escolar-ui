<script setup lang="ts">
import { Camera } from 'lucide-vue-next'
import SelectorImagen from '@/shared/ui/SelectorImagen.vue'
import Spinner from '@/shared/ui/Spinner.vue'
import { TEXTO_CAMBIAR_FOTO, TEXTO_SUBIENDO } from '@/features/portal-cliente/constants/perfil'
import { inicialesDeTexto } from '@/shared/utils/nombres'

// Foto redonda con su botón para cambiarla. Quien la usa sube el archivo (ya reducido) y refresca los datos.
defineProps<{ foto?: string; nombre: string; subiendo: boolean }>()
const emit = defineEmits<{ elegida: [archivo: File]; error: [mensaje: string] }>()
</script>

<template>
    <div class="flex items-center gap-3">
        <img v-if="foto" :src="foto" :alt="nombre" loading="lazy" class="h-16 w-16 shrink-0 rounded-full object-cover" />
        <span v-else aria-hidden="true"
            class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent text-xl font-semibold text-bg">
            {{ inicialesDeTexto(nombre) }}
        </span>
        <SelectorImagen :deshabilitado="subiendo"
            clases="flex items-center gap-2 rounded-card border border-border bg-panel px-3 py-2 text-sm font-medium text-text-primary hover:bg-panel-2 disabled:opacity-50"
            @elegida="emit('elegida', $event)" @error="emit('error', $event)">
            <Spinner v-if="subiendo" />
            <Camera v-else class="h-4 w-4" />
            {{ subiendo ? TEXTO_SUBIENDO : TEXTO_CAMBIAR_FOTO }}
        </SelectorImagen>
    </div>
</template>
