import {
  circulo,
  copo,
  destello,
  pastilla,
  poligono,
  puntoEnCurva,
  type CapaVector,
  type Pieza,
} from '@/shared/utils/formasTemporada'

// Escena de Navidad en vector grueso. Es la vara de estilo de los temas de temporada; para otro tema se copia
// este archivo y se cambian los dibujos, manteniendo las reglas:
//  - fondo (detrás), cuerpo (viaja con la camioneta) y frente (delante) con elementos en cada plano
//  - formas gordas y redondeadas con contorno de tinta; brillo blanco y sombra plana en un lado
//  - el elemento principal mide cerca de la mitad del ancho de la camioneta (50 columnas)
//  - cada plano se mueve a su ritmo: lo cercano rápido, lo lejano lento

const RITMO_NIEVE_LEJOS = [1.5, 1.8, 1.6, 1.9, 1.7, 1.55, 1.85, 1.65, 1.75, 1.6]
const RITMO_NIEVE_CERCA = [0.55, 0.7, 0.62, 0.8, 0.58, 0.75, 0.66, 0.85]
const CAIDA_NIEVE = 34 // cuánto baja cada copo en una vuelta
const FONDO_NIEVE = { x: -8, ancho: 64, y: -14, alto: 12 }
const COLUMNAS_NIEVE_CERCA = [-7, 6, 13, 21, 29, 37, 46, 54]
const PUNTOS_ANCLA = [2, 17, 33, 48] // de dónde cuelga la guirnalda
const ALTO_ANCLA = 2.5
const HUNDIMIENTO = 8.5 // punto de control de cada tramo combado
const POSICIONES_FOCO = [0.22, 0.5, 0.78] // dónde cuelgan los focos, a lo largo de cada tramo
const COLORES_FOCO = ['acento', 'sol', 'menta', 'servicio'] as const
const CONFETI = 16
const COLORES_CONFETI = ['acento', 'sol', 'menta', 'servicio'] as const
const ORIGEN_RAFAGA = { x: 24, y: -5 }

// ---- fondo

// Pino de tres pisos con nieve en las puntas; sale de (0, 0) hacia arriba y se escala con k
function pino(x: number, base: number, k: number): CapaVector {
  const tri = (a: number[], sombra = false) => {
    const [xi, yb, , yp, xd] = a as [number, number, number, number, number]
    return poligono(sombra ? [[0, yp * k], [xd * k, yb * k], [0, yb * k]] : [[xi * k, yb * k], [0, yp * k], [xd * k, yb * k]])
  }
  const pisos = [
    [-8, -3, 0, -13, 8],
    [-6.5, -9, 0, -19, 6.5],
    [-5, -15, 0, -24, 5],
  ]
  const piezas: Pieza[] = [{ d: poligono([[-1.6 * k, -4.5 * k], [1.6 * k, -4.5 * k], [1.6 * k, 0], [-1.6 * k, 0]]), color: 'solSombra' }]
  pisos.forEach((a) => {
    piezas.push({ d: tri(a), color: 'menta' })
    piezas.push({ d: tri(a, true), color: 'mentaSombra', contorno: false })
  })
  pisos.forEach(([, yb, , yp]) => {
    const pun = yp!
    const alto = (pun - yb!) * -0.38 // la nieve cubre la parte de arriba de cada piso
    piezas.push({
      d: poligono([
        [-2.6 * k, (pun + alto) * k],
        [0, pun * k],
        [2.6 * k, (pun + alto) * k],
        [1.3 * k, (pun + alto + 1.1) * k],
        [0, (pun + alto - 0.1) * k],
        [-1.3 * k, (pun + alto + 1.1) * k],
      ]),
      color: 'blanco',
      contorno: false,
    })
  })
  return { x, y: base, plano: 'fondo', piezas }
}

const estrellasDeFondo: CapaVector[] = [
  [8, -16, 2.6, 0.1],
  [30, -20, 3.2, 0.5],
  [46, -14, 2.2, 0.8],
].map(([x, y, r, fase]) => ({
  x: x!,
  y: y!,
  plano: 'fondo',
  anima: 'pulso',
  fase,
  piezas: [{ d: destello(0, 0, r!), color: 'sol', contorno: false }],
}))

const nieveLejana: CapaVector[] = RITMO_NIEVE_LEJOS.map((velocidad, i) => ({
  x: FONDO_NIEVE.x + ((i * 37) % FONDO_NIEVE.ancho),
  y: FONDO_NIEVE.y + ((i * 5) % FONDO_NIEVE.alto),
  plano: 'fondo' as const,
  anima: 'cae' as const,
  fase: (i * 0.618) % 1,
  caida: CAIDA_NIEVE,
  deriva: i % 2 === 0 ? 3 : -3,
  velocidad,
  piezas: [{ d: circulo(0, 0, 0.9), color: 'servicio', contorno: false }],
}))

// ---- cuerpo

