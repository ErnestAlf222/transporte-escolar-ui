<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTemaLoader } from '@/shared/composables/useTemaLoader'
import { DURACION_REBOTE_MS } from '@/shared/constants/tiempo'
import DecoracionVan from '@/shared/ui/DecoracionVan.vue'
import MensajeTema from '@/shared/ui/MensajeTema.vue'

// `tema`: sin él se usa el tema vigente; con un id (o '' para normal) se fuerza, para las vistas previas
// 'escena' es la vista previa grande de un tema: más lienzo alrededor de la camioneta para ver toda la escena
const props = withDefaults(
    defineProps<{ variante?: 'pantalla' | 'inline' | 'compacto' | 'escena'; tema?: string | null }>(),
    { variante: 'pantalla' },
)

const VIEWBOX = '0 0 140 70'
const VIEWBOX_ESCENA = '-12 -48 160 120'
const viewBox = computed(() => (props.variante === 'escena' ? VIEWBOX_ESCENA : VIEWBOX))

const temaActivo = useTemaLoader(() => props.tema)
const estiloSvg = { '--ciclo-rebote': `${DURACION_REBOTE_MS}ms` }

// La camioneta de este dibujo mide 106 unidades de ancho y la de la cuadrícula 50 pixeles
const DECORACION_TRANSFORM = 'translate(16 11) scale(2.1)'

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
    <div class="flex flex-col items-center justify-center"
        :class="variante === 'pantalla' ? 'fixed inset-0 z-50 gap-6 bg-bg' : ''">
        <svg class="van" :class="[`van--${variante}`, { 'van--tema': temaActivo, 'van--squash': temaActivo?.squash }]" :viewBox="viewBox"
            :style="estiloSvg" xmlns="http://www.w3.org/2000/svg">
            <DecoracionVan :tema="temaActivo" plano="fondo" :transform="DECORACION_TRANSFORM" />

            <ellipse cx="72" cy="62" rx="52" ry="4" fill="rgba(0,0,0,0.35)" />

            <g class="cuerpo">
            <path d="M16 50 L16 24 Q16 16 24 15 L96 15 Q104 15 108 21 L120 36 L122 46 Q122 50 118 50 Z"
                fill="var(--color-van)" stroke="var(--color-van-tinta)" stroke-width="1.5" />

            <path d="M100 19 L110 22 L118 35 L104 35 Z" fill="var(--color-van-tinta)" opacity="0.85" />

            <path d="M26 19 L94 19 L94 33 L26 33 Z" fill="var(--color-accent)" opacity="0.8" />

            <line x1="60" y1="33" x2="60" y2="50" stroke="var(--color-van-tinta)" stroke-width="1" opacity="0.3" />

            <path d="M26 50 a10 10 0 0 1 20 0" fill="none" stroke="var(--color-van-tinta)" stroke-width="1.5"
                opacity="0.4" />
            <path d="M94 50 a10 10 0 0 1 20 0" fill="none" stroke="var(--color-van-tinta)" stroke-width="1.5"
                opacity="0.4" />

            <circle cx="118" cy="42" r="2.5" fill="var(--color-sun)" />

            <circle class="wheel" cx="36" cy="52" r="9" fill="var(--color-bg)" stroke="var(--color-text-secondary)"
                stroke-width="2.5" />
            <circle class="wheel" cx="104" cy="52" r="9" fill="var(--color-bg)" stroke="var(--color-text-secondary)"
                stroke-width="2.5" />
            <circle cx="36" cy="52" r="3" fill="var(--color-text-secondary)" />
            <circle cx="104" cy="52" r="3" fill="var(--color-text-secondary)" />

            <DecoracionVan :tema="temaActivo" plano="cuerpo" :transform="DECORACION_TRANSFORM" />
            </g>

            <DecoracionVan :tema="temaActivo" plano="frente" :transform="DECORACION_TRANSFORM" />
        </svg>

        <MensajeTema v-if="variante === 'escena' && temaActivo?.mensaje" :key="temaActivo.id" :texto="temaActivo.mensaje" />

        <p v-if="variante === 'pantalla'" class="text-sm text-text-secondary">
            Hecho con tecnología
            <span class="font-semibold text-accent">{{ palabras[indice] }}</span>
        </p>
    </div>
</template>

<style scoped>
.van {
    overflow: visible; /* la decoración de temporada sobresale del techo */
    width: 160px;
    animation: bounce 1.2s ease-in-out infinite;
}

.van--inline {
    width: 110px;
}

.van--compacto {
    width: 44px;
}

.van--escena {
    width: 100%;
    max-width: 440px;
}

.van--tema {
    overflow: visible;
}

/* con tema, el rebote es de la camioneta (y lo que lleva encima): se estira al saltar y se aplasta al caer */
.van--squash {
    animation: none;
}

.van--squash .cuerpo {
    transform-box: fill-box;
    transform-origin: 50% 100%;
    animation: squash var(--ciclo-rebote) ease-in-out infinite;
}

@keyframes squash {

    0%,
    100% {
        transform: translateY(0) scale(1.05, 0.93);
    }

    35% {
        transform: translateY(-5px) scale(0.97, 1.06);
    }

    65% {
        transform: translateY(-1px) scale(1, 1);
    }
}

@media (prefers-reduced-motion: reduce) {

    .van--tema,
    .van--tema .cuerpo,
    .van--tema .wheel {
        animation: none;
    }
}

.wheel {
    transform-box: fill-box;
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