<script setup lang="ts">
// Botón grande con relieve: tiene un borde inferior sólido más oscuro (sale del acento o del borde del sistema)
// y se hunde al presionarlo. Con "reducir movimiento" no se mueve. Alto mínimo de 48 px.
withDefaults(defineProps<{ variante?: 'principal' | 'suave'; deshabilitado?: boolean; tipo?: 'button' | 'submit' }>(), {
    tipo: 'button',
    variante: 'principal',
    deshabilitado: false,
})

const CLASES: Record<'principal' | 'suave', string> = {
    principal:
        'bg-accent text-bg shadow-[0_4px_0_0_color-mix(in_srgb,var(--color-accent)_60%,var(--color-van-tinta))] hover:brightness-105',
    suave:
        'border border-border bg-panel text-text-primary shadow-[0_3px_0_0_var(--color-border)] hover:bg-panel-2',
}
</script>

<template>
    <button :type="tipo" :disabled="deshabilitado" :class="CLASES[variante]"
        class="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-base font-bold transition-[transform,box-shadow,filter] duration-100 active:translate-y-1 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0 motion-reduce:transition-none motion-reduce:active:translate-y-0">
        <slot />
    </button>
</template>
