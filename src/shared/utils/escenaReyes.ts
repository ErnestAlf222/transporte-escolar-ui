import {
  circulo,
  destello,
  destellosDeFondo,
  estrella,
  linea,
  lluvia,
  poligono,
  pastilla,
  rafaga,
  rectRedondeado,
  type CapaVector,
  type Pieza,
} from '@/shared/utils/formasTemporada'

// Escena de Día de Reyes. Mismo estilo que escenaNavidad.ts: tres planos, contorno de tinta, volumen plano,
// elemento principal de más de la mitad de la camioneta (la corona mide 29 de 50 columnas), cada plano a su ritmo.

const RITMO_LLUVIA = [0.55, 0.7, 0.62, 0.8, 0.58, 0.75, 0.66, 0.85]
const CAIDA = 34
const COLORES_CONFETI = ['sol', 'acento', 'menta', 'servicio'] as const
const ORIGEN_RAFAGA = [30, -6] as const

// ---- fondo

// Dunas detrás de la camioneta: la luz da a la izquierda y la sombra a la derecha
const DUNAS: Pieza[] = [
  { d: 'M-12 24C-10 14 2 12 12 24Z', color: 'sol' },
  { d: 'M2 15.2C7 16 10 19 12 24L5 24C5 20 4 17 2 15.2Z', color: 'solSombra', contorno: false },
  { d: 'M42 24C44 16 54 14 64 24Z', color: 'sol' },
  { d: 'M54 15.5C58 17 61 20 64 24L56 24C56 20 55 17 54 15.5Z', color: 'solSombra', contorno: false },
]

// Estrella guía: grande, con cola de cometa; los rayos laten
const ESTRELLA_X = 46
const ESTRELLA_Y = -13
const COLA: Pieza[] = [
  { d: 'M41 -11Q28 -16 12 -12', color: 'sol', trazo: true, ancho: 1.6, opacidad: 0.8 },
  { d: circulo(32, -14.3, 1.1), color: 'sol', contorno: false },
  { d: circulo(23, -14.4, 0.8), color: 'sol', contorno: false },
  { d: circulo(15, -12.6, 0.6), color: 'sol', contorno: false },
]
const ESTRELLA_GUIA: Pieza[] = [
  { d: estrella(0, 0, 7, 3.1), color: 'sol' },
  { d: poligono([[0, -7], [2.2, -2.2], [0, 0], [-1, -3.2]]), color: 'blanco', contorno: false, opacidad: 0.7 },
  { d: circulo(0, 0.4, 1.2), color: 'acento', contorno: false },
]
const RAYOS: Pieza[] = Array.from({ length: 8 }, (_, k) => {
  const a = (k * Math.PI) / 4
  return { d: linea([[Math.cos(a) * 9, Math.sin(a) * 9], [Math.cos(a) * 12.5, Math.sin(a) * 12.5]]), color: 'sol' as const, trazo: true, ancho: 1.2 }
})

// ---- cuerpo

// Corona de 29 columnas con cinco picos, bolas en las puntas y tres joyas; sale de (0, 0) = centro del borde de abajo
const PICOS = [-13, -6.5, 0, 6.5, 13]
const ALTO_PICO = [10, 8, 13, 8, 10]
const CORONA: Pieza[] = [
  {
    d: poligono([
      [-14.5, 0],
      [14.5, 0],
      [13, -10],
      [9.75, -4.5],
      [6.5, -8],
      [3.25, -4.5],
      [0, -13],
      [-3.25, -4.5],
      [-6.5, -8],
      [-9.75, -4.5],
      [-13, -10],
    ]),
    color: 'sol',
  },
  { d: 'M9.75 -4.5L13 -10L14.5 0L8 0Z', color: 'solSombra', contorno: false },
  { d: 'M-11.5 -5.5Q-12.3 -8 -12.6 -9.5Q-10.8 -7.6 -9.7 -5.5Z', color: 'blanco', contorno: false, opacidad: 0.85 },
  { d: pastilla(-15, -3.2, 30, 5.2), color: 'solSombra' },
  ...PICOS.map((x, i) => ({ d: circulo(x, -ALTO_PICO[i]! - 0.6, 1.5), color: i === 2 ? ('acento' as const) : ('blanco' as const) })),
  { d: circulo(-8, -0.6, 1.6), color: 'acento' },
  { d: circulo(0, -0.6, 1.8), color: 'servicio' },
  { d: circulo(8, -0.6, 1.6), color: 'menta' },
]

// Regalo de esquinas redondas con listón en cruz y moño; sale de (0, 0) = centro del borde de abajo
function regalo(ancho: number, alto: number, color: 'acento' | 'menta' | 'servicio'): Pieza[] {
  return [
    { d: rectRedondeado(-ancho / 2, -alto, ancho, alto, 1.2), color },
    { d: `M-1 ${-alto}h2v${alto}h-2Z`, color: 'sol', contorno: false },
    { d: `M${-ancho / 2} ${-alto / 2 - 1}h${ancho}v2h${-ancho}Z`, color: 'sol', contorno: false },
    { d: circulo(-1.9, -alto - 1.2, 1.7), color: 'sol' },
    { d: circulo(1.9, -alto - 1.2, 1.7), color: 'sol' },
    { d: circulo(0, -alto - 0.4, 1), color: 'solSombra' },
  ]
}

// ---- frente

// Montones de arena en las esquinas, delante de las defensas
const MONTONES: Pieza[] = [
  { d: 'M-10 24L-10 21C-8 17.5 -3 17 0 19.5C2 17.5 6 18 7 24Z', color: 'sol' },
  { d: 'M43 24C43 20 47 17.5 51 19C54 17 58 19 59 24Z', color: 'sol' },
  { d: 'M-3.5 18.4C-1.5 18 0.5 19 1 20.2C-1 20.6 -3 20 -3.5 18.4Z', color: 'solSombra', contorno: false },
]

const BRILLOS: Pieza[][] = [
  [{ d: destello(0, 0, 3.4), color: 'sol' }],
  [{ d: circulo(0, 0, 1.8), color: 'sol' }, { d: circulo(0, 0, 0.8), color: 'solSombra', contorno: false }],
  [{ d: estrella(0, 0, 2.8, 1.2), color: 'sol' }],
]

export const CAPAS_REYES: CapaVector[] = [
  // fondo
  { x: 0, y: 0, plano: 'fondo', piezas: DUNAS },
  ...destellosDeFondo([[8, -16, 2.6, 0.1], [30, -19, 2.2, 0.5], [4, -6, 1.8, 0.8]]),
  { x: 0, y: 0, plano: 'fondo', anima: 'pulso', fase: 0.3, piezas: COLA },
  { x: ESTRELLA_X, y: ESTRELLA_Y, plano: 'fondo', piezas: ESTRELLA_GUIA },
  { x: ESTRELLA_X, y: ESTRELLA_Y, plano: 'fondo', anima: 'pulso', piezas: RAYOS },
  // cuerpo
  { x: 9, y: 1, piezas: regalo(10, 8, 'acento') },
  { x: 2, y: 1, piezas: regalo(6, 5, 'menta') },
  { x: 30, y: 1, anima: 'saltito', piezas: CORONA },
  // frente
  { x: 0, y: 0, plano: 'frente', piezas: MONTONES },
  ...lluvia(BRILLOS, RITMO_LLUVIA, { x: -6, ancho: 62, y: -14, alto: 10 }, CAIDA, 5, 120, 'frente'),
  ...rafaga(ORIGEN_RAFAGA, COLORES_CONFETI, 16),
]
