import {
  circulo,
  destellosDeFondo,
  hoja,
  llama,
  lluvia,
  poligono,
  puntoEnCurva,
  rafaga,
  rectRedondeado,
  rosa,
  type CapaVector,
  type Pieza,
  type Punto,
} from '@/shared/utils/formasTemporada'

// Escena de Guadalupe: rosas, rayos de luz, flores y velas (sin figuras religiosas). Mismo estilo que
// escenaNavidad.ts: tres planos, contorno de tinta, volumen plano, elemento principal de casi toda la
// camioneta (el arco de rosas mide 46 de 50 columnas) y cada plano a su ritmo.

const RITMO_PETALOS = [0.55, 0.7, 0.62, 0.8, 0.58, 0.75, 0.66, 0.85]
const CAIDA = 34
const ORIGEN_RAFAGA = [25, -12.5] as const
const CENTRO_RAYOS = [25, -1] as const
const RAYOS_LARGOS = 9
const ALCANCE_RAYO_LARGO = 24
const ALCANCE_RAYO_CORTO = 17
const SEPARACION_RAYOS = 20 // grados entre un rayo y el siguiente
const APERTURA_RAYO = 0.09 // qué tan ancho es cada rayo en la base (radianes)
const ARCO: readonly [Punto, Punto, Punto] = [[2, 1], [25, -26], [48, 1]]
const POSICIONES_ROSA = [0.08, 0.22, 0.36, 0.64, 0.78, 0.92]

// ---- fondo

// Rayos de luz en abanico detrás del arco, en dos tandas que laten por turnos
function rayos(largos: boolean): Pieza[] {
  return Array.from({ length: largos ? RAYOS_LARGOS : RAYOS_LARGOS - 1 }, (_, k) => {
    const a = (((largos ? -170 : -160) + k * SEPARACION_RAYOS) * Math.PI) / 180
    const alcance = largos ? ALCANCE_RAYO_LARGO : ALCANCE_RAYO_CORTO
    const punto = (r: number, da: number) => [Math.cos(a + da) * r, Math.sin(a + da) * r] as const
    return {
      d: poligono([punto(6, -APERTURA_RAYO), punto(alcance, 0), punto(6, APERTURA_RAYO)]),
      color: largos ? ('sol' as const) : ('solSombra' as const),
      contorno: false,
    }
  })
}

// ---- cuerpo

// Arco de rosas de 46 columnas sobre el techo: tallo con hojas y rosas, la del centro la más grande
const [P0, P1, P2] = ARCO
const TALLO: Pieza = {
  d: `M${P0[0]} ${P0[1]}Q${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]}`,
  color: 'mentaSombra',
  trazo: true,
  ancho: 1.8,
}

const HOJAS: Pieza[] = [0.15, 0.29, 0.43, 0.57, 0.71, 0.85].map((t, k) => {
  const [x, y] = puntoEnCurva(P0, P1, P2, t)
  return { d: hoja(x, y + (k % 2 === 0 ? 1.6 : -1.6), 4.4, 1.3, k % 2 === 0 ? 60 : -60), color: 'menta' as const }
})

const ROSAS: Pieza[] = POSICIONES_ROSA.flatMap((t, k) => {
  const [x, y] = puntoEnCurva(P0, P1, P2, t)
  return rosa(x, y, k === 2 || k === 3 ? 3.6 : 2.9)
})

const ROSA_CENTRAL: Pieza[] = rosa(0, 0, 5.2)
const BOTONES: Pieza[] = [0.15, 0.29, 0.43, 0.57, 0.71, 0.85].map((t) => {
  const [x, y] = puntoEnCurva(P0, P1, P2, t)
  return { d: circulo(x, y + 0.4, 0.8), color: 'sol' as const, contorno: false }
})

// ---- frente

function vela(alto: number): Pieza[] {
  return [
    { d: rectRedondeado(-1.8, -alto, 3.6, alto, 1), color: 'blanco' },
    { d: `M-1.8 ${-alto + 2.2}h3.6`, color: 'sol', trazo: true, ancho: 0.6 },
  ]
}
const LLAMA: Pieza[] = [
  { d: llama(0, 0, 4.6, 1.6), color: 'sol' },
  { d: llama(0, -0.2, 2.3, 0.75), color: 'acento', contorno: false },
]

const PETALOS: Pieza[][] = [
  [{ d: hoja(0, 0, 3.4, 1.3, 40), color: 'acento' }],
  [{ d: hoja(0, 0, 3, 1.1, -40), color: 'acentoSombra' }],
  [{ d: circulo(0, 0, 1.2), color: 'sol' }],
]

export const CAPAS_GUADALUPE: CapaVector[] = [
  // fondo
  { x: CENTRO_RAYOS[0], y: CENTRO_RAYOS[1], plano: 'fondo', anima: 'pulso', fase: 0, piezas: rayos(true) },
  { x: CENTRO_RAYOS[0], y: CENTRO_RAYOS[1], plano: 'fondo', anima: 'pulso', fase: 0.5, piezas: rayos(false) },
  ...destellosDeFondo([[4, -14, 2.4, 0.2], [46, -16, 2.8, 0.6], [25, -27, 2, 0.9]]),
  // cuerpo
  { x: 0, y: 0, piezas: [TALLO, ...HOJAS, ...ROSAS, ...BOTONES] },
  { x: 25, y: -12.5, anima: 'saltito', piezas: ROSA_CENTRAL },
  // frente
  { x: -3, y: 23.6, plano: 'frente', piezas: vela(7) },
  { x: -3, y: 16.6, plano: 'frente', anima: 'pulso', fase: 0.1, piezas: LLAMA },
  { x: 2.5, y: 23.6, plano: 'frente', piezas: vela(10) },
  { x: 2.5, y: 13.6, plano: 'frente', anima: 'pulso', fase: 0.6, piezas: LLAMA },
  { x: 47, y: 23.6, plano: 'frente', piezas: vela(10) },
  { x: 47, y: 13.6, plano: 'frente', anima: 'pulso', fase: 0.35, piezas: LLAMA },
  { x: 52.5, y: 23.6, plano: 'frente', piezas: vela(7) },
  { x: 52.5, y: 16.6, plano: 'frente', anima: 'pulso', fase: 0.8, piezas: LLAMA },
  ...lluvia(PETALOS, RITMO_PETALOS, { x: -6, ancho: 62, y: -14, alto: 10 }, CAIDA, 5, 160, 'frente'),
  ...rafaga(ORIGEN_RAFAGA, ['acento', 'sol', 'menta', 'acentoSombra'], 16),
]
