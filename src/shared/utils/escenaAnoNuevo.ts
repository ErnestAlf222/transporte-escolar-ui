import {
  circulo,
  destello,
  fuegoArtificial,
  linea,
  lluvia,
  pastilla,
  rafaga,
  type CapaVector,
  type ColorPieza,
  type Pieza,
} from '@/shared/utils/formasTemporada'

// Escena de Año Nuevo. Mismo estilo que escenaNavidad.ts: tres planos, contorno de tinta, volumen plano,
// elemento principal de casi la mitad de la camioneta (el reloj mide 22 de 50 columnas) y cada plano a su ritmo.

const RITMO_CONFETI = [0.5, 0.65, 0.58, 0.75, 0.55, 0.7, 0.62, 0.8]
const CAIDA = 34
const COLORES_FESTEJO = ['acento', 'sol', 'menta', 'servicio'] as const
const ORIGEN_RAFAGA = [26, -10] as const
const RELOJ = { x: 26, y: -10, radio: 11 }

// ---- fondo

const FUEGOS: CapaVector[] = [
  fuegoArtificial(6, -14, 9, 'acento', 0.05),
  fuegoArtificial(26, -20, 8, 'sol', 0.4),
  fuegoArtificial(46, -15, 9, 'servicio', 0.7),
  fuegoArtificial(51, -2, 6, 'menta', 0.2),
  fuegoArtificial(-1, -3, 6, 'sol', 0.55),
]

// Serpentinas onduladas que cuelgan y se mecen
function serpentina(x: number, largo: number, color: ColorPieza, fase: number): CapaVector {
  const tramos = Math.floor(largo / 6)
  const d = `M0 0${Array.from({ length: tramos }, (_, k) => `q${k % 2 === 0 ? 3 : -3} 3 0 6`).join('')}`
  return { x, y: -20, plano: 'fondo', anima: 'balanceo', fase, piezas: [{ d, color, trazo: true, ancho: 1.4 }] }
}

// ---- cuerpo

// Reloj despertador de 22 columnas, marcando casi las doce; sale de (0, 0) = su centro
const CARATULA: Pieza[] = [
  { d: circulo(-7.4, -9.2, 3.2), color: 'sol' },
  { d: circulo(7.4, -9.2, 3.2), color: 'sol' },
  { d: pastilla(-6, 10.2, 12, 2.2), color: 'solSombra' },
  { d: circulo(0, 0, RELOJ.radio), color: 'sol' },
  { d: circulo(0, 0, 8.6), color: 'blanco' },
  { d: circulo(-7.9, -7.2, 1), color: 'blanco', contorno: false, opacidad: 0.8 },
  ...Array.from({ length: 12 }, (_, k) => {
    const a = (k * Math.PI) / 6
    const largo = k % 3 === 0 ? 2.2 : 1.1
    return {
      d: linea([[Math.sin(a) * 7.8, -Math.cos(a) * 7.8], [Math.sin(a) * (7.8 - largo), -Math.cos(a) * (7.8 - largo)]]),
      color: 'tinta' as const,
      trazo: true,
      ancho: k % 3 === 0 ? 0.9 : 0.5,
    }
  }),
  { d: linea([[0, 0], [-1.7, -4.4]]), color: 'tinta', trazo: true, ancho: 1.3 },
  { d: linea([[0, 0], [0.6, -6.6]]), color: 'tinta', trazo: true, ancho: 0.9 },
  { d: circulo(0, 0, 1.1), color: 'acento' },
]

// La manecilla de los segundos da la vuelta sin parar; el trazo invisible de abajo la deja girar sobre el centro
const SEGUNDERO: Pieza[] = [
  { d: linea([[0, 0], [0, -7.4]]), color: 'acento', trazo: true, ancho: 0.5 },
  { d: linea([[0, 0], [0, 7.4]]), color: 'acento', trazo: true, ancho: 0.5, opacidad: 0 },
]

// Plato con doce uvas: la tradición de las campanadas
function uvas(): Pieza[] {
  const filas = [4, 3, 3, 2]
  const piezas: Pieza[] = [{ d: pastilla(-6.5, -1.4, 13, 2.8), color: 'solSombra' }]
  filas.forEach((n, f) =>
    Array.from({ length: n }, (_, i) => {
      piezas.push({ d: circulo((i - (n - 1) / 2) * 3.1, -3.6 - f * 2.7, 1.55), color: 'servicio' })
      piezas.push({ d: circulo((i - (n - 1) / 2) * 3.1 - 0.5, -4.1 - f * 2.7, 0.4), color: 'blanco', contorno: false })
    }),
  )
  piezas.push({ d: linea([[0, -14.2], [0.6, -16.4]]), color: 'mentaSombra', trazo: true, ancho: 0.8 })
  return piezas
}

// ---- frente

const FESTEJO: Pieza[][] = [
  [{ d: destello(0, 0, 3.2), color: 'sol' }],
  [{ d: circulo(0, 0, 1.4), color: 'acento' }],
  [{ d: pastilla(-2, -0.7, 4, 1.4), color: 'menta' }],
  [{ d: pastilla(-2, -0.7, 4, 1.4), color: 'servicio' }],
]

// Confeti ya caído, en las esquinas
const PISO_CONFETI: Pieza[] = [
  [-8, 22.4, 'acento'], [-5, 23.2, 'sol'], [-2, 22.6, 'menta'], [1, 23.3, 'servicio'], [4, 22.5, 'acento'],
  [44, 22.5, 'sol'], [47, 23.2, 'servicio'], [50, 22.4, 'menta'], [53, 23.3, 'acento'], [56, 22.6, 'sol'],
].map(([x, y, color]) => ({ d: circulo(x as number, y as number, 1.1), color: color as ColorPieza }))

export const CAPAS_ANO_NUEVO: CapaVector[] = [
  // fondo
  ...FUEGOS,
  serpentina(10, 18, 'acento', 0.1),
  serpentina(18, 24, 'servicio', 0.5),
  serpentina(35, 22, 'menta', 0.3),
  serpentina(43, 16, 'sol', 0.8),
  // cuerpo
  { x: 8, y: 1, anima: 'saltito', piezas: uvas() },
  { x: RELOJ.x, y: RELOJ.y, piezas: CARATULA },
  { x: RELOJ.x, y: RELOJ.y, anima: 'gira', piezas: SEGUNDERO },
  // frente
  { x: 0, y: 0, plano: 'frente', piezas: PISO_CONFETI },
  ...lluvia(FESTEJO, RITMO_CONFETI, { x: -6, ancho: 62, y: -14, alto: 10 }, CAIDA, 5, 200, 'frente'),
  ...rafaga(ORIGEN_RAFAGA, COLORES_FESTEJO, 20),
]
