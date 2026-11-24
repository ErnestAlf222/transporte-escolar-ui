<script setup lang="ts">
import { DURACION_MENSAJE_MS } from '@/shared/constants/tiempo'

// Mensaje festivo de un tema de temporada, en la letra de la app y bien gruesa; entra con un rebote
defineProps<{ texto: string }>()

const estilo = { '--duracion': `${DURACION_MENSAJE_MS}ms` }
</script>

<template>
  <p class="mensaje" :style="estilo">{{ texto }}</p>
</template>

<style scoped>
.mensaje {
  margin-top: 0.5rem;
  text-align: center;
  font-size: 1.5rem;
  line-height: 1.2;
  font-weight: 900;
  color: var(--color-accent);
  /* sombra plana y sin desenfoque, como las de los dibujos */
  text-shadow: 0 3px 0 color-mix(in srgb, var(--color-accent) 55%, var(--color-van-tinta));
  animation: entra var(--duracion) cubic-bezier(0.2, 1.5, 0.4, 1) both;
}

@keyframes entra {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.5) rotate(-4deg);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mensaje {
    animation: none;
  }
}
</style>
