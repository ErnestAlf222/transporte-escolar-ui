import {
  circulo,
  flor,
  guirnaldaPapel,
  hoja,
  linea,
  llama,
  lluvia,
  poligono,
  rafaga,
  rectRedondeado,
  type CapaVector,
  type Pieza,
} from '@/shared/utils/formasTemporada'

// Escena de Día de Muertos. Mismo estilo que escenaNavidad.ts: tres planos, contorno de tinta, volumen plano,
// elemento principal de casi la mitad de la camioneta (la calavera mide 25 de 50 columnas) y cada plano a su ritmo.

const RITMO_PETALOS = [0.55, 0.7, 0.62, 0.8, 0.58, 0.75, 0.66, 0.85]
const CAIDA = 34
const COLORES_PAPEL = ['acento', 'sol', 'menta', 'servicio'] as const
const BANDERIN = { ancho: 6, alto: 7.5, separacion: 7.5 }
const ORIGEN_RAFAGA = [25, -9] as const

// ---- fondo

const LUNA: Pieza[] = [
  { d: circulo(0, 0, 5.2), color: 'blanco' },
  { d: circulo(-1.6, -1.2, 1.2), color: 'servicio', contorno: false, opacidad: 0.3 },
  { d: circulo(1.8, 1.6, 0.9), color: 'servicio', contorno: false, opacidad: 0.3 },
]

// ---- cuerpo

// Calavera de azúcar de 25 columnas: cráneo blanco, ojos con flores de colores, nariz, dientes y adornos.
// Sale de (0, 0) = centro del borde de abajo.
const CALAVERA: Pieza[] = [
  { d: 'M-8 0V-4C-12.5 -7 -12.5 -18 0 -18.5C12.5 -18 12.5 -7 8 -4V0Z', color: 'blanco' },
  { d: 'M8 0V-4C12.5 -7 12.5 -16 7 -17.4C9 -12 9.5 -6 8 -4Z', color: 'servicioSombra', contorno: false, opacidad: 0.35 },
  ...flor(-4.6, -10, 3.7, 'acento', 'tinta'),
  ...flor(4.6, -10, 3.7, 'servicio', 'tinta'),
  { d: poligono([[0, -6.6], [-1.5, -3.8], [1.5, -3.8]]), color: 'tinta', contorno: false },
  { d: linea([[-6, -2.6], [6, -2.6]]), color: 'tinta', trazo: true, ancho: 0.5 },
  ...[-4, -2, 0, 2, 4].map((x) => ({ d: linea([[x, -2.6], [x, 0]]), color: 'tinta' as const, trazo: true, ancho: 0.45 })),
  ...flor(0, -15.4, 2.1, 'sol', 'acento'),
  { d: circulo(-7.8, -5.2, 1), color: 'menta' },
  { d: circulo(7.8, -5.2, 1), color: 'menta' },
]

// Flor de cempasúchil con hojas, sobre el techo
function cempasuchil(r: number): Pieza[] {
  return [
    { d: hoja(-r * 0.9, r * 0.5, r * 1.4, r * 0.35, 200), color: 'menta' },
    { d: hoja(r * 0.9, r * 0.5, r * 1.4, r * 0.35, -20), color: 'menta' },
    ...flor(0, 0, r),
  ]
}

// ---- frente

// Velas con llama que parpadea
function vela(alto: number): Pieza[] {
  return [
    { d: rectRedondeado(-1.7, -alto, 3.4, alto, 1), color: 'blanco' },
    { d: `M-1.7 ${-alto + 2}h3.4`, color: 'servicio', trazo: true, ancho: 0.6 },
  ]
}
const LLAMA: Pieza[] = [
  { d: llama(0, 0, 4.4, 1.5), color: 'sol' },
  { d: llama(0, -0.2, 2.2, 0.7), color: 'acento', contorno: false },
]

const PETALOS: Pieza[][] = [
  [{ d: hoja(0, 0, 3.2, 1.2, 40), color: 'sol' }],
  [{ d: hoja(0, 0, 3.2, 1.2, -40), color: 'acento' }],
  [{ d: hoja(0, 0, 2.6, 1, 10), color: 'sol' }],
]

export const CAPAS_MUERTOS: CapaVector[] = [
  // fondo
  { x: 6, y: -14, plano: 'fondo', piezas: LUNA },
  ...guirnaldaPapel(-4, -17, 54, -9, 2, COLORES_PAPEL, BANDERIN, 'fondo', 0),
  ...guirnaldaPapel(-4, -9, 54, -17, 2, COLORES_PAPEL, BANDERIN, 'fondo', 0.3),
  // cuerpo
  { x: 5, y: 1, piezas: cempasuchil(3.2) },
  { x: 45, y: 1, piezas: cempasuchil(3.2) },
  { x: 25, y: 1, anima: 'saltito', piezas: CALAVERA },
  // frente
  { x: -3, y: 24, plano: 'frente', piezas: cempasuchil(4.2) },
  { x: 53, y: 24, plano: 'frente', piezas: cempasuchil(4.2) },
  { x: 3, y: 23.6, plano: 'frente', piezas: vela(7) },
  { x: 3, y: 16.6, plano: 'frente', anima: 'titila-a', piezas: LLAMA },
  { x: 47, y: 23.6, plano: 'frente', piezas: vela(9) },
  { x: 47, y: 14.6, plano: 'frente', anima: 'titila-b', piezas: LLAMA },
  ...lluvia(PETALOS, RITMO_PETALOS, { x: -6, ancho: 62, y: -14, alto: 10 }, CAIDA, 5, 160, 'frente'),
  ...rafaga(ORIGEN_RAFAGA, ['sol', 'acento', 'menta', 'servicio'], 16),
]
