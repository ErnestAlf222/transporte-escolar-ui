<script setup lang="ts">
// Contenedor común de las pantallas del portal con sesión (inicio y perfil).
// Móvil: una columna a lo ancho. Tablet (md): más ancho y centrado. Escritorio (lg): tope de ancho y centrado;
// en pantallas aún más grandes (xl, 2xl) ya no crece, así nada se estira.
</script>

<template>
    <div class="mx-auto min-h-screen w-full max-w-md space-y-6 p-4 pb-10 md:max-w-2xl md:p-6 md:pb-12 lg:max-w-5xl">
        <slot />
    </div>
</template>
