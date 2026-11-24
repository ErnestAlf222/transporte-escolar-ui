<script setup lang="ts">
import { computed } from 'vue'
import { GROSOR_CONTORNO, type TemaLoader } from '@/shared/constants/temasLoader'
import {
  DURACION_BALANCEO_MS,
  DURACION_CAIDA_MS,
  DURACION_ESTALLIDO_MS,
  DURACION_GIRO_MS,
  DURACION_PULSO_MS,
  DURACION_RAFAGA_MS,
  DURACION_REBOTE_MS,
  DURACION_TITILEO_MS,
} from '@/shared/constants/tiempo'
import type { Pieza, Plano } from '@/shared/utils/formasTemporada'

// Un plano de la decoración de temporada sobre la camioneta, en la cuadrícula de pixeles de VAN. El loader
// lo pone tres veces (fondo, cuerpo y frente) con el transform que lo coloca sobre su camioneta.
const props = defineProps<{ tema?: TemaLoader; plano: Plano }>()

interface CapaLista {
  x: number
  y: number
  anima?: string
  piezas: Pieza[]
  estilo: Record<string, string | number>
}

const capas = computed<CapaLista[]>(() =>
  (props.tema?.capas ?? [])
    .filter((c) => (c.plano ?? 'cuerpo') === props.plano)
    .map((c) => ({
      x: c.x,
      y: c.y,
      anima: c.anima,
      piezas: c.piezas,
      estilo: {
        '--fase': c.fase ?? 0,
        '--vel': c.velocidad ?? 1,
        '--caida': `${c.caida ?? 0}px`,
        '--deriva': `${c.deriva ?? 0}px`,
        '--giro': `${c.giro ?? 0}deg`,
        '--sale-x': `${c.salidaX ?? 0}px`,
        '--sale-y': `${c.salidaY ?? 0}px`,
      },
    })),
)

const estilo = {
  '--titileo': `${DURACION_TITILEO_MS}ms`,
  '--ciclo-caida': `${DURACION_CAIDA_MS}ms`,
  '--ciclo-balanceo': `${DURACION_BALANCEO_MS}ms`,
  '--ciclo-pulso': `${DURACION_PULSO_MS}ms`,
  '--ciclo-rebote': `${DURACION_REBOTE_MS}ms`,
  '--ciclo-rafaga': `${DURACION_RAFAGA_MS}ms`,
  '--ciclo-estallido': `${DURACION_ESTALLIDO_MS}ms`,
  '--ciclo-giro': `${DURACION_GIRO_MS}ms`,
  '--grosor': GROSOR_CONTORNO,
}

const estiloPieza = (p: Pieza) => ({
  opacity: p.opacidad,
  '--ancho-trazo': p.ancho,
})
</script>

<template>
  <!-- la clave por tema hace que al cambiar de tema se repita la ráfaga de entrada -->
  <g v-if="capas.length" :key="tema?.id" :style="estilo">
    <!-- el translate va en un grupo y la animación en el de adentro: la animación reemplaza el transform de su grupo -->
    <g
      v-for="(c, i) in capas"
      :key="i"
      :transform="`translate(${c.x} ${c.y})`"
      shape-rendering="geometricPrecision"
    >
      <g :class="c.anima ? `anima-${c.anima}` : ''" :style="c.estilo">
        <template v-for="(p, k) in c.piezas" :key="k">
          <path v-if="p.contorno !== false && !p.trazo" :d="p.d" class="borde" :class="{ huecos: p.huecos }" />
          <path
            :d="p.d"
            class="pieza"
            :class="[`c-${p.color}`, { trazo: p.trazo, huecos: p.huecos }]"
            :style="estiloPieza(p)"
          />
        </template>
      </g>
    </g>
  </g>
</template>

<style scoped>
/* vector: cada color es un token; la sombra es el mismo token mezclado con tinta */
.c-acento {
  --pz: var(--color-accent);
}
.c-acentoSombra {
  --pz: color-mix(in srgb, var(--color-accent) 68%, var(--color-van-tinta));
}
.c-sol {
  --pz: var(--color-sun);
}
.c-solSombra {
  --pz: color-mix(in srgb, var(--color-sun) 60%, var(--color-van-tinta));
}
.c-menta {
  --pz: var(--color-mint);
}
.c-mentaSombra {
  --pz: color-mix(in srgb, var(--color-mint) 62%, var(--color-van-tinta));
}
.c-servicio {
  --pz: var(--color-servicio);
}
.c-servicioSombra {
  --pz: color-mix(in srgb, var(--color-servicio) 62%, var(--color-van-tinta));
}
.c-blanco {
  --pz: var(--color-van);
}
.c-tinta {
  --pz: var(--color-text-primary);
}

.pieza {
  fill: var(--pz);
}

.huecos {
  fill-rule: evenodd;
}

