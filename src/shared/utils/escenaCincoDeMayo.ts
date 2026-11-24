import {
  circulo,
  destello,
  estandarte,
  estrella,
  fuegoArtificial,
  lluvia,
  pastilla,
  rafaga,
  rectRedondeado,
  type CapaVector,
  type Pieza,
} from '@/shared/utils/formasTemporada'

// Escena de 5 de Mayo: fuerte sobre un cerro, estandartes, fuegos artificiales y confeti (sin banderas
// tricolor). Mismo estilo que escenaReyes.ts: tres planos, contorno de tinta, volumen plano, elemento principal
// de más de la mitad de la camioneta (los tres estandartes abarcan 34 de 50 columnas) y cada plano a su ritmo.

const RITMO_CONFETI = [0.5, 0.65, 0.58, 0.75, 0.55, 0.7, 0.62, 0.8]
const CAIDA = 34
const ORIGEN_RAFAGA = [25, -12] as const

// ---- fondo

// Cerro con un fuerte de tres torres encima (la silueta del fuerte de Loreto y Guadalupe). El cerro no lleva
// contorno propio: solo se marca la cima con un trazo, así no queda un borde blanco a la altura del piso.
const SUELO = 23.4
const CIMA_CERRO = -1
const CURVA_CERRO = `M-14 ${SUELO}C-10 8 -2 ${CIMA_CERRO} 10 ${CIMA_CERRO}C22 ${CIMA_CERRO} 30 9 36 ${SUELO}`
const CERRO: Pieza[] = [
  { d: `${CURVA_CERRO}Z`, color: 'mentaSombra', contorno: false },
  { d: `M10 ${CIMA_CERRO}C22 ${CIMA_CERRO} 30 9 36 ${SUELO}L22 ${SUELO}C22 12 18 2 10 ${CIMA_CERRO}Z`, color: 'menta', contorno: false, opacidad: 0.4 },
  { d: `M-9 14C-5 3 1 ${CIMA_CERRO} 10 ${CIMA_CERRO}C19 ${CIMA_CERRO} 27 5 31 14`, color: 'tinta', trazo: true, ancho: 1.8 },
]

// El fuerte mide 35 columnas de ancho (70 % de la camioneta): se dibuja en un molde chico y se agranda
const ESCALA_X = 1.6
const ESCALA_Y = 1.25
function fuerte(): Pieza[] {
  const sx = (x: number) => Math.round(x * ESCALA_X * 100) / 100
  const sy = (y: number) => Math.round(y * ESCALA_Y * 100) / 100
  const caja = (x: number, y: number, ancho: number, alto: number, r: number) => rectRedondeado(sx(x), sy(y), sx(ancho), sy(alto), r)
  const almena = (x: number, y: number) => ({ d: caja(x, y, 1.6, 1.8, 0.4), color: 'solSombra' as const, contorno: false })
  return [
    { d: caja(-9, -9, 18, 7, 0.8), color: 'sol' },
    { d: caja(-11, -13, 5, 11, 0.8), color: 'sol' },
    { d: caja(6, -13, 5, 11, 0.8), color: 'sol' },
    ...[-11, -8.7, -6.4].map((x) => almena(x + 0.3, -14.6)),
    ...[6, 8.3, 10.6].map((x) => almena(x - 0.3, -14.6)),
    { d: `M${sx(-2)} ${sy(-2)}V${sy(-5.5)}A${sx(2)} ${sy(2)} 0 0 1 ${sx(2)} ${sy(-5.5)}V${sy(-2)}Z`, color: 'solSombra' },
    { d: `M0 ${sy(-13)}V${sy(-19)}`, color: 'tinta', trazo: true, ancho: 0.7 },
    { d: `M${sx(-8.5)} ${sy(-13)}V${sy(-17)}`, color: 'tinta', trazo: true, ancho: 0.7 },
    { d: `M0.6 ${sy(-19)}h6l-1.4 2 1.4 2h-6Z`, color: 'acento' },
    { d: `M${sx(-8.5) + 0.6} ${sy(-17)}h5l-1.1 1.6 1.1 1.6h-5Z`, color: 'servicio' },
  ]
}

// ---- cuerpo

// Tres estandartes en astas de distinta altura; el del centro, el más alto, salta
const ASTA_CHICA = 17
const ASTA_GRANDE = 20

// ---- frente

// Sacos de arena apilados en las esquinas, delante de las defensas
function sacos(x: number, lado: 1 | -1): Pieza[] {
  const saco = (cx: number, cy: number, color: 'sol' | 'solSombra'): Pieza => ({ d: pastilla(cx - 3.2, cy - 1.4, 6.4, 2.8), color })
  return [
    saco(x, 22.6, 'solSombra'),
    saco(x + lado * 6, 22.6, 'sol'),
    saco(x + lado * 3, 19.9, 'sol'),
    { d: circulo(x + lado * 3, 19.9, 0.5), color: 'solSombra', contorno: false },
  ]
}

const CONFETI: Pieza[][] = [
  [{ d: destello(0, 0, 3.2), color: 'sol' }],
  [{ d: estrella(0, 0, 2.6, 1.1), color: 'acento' }],
  [{ d: pastilla(-2, -0.7, 4, 1.4), color: 'menta' }],
  [{ d: pastilla(-2, -0.7, 4, 1.4), color: 'servicio' }],
]

export const CAPAS_CINCO_DE_MAYO: CapaVector[] = [
  // fondo
  { x: 0, y: 0, plano: 'fondo', piezas: CERRO },
  { x: 10, y: CIMA_CERRO, plano: 'fondo', piezas: fuerte() },
  fuegoArtificial(46, -14, 8, 'acento', 0.05),
  fuegoArtificial(31, -21, 7.5, 'sol', 0.4),
  fuegoArtificial(52, -3, 5.5, 'menta', 0.7),
  // cuerpo
  { x: 8, y: -ASTA_CHICA + 1, anima: 'balanceo', fase: 0.1, piezas: estandarte(ASTA_CHICA, 'acento') },
  { x: 25, y: -ASTA_GRANDE + 1, anima: 'saltito', piezas: estandarte(ASTA_GRANDE, 'sol') },
  { x: 42, y: -ASTA_CHICA + 1, anima: 'balanceo', fase: 0.6, piezas: estandarte(ASTA_CHICA, 'servicio') },
  // frente
  { x: 0, y: 0, plano: 'frente', piezas: [...sacos(-5, 1), ...sacos(52, -1)] },
  ...lluvia(CONFETI, RITMO_CONFETI, { x: -6, ancho: 62, y: -14, alto: 10 }, CAIDA, 5, 200, 'frente'),
  ...rafaga(ORIGEN_RAFAGA, ['sol', 'acento', 'menta', 'servicio'], 20),
]
