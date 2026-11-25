<script setup lang="ts">
import { CircleAlert } from 'lucide-vue-next'
import { TEXTO_ERROR_VARIAS, TEXTO_BOTON_REINTENTAR } from '@/features/portal-cliente/constants/portal'

// Un solo aviso amable cuando fallan varias secciones a la vez, con un botón que recarga todo
defineEmits<{ reintentar: [] }>()
</script>

<template>
    <div role="alert" class="flex flex-col items-center gap-4 rounded-3xl border border-border bg-panel p-5 text-center sm:flex-row sm:text-left">
        <CircleAlert class="h-6 w-6 shrink-0 text-sun" aria-hidden="true" />
        <p class="flex-1 text-sm text-text-primary">{{ TEXTO_ERROR_VARIAS }}</p>
        <button type="button"
            class="min-h-11 shrink-0 rounded-2xl bg-accent px-5 py-2 text-sm font-bold text-bg hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            @click="$emit('reintentar')">
            {{ TEXTO_BOTON_REINTENTAR }}
        </button>
    </div>
</template>
