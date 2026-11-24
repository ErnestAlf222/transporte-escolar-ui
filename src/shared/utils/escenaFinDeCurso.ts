import {
  circulo,
  destello,
  estrella,
  fuegoArtificial,
  globo,
  linea,
  lluvia,
  pastilla,
  poligono,
  rafaga,
  elipse,
  type CapaVector,
  type Pieza,
} from '@/shared/utils/formasTemporada'

// Escena de Fin de curso: birrete, diploma, medalla, confeti y globos. Mismo estilo que escenaReyes.ts: tres
// planos, contorno de tinta, volumen plano, elemento principal de más de la mitad de la camioneta (el birrete
// mide 28 de 50 columnas) y cada plano a su ritmo.

const RITMO_GLOBOS = [0.9, 1.1, 1, 1.2]
const RITMO_CONFETI = [0.5, 0.65, 0.58, 0.75, 0.55, 0.7, 0.62, 0.8]
const CAIDA = 34
const SUBIDA = -34
const COLORES_FIESTA = ['acento', 'sol', 'menta', 'servicio'] as const
const ORIGEN_RAFAGA = [27, -12] as const

// ---- cuerpo

// Birrete de 28 columnas: tablero, gorro, botón y cordón; sale de (0, 0) = el centro del borde de abajo
const BIRRETE: Pieza[] = [
  { d: poligono([[-8, -8.4], [0, -5], [8, -8.4], [8, -1.4], [0, 1], [-8, -1.4]]), color: 'servicio' },
  { d: poligono([[0, -5], [8, -8.4], [8, -1.4], [0, 1]]), color: 'servicioSombra', contorno: false },
  { d: poligono([[-14, -11], [0, -15.6], [14, -11], [0, -6.4]]), color: 'servicioSombra' },
  { d: poligono([[-9.6, -11], [-1, -13.8], [-0.4, -13], [-8.4, -10.4]]), color: 'blanco', contorno: false, opacidad: 0.5 },
  { d: circulo(0, -11, 1.3), color: 'sol' },
  { d: 'M0 -11L11.6 -9.6', color: 'sol', trazo: true, ancho: 0.9 },
]

// La borla cuelga del cordón y se mece sola
const BORLA: Pieza[] = [
  { d: 'M0 0L0 3', color: 'sol', trazo: true, ancho: 0.9 },
  { d: poligono([[-1.5, 2.8], [1.5, 2.8], [2.4, 8.4], [-2.4, 8.4]]), color: 'sol' },
  { d: linea([[-1.2, 5], [1.2, 5]]), color: 'solSombra', trazo: true, ancho: 0.5 },
]

// Diploma enrollado con moño, a la izquierda; sale de (0, 0) = el centro del borde de abajo
const DIPLOMA: Pieza[] = [
  { d: pastilla(-6.5, -4.6, 13, 4.6), color: 'blanco' },
  { d: elipse(-6.3, -2.3, 1.2, 2.3), color: 'blanco' },
  { d: elipse(6.3, -2.3, 1.2, 2.3), color: 'blanco' },
  { d: linea([[-5.6, -2.3], [-4.4, -2.3]]), color: 'servicioSombra', trazo: true, ancho: 0.5 },
  { d: 'M-1 -4.6h2v4.6h-2Z', color: 'acento' },
  { d: elipse(-2, -5.4, 2.2, 1.4), color: 'acento' },
  { d: elipse(2, -5.4, 2.2, 1.4), color: 'acento' },
  { d: circulo(0, -5.2, 0.9), color: 'acentoSombra', contorno: false },
]

// Medalla con listón, a la derecha; sale de (0, 0) = el punto más bajo de la medalla
const MEDALLA: Pieza[] = [
  { d: poligono([[-4, -15], [-1, -15], [1.6, -8.6], [-1.4, -8.6]]), color: 'acento' },
  { d: poligono([[4, -15], [1, -15], [-1.6, -8.6], [1.4, -8.6]]), color: 'servicio' },
  { d: circulo(0, -4.6, 4.6), color: 'sol' },
  { d: circulo(0, -4.6, 3.1), color: 'solSombra', contorno: false },
  { d: estrella(0, -4.4, 2.5, 1.1), color: 'sol', contorno: false },
]

// ---- frente

// Rollitos de diploma apilados en las esquinas, delante de las defensas
function rollitos(x: number, lado: 1 | -1): Pieza[] {
  const rollo = (cx: number, cy: number): Pieza[] => [
    { d: pastilla(cx - 3.4, cy - 1.4, 6.8, 2.8), color: 'blanco' },
    { d: `M${cx - 0.5} ${cy - 1.4}h1v2.8h-1Z`, color: 'acento', contorno: false },
  ]
  return [...rollo(x, 22.6), ...rollo(x + lado * 6.4, 22.6), ...rollo(x + lado * 3.2, 19.8)]
}

const GLOBOS: Pieza[][] = COLORES_FIESTA.map((color) => [
  { d: linea([[0, 4], [0.8, 8], [-0.6, 11]]), color: 'tinta' as const, trazo: true, ancho: 0.35 },
  ...globo(0, 0, 2.4, 3, color),
])
const FIESTA: Pieza[][] = [
  [{ d: destello(0, 0, 3.2), color: 'sol' }],
  [{ d: circulo(0, 0, 1.4), color: 'acento' }],
  [{ d: pastilla(-2, -0.7, 4, 1.4), color: 'menta' }],
  [{ d: estrella(0, 0, 2.6, 1.1), color: 'servicio' }],
]

export const CAPAS_FIN_DE_CURSO: CapaVector[] = [
  // fondo
  fuegoArtificial(5, -14, 8, 'acento', 0.05),
  fuegoArtificial(27, -22, 8.5, 'sol', 0.4),
  fuegoArtificial(47, -14, 8, 'servicio', 0.7),
  // cuerpo
  { x: 5, y: 1, anima: 'cabeceo', piezas: DIPLOMA },
  { x: 27, y: 1, anima: 'saltito', piezas: BIRRETE },
  { x: 38.6, y: -9.6, anima: 'balanceo', fase: 0.2, piezas: BORLA },
  { x: 45, y: 1, anima: 'cabeceo', piezas: MEDALLA },
  // frente
  { x: 0, y: 0, plano: 'frente', piezas: [...rollitos(-5, 1), ...rollitos(52, -1)] },
  ...lluvia(GLOBOS, RITMO_GLOBOS, { x: -4, ancho: 58, y: 10, alto: 10 }, SUBIDA, 4, 20, 'frente'),
  ...lluvia(FIESTA, RITMO_CONFETI, { x: -6, ancho: 62, y: -14, alto: 10 }, CAIDA, 5, 200, 'frente'),
  ...rafaga(ORIGEN_RAFAGA, COLORES_FIESTA, 20),
]
