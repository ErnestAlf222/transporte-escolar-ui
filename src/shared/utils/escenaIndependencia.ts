import {
  circulo,
  destello,
  estrella,
  fuegoArtificial,
  guirnaldaPapel,
  lluvia,
  pastilla,
  poligono,
  rafaga,
  rectRedondeado,
  type CapaVector,
  type Pieza,
} from '@/shared/utils/formasTemporada'

// Escena de Independencia: campana, papel picado, fuegos artificiales y estandartes (sin banderas tricolor).
// Mismo estilo que escenaNavidad.ts: tres planos, contorno de tinta, volumen plano, elemento principal de más
// de la mitad de la camioneta (el pórtico de la campana mide 26 de 50 columnas) y cada plano a su ritmo.

const RITMO_FESTEJO = [0.5, 0.65, 0.58, 0.75, 0.55, 0.7, 0.62, 0.8]
const CAIDA = 34
const COLORES_PAPEL = ['acento', 'sol', 'menta', 'servicio'] as const
const BANDERIN = { ancho: 6.5, alto: 8, separacion: 7.5 }
const ORIGEN_RAFAGA = [25, -9] as const

// ---- cuerpo

// Pórtico de madera sobre el techo: dos postes y una viga, de la que cuelga la campana
const PORTICO: Pieza[] = [
  { d: rectRedondeado(11.2, -19, 2.4, 20, 0.8), color: 'solSombra' },
  { d: rectRedondeado(36.4, -19, 2.4, 20, 0.8), color: 'solSombra' },
  { d: pastilla(10, -20.4, 30, 2.6), color: 'sol' },
  { d: circulo(11.8, -21.8, 1.3), color: 'blanco' },
  { d: circulo(37.2, -21.8, 1.3), color: 'blanco' },
]

// Campana de 18 columnas; sale de (0, 0) = el anillo de donde cuelga y se mece como un badajo
const CAMPANA: Pieza[] = [
  { d: 'M-2 2C-3 3.2 -3.4 5.2 -3.9 7.2C-4.6 9.6 -6.2 10.8 -8 11.8V13.2H8V11.8C6.2 10.8 4.6 9.6 3.9 7.2C3.4 5.2 3 3.2 2 2Z', color: 'sol' },
  { d: 'M3.9 7.2C4.6 9.6 6.2 10.8 8 11.8V13.2H3.4C4.1 10.6 4.3 8.8 3.9 7.2Z', color: 'solSombra', contorno: false },
  { d: 'M-4.6 7.4C-5 9 -6 10.2 -7 11C-5.4 10.2 -4.3 9 -3.8 7.2Z', color: 'blanco', contorno: false, opacidad: 0.85 },
  { d: pastilla(-9, 11.6, 18, 2.6), color: 'solSombra' },
  { d: circulo(0, 0.6, 1.5), color: 'blanco' },
  { d: circulo(0, 16.2, 1.8), color: 'solSombra' },
]

// Cintas largas con estrella que cuelgan de los extremos de la viga
function cinta(color: 'acento' | 'servicio'): Pieza[] {
  return [
    { d: poligono([[-2.3, 0], [2.3, 0], [2.3, 13], [0, 11], [-2.3, 13]]), color },
    { d: estrella(0, 5.2, 1.7, 0.75), color: 'sol', contorno: false },
  ]
}

// ---- frente

// Arbustos en las esquinas, delante de las defensas, con florecitas
const ARBUSTOS: Pieza[] = [
  { d: 'M-10 24L-10 21C-8.5 18 -4 17.5 -1 19.5C1 17.5 6 18 7 24Z', color: 'menta' },
  { d: 'M-1 19.5C1 17.5 6 18 7 24L1.5 24C2 22 1 20.5 -1 19.5Z', color: 'mentaSombra', contorno: false },
  { d: circulo(-6, 20, 1), color: 'acento' },
  { d: circulo(-2.5, 19.6, 1), color: 'sol' },
  { d: 'M43 24C43 20.5 47 17.8 51 19.2C54 17.2 58 19.5 59 24Z', color: 'menta' },
  { d: circulo(47, 20.2, 1), color: 'servicio' },
  { d: circulo(54, 20.4, 1), color: 'acento' },
]

const FESTEJO: Pieza[][] = [
  [{ d: destello(0, 0, 3.2), color: 'sol' }],
  [{ d: circulo(0, 0, 1.4), color: 'acento' }],
  [{ d: pastilla(-2, -0.7, 4, 1.4), color: 'menta' }],
  [{ d: pastilla(-2, -0.7, 4, 1.4), color: 'servicio' }],
]

export const CAPAS_INDEPENDENCIA: CapaVector[] = [
  // fondo
  fuegoArtificial(5, -14, 8, 'acento', 0.05),
  fuegoArtificial(25, -22, 9, 'sol', 0.4),
  fuegoArtificial(46, -14, 8, 'servicio', 0.7),
  fuegoArtificial(52, -3, 5.5, 'menta', 0.25),
  ...guirnaldaPapel(-4, -9, 54, -9, 5, COLORES_PAPEL, BANDERIN, 'fondo', 0),
  // cuerpo
  { x: 0, y: 0, piezas: PORTICO },
  { x: 25, y: -17.5, anima: 'balanceo', piezas: CAMPANA },
  { x: 10.6, y: -18.5, anima: 'balanceo', fase: 0.2, piezas: cinta('acento') },
  { x: 39.4, y: -18.5, anima: 'balanceo', fase: 0.6, piezas: cinta('servicio') },
  // frente
  { x: 0, y: 0, plano: 'frente', piezas: ARBUSTOS },
  ...lluvia(FESTEJO, RITMO_FESTEJO, { x: -6, ancho: 62, y: -14, alto: 10 }, CAIDA, 5, 200, 'frente'),
  ...rafaga(ORIGEN_RAFAGA, ['sol', 'acento', 'menta', 'servicio'], 20),
]
