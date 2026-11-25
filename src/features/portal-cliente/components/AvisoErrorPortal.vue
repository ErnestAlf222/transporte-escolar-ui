<script setup lang="ts">
import { CircleAlert } from 'lucide-vue-next'
import { TEXTO_ERROR_VARIAS, TEXTO_BOTON_REINTENTAR } from '@/features/portal-cliente/constants/portal'

// Un solo aviso amable cuando fallan varias secciones a la vez, con un botón que recarga todo
defineEmits<{ reintentar: [] }>()
</script>

<template>
    <div role="alert" class="glass-plano flex flex-col items-center gap-3 rounded-card p-5 text-center sm:flex-row sm:text-left">
        <CircleAlert class="h-6 w-6 shrink-0 text-sun" aria-hidden="true" />
        <p class="flex-1 text-sm text-text-primary">{{ TEXTO_ERROR_VARIAS }}</p>
        <button type="button"
            class="shrink-0 rounded-card bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90"
            @click="$emit('reintentar')">
            {{ TEXTO_BOTON_REINTENTAR }}
        </button>
    </div>
</template>
