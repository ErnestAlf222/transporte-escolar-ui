<script setup lang="ts">
import { ETIQUETA_ESCUELA_ESCRITA } from '@/features/prospectos/constants/prospectos'

// Lo que la familia escribió como escuela: es el dato con el que se elige la escuela real, así que va bien visible.
// Sin texto no se muestra nada.
defineProps<{ escrita: string }>()
</script>

<template>
  <div v-if="escrita.trim()" class="flex flex-wrap items-center gap-x-2 gap-y-1">
    <span class="text-xs text-text-secondary">{{ ETIQUETA_ESCUELA_ESCRITA }}:</span>
    <span
      class="max-w-full wrap-anywhere rounded-card border border-accent/40 bg-accent/10 px-3 py-1 text-sm font-medium text-text-primary">
      {{ escrita.trim() }}
    </span>
  </div>
</template>
