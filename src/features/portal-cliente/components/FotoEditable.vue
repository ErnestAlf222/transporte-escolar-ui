<script setup lang="ts">
import { Camera } from 'lucide-vue-next'
import SelectorImagen from '@/shared/ui/SelectorImagen.vue'
import Spinner from '@/shared/ui/Spinner.vue'
import { TEXTO_CAMBIAR_FOTO, TEXTO_SUBIENDO } from '@/features/portal-cliente/constants/perfil'
import { inicialesDeTexto } from '@/shared/utils/nombres'

// Foto redonda grande con su botón para cambiarla. Quien la usa sube el archivo (ya reducido) y refresca los datos.
defineProps<{ foto?: string; nombre: string; subiendo: boolean }>()
const emit = defineEmits<{ elegida: [archivo: File]; error: [mensaje: string] }>()
</script>

<template>
    <div class="flex items-center gap-4">
        <img v-if="foto" :src="foto" :alt="nombre" loading="lazy" class="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-accent/40" />
        <span v-else aria-hidden="true"
            class="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-accent text-2xl font-extrabold text-bg">
            {{ inicialesDeTexto(nombre) }}
        </span>
        <SelectorImagen :deshabilitado="subiendo"
            clases="flex min-h-11 items-center gap-2 rounded-2xl border border-border bg-panel px-4 py-2 text-sm font-bold text-text-primary shadow-[0_3px_0_0_var(--color-border)] transition-[transform,box-shadow] duration-100 hover:bg-panel-2 active:translate-y-0.5 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:translate-y-0"
            @elegida="emit('elegida', $event)" @error="emit('error', $event)">
            <Spinner v-if="subiendo" />
            <Camera v-else class="h-5 w-5" />
            {{ subiendo ? TEXTO_SUBIENDO : TEXTO_CAMBIAR_FOTO }}
        </SelectorImagen>
    </div>
</template>
