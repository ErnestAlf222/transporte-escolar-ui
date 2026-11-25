<script setup lang="ts">
import { computed } from 'vue'
import { ESTADO_CICLO, type EstadoCiclo } from '@/shared/constants/estadoCiclo'

// Chip de estado con su icono (así no depende solo del color): todo sale del mapa único de estados
const props = defineProps<{ estado: EstadoCiclo }>()
const vista = computed(() => ESTADO_CICLO[props.estado])
</script>

<template>
    <span class="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-bold" :class="vista.clases">
        <component :is="vista.icono" class="h-3.5 w-3.5" aria-hidden="true" />
        {{ vista.texto }}
    </span>
</template>
