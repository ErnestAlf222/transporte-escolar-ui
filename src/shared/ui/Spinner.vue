<script setup lang="ts"></script>

<template>
    <svg class="spinner" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"
            stroke-dasharray="42 100" />
    </svg>
</template>

<style scoped>
.spinner {
    width: 1.25rem;
    height: 1.25rem;
    animation: spin 0.7s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>