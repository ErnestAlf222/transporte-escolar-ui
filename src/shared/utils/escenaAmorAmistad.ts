import {
  corazon,
  destellosDeFondo,
  linea,
  lluvia,
  pastilla,
  poligono,
  rafaga,
  globo,
  type CapaVector,
  type Pieza,
} from '@/shared/utils/formasTemporada'

// Escena de Amor y Amistad. Mismo estilo que escenaReyes.ts: tres planos, contorno de tinta, volumen plano,
// elemento principal de casi la mitad de la camioneta (el corazón mide 24 de 50 columnas) y cada plano a su ritmo.

const RITMO_FLOTAN = [1.4, 1.7, 1.55, 1.85, 1.6, 1.75] // corazones lejanos: suben lento
const RITMO_CARTAS = [0.55, 0.7, 0.62, 0.8, 0.58, 0.75, 0.66, 0.85]
const CAIDA = 34
const SUBIDA = -30
const ORIGEN_RAFAGA = [27, -8] as const

// ---- fondo

const CORAZONES_LEJANOS: Pieza[][] = [
  [{ d: corazon(0, 0, 2), color: 'acentoSombra' }],
  [{ d: corazon(0, 0, 2.6), color: 'servicio' }],
  [{ d: corazon(0, 0, 1.8), color: 'sol' }],
]

// ---- cuerpo

// Flecha de (x0, y0) a (x1, y1): astil, punta y plumas
function flecha(x0: number, y0: number, x1: number, y1: number): Pieza[] {
  const largo = Math.hypot(x1 - x0, y1 - y0)
  const [ux, uy] = [(x1 - x0) / largo, (y1 - y0) / largo]
  const [vx, vy] = [-uy, ux]
  const punto = (x: number, y: number, a: number, b: number) => [x + ux * a + vx * b, y + uy * a + vy * b] as const
  return [
    { d: linea([[x0, y0], [x1, y1]]), color: 'solSombra', trazo: true, ancho: 1.2 },
    { d: poligono([punto(x1, y1, 3.4, 0), punto(x1, y1, 0, 1.9), punto(x1, y1, 0, -1.9)]), color: 'sol' },
    { d: poligono([punto(x0, y0, 0, 0), punto(x0, y0, -2.6, 1.9), punto(x0, y0, 0.8, 1.9)]), color: 'menta' },
    { d: poligono([punto(x0, y0, 1.8, 0), punto(x0, y0, -0.8, -1.9), punto(x0, y0, 2.6, -1.9)]), color: 'menta' },
  ]
}

// Corazón de 24 columnas atravesado por una flecha; sale de (0, 0) = el centro del borde de abajo
const CORAZON_GRANDE: Pieza[] = [
  { d: corazon(0, -8, 10), color: 'acento' },
  { d: 'M4 -2.5C9 -5.5 10.5 -11.5 7.4 -14.8C11.2 -13.6 12.2 -7.6 6 -0.5Z', color: 'acentoSombra', contorno: false },
  { d: 'M-8 -12C-9 -15 -6.5 -17 -4.5 -16.5C-6.5 -16 -7.5 -14.5 -7.5 -12Z', color: 'blanco', contorno: false, opacidad: 0.85 },
  ...flecha(-13, -1, 13, -14.5),
]

// Racimo de tres globos de corazón atados a la esquina de atrás; sale de (0, 0) = donde se atan
const RACIMO: Pieza[] = [
  { d: 'M0 0Q-3 -5 -4 -9', color: 'tinta', trazo: true, ancho: 0.4 },
  { d: 'M0 0Q2 -8 6 -13', color: 'tinta', trazo: true, ancho: 0.4 },
  { d: 'M0 0Q-1 -10 1 -17', color: 'tinta', trazo: true, ancho: 0.4 },
  ...globo(-4, -11.5, 3.6, 3.6, 'acento', 'corazon'),
  ...globo(6, -15.5, 3.8, 3.8, 'servicio', 'corazon'),
  ...globo(1, -19.5, 3.3, 3.3, 'sol', 'corazon'),
]

// ---- frente

// Montones de corazones en las esquinas, delante de las defensas
const MONTONES: Pieza[] = [
  { d: corazon(-4, 21, 4.6), color: 'acento' },
  { d: corazon(2, 22, 3.6), color: 'servicio' },
  { d: corazon(-8.5, 22.4, 3), color: 'sol' },
  { d: corazon(52, 21.2, 4.6), color: 'servicio' },
  { d: corazon(46.5, 22.2, 3.6), color: 'acento' },
  { d: corazon(57, 22.4, 3), color: 'sol' },
]

// Cartitas que caen: sobre con solapa y un corazoncito
const CARTA: Pieza[] = [
  { d: pastilla(-2.6, -1.8, 5.2, 3.6), color: 'blanco' },
  { d: poligono([[-2.6, -1.8], [2.6, -1.8], [0, 0.6]]), color: 'acento', contorno: false },
  { d: corazon(0, 0.7, 0.8), color: 'acento', contorno: false },
]
const CARTAS: Pieza[][] = [CARTA, [{ d: corazon(0, 0, 2.2), color: 'acento' }], [{ d: corazon(0, 0, 1.8), color: 'servicio' }]]

export const CAPAS_AMOR_AMISTAD: CapaVector[] = [
  // fondo
  ...destellosDeFondo([[8, -17, 2.6, 0.1], [44, -19, 2.4, 0.5], [30, -22, 1.8, 0.8]]),
  ...lluvia(CORAZONES_LEJANOS, RITMO_FLOTAN, { x: -6, ancho: 62, y: 4, alto: 14 }, SUBIDA, 3, 30, 'fondo'),
  // cuerpo
  { x: 4, y: 1, anima: 'cabeceo', piezas: RACIMO },
  { x: 27, y: 1, anima: 'saltito', piezas: CORAZON_GRANDE },
  // frente
  { x: 0, y: 0, plano: 'frente', piezas: MONTONES },
  ...lluvia(CARTAS, RITMO_CARTAS, { x: -6, ancho: 62, y: -14, alto: 10 }, CAIDA, 5, 120, 'frente'),
  ...rafaga(ORIGEN_RAFAGA, ['acento', 'sol', 'servicio', 'acentoSombra'], 18),
]
