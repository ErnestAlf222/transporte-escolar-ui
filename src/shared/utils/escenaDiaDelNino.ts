import {
  circulo,
  corazon,
  destello,
  destellosDeFondo,
  estrella,
  globo,
  linea,
  lluvia,
  poligono,
  rafaga,
  rectRedondeado,
  type CapaVector,
  type ColorPieza,
  type Pieza,
} from '@/shared/utils/formasTemporada'

// Escena de Día del Niño. Mismo estilo que escenaReyes.ts: tres planos, contorno de tinta, volumen plano,
// elemento principal de casi la mitad de la camioneta (la pelota mide 22 de 50 columnas) y cada plano a su ritmo.

const RITMO_BURBUJAS = [1.4, 1.75, 1.55, 1.9, 1.65, 1.5]
const RITMO_GLOBOS = [0.9, 1.1, 1, 1.2]
const RITMO_CONFETI = [0.55, 0.7, 0.62, 0.8, 0.58, 0.75, 0.66, 0.85]
const CAIDA = 34
const SUBIDA = -34
const COLORES_JUEGO = ['acento', 'sol', 'menta', 'servicio'] as const
const ORIGEN_RAFAGA = [22, -10] as const

// ---- fondo

// Arcoíris detrás de la camioneta: cuatro arcos que se pierden tras el techo
const ARCOIRIS: Pieza[] = COLORES_JUEGO.map((color, k) => ({
  d: `M${3 - k * 2.2} 9A${22 + k * 2.2} ${22 + k * 2.2} 0 0 1 ${47 + k * 2.2} 9`,
  color: color as ColorPieza,
  trazo: true,
  ancho: 2.4,
}))

const BURBUJA: Pieza[] = [
  { d: circulo(0, 0, 2.6), color: 'servicio', opacidad: 0.22 },
  { d: circulo(-0.9, -0.9, 0.6), color: 'blanco', contorno: false },
]

// ---- cuerpo

// Pelota de playa de 22 columnas con gajos de colores; sale de (0, 0) = el centro del borde de abajo
const PELOTA: Pieza[] = [
  { d: circulo(0, -10, 10.5), color: 'blanco' },
  ...Array.from({ length: 6 }, (_, k) => {
    const a0 = (k * Math.PI) / 3 - Math.PI / 2
    const a1 = a0 + Math.PI / 3
    const p = (a: number) => `${Math.round((Math.cos(a) * 10.5) * 100) / 100} ${Math.round((-10 + Math.sin(a) * 10.5) * 100) / 100}`
    return {
      d: `M0 -10L${p(a0)}A10.5 10.5 0 0 1 ${p(a1)}Z`,
      color: (['acento', 'blanco', 'sol', 'blanco', 'servicio', 'blanco'] as const)[k]!,
      contorno: false,
    }
  }),
  { d: circulo(0, -10, 1.6), color: 'blanco' },
  { d: 'M-8 -14C-9 -16.5 -6.5 -18.4 -4.4 -18C-6.2 -17.4 -7.4 -16 -7.8 -14Z', color: 'blanco', contorno: false, opacidad: 0.85 },
]

// Paleta de caramelo de 11 columnas con espiral
const PALETA: Pieza[] = [
  { d: rectRedondeado(-0.7, -5, 1.4, 6, 0.5), color: 'blanco' },
  { d: circulo(0, -9, 5.2), color: 'acento' },
  { d: circulo(0, -9, 3.6), color: 'blanco' },
  { d: circulo(0, -9, 2.1), color: 'acento' },
  { d: circulo(0, -9, 0.7), color: 'blanco', contorno: false },
]

// Pila de tres cubos de juguete; sale de (0, 0) = el centro del borde de abajo
const CUBOS: Pieza[] = [
  { d: rectRedondeado(-5.5, -5.5, 5.4, 5.4, 0.9), color: 'menta' },
  { d: rectRedondeado(0.1, -5.5, 5.4, 5.4, 0.9), color: 'sol' },
  { d: rectRedondeado(-2.7, -11, 5.4, 5.4, 0.9), color: 'servicio' },
  { d: estrella(2.8, -2.8, 1.8, 0.8), color: 'acento', contorno: false },
  { d: circulo(-2.8, -2.8, 1.3), color: 'blanco', contorno: false },
  { d: poligono([[0, -9.2], [-1.3, -6.9], [1.3, -6.9]]), color: 'blanco', contorno: false },
]

// ---- frente

// Montones de pelotitas en las esquinas, delante de las defensas
const MONTONES: Pieza[] = [
  [-6, 20.5, 4, 'acento'], [-1, 21.5, 3.4, 'sol'], [-9.5, 22.6, 2.6, 'menta'], [2.5, 22.8, 2.2, 'servicio'],
  [50, 21, 4, 'servicio'], [55.5, 21.8, 3.4, 'acento'], [46, 22.8, 2.4, 'menta'], [58, 23, 2.2, 'sol'],
].flatMap(([x, y, r, color]) => [
  { d: circulo(x as number, y as number, r as number), color: color as ColorPieza },
  { d: circulo((x as number) - (r as number) * 0.4, (y as number) - (r as number) * 0.4, (r as number) * 0.2), color: 'blanco' as const, contorno: false },
])

// Globos que suben y estrellas que caen
const GLOBOS: Pieza[][] = COLORES_JUEGO.map((color) => [
  { d: linea([[0, 4], [0.8, 8], [-0.6, 11]]), color: 'tinta' as const, trazo: true, ancho: 0.35 },
  ...globo(0, 0, 2.4, 3, color as ColorPieza),
])
const JUEGO: Pieza[][] = [
  [{ d: estrella(0, 0, 2.8, 1.2), color: 'sol' }],
  [{ d: destello(0, 0, 3.2), color: 'acento' }],
  [{ d: corazon(0, 0, 1.7), color: 'servicio' }],
]

export const CAPAS_DIA_DEL_NINO: CapaVector[] = [
  // fondo
  { x: 0, y: 0, plano: 'fondo', piezas: ARCOIRIS },
  ...destellosDeFondo([[6, -15, 2.6, 0.1], [44, -17, 2.4, 0.5], [26, -23, 2, 0.8]]),
  ...lluvia([BURBUJA], RITMO_BURBUJAS, { x: -6, ancho: 62, y: 4, alto: 14 }, SUBIDA, 3, 0, 'fondo'),
  // cuerpo
  { x: 8, y: 1, anima: 'saltito', piezas: CUBOS },
  { x: 24, y: 1, anima: 'saltito', piezas: PELOTA },
  { x: 41, y: 1, anima: 'cabeceo', piezas: PALETA },
  // frente
  { x: 0, y: 0, plano: 'frente', piezas: MONTONES },
  ...lluvia(GLOBOS, RITMO_GLOBOS, { x: -4, ancho: 58, y: 10, alto: 10 }, SUBIDA, 4, 20, 'frente'),
  ...lluvia(JUEGO, RITMO_CONFETI, { x: -6, ancho: 62, y: -14, alto: 10 }, CAIDA, 5, 160, 'frente'),
  ...rafaga(ORIGEN_RAFAGA, COLORES_JUEGO, 18),
]
