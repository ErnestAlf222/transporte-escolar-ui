import {
  circulo,
  destello,
  destellosDeFondo,
  estrella,
  guirnaldaPapel,
  lluvia,
  pastilla,
  poligono,
  rafaga,
  rectRedondeado,
  type CapaVector,
  type Pieza,
} from '@/shared/utils/formasTemporada'

// Escena de Revolución: estandartes, papel picado, tren y estrellas (sin banderas tricolor). Mismo estilo que
// escenaNavidad.ts: tres planos, contorno de tinta, volumen plano, elemento principal de casi la mitad de la
// camioneta (la estrella mide 24 de 50 columnas) y cada plano a su ritmo.

const RITMO_ESTRELLAS = [0.55, 0.7, 0.62, 0.8, 0.58, 0.75, 0.66, 0.85]
const RITMO_VAPOR = [0.9, 1.1, 1, 1.25]
const CAIDA = 34
const SUBIDA_VAPOR = -24
const COLORES_PAPEL = ['acento', 'sol', 'menta', 'servicio'] as const
const BANDERIN = { ancho: 5.5, alto: 7, separacion: 7 }
const ORIGEN_RAFAGA = [25, -9] as const
const TRAVIESAS = 14 // cuántas traviesas tiene la vía de atrás

// ---- fondo

const CERROS: Pieza[] = [
  { d: 'M-12 24C-10 15 -2 11 6 14C10 16 12 20 14 24Z', color: 'mentaSombra' },
  { d: 'M40 24C42 18 48 13 55 14C60 15 63 20 64 24Z', color: 'solSombra' },
]

// Vía del tren: dos rieles y traviesas, detrás de las ruedas
const VIA: Pieza[] = [
  ...Array.from({ length: TRAVIESAS }, (_, k) => ({ d: pastilla(-9 + k * 5, 23.2, 3.4, 1.6), color: 'solSombra' as const })),
  { d: `M-10 23.6H60`, color: 'tinta', trazo: true, ancho: 0.8 },
]

// ---- cuerpo

// Estrella grande de 24 columnas con otra más chica adentro; sale de (0, 0) = su centro
const ESTRELLA: Pieza[] = [
  { d: estrella(0, 0, 12, 5.2), color: 'sol' },
  { d: poligono([[0, -12], [3, -4], [0, 0], [-1.6, -5.5]]), color: 'blanco', contorno: false, opacidad: 0.7 },
  { d: estrella(0, 0.4, 5.6, 2.4), color: 'acento' },
]

// Estandarte con cola de golondrina en un asta; sale de (0, 0) = la punta del asta
function estandarte(color: 'acento' | 'servicio'): Pieza[] {
  return [
    { d: rectRedondeado(-0.5, 0, 1, 21, 0.4), color: 'tinta', contorno: false },
    { d: circulo(0, -0.6, 1.4), color: 'sol' },
    { d: poligono([[0.5, 2], [9, 2], [9, 14], [4.75, 11.5], [0.5, 14]]), color },
    { d: estrella(4.75, 6.6, 2.3, 1), color: 'sol', contorno: false },
  ]
}

// Chimenea de locomotora en el frente, con la tapa ancha
const CHIMENEA: Pieza[] = [
  { d: rectRedondeado(36.6, -6, 3.4, 7, 0.6), color: 'solSombra' },
  { d: poligono([[35, -6], [41.6, -6], [40.4, -9.5], [36.2, -9.5]]), color: 'sol' },
]

const NUBE: Pieza[] = [
  { d: circulo(0, 0, 2.2), color: 'blanco' },
  { d: circulo(1.8, 0.4, 1.7), color: 'blanco' },
]

// ---- frente

const TIERRA: Pieza[] = [
  { d: 'M-10 24L-10 21C-8 17.5 -3 17 0 19.5C2 17.5 6 18 7 24Z', color: 'solSombra' },
  { d: 'M43 24C43 20 47 17.5 51 19C54 17 58 19 59 24Z', color: 'solSombra' },
]

const ESTRELLAS: Pieza[][] = [
  [{ d: destello(0, 0, 3.4), color: 'sol' }],
  [{ d: estrella(0, 0, 2.8, 1.2), color: 'acento' }],
  [{ d: circulo(0, 0, 1.4), color: 'servicio' }],
]

export const CAPAS_REVOLUCION: CapaVector[] = [
  // fondo
  { x: 0, y: 0, plano: 'fondo', piezas: CERROS },
  ...destellosDeFondo([[8, -17, 3, 0.1], [40, -20, 2.4, 0.5], [18, -10, 1.8, 0.8]]),
  { x: 0, y: 0, plano: 'fondo', piezas: VIA },
  ...guirnaldaPapel(3, -17, 47, -17, 4, COLORES_PAPEL, BANDERIN, 'fondo', 0),
  // cuerpo
  { x: 3, y: -17, anima: 'balanceo', fase: 0.1, piezas: estandarte('acento') },
  { x: 47, y: -17, anima: 'balanceo', fase: 0.6, piezas: estandarte('servicio') },
  { x: 0, y: 0, piezas: CHIMENEA },
  ...lluvia([NUBE], RITMO_VAPOR, { x: 36, ancho: 4, y: -10, alto: 4 }, SUBIDA_VAPOR, 3, 40, 'cuerpo'),
  { x: 25, y: -11, anima: 'saltito', piezas: ESTRELLA },
  // frente
  { x: 0, y: 0, plano: 'frente', piezas: TIERRA },
  ...lluvia(ESTRELLAS, RITMO_ESTRELLAS, { x: -6, ancho: 62, y: -14, alto: 10 }, CAIDA, 5, 160, 'frente'),
  ...rafaga(ORIGEN_RAFAGA, ['sol', 'acento', 'menta', 'servicio'], 18),
]
