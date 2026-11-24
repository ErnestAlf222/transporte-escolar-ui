import {
  circulo,
  destello,
  destellosDeFondo,
  elipse,
  estrella,
  libro,
  linea,
  lapiz,
  lluvia,
  pastilla,
  poligono,
  rafaga,
  rectRedondeado,
  type CapaVector,
  type Pieza,
} from '@/shared/utils/formasTemporada'

// Escena de Regreso a clases: mochila, lápices, regla, cuaderno, sol que sale y campana. Mismo estilo que
// escenaReyes.ts: tres planos, contorno de tinta, volumen plano, elemento principal de casi la mitad de la
// camioneta (la mochila mide 22 de 50 columnas) y cada plano a su ritmo.

const RITMO_CAIDOS = [0.55, 0.7, 0.62, 0.8, 0.58, 0.75, 0.66, 0.85]
const RITMO_NUBES = [1.6, 2]
const RAYOS_SOL = 9
const CAIDA = 34
const ORIGEN_RAFAGA = [25, -9] as const

// ---- fondo

// Sol que sale detrás de la camioneta: disco y rayos que laten
const SOL: Pieza[] = [{ d: circulo(0, 0, 9), color: 'sol' }, { d: circulo(-3, -3, 2), color: 'blanco', contorno: false, opacidad: 0.7 }]
const RAYOS: Pieza[] = Array.from({ length: RAYOS_SOL }, (_, k) => {
  const a = (-170 + k * 20) * (Math.PI / 180)
  return { d: linea([[Math.cos(a) * 12, Math.sin(a) * 12], [Math.cos(a) * 17, Math.sin(a) * 17]]), color: 'sol' as const, trazo: true, ancho: 1.6 }
})

const NUBE: Pieza[] = [
  { d: `${circulo(0, 0, 2.6)}${circulo(3.2, 0.6, 2)}${circulo(-3, 0.8, 1.8)}`, color: 'blanco' },
]

// Campana de la escuela colgada de un poste, que se mece
const POSTE: Pieza[] = [{ d: rectRedondeado(-0.7, 0, 1.4, 24, 0.5), color: 'solSombra' }, { d: pastilla(0, 0, 9, 1.4), color: 'solSombra' }]
const CAMPANA: Pieza[] = [
  { d: 'M-1.6 1.6C-2.4 2.6 -2.8 4.2 -3.2 5.8C-3.8 8 -5 8.8 -6.4 9.6V10.8H6.4V9.6C5 8.8 3.8 8 3.2 5.8C2.8 4.2 2.4 2.6 1.6 1.6Z', color: 'sol' },
  { d: 'M3.2 5.8C3.8 8 5 8.8 6.4 9.6V10.8H2.8C3.4 8.6 3.4 7.2 3.2 5.8Z', color: 'solSombra', contorno: false },
  { d: pastilla(-7.2, 9.4, 14.4, 2), color: 'solSombra' },
  { d: circulo(0, 0.5, 1.2), color: 'blanco' },
  { d: circulo(0, 13.2, 1.5), color: 'solSombra' },
]

// ---- cuerpo

// Mochila de 22 columnas: asa, cuerpo, bolsa del frente con cierre y bolsas a los lados; sale de (0, 0) = el centro
// del borde de abajo
const MOCHILA: Pieza[] = [
  { d: 'M-3.4 -17C-3.4 -22 3.4 -22 3.4 -17', color: 'servicioSombra', trazo: true, ancho: 1.8 },
  { d: rectRedondeado(-12.6, -9, 3.4, 9, 1.4), color: 'servicioSombra' },
  { d: rectRedondeado(9.2, -9, 3.4, 9, 1.4), color: 'servicioSombra' },
  { d: rectRedondeado(-11, -18, 22, 18, 5), color: 'servicio' },
  { d: 'M7.4 -16.6C10 -14 10.4 -8 9 -1.4L11 -1.4C11.2 -8 10.6 -14 8.6 -17.4Z', color: 'servicioSombra', contorno: false },
  { d: rectRedondeado(-11, -18, 22, 6.4, 4.2), color: 'servicioSombra' },
  { d: circulo(0, -12.2, 1.4), color: 'sol' },
  { d: rectRedondeado(-7.6, -8.4, 15.2, 7.8, 2.4), color: 'acento' },
  { d: linea([[-6, -6.4], [6, -6.4]]), color: 'solSombra', trazo: true, ancho: 0.6 },
  { d: pastilla(-1, -7.2, 2, 1.6), color: 'sol' },
  { d: estrella(0, -3.2, 1.5, 0.7), color: 'sol', contorno: false },
  { d: 'M-9 -15.4C-9.6 -17 -8.4 -17.6 -7.2 -17.4C-8.2 -17 -8.6 -16.2 -8.6 -15.4Z', color: 'blanco', contorno: false, opacidad: 0.85 },
]

