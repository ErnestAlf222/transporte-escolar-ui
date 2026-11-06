<script setup lang="ts">
// Rótulo de grupo por escuela. Sin `color` usa el acento; con `color` recibe las clases de
// fondo y texto de la escuela (p. ej. colorEscuela(id).etiqueta).
defineProps<{ color?: string }>()
</script>

<template>
  <h2
    class="w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
    :class="color ?? 'bg-accent/15 text-accent'">
    <slot />
  </h2>
</template>