.pieza.trazo {
  fill: none;
  stroke: var(--pz);
  stroke-width: var(--ancho-trazo, 0.6);
  stroke-linecap: round;
}

/* el contorno es la misma forma, más gruesa, debajo del relleno: solo se ve por fuera */
.borde {
  fill: var(--color-text-primary);
  stroke: var(--color-text-primary);
  stroke-width: calc(var(--grosor) * 2);
  stroke-linejoin: round;
}

/* movimientos */
.anima-titila-a,
.anima-titila-b {
  animation: titila var(--titileo) steps(1) infinite;
}
.anima-titila-b {
  animation-delay: calc(var(--titileo) / -2);
}

.anima-cae {
  transform-box: fill-box;
  transform-origin: 50% 50%;
  animation: cae calc(var(--ciclo-caida) * var(--vel)) linear infinite;
  animation-delay: calc(var(--ciclo-caida) * var(--vel) * var(--fase) * -1);
}

.anima-balanceo {
  transform-box: fill-box;
  transform-origin: 50% 0;
  animation: balanceo var(--ciclo-balanceo) ease-in-out infinite;
  animation-delay: calc(var(--ciclo-balanceo) * var(--fase) * -1);
}

.anima-cabeceo {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: balanceo var(--ciclo-balanceo) ease-in-out infinite;
}

.anima-pulso {
  animation: pulso var(--ciclo-pulso) ease-in-out infinite;
  animation-delay: calc(var(--ciclo-pulso) * var(--fase) * -1);
}

/* el gorro salta con la camioneta, un poco después, y cae aplastándose */
.anima-saltito {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: saltito var(--ciclo-rebote) ease-in-out infinite;
  animation-delay: 90ms;
}

/* el fuego artificial se abre, brilla y se apaga, una y otra vez */
.anima-estalla {
  transform-box: fill-box;
  transform-origin: 50% 50%;
  animation: estalla var(--ciclo-estallido) ease-out infinite;
  animation-delay: calc(var(--ciclo-estallido) * var(--fase) * -1);
}

/* una vuelta completa, sin parar (manecilla) */
.anima-gira {
  transform-box: fill-box;
  transform-origin: 50% 50%;
  animation: gira var(--ciclo-giro) linear infinite;
}

/* una sola vez, al aparecer */
.anima-rafaga {
  transform-box: fill-box;
  transform-origin: 50% 50%;
  animation: rafaga var(--ciclo-rafaga) cubic-bezier(0.1, 0.8, 0.3, 1) both;
  animation-delay: calc(var(--ciclo-rafaga) * var(--fase) * 0.2);
}

@keyframes titila {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.2;
  }
}

@keyframes cae {
  0% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 0;
  }
  10%,
  85% {
    opacity: 1;
  }
  100% {
    transform: translate(var(--deriva), var(--caida)) rotate(var(--giro));
    opacity: 0;
  }
}

@keyframes balanceo {
  0%,
  100% {
    transform: rotate(-5deg);
  }
  50% {
    transform: rotate(5deg);
  }
}

@keyframes pulso {
  0%,
  100% {
    opacity: 0.35;
  }
  50% {
    opacity: 1;
  }
}

@keyframes estalla {
  0% {
    transform: scale(0.15);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  100% {
    transform: scale(1.1);
    opacity: 0;
  }
}

@keyframes gira {
  to {
    transform: rotate(360deg);
  }
}

@keyframes saltito {
  0%,
  100% {
    transform: translateY(0) rotate(0deg) scale(1.06, 0.9);
  }
  32% {
    transform: translateY(-3.5px) rotate(-5deg) scale(0.96, 1.08);
  }
  58% {
    transform: translateY(-1px) rotate(3deg) scale(1, 1);
  }
}

@keyframes rafaga {
  0% {
    transform: translate(0, 0) rotate(0deg) scale(0);
    opacity: 1;
  }
  25% {
    transform: translate(calc(var(--sale-x) * 0.7), calc(var(--sale-y) * 0.7)) rotate(calc(var(--giro) * 0.3)) scale(1.4);
    opacity: 1;
  }
  100% {
    transform: translate(var(--sale-x), calc(var(--sale-y) + 10px)) rotate(var(--giro)) scale(0.6);
    opacity: 0;
  }
}

/* Con "reducir movimiento" todo queda quieto: la nieve y los pétalos se reparten por la escena y la ráfaga no sale */
@media (prefers-reduced-motion: reduce) {
  .anima-titila-a,
  .anima-titila-b,
  .anima-balanceo,
  .anima-cabeceo,
  .anima-pulso,
  .anima-saltito,
  .anima-gira {
    animation: none;
  }

  .anima-estalla {
    animation: none;
    opacity: 0.85;
  }

  .anima-cae {
    animation: none;
    transform: translateY(calc(var(--caida) * var(--fase)));
  }

  .anima-rafaga {
    animation: none;
    display: none;
  }
}
</style>