const LAPICES: Pieza[] = [...lapiz(0, 1, 13, 'acento'), ...lapiz(3.2, 1, 16, 'sol'), ...lapiz(6.4, 1, 11, 'menta')]

// Regla con marcas, parada a la derecha
const REGLA: Pieza[] = [
  { d: rectRedondeado(-2, -19, 4, 20, 0.8), color: 'sol' },
  ...[-16, -13, -10, -7, -4].map((y, k) => ({ d: linea([[-2, y], [k % 2 === 0 ? 0.4 : -0.6, y]]), color: 'tinta' as const, trazo: true, ancho: 0.4 })),
]

// Cuaderno con espiral y etiqueta, recargado junto a la regla
const CUADERNO: Pieza[] = [
  { d: rectRedondeado(-5, -13, 10, 13, 1.2), color: 'acento' },
  { d: rectRedondeado(-3, -9.4, 6, 4, 0.8), color: 'blanco', contorno: false },
  ...[-11.6, -9.2, -6.8, -4.4, -2].map((y) => ({ d: circulo(-5, y, 0.7), color: 'tinta' as const, contorno: false })),
]

// ---- frente

// Pilas de libros en las esquinas, delante de las defensas
const PILAS: Pieza[] = [
  ...libro(-4, 24, 12, 'servicio'),
  ...libro(-3.4, 20.4, 10, 'acento'),
  ...libro(-4.6, 16.8, 8, 'menta'),
  ...libro(52, 24, 12, 'acento'),
  ...libro(52.6, 20.4, 10, 'sol'),
]

// Avioncitos de papel y estrellas que caen
const AVION: Pieza[] = [
  { d: poligono([[-3, 0.6], [3.4, -1.8], [0.6, 2.4]]), color: 'blanco' },
  { d: poligono([[-3, 0.6], [0.6, 2.4], [0.4, 0.4]]), color: 'servicio', contorno: false },
]
const CAIDOS: Pieza[][] = [
  AVION,
  [{ d: estrella(0, 0, 2.8, 1.2), color: 'sol' }],
  [{ d: destello(0, 0, 3.2), color: 'acento' }],
  [{ d: elipse(0, 0, 2.4, 0.8), color: 'menta' }],
]

export const CAPAS_REGRESO_A_CLASES: CapaVector[] = [
  // fondo
  { x: 25, y: -1, plano: 'fondo', anima: 'pulso', piezas: RAYOS },
  { x: 25, y: -1, plano: 'fondo', piezas: SOL },
  { x: -3, y: -17, plano: 'fondo', piezas: POSTE },
  { x: 5.4, y: -16.4, plano: 'fondo', anima: 'balanceo', piezas: CAMPANA },
  ...lluvia([NUBE], RITMO_NUBES, { x: 0, ancho: 20, y: -18, alto: 4 }, 0, 26, 0, 'fondo'),
  ...destellosDeFondo([[44, -17, 2.4, 0.2], [8, -23, 2, 0.6]]),
  // cuerpo
  { x: 4, y: 1, anima: 'cabeceo', piezas: LAPICES },
  { x: 25, y: 1, anima: 'saltito', piezas: MOCHILA },
  { x: 38, y: 1, piezas: REGLA },
  { x: 45, y: 1, anima: 'cabeceo', piezas: CUADERNO },
  // frente
  { x: 0, y: 0, plano: 'frente', piezas: PILAS },
  ...lluvia(CAIDOS, RITMO_CAIDOS, { x: -6, ancho: 62, y: -14, alto: 10 }, CAIDA, 5, 160, 'frente'),
  ...rafaga(ORIGEN_RAFAGA, ['acento', 'sol', 'menta', 'servicio'], 18),
]
