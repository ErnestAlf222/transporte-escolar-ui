import {
  circulo,
  corazon,
  destellosDeFondo,
  elipse,
  flor,
  hoja,
  linea,
  lluvia,
  poligono,
  rafaga,
  rosa,
  type CapaVector,
  type Pieza,
} from '@/shared/utils/formasTemporada'

// Escena de Día de las Madres. Mismo estilo que escenaReyes.ts: tres planos, contorno de tinta, volumen plano,
// elemento principal de casi la mitad de la camioneta (el ramo mide 24 de 50 columnas) y cada plano a su ritmo.

const RITMO_FLOTAN = [1.4, 1.7, 1.55, 1.85, 1.6, 1.75]
const RITMO_PETALOS = [0.55, 0.7, 0.62, 0.8, 0.58, 0.75, 0.66, 0.85]
const CAIDA = 34
const SUBIDA = -30
const ORIGEN_RAFAGA = [25, -10] as const

// ---- fondo

const CORAZONES_LEJANOS: Pieza[][] = [
  [{ d: corazon(0, 0, 2), color: 'acentoSombra' }],
  [{ d: corazon(0, 0, 2.6), color: 'servicio' }],
  [{ d: corazon(0, 0, 1.8), color: 'sol' }],
]

// Mariposa de alas grandes y chicas, con cuerpo y antenas; sale de (0, 0) = su centro
const MARIPOSA: Pieza[] = [
  { d: elipse(-2.6, -1.8, 2.7, 2.1), color: 'servicio' },
  { d: elipse(2.6, -1.8, 2.7, 2.1), color: 'servicio' },
  { d: elipse(-1.9, 1.4, 1.9, 1.5), color: 'sol' },
  { d: elipse(1.9, 1.4, 1.9, 1.5), color: 'sol' },
  { d: elipse(0, 0, 0.55, 2.4), color: 'tinta' },
  { d: linea([[0, -2], [-1.2, -4]]), color: 'tinta', trazo: true, ancho: 0.3 },
  { d: linea([[0, -2], [1.2, -4]]), color: 'tinta', trazo: true, ancho: 0.3 },
]

// ---- cuerpo

// Ramo de 25 columnas: las flores desbordan por arriba de un papel de envoltura abierto en V, atado con un moño;
// sale de (0, 0) = la punta del papel
const RAMO: Pieza[] = [
  ...[[-6, -14, -8], [6, -14, 8], [0, -14, 0]].map(([x, y, dx]) => ({ d: linea([[x!, y!], [dx! * 0.2, -4]]), color: 'mentaSombra' as const, trazo: true, ancho: 1.2 })),
  { d: hoja(-12, -12, 7, 1.8, -135), color: 'menta' },
  { d: hoja(12, -12, 7, 1.8, -45), color: 'menta' },
  ...flor(-8.5, -11.5, 4.4, 'servicio', 'sol'),
  ...flor(8.5, -11.5, 4.4, 'sol', 'acento'),
  ...rosa(0, -14.5, 5),
  { d: poligono([[-12.5, -10], [12.5, -10], [2, 0], [-2, 0]]), color: 'servicio' },
  { d: poligono([[-12.5, -10], [1, -10], [-2, 0]]), color: 'blanco' },
  { d: elipse(-2.9, -4.8, 3, 2), color: 'sol' },
  { d: elipse(2.9, -4.8, 3, 2), color: 'sol' },
  { d: circulo(0, -4.8, 1.3), color: 'solSombra' },
  { d: poligono([[-0.8, -3.8], [-3.8, 0.8], [-1.8, 0.6]]), color: 'sol', contorno: false },
  { d: poligono([[0.8, -3.8], [3.8, 0.8], [1.8, 0.6]]), color: 'sol', contorno: false },
]

const CORAZON: Pieza[] = [
  { d: corazon(0, -5.5, 5.6), color: 'acento' },
  { d: 'M2 -1.5C4.8 -3.2 5.6 -6.6 3.8 -8.6C6.2 -7.8 6.8 -4.2 3.4 -0.2Z', color: 'acentoSombra', contorno: false },
  { d: circulo(-3.2, -8.2, 0.8), color: 'blanco', contorno: false },
]

// ---- frente

// Canteros de flores en las esquinas, delante de las defensas
const CANTEROS: Pieza[] = [
  { d: 'M-10 24L-10 21C-8.5 18 -4 17.5 -1 19.5C1 17.5 6 18 7 24Z', color: 'menta' },
  { d: 'M-1 19.5C1 17.5 6 18 7 24L1.5 24C2 22 1 20.5 -1 19.5Z', color: 'mentaSombra', contorno: false },
  ...flor(-5.5, 18.6, 2.8, 'acento', 'sol'),
  ...flor(0.5, 19.6, 2.4, 'sol', 'acento'),
  { d: 'M43 24C43 20.5 47 17.8 51 19.2C54 17.2 58 19.5 59 24Z', color: 'menta' },
  ...flor(47.5, 19.6, 2.4, 'servicio', 'sol'),
  ...flor(53.5, 18.8, 2.8, 'acento', 'sol'),
]

const PETALOS: Pieza[][] = [
  [{ d: hoja(0, 0, 3.4, 1.3, 40), color: 'acento' }],
  [{ d: corazon(0, 0, 1.6), color: 'acentoSombra' }],
  [{ d: hoja(0, 0, 3, 1.1, -40), color: 'sol' }],
]

export const CAPAS_DIA_DE_LAS_MADRES: CapaVector[] = [
  // fondo
  ...destellosDeFondo([[6, -16, 2.6, 0.1], [44, -18, 2.4, 0.5], [30, -23, 1.8, 0.8]]),
  ...lluvia(CORAZONES_LEJANOS, RITMO_FLOTAN, { x: -6, ancho: 62, y: 4, alto: 14 }, SUBIDA, 3, 30, 'fondo'),
  { x: 6, y: -12, plano: 'fondo', anima: 'balanceo', fase: 0.2, piezas: MARIPOSA },
  { x: 45, y: -15, plano: 'fondo', anima: 'balanceo', fase: 0.6, piezas: MARIPOSA },
  // cuerpo
  { x: 7, y: 1, anima: 'saltito', piezas: CORAZON },
  { x: 28, y: 1, anima: 'saltito', piezas: RAMO },
  // frente
  { x: 0, y: 0, plano: 'frente', piezas: CANTEROS },
  ...lluvia(PETALOS, RITMO_PETALOS, { x: -6, ancho: 62, y: -14, alto: 10 }, CAIDA, 5, 160, 'frente'),
  ...rafaga(ORIGEN_RAFAGA, ['acento', 'sol', 'servicio', 'menta'], 18),
]
