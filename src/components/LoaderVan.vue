<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const palabras = ['Ernesto', 'Alfonso', 'Sánchez', 'Montiel']
const indice = ref(0)
let intervalo: ReturnType<typeof setInterval>

onMounted(() => {
    intervalo = setInterval(() => {
        indice.value = (indice.value + 1) % palabras.length
    }, 1200)
})

onUnmounted(() => {
    clearInterval(intervalo)
})
</script>

<template>
    <div class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-bg">
        <svg class="van" viewBox="0 0 140 70" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="72" cy="62" rx="52" ry="4" fill="rgba(0,0,0,0.35)" />

            <path d="M16 50 L16 24 Q16 16 24 15 L96 15 Q104 15 108 21 L120 36 L122 46 Q122 50 118 50 Z"
                fill="var(--color-text-primary)" stroke="var(--color-bg)" stroke-width="1.5" />

            <path d="M100 19 L110 22 L118 35 L104 35 Z" fill="var(--color-bg)" opacity="0.85" />

            <path d="M26 19 L94 19 L94 33 L26 33 Z" fill="var(--color-accent)" opacity="0.8" />

            <line x1="60" y1="33" x2="60" y2="50" stroke="var(--color-bg)" stroke-width="1" opacity="0.3" />

            <path d="M26 50 a10 10 0 0 1 20 0" fill="none" stroke="var(--color-bg)" stroke-width="1.5" opacity="0.4" />
            <path d="M94 50 a10 10 0 0 1 20 0" fill="none" stroke="var(--color-bg)" stroke-width="1.5" opacity="0.4" />

            <circle cx="118" cy="42" r="2.5" fill="var(--color-sun)" />

            <circle class="wheel" cx="36" cy="52" r="9" fill="var(--color-bg)" stroke="var(--color-text-secondary)"
                stroke-width="2.5" />
            <circle class="wheel" cx="104" cy="52" r="9" fill="var(--color-bg)" stroke="var(--color-text-secondary)"
                stroke-width="2.5" />
            <circle cx="36" cy="52" r="3" fill="var(--color-text-secondary)" />
            <circle cx="104" cy="52" r="3" fill="var(--color-text-secondary)" />
        </svg>

        <p class="text-sm text-text-secondary">
            Hecho con tecnología
            <span class="font-semibold text-accent">{{ palabras[indice] }}</span>
        </p>
    </div>
</template>

<style scoped>
.van {
    width: 160px;
    animation: bounce 1.2s ease-in-out infinite;
}

.wheel {
    transform-origin: center;
    animation: spin 0.6s linear infinite;
}

@keyframes bounce {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-4px);
    }
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>