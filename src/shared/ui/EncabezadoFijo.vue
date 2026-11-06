<script setup lang="ts">
// Encabezado que se queda debajo de la barra superior mientras se desliza la lista.
// Lo que varía entre pantallas: la capa (z-20 o z-25), el relleno inferior (pb-3 o pb-4) y el
// diseño interno; este último se pasa con `class` (p. ej. "mb-2 flex flex-wrap ...").
withDefaults(defineProps<{ capa?: 20 | 25; relleno?: 3 | 4 }>(), { capa: 20, relleno: 3 })

// Clases completas (no armadas por pedazos) para que Tailwind las detecte
const CAPAS = { 20: 'z-20', 25: 'z-25' }
const RELLENOS = { 3: 'pb-3', 4: 'pb-4' }
</script>

<template>
  <div class="sticky top-cabecera -mx-6 bg-bg px-6 pt-2" :class="[CAPAS[capa], RELLENOS[relleno]]">
    <slot />
  </div>
</template>
