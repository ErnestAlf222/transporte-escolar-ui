import {
  circulo,
  destello,
  destellosDeFondo,
  estrella,
  globo,
  linea,
  lluvia,
  pastilla,
  poligono,
  rafaga,
  rectRedondeado,
  type CapaVector,
  type ColorPieza,
  type Pieza,
} from '@/shared/utils/formasTemporada'

// Escena de Día del Padre: corbata, lentes, gorra, llave inglesa, taza y globos. Mismo estilo que
// escenaReyes.ts: tres planos, contorno de tinta, volumen plano, elemento principal de más de la mitad de la
// camioneta (corbata, lentes y gorra juntos miden 40 de 50 columnas) y cada plano a su ritmo.

const RITMO_GLOBOS = [0.9, 1.1, 1, 1.2]
const RITMO_ESTRELLAS = [0.55, 0.7, 0.62, 0.8, 0.58, 0.75, 0.66, 0.85]
const RITMO_VAPOR = [0.9, 1.15]
const CAIDA = 34
const SUBIDA = -34
const ORIGEN_RAFAGA = [17, -10] as const
const COLORES_GLOBO = ['acento', 'sol', 'menta', 'servicio'] as const

// ---- fondo

// Llave inglesa parada detrás de la camioneta: cabeza abierta y mango largo; sale de (0, 0) = el pie
const LLAVE: Pieza[] = [
  {
    d: poligono([[-1.5, 0], [-1.5, -12], [-4.2, -12], [-4.2, -18], [-1.7, -18], [-1.7, -15], [1.7, -15], [1.7, -18], [4.2, -18], [4.2, -12], [1.5, -12], [1.5, 0]]),
    color: 'servicio',
  },
  { d: circulo(0, -1.4, 0.7), color: 'servicioSombra', contorno: false },
]

// ---- cuerpo

// Corbata de 14 columnas y 22 de alto: nudo, cuerpo con rayas y punta; sale de (0, 0) = la punta de abajo
const CORBATA: Pieza[] = [
  { d: poligono([[-3.4, -19], [3.4, -19], [6.8, -3], [0, 1], [-6.8, -3]]), color: 'servicio' },
  { d: poligono([[3.4, -19], [6.8, -3], [0, 1], [1.4, -9]]), color: 'servicioSombra', contorno: false },
  { d: linea([[-4.6, -11], [3.6, -8.4]]), color: 'sol', trazo: true, ancho: 1.1 },
  { d: linea([[-5.4, -7], [4.6, -4.2]]), color: 'sol', trazo: true, ancho: 1.1 },
  { d: poligono([[-4.2, -21.4], [4.2, -21.4], [3.4, -17.6], [-3.4, -17.6]]), color: 'acento' },
  { d: poligono([[-3.8, -20.6], [-2.2, -20.6], [-2.6, -18.4]]), color: 'blanco', contorno: false, opacidad: 0.8 },
]

// Lentes de 24 columnas: dos aros, puente y patillas; sale de (0, 0) = el centro del borde de abajo
const LENTES: Pieza[] = [
  { d: linea([[-11.4, -6.4], [-14.6, -3]]), color: 'servicioSombra', trazo: true, ancho: 1.4 },
  { d: linea([[11.4, -6.4], [14.6, -3]]), color: 'servicioSombra', trazo: true, ancho: 1.4 },
  { d: circulo(-6.2, -5.4, 5.4), color: 'servicioSombra' },
  { d: circulo(6.2, -5.4, 5.4), color: 'servicioSombra' },
  { d: circulo(-6.2, -5.4, 3.7), color: 'blanco' },
  { d: circulo(6.2, -5.4, 3.7), color: 'blanco' },
  { d: 'M-1 -6.6Q0 -8.2 1 -6.6', color: 'servicioSombra', trazo: true, ancho: 1.2 },
  { d: 'M-8.4 -7.4Q-7.4 -8.6 -6 -8.6', color: 'servicio', trazo: true, ancho: 0.7, opacidad: 0.7 },
  { d: 'M3.9 -7.4Q4.9 -8.6 6.3 -8.6', color: 'servicio', trazo: true, ancho: 0.7, opacidad: 0.7 },
]

