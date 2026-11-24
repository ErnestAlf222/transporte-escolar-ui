import {
  circulo,
  destello,
  destellosDeFondo,
  estrella,
  hoja,
  libro,
  linea,
  lapiz,
  lluvia,
  pastilla,
  rafaga,
  rectRedondeado,
  type CapaVector,
  type Pieza,
} from '@/shared/utils/formasTemporada'

// Escena de Día del Maestro: manzana, pizarrón, lápices y libros. Mismo estilo que escenaReyes.ts: tres planos,
// contorno de tinta, volumen plano, elemento principal de casi la mitad de la camioneta (la manzana mide 23 de
// 50 columnas) y cada plano a su ritmo.

const RITMO_ESTRELLAS = [0.55, 0.7, 0.62, 0.8, 0.58, 0.75, 0.66, 0.85]
const CAIDA = 34
const ORIGEN_RAFAGA = [18, -9] as const

// ---- fondo

// Pizarrón con marco de madera, garabatos de gis y charola; los garabatos son figuras simples, sin letras
const PIZARRON: Pieza[] = [
  { d: linea([[3.5, 13], [3.5, 21]]), color: 'solSombra', trazo: true, ancho: 1.4 },
  { d: linea([[21.5, 13], [21.5, 21]]), color: 'solSombra', trazo: true, ancho: 1.4 },
  { d: rectRedondeado(0, 0, 25, 14, 1.4), color: 'solSombra' },
  { d: rectRedondeado(1.6, 1.6, 21.8, 10.8, 0.8), color: 'mentaSombra', contorno: false },
  { d: 'M4 8Q6 4 8 8T12 8', color: 'blanco', trazo: true, ancho: 0.7 },
  { d: circulo(17, 5, 2), color: 'sol', trazo: true, ancho: 0.7 },
  { d: linea([[17, 1.6], [17, 2.4]]), color: 'sol', trazo: true, ancho: 0.6 },
  { d: linea([[14.4, 9], [20.6, 9]]), color: 'blanco', trazo: true, ancho: 0.7 },
  { d: linea([[17.5, 7.2], [17.5, 10.8]]), color: 'blanco', trazo: true, ancho: 0.7 },
  { d: pastilla(3, 12.6, 19, 1.6), color: 'sol' },
]

// ---- cuerpo

// Manzana de 23 columnas: dos lóbulos, tallo y hoja; sale de (0, 0) = el centro del borde de abajo
const MANZANA: Pieza[] = [
  { d: `${circulo(-3.6, -9, 7.9)}${circulo(3.6, -9, 7.9)}`, color: 'acento' },
  { d: 'M7.6 -3.2C11 -6 11.2 -11 8.6 -14.2C13 -12 12.6 -5.6 6.4 -1.6Z', color: 'acentoSombra', contorno: false },
  { d: 'M-9 -11C-9.6 -14.4 -7.4 -16.6 -4.4 -16C-6.8 -15.4 -8 -13.6 -8.2 -11Z', color: 'blanco', contorno: false, opacidad: 0.85 },
  { d: 'M0 -16L1 -20', color: 'solSombra', trazo: true, ancho: 1.5 },
  { d: hoja(4.6, -18.6, 6, 2, -20), color: 'menta' },
]

// Lápices de colores parados en un grupo, a la izquierda
const LAPICES: Pieza[] = [
  ...lapiz(0, 1, 12, 'acento'),
  ...lapiz(3.2, 1, 15, 'sol'),
  ...lapiz(6.4, 1, 10, 'servicio'),
]

// Pila de tres libros, a la derecha
const LIBROS: Pieza[] = [...libro(0, 1, 15, 'servicio'), ...libro(0.8, -2.6, 12, 'acento'), ...libro(-0.4, -6.2, 13, 'menta')]

// ---- frente

// Montones de manzanitas en las esquinas, delante de las defensas
const MONTONES: Pieza[] = [
  [-6, 20.4, 3.6], [-1, 21.6, 3.2], [-9.5, 22.6, 2.4], [50, 21, 3.6], [55, 21.8, 3.2], [46, 22.8, 2.4],
].flatMap(([x, y, r]) => [
  { d: `${circulo(x! - r! * 0.42, y!, r! * 0.62)}${circulo(x! + r! * 0.42, y!, r! * 0.62)}`, color: 'acento' as const },
  { d: hoja(x! + r! * 0.5, y! - r! * 0.8, r! * 0.9, 0.5, -30), color: 'menta' as const },
])

const CAIDOS: Pieza[][] = [
  [{ d: estrella(0, 0, 2.8, 1.2), color: 'sol' }],
  [{ d: destello(0, 0, 3.2), color: 'acento' }],
  [{ d: pastilla(-2.4, -0.6, 4.8, 1.2), color: 'servicio' }],
]

export const CAPAS_DIA_DEL_MAESTRO: CapaVector[] = [
  // fondo
  { x: 28, y: -20, plano: 'fondo', piezas: PIZARRON },
  ...destellosDeFondo([[5, -17, 2.6, 0.1], [20, -23, 2.2, 0.5], [50, -3, 1.8, 0.8]]),
  // cuerpo
  { x: 4, y: 1, anima: 'cabeceo', piezas: LAPICES },
  { x: 18, y: 1, anima: 'saltito', piezas: MANZANA },
  { x: 42, y: 1, piezas: LIBROS },
  // frente
  { x: 0, y: 0, plano: 'frente', piezas: MONTONES },
  ...lluvia(CAIDOS, RITMO_ESTRELLAS, { x: -6, ancho: 62, y: -14, alto: 10 }, CAIDA, 5, 160, 'frente'),
  ...rafaga(ORIGEN_RAFAGA, ['acento', 'sol', 'menta', 'servicio'], 18),
]
