<script setup lang="ts">
defineProps<{ texto: string; clases: string }>()
</script>

<template>
    <span class="inline-block shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium" :class="clases">{{ texto }}</span>
</template>