// Gorra de 15 columnas: domo con botón y visera; sale de (0, 0) = el centro del borde de abajo
const GORRA: Pieza[] = [
  { d: 'M-7 0C-7 -10 7 -10 7 0Z', color: 'acento' },
  { d: 'M2 -1C3.6 -4 3.4 -7 1.6 -8.6C5.8 -7.4 6.4 -3 5.4 -0.6Z', color: 'acentoSombra', contorno: false },
  { d: circulo(0, -8.6, 1.1), color: 'sol' },
  { d: 'M3 -0.2C8 2.2 13 2.2 15 -0.6C11 -1.6 7 -1.4 3 -0.2Z', color: 'acentoSombra' },
  { d: pastilla(-7, -1.6, 14, 1.8), color: 'sol' },
]

// ---- frente

// Taza de la esquina de atrás con vapor, y pila de regalos en la de adelante
const TAZA: Pieza[] = [
  { d: `M${5.5} 18.2h1a3 3 0 0 1 0 6h-1`, color: 'solSombra', trazo: true, ancho: 1.4 },
  { d: rectRedondeado(-2, 17.5, 8, 7, 1.6), color: 'blanco' },
  { d: pastilla(-1, 18.8, 6, 1.6), color: 'solSombra', contorno: false },
  { d: estrella(2, 22, 1.6, 0.7), color: 'acento', contorno: false },
]
const VAPOR: Pieza[] = [{ d: 'M0 0Q2 -2 0 -4T0 -8', color: 'blanco', trazo: true, ancho: 1.2, opacidad: 0.9 }]
function regalo(cx: number, ancho: number, alto: number, color: ColorPieza, y: number): Pieza[] {
  return [
    { d: rectRedondeado(cx - ancho / 2, y - alto, ancho, alto, 0.9), color },
    { d: linea([[cx, y - alto], [cx, y]]), color: 'sol', trazo: true, ancho: 1.1 },
    { d: linea([[cx - ancho / 2, y - alto / 2], [cx + ancho / 2, y - alto / 2]]), color: 'sol', trazo: true, ancho: 1.1 },
  ]
}
const REGALOS: Pieza[] = [...regalo(50, 8, 6, 'servicio', 24), ...regalo(57, 6, 5, 'acento', 24), ...regalo(53.5, 5, 4, 'menta', 18.8)]

const GLOBOS: Pieza[][] = COLORES_GLOBO.map((color) => [
  { d: linea([[0, 4], [0.8, 8], [-0.6, 11]]), color: 'tinta' as const, trazo: true, ancho: 0.35 },
  ...globo(0, 0, 2.4, 3, color),
])
const CAIDOS: Pieza[][] = [
  [{ d: estrella(0, 0, 2.8, 1.2), color: 'sol' }],
  [{ d: destello(0, 0, 3.2), color: 'acento' }],
  [{ d: pastilla(-2.4, -0.6, 4.8, 1.2), color: 'menta' }],
]

export const CAPAS_DIA_DEL_PADRE: CapaVector[] = [
  // fondo
  { x: 51, y: 4, plano: 'fondo', piezas: LLAVE },
  ...destellosDeFondo([[4, -17, 2.6, 0.1], [29, -22, 2.2, 0.5], [47, -16, 2, 0.8]]),
  // cuerpo
  { x: 8, y: 1, anima: 'saltito', piezas: CORBATA },
  { x: 27, y: 1, anima: 'saltito', piezas: LENTES },
  { x: 43, y: 1, anima: 'saltito', piezas: GORRA },
  // frente
  { x: 0, y: 0, plano: 'frente', piezas: REGALOS },
  { x: -4, y: 0, plano: 'frente', piezas: TAZA },
  { x: -1.5, y: 17, plano: 'frente', anima: 'cae', fase: 0, caida: -8, velocidad: RITMO_VAPOR[0], piezas: VAPOR },
  { x: 2, y: 17, plano: 'frente', anima: 'cae', fase: 0.5, caida: -8, velocidad: RITMO_VAPOR[1], piezas: VAPOR },
  ...lluvia(GLOBOS, RITMO_GLOBOS, { x: -4, ancho: 58, y: 10, alto: 10 }, SUBIDA, 4, 20, 'frente'),
  ...lluvia(CAIDOS, RITMO_ESTRELLAS, { x: -6, ancho: 62, y: -14, alto: 10 }, CAIDA, 5, 160, 'frente'),
  ...rafaga(ORIGEN_RAFAGA, ['acento', 'sol', 'menta', 'servicio'], 18),
]