// Gorro de Santa de 33 columnas (más de la mitad de la camioneta): sale de (0, 0) = centro del borde del gorro
const GORRO: Pieza[] = [
  { d: 'M-12 0C-12 -9 -6 -17 3 -17C12 -17 18 -11 19 -4C15 -6 12 -4 12 0Z', color: 'acento' },
  { d: 'M12 0C12 -4 15 -6 19 -4C18.4 -8.5 15.8 -12 12 -14C13 -8 12.3 -3 12 0Z', color: 'acentoSombra', contorno: false },
  { d: 'M-8 -5C-8.6 -9.5 -6.6 -12.6 -3.8 -14.2C-5.3 -11 -6 -8 -5.8 -5Z', color: 'blanco', contorno: false, opacidad: 0.85 },
  { d: pastilla(-14.5, -3.4, 29, 5.6), color: 'blanco' },
  { d: circulo(19.5, -3.2, 3.6), color: 'blanco' },
]

// Guirnalda de tres tramos combados con focos gordos; los focos se encienden por turnos en dos tandas
const TRAMOS = PUNTOS_ANCLA.slice(0, -1).map((x0, i) => ({
  p0: [x0, ALTO_ANCLA] as const,
  p1: [(x0 + PUNTOS_ANCLA[i + 1]!) / 2, HUNDIMIENTO] as const,
  p2: [PUNTOS_ANCLA[i + 1]!, ALTO_ANCLA] as const,
}))

const HILO: Pieza = {
  d: `M${PUNTOS_ANCLA[0]} ${ALTO_ANCLA}` + TRAMOS.map((t) => `Q${t.p1[0]} ${t.p1[1]} ${t.p2[0]} ${t.p2[1]}`).join(''),
  color: 'tinta',
  trazo: true,
  ancho: 0.7,
}

function focos(tanda: 0 | 1): Pieza[] {
  const piezas: Pieza[] = []
  TRAMOS.forEach((t, s) =>
    POSICIONES_FOCO.forEach((pos, k) => {
      const n = s * POSICIONES_FOCO.length + k
      if (n % 2 !== tanda) return
      const [x, y] = puntoEnCurva(t.p0, t.p1, t.p2, pos)
      const color = COLORES_FOCO[n % COLORES_FOCO.length]!
      piezas.push(
        { d: circulo(x, y + 2.8, 3.8), color, contorno: false, opacidad: 0.3 }, // resplandor
        { d: pastilla(x - 0.9, y - 0.5, 1.8, 1.5), color: 'tinta' },
        { d: circulo(x, y + 2.8, 1.9), color },
        { d: circulo(x - 0.65, y + 2.1, 0.5), color: 'blanco', contorno: false },
      )
    }),
  )
  return piezas
}

// ---- frente

// Drifts de nieve en las esquinas, delante de las defensas
const MONTONES: Pieza[] = [
  { d: 'M-10 24L-10 21C-8 17.5 -3 17 0 19.5C2 17.5 6 18 7 24Z', color: 'blanco' },
  { d: 'M43 24C43 20 47 17.5 51 19C54 17 58 19 59 24Z', color: 'blanco' },
]

const COPOS_CERCA: Pieza[][] = [
  [{ d: copo(0, 0, 3.4, 0.6), color: 'blanco' }],
  [{ d: destello(0, 0, 3.4), color: 'blanco' }],
  [{ d: circulo(0, 0, 1.8), color: 'blanco' }],
]

const nieveCercana: CapaVector[] = RITMO_NIEVE_CERCA.map((velocidad, i) => ({
  x: COLUMNAS_NIEVE_CERCA[i]!,
  y: -14 + ((i * 7) % 10),
  plano: 'frente' as const,
  anima: 'cae' as const,
  fase: (i * 0.382) % 1,
  caida: CAIDA_NIEVE,
  deriva: i % 2 === 0 ? 5 : -5,
  velocidad,
  giro: i % 2 === 0 ? 120 : -120,
  piezas: COPOS_CERCA[i % COPOS_CERCA.length]!,
}))

// Ráfaga de confeti al aparecer el loader: sale en abanico desde el gorro
const confeti: CapaVector[] = Array.from({ length: CONFETI }, (_, i) => {
  const ang = ((i * 360) / CONFETI + (i % 2) * 11) * (Math.PI / 180)
  const radio = 14 + (i % 3) * 5
  const color = COLORES_CONFETI[i % COLORES_CONFETI.length]!
  return {
    x: ORIGEN_RAFAGA.x,
    y: ORIGEN_RAFAGA.y,
    plano: 'frente' as const,
    anima: 'rafaga' as const,
    fase: (i % 4) / 4,
    salidaX: Math.round(Math.cos(ang) * radio * 1.3),
    salidaY: Math.round(Math.sin(ang) * radio * 0.9 - 6),
    giro: i % 2 === 0 ? 240 : -240,
    piezas: [{ d: i % 3 === 0 ? circulo(0, 0, 0.9) : pastilla(-1, -0.5, 2, 1), color, contorno: false }],
  }
})

export const CAPAS_NAVIDAD: CapaVector[] = [
  // fondo
  ...estrellasDeFondo,
  pino(-1, 23, 1.25),
  pino(52, 23, 1),
  ...nieveLejana,
  // cuerpo
  { x: 0, y: 0, piezas: [HILO] },
  { x: 0, y: 0, anima: 'titila-a', piezas: focos(0) },
  { x: 0, y: 0, anima: 'titila-b', piezas: focos(1) },
  { x: 33, y: 1, anima: 'saltito', piezas: GORRO },
  // frente
  { x: 0, y: 0, plano: 'frente', piezas: MONTONES },
  ...nieveCercana,
  ...confeti,
]
