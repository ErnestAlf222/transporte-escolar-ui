import {
  circulo,
  destello,
  destellosDeFondo,
  estandarte,
  estrella,
  hoja,
  linea,
  lluvia,
  pastilla,
  poligono,
  rafaga,
  rectRedondeado,
  type CapaVector,
  type Pieza,
} from '@/shared/utils/formasTemporada'

// Escena de Benito Juárez: libro de leyes, balanza de la justicia, laurel, estrellas y estandartes. Sin rostros
// ni figuras de personas, sin tricolor ni escudo. Mismo estilo que escenaReyes.ts: tres planos, contorno de
// tinta, volumen plano, elemento principal de casi la mitad de la camioneta (el libro mide 24 de 50 columnas)
// y cada plano a su ritmo.

const RITMO_HOJAS = [0.55, 0.7, 0.62, 0.8, 0.58, 0.75, 0.66, 0.85]
const CAIDA = 34
const ORIGEN_RAFAGA = [18, -8] as const
const CENTRO_LAUREL = [18, -6] as const
const RADIO_LAUREL = 15
const HOJAS_POR_RAMA = 9

// ---- fondo

// Corona de laurel: dos ramas que suben por los lados y dejan abierto el arriba
const LAUREL: Pieza[] = [-1, 1].flatMap((lado) =>
  Array.from({ length: HOJAS_POR_RAMA }, (_, k) => {
    const grados = 100 + k * 17 // desde abajo hacia arriba por cada lado
    const a = ((lado === 1 ? 180 - grados : grados) * Math.PI) / 180
    const x = Math.cos(a) * RADIO_LAUREL
    const y = Math.sin(a) * RADIO_LAUREL
    return { d: hoja(x, y, 5.4, 1.7, (lado === 1 ? 180 - grados : grados) + 90 + (k % 2 === 0 ? 24 : -24)), color: k % 2 === 0 ? ('menta' as const) : ('mentaSombra' as const) }
  }),
)

// ---- cuerpo

// Libro de leyes abierto de 24 columnas: tapas, dos páginas con renglones y un listón; sale de (0, 0) = el
// centro del borde de abajo
const LIBRO: Pieza[] = [
  { d: poligono([[-13, -0.4], [0, 1], [13, -0.4], [13.4, -13], [0, -11.6], [-13.4, -13]]), color: 'acentoSombra' },
  { d: poligono([[-12, -1.8], [-0.6, -0.6], [-0.6, -12.6], [-12.2, -13.4]]), color: 'blanco' },
  { d: poligono([[12, -1.8], [0.6, -0.6], [0.6, -12.6], [12.2, -13.4]]), color: 'blanco' },
  ...[-3.2, -5.6, -8, -10.4].flatMap((y, k) => [
    { d: linea([[-10.4, y - k * 0.1 - 0.4], [-2.4, y + 0.4]]), color: 'servicioSombra' as const, trazo: true, ancho: 0.5 },
    { d: linea([[2.4, y + 0.4], [10.4, y - k * 0.1 - 0.4]]), color: 'servicioSombra' as const, trazo: true, ancho: 0.5 },
  ]),
  { d: poligono([[3.4, -12.6], [5.6, -12.4], [5.6, -3], [4.5, -4.4], [3.4, -3]]), color: 'sol', contorno: false },
]

// Balanza de dos platillos sobre un poste; el travesaño con los platillos se mece. Sale de (0, 0) = el pie del poste
const POSTE: Pieza[] = [
  { d: rectRedondeado(-0.8, -17, 1.6, 17.5, 0.5), color: 'solSombra' },
  { d: pastilla(-4, -1.4, 8, 2.4), color: 'sol' },
  { d: circulo(0, -17.5, 1.5), color: 'sol' },
]
const TRAVESANO: Pieza[] = [
  { d: pastilla(-8, -18.6, 16, 1.4), color: 'sol' },
  { d: linea([[-7.2, -17.2], [-9.6, -10]]), color: 'tinta', trazo: true, ancho: 0.4 },
  { d: linea([[-7.2, -17.2], [-4.8, -10]]), color: 'tinta', trazo: true, ancho: 0.4 },
  { d: linea([[7.2, -17.2], [4.8, -10]]), color: 'tinta', trazo: true, ancho: 0.4 },
  { d: linea([[7.2, -17.2], [9.6, -10]]), color: 'tinta', trazo: true, ancho: 0.4 },
  { d: 'M-10.4 -10H-4A3.2 2.6 0 0 1 -10.4 -10Z', color: 'sol' },
  { d: 'M4 -10H10.4A3.2 2.6 0 0 1 4 -10Z', color: 'sol' },
]

// ---- frente

// Montones de hojas de laurel en las esquinas, delante de las defensas
const MONTONES: Pieza[] = [
  { d: 'M-10 24L-10 21C-8.5 18 -4 17.5 -1 19.5C1 17.5 6 18 7 24Z', color: 'menta' },
  { d: 'M-1 19.5C1 17.5 6 18 7 24L1.5 24C2 22 1 20.5 -1 19.5Z', color: 'mentaSombra', contorno: false },
  { d: hoja(-6, 19.6, 4.4, 1.3, -30), color: 'mentaSombra' },
  { d: hoja(-2.5, 19, 4.4, 1.3, 30), color: 'menta' },
  { d: 'M43 24C43 20.5 47 17.8 51 19.2C54 17.2 58 19.5 59 24Z', color: 'menta' },
  { d: hoja(48, 19.6, 4.4, 1.3, -30), color: 'mentaSombra' },
  { d: hoja(53.5, 19.2, 4.4, 1.3, 30), color: 'menta' },
]

const CAIDOS: Pieza[][] = [
  [{ d: hoja(0, 0, 3.6, 1.3, 40), color: 'menta' }],
  [{ d: estrella(0, 0, 2.6, 1.1), color: 'sol' }],
  [{ d: hoja(0, 0, 3.2, 1.2, -40), color: 'mentaSombra' }],
  [{ d: destello(0, 0, 3), color: 'sol' }],
]

export const CAPAS_BENITO_JUAREZ: CapaVector[] = [
  // fondo
  { x: 52, y: 1 - 21, plano: 'fondo', anima: 'balanceo', fase: 0.4, piezas: estandarte(21, 'servicio') },
  { x: -2, y: 1 - 21, plano: 'fondo', anima: 'balanceo', fase: 0.1, piezas: estandarte(21, 'acento') },
  { x: CENTRO_LAUREL[0], y: CENTRO_LAUREL[1], plano: 'fondo', piezas: LAUREL },
  ...destellosDeFondo([[44, -17, 2.8, 0.1], [30, -23, 2.2, 0.5], [6, -22, 2, 0.8]]),
  // cuerpo
  { x: 40, y: 1, piezas: POSTE },
  { x: 40, y: 1, anima: 'balanceo', fase: 0.3, piezas: TRAVESANO },
  { x: 18, y: 1, anima: 'saltito', piezas: LIBRO },
  // frente
  { x: 0, y: 0, plano: 'frente', piezas: MONTONES },
  ...lluvia(CAIDOS, RITMO_HOJAS, { x: -6, ancho: 62, y: -14, alto: 10 }, CAIDA, 5, 160, 'frente'),
  ...rafaga(ORIGEN_RAFAGA, ['sol', 'menta', 'servicio', 'acento'], 18),
]
