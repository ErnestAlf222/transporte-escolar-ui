<script setup lang="ts">
defineProps<{ mensaje: string }>()
</script>

<template>
    <div class="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <svg class="h-16 w-16 text-text-secondary" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="21" cy="21" r="13" stroke="currentColor" stroke-width="3" />
            <line x1="30" y1="30" x2="42" y2="42" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
            <line x1="16" y1="21" x2="26" y2="21" stroke="var(--color-accent)" stroke-width="2.5"
                stroke-linecap="round" />
        </svg>
        <p class="text-sm text-text-secondary">{{ mensaje }}</p>
    </div>
</template>