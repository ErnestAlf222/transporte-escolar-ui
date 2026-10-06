<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { CONO, RUEDA_A, RUEDA_B, VAN, pixeles } from '@/utils/spritesVan'

const props = withDefaults(defineProps<{ texto?: string; compacto?: boolean }>(), {
    texto: 'Doña Mary',
    compacto: false,
})

// Todo se mide en unidades de la escena: un pixel del dibujo son 3 unidades
const PIXEL = 3
const ANCHO_ESCENA = 330
const SUELO_Y = 90
const VAN_X = 24
const VAN_FILAS = 23
const VAN_Y = SUELO_Y - VAN_FILAS * PIXEL
const RUEDA_FILA = 14
const RUEDA_MITAD = 4 // la rueda mide 9 pixeles: 4 a cada lado del centro
const EJES = [11, 37] // columna del centro de cada rueda

// Recorrido de una vuelta. El suelo, las marcas y los conos avanzan a la misma velocidad, y el salto
// (ver @keyframes salto) supone que el cono toca a la camioneta al 51 % de la vuelta y sale al 92 %.
// Si cambia el tamaño de la camioneta o del cono hay que recalcular CICLO, y tiene que ser múltiplo del periodo de las marcas
const SALIDA = -62
const CICLO = 486
const ENTRADA = SALIDA + CICLO
const PERIODO_MARCAS = 27

const uid = `lvj${Math.random().toString(36).slice(2, 8)}`

const DEFINICIONES = [
    { id: 'van', prefijo: 'p', pixeles: pixeles(VAN) },
    { id: 'ra', prefijo: 'p', pixeles: pixeles(RUEDA_A) },
    { id: 'rb', prefijo: 'p', pixeles: pixeles(RUEDA_B) },
    { id: 'cono', prefijo: 'p', pixeles: pixeles(CONO) },
]

// Marcas del suelo, repetidas dos veces para que la vuelta sea continua
const DESFASES = [4, 13, 0, 19, 8]
const ANCHOS = [6, 3, 9, 3, 6]
const MARCAS = [0, CICLO].flatMap((base) =>
    Array.from({ length: CICLO / PERIODO_MARCAS }, (_, i) => ({
        x: base + i * PERIODO_MARCAS + DESFASES[i % DESFASES.length]!,
        y: i % 2 === 0 ? SUELO_Y + 6 : SUELO_Y + 12,
        ancho: ANCHOS[i % ANCHOS.length]!,
    })),
)

const estilo = {
    '--ciclo': `${CICLO}px`,
    '--entra': `${ENTRADA}px`,
    '--sale': `${SALIDA}px`,
}

// El nombre se escribe letra por letra, se queda un momento completo y se borra
const MS_ESCRIBIR = 140
const MS_BORRAR = 70
const MS_PAUSA_LLENO = 1000
const MS_PAUSA_VACIO = 300
const ANCHO_LETRA = 9.2 // 12 px de letra monoespaciada + 2 px de separación: sirve para centrar el texto

const letras = ref(0)
const escrito = computed(() => props.texto.toUpperCase().slice(0, letras.value))
const xTexto = computed(() => 340 - (props.texto.length * ANCHO_LETRA) / 2)
let escribiendo = true
let reloj: ReturnType<typeof setTimeout> | undefined

function paso() {
    let espera: number
    if (escribiendo) {
        letras.value++
        if (letras.value >= props.texto.length) {
            escribiendo = false
            espera = MS_PAUSA_LLENO
        } else {
            espera = MS_ESCRIBIR
        }
    } else {
        letras.value--
        if (letras.value <= 0) {
            escribiendo = true
            espera = MS_PAUSA_VACIO
        } else {
            espera = MS_BORRAR
        }
    }
    reloj = setTimeout(paso, espera)
}

onMounted(() => {
    // Con "reducir movimiento" el nombre se ve completo y quieto
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        letras.value = props.texto.length
        return
    }
    reloj = setTimeout(paso, MS_ESCRIBIR)
})

onUnmounted(() => clearTimeout(reloj))
</script>

<template>
    <div role="status" class="mx-auto w-full" :class="compacto ? 'max-w-xl' : 'max-w-2xl'" :aria-label="texto">
        <svg class="escena" viewBox="0 0 680 262" shape-rendering="crispEdges" aria-hidden="true" :style="estilo">
            <defs>
                <g v-for="d in DEFINICIONES" :id="`${uid}-${d.id}`" :key="d.id">
                    <rect v-for="(p, i) in d.pixeles" :key="i" :x="p.x" :y="p.y" :width="p.ancho" height="1"
                        :class="`${d.prefijo}-${p.color}`" />
                </g>
                <g :id="`${uid}-rueda`">
                    <g class="rueda-a">
                        <use :href="`#${uid}-ra`" />
                    </g>
                    <g class="rueda-b">
                        <use :href="`#${uid}-rb`" />
                    </g>
                </g>
            </defs>

            <text :x="xTexto" y="30" class="hud hud-texto">{{ escrito }}<tspan class="cursor">_</tspan></text>

            <g transform="translate(10 40) scale(2)">
                <rect :y="SUELO_Y" :width="ANCHO_ESCENA + 10" height="3" class="marca" />
                <g class="marcas">
                    <rect v-for="(m, i) in MARCAS" :key="i" :x="m.x" :y="m.y" :width="m.ancho" height="3"
                        class="marca" />
                </g>

                <g class="obstaculo">
                    <g :transform="`translate(0 ${SUELO_Y - 9 * PIXEL})`">
                        <use :href="`#${uid}-cono`" :transform="`scale(${PIXEL})`" />
                        <use :href="`#${uid}-cono`" :transform="`translate(27 0) scale(${PIXEL})`" />
                    </g>
                </g>

                <g class="salto">
                    <g class="rebote">
                        <rect v-for="i in 3" :key="i" :x="VAN_X - 6" :y="VAN_Y + 15 * PIXEL" width="6" height="6"
                            class="p-K humo" :style="{ animationDelay: `-${((i - 1) * 0.2).toFixed(1)}s` }" />
                        <use :href="`#${uid}-van`" :transform="`translate(${VAN_X} ${VAN_Y}) scale(${PIXEL})`" />
                        <use v-for="eje in EJES" :key="eje" :href="`#${uid}-rueda`"
                            :transform="`translate(${VAN_X + (eje - RUEDA_MITAD) * PIXEL} ${VAN_Y + RUEDA_FILA * PIXEL}) scale(${PIXEL})`" />
                    </g>
                </g>
            </g>
        </svg>
    </div>
</template>

<style scoped>
.escena {
    display: block;
    width: 100%;
    height: auto;
}

.hud {
    font-family: ui-monospace, Menlo, Consolas, monospace;
    font-size: 12px;
    letter-spacing: 2px;
}

.hud-texto {
    fill: var(--color-text-secondary);
}

.cursor {
    animation: cursor 0.8s steps(1) infinite;
}

.marca {
    fill: var(--color-text-muted);
}

.p-W {
    fill: var(--color-text-primary);
}

.p-L {
    fill: color-mix(in srgb, var(--color-text-primary) 70%, var(--color-bg));
}

.p-G {
    fill: color-mix(in srgb, var(--color-text-secondary) 25%, var(--color-bg));
}

.p-H {
    fill: var(--color-text-muted);
}

.p-A {
    fill: var(--color-accent);
}

.p-Y,
.p-E {
    fill: var(--color-sun);
}

.p-D,
.p-T {
    fill: var(--color-danger);
}

.p-K {
    fill: var(--color-text-muted);
}

.p-O {
    fill: var(--color-bg);
}


/* Todas las animaciones comparten la misma duración (2.6 s) y el mismo recorrido (--ciclo):
   el suelo, las marcas y el cono avanzan a la misma velocidad y el salto cae justo sobre el cono */
.salto {
    animation: salto 2.6s linear infinite;
}

.rebote {
    animation: rebote 0.3s steps(1) infinite;
}

.obstaculo {
    animation: pasa 2.6s linear infinite;
}

.marcas {
    animation: avanza 2.6s linear infinite;
}

.rueda-a {
    animation: rueda-a 0.3s steps(1) infinite;
}

.rueda-b {
    animation: rueda-b 0.3s steps(1) infinite;
}

.humo {
    animation: humo 0.6s linear infinite;
    opacity: 0;
}

@keyframes salto {

    0%,
    46% {
        transform: translateY(0);
        animation-timing-function: cubic-bezier(0.25, 0.8, 0.4, 1);
    }

    70% {
        transform: translateY(-36px);
        animation-timing-function: cubic-bezier(0.6, 0, 0.75, 0.3);
    }

    93%,
    100% {
        transform: translateY(0);
    }
}

@keyframes rebote {
    0% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-1.5px);
    }
}

@keyframes pasa {
    from {
        transform: translateX(var(--entra));
    }

    to {
        transform: translateX(var(--sale));
    }
}

@keyframes avanza {
    from {
        transform: translateX(0);
    }

    to {
        transform: translateX(calc(var(--ciclo) * -1));
    }
}

@keyframes rueda-a {
    0% {
        opacity: 1;
    }

    50% {
        opacity: 0;
    }
}

@keyframes rueda-b {
    0% {
        opacity: 0;
    }

    50% {
        opacity: 1;
    }
}

@keyframes cursor {
    0% {
        opacity: 1;
    }

    50% {
        opacity: 0;
    }
}

@keyframes humo {
    0% {
        transform: translate(0, 0);
        opacity: 0.8;
    }

    100% {
        transform: translate(-26px, -6px);
        opacity: 0;
    }
}

@media (prefers-reduced-motion: reduce) {
    .escena * {
        animation: none !important;
    }

    .rueda-b {
        opacity: 0;
    }
}
</style>