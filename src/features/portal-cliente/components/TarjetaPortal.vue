<script setup lang="ts">
// Tarjeta independiente del portal: esquinas bien redondeadas, borde suave y una sombra que sale del color del texto.
// Cada bloque se lee como una tarjeta propia y respira.
</script>

<template>
    <div
        class="rounded-3xl border border-border bg-panel p-5 shadow-[0_10px_30px_-18px_color-mix(in_srgb,var(--color-text-primary)_45%,transparent)] sm:p-6">
        <slot />
    </div>
</template>
