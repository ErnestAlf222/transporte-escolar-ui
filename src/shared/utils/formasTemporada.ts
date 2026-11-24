// Herramientas para dibujar las escenas de temporada en vector (estilo grueso y redondeado). Las coordenadas
// son las de la cuadrícula de VAN (spritesVan.ts): una unidad = un pixel de la camioneta; la columna 0 es el
// borde trasero, la fila 1 el techo, el piso está en la fila 23 y las filas negativas quedan sobre el techo.

export type Animacion =
  | 'titila-a'
  | 'titila-b'
  | 'cae'
  | 'balanceo'
  | 'cabeceo'
  | 'pulso'
  | 'saltito'
  | 'rafaga'
  | 'estalla'
  | 'gira'

// Dónde se dibuja una capa: 'fondo' va detrás de la camioneta, 'cuerpo' viaja con ella (rebota con ella) y
// 'frente' queda delante, quieto respecto de la camioneta
export type Plano = 'fondo' | 'cuerpo' | 'frente'

// Cada color es un token de main.css (ver DecoracionVan.vue); "Sombra" es el mismo token oscurecido con tinta
// para el volumen plano, y "tinta" es el token de texto, el que mejor contrasta en claro y oscuro
export type ColorPieza =
  | 'acento'
  | 'acentoSombra'
  | 'sol'
  | 'solSombra'
  | 'menta'
  | 'mentaSombra'
  | 'servicio'
  | 'servicioSombra'
  | 'blanco'
  | 'tinta'

export interface Pieza {
  d: string // trazado SVG
  color: ColorPieza
  contorno?: boolean // por omisión sí: borde grueso del token de texto alrededor de la forma
  trazo?: boolean // línea en vez de relleno
  ancho?: number // grosor de la línea, si es trazo
  opacidad?: number
  huecos?: boolean // las partes que se cruzan quedan vacías (papel picado)
}

export interface CapaVector {
  x: number
  y: number
  piezas: Pieza[]
  plano?: Plano // por omisión, 'cuerpo'
  anima?: Animacion
  fase?: number // 0 a 1: en qué punto del ciclo arranca, para que no se muevan todas a la vez
  caida?: number // 'cae': cuántos pixeles baja en cada vuelta (negativo = sube)
  deriva?: number // 'cae': cuántos pixeles se desvía hacia un lado mientras baja
  velocidad?: number // 'cae': 1 = ritmo normal; menos de 1 cae más rápido y más de 1 más lento
  giro?: number // 'cae' y 'rafaga': grados que da mientras se mueve
  salidaX?: number // 'rafaga': hasta dónde llega a los lados
  salidaY?: number // 'rafaga': hasta dónde llega hacia arriba (negativo) o abajo
}

export type Punto = readonly [number, number]

const r2 = (n: number) => Math.round(n * 100) / 100

// ---- formas (todas se recorren en el mismo sentido para que al unirse no se hagan huecos)

export function circulo(cx: number, cy: number, r: number): string {
  return `M${r2(cx - r)} ${r2(cy)}a${r} ${r} 0 1 1 ${r2(2 * r)} 0a${r} ${r} 0 1 1 ${r2(-2 * r)} 0Z`
}

export function pastilla(x: number, y: number, ancho: number, alto: number): string {
  const r = alto / 2
  return `M${r2(x + r)} ${y}H${r2(x + ancho - r)}a${r} ${r} 0 0 1 0 ${alto}H${r2(x + r)}a${r} ${r} 0 0 1 0 ${-alto}Z`
}

// Rectángulo de esquinas redondas
export function rectRedondeado(x: number, y: number, ancho: number, alto: number, r: number): string {
  return `M${r2(x + r)} ${y}H${r2(x + ancho - r)}A${r} ${r} 0 0 1 ${r2(x + ancho)} ${r2(y + r)}V${r2(y + alto - r)}A${r} ${r} 0 0 1 ${r2(x + ancho - r)} ${r2(y + alto)}H${r2(x + r)}A${r} ${r} 0 0 1 ${x} ${r2(y + alto - r)}V${r2(y + r)}A${r} ${r} 0 0 1 ${r2(x + r)} ${y}Z`
}

export function poligono(puntos: ReadonlyArray<Punto>): string {
  return puntos.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${r2(x)} ${r2(y)}`).join('') + 'Z'
}

// Línea quebrada abierta (para trazos)
export function linea(puntos: ReadonlyArray<Punto>): string {
  return puntos.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${r2(x)} ${r2(y)}`).join('')
}

// Destello de cuatro puntas
export function destello(cx: number, cy: number, r: number): string {
  const c = r * 0.22
  return `M${cx} ${r2(cy - r)}Q${r2(cx + c)} ${r2(cy - c)} ${r2(cx + r)} ${cy}Q${r2(cx + c)} ${r2(cy + c)} ${cx} ${r2(cy + r)}Q${r2(cx - c)} ${r2(cy + c)} ${r2(cx - r)} ${cy}Q${r2(cx - c)} ${r2(cy - c)} ${cx} ${r2(cy - r)}Z`
}

// Estrella de varias puntas con la punta principal hacia arriba
export function estrella(cx: number, cy: number, radio: number, interior: number, puntas = 5): string {
  const vertices = Array.from({ length: puntas * 2 }, (_, k) => {
    const r = k % 2 === 0 ? radio : interior
    const ang = -Math.PI / 2 + (k * Math.PI) / puntas
    return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)] as const
  })
  return poligono(vertices)
}

// Copo de seis brazos gruesos: tres barras cruzadas y un centro redondo
export function copo(cx: number, cy: number, largo: number, grosor: number): string {
  const barras = [0, 60, 120].map((grados) => {
    const a = (grados * Math.PI) / 180
    const [ux, uy] = [Math.cos(a), Math.sin(a)]
    const [vx, vy] = [-uy, ux]
    const punto = (l: number, g: number) => [cx + ux * l + vx * g, cy + uy * l + vy * g] as const
    return poligono([punto(-largo, -grosor), punto(largo, -grosor), punto(largo, grosor), punto(-largo, grosor)])
  })
  return barras.join('') + circulo(cx, cy, grosor * 2.1)
}

// Hoja puntiaguda centrada en (cx, cy), de largo y ancho dados, girada los grados indicados
export function hoja(cx: number, cy: number, largo: number, ancho: number, grados: number): string {
  const a = (grados * Math.PI) / 180
  const [ux, uy] = [Math.cos(a), Math.sin(a)]
  const [vx, vy] = [-uy, ux]
  const p = (l: number, g: number) => `${r2(cx + ux * l + vx * g)} ${r2(cy + uy * l + vy * g)}`
  return `M${p(-largo / 2, 0)}Q${p(0, ancho)} ${p(largo / 2, 0)}Q${p(0, -ancho)} ${p(-largo / 2, 0)}Z`
}

// Llama de vela con la base en (cx, y)
export function llama(cx: number, y: number, alto: number, ancho: number): string {
  return `M${cx} ${r2(y - alto)}C${r2(cx + ancho * 0.2)} ${r2(y - alto * 0.6)} ${r2(cx + ancho)} ${r2(y - alto * 0.35)} ${r2(cx + ancho)} ${y}A${ancho} ${r2(ancho * 0.9)} 0 0 1 ${r2(cx - ancho)} ${y}C${r2(cx - ancho)} ${r2(y - alto * 0.35)} ${r2(cx - ancho * 0.2)} ${r2(y - alto * 0.6)} ${cx} ${r2(y - alto)}Z`
}

// Banderín de papel picado: cuelga de (0, 0), tiene el borde de abajo en picos y huecos recortados
export function papelPicado(ancho: number, alto: number): string {
  const w = ancho
  const h = alto
  const marco = poligono([
    [0, 0],
    [w, 0],
    [w, h * 0.82],
    [w * 0.75, h],
    [w * 0.5, h * 0.82],
    [w * 0.25, h],
    [0, h * 0.82],
  ])
  const rombo = (cx: number, cy: number, t: number) =>
    poligono([
      [cx, cy - t],
      [cx + t, cy],
      [cx, cy + t],
      [cx - t, cy],
    ])
  return marco + circulo(w / 2, h * 0.3, w * 0.17) + rombo(w * 0.27, h * 0.58, w * 0.12) + rombo(w * 0.73, h * 0.58, w * 0.12)
}

// Punto de una curva de Bézier cuadrática en t (0 a 1)
export function puntoEnCurva(p0: Punto, p1: Punto, p2: Punto, t: number): [number, number] {
  const u = 1 - t
  return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]
}

// ---- flores

// Rosa de capas: tres círculos concéntricos y un brillo
export function rosa(cx: number, cy: number, r: number, color: 'acento' = 'acento'): Pieza[] {
  return [
    { d: circulo(cx, cy, r), color },
    { d: circulo(cx, cy, r * 0.68), color: 'acentoSombra' },
    { d: circulo(cx + r * 0.04, cy, r * 0.36), color },
    { d: circulo(cx - r * 0.45, cy - r * 0.5, r * 0.16), color: 'blanco', contorno: false },
  ]
}

// Flor de pétalos redondos (cempasúchil): ocho pétalos alrededor de un centro
export function flor(cx: number, cy: number, r: number, petalo: ColorPieza = 'sol', centro: ColorPieza = 'acento'): Pieza[] {
  const petalos: Pieza[] = Array.from({ length: 8 }, (_, k) => {
    const a = (k * Math.PI) / 4
    return { d: circulo(cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62, r * 0.42), color: petalo }
  })
  return [...petalos, { d: circulo(cx, cy, r * 0.42), color: centro }]
}

// ---- generadores de capas

// Capas de elementos que caen (o suben, con caída negativa), cada uno a su ritmo
export function lluvia(
  tipos: Pieza[][],
  ritmos: number[],
  area: { x: number; ancho: number; y: number; alto: number },
  caida: number,
  deriva: number,
  giro: number,
  plano: Plano,
): CapaVector[] {
  return ritmos.map((velocidad, i) => ({
    x: area.x + ((i * 37) % area.ancho),
    y: area.y + ((i * 11) % area.alto),
    plano,
    anima: 'cae' as const,
    fase: (i * 0.618) % 1,
    caida,
    deriva: i % 2 === 0 ? deriva : -deriva,
    velocidad,
    giro: i % 2 === 0 ? giro : -giro,
    piezas: tipos[i % tipos.length]!,
  }))
}

// Ráfaga de confeti al aparecer el loader: sale en abanico desde `origen`
export function rafaga(origen: Punto, colores: ReadonlyArray<ColorPieza>, cantidad: number): CapaVector[] {
  return Array.from({ length: cantidad }, (_, i) => {
    const ang = ((i * 360) / cantidad + (i % 2) * 11) * (Math.PI / 180)
    const radio = 14 + (i % 3) * 5
    return {
      x: origen[0],
      y: origen[1],
      plano: 'frente' as const,
      anima: 'rafaga' as const,
      fase: (i % 4) / 4,
      salidaX: Math.round(Math.cos(ang) * radio * 1.3),
      salidaY: Math.round(Math.sin(ang) * radio * 0.9 - 6),
      giro: i % 2 === 0 ? 240 : -240,
      piezas: [
        { d: i % 3 === 0 ? circulo(0, 0, 0.9) : pastilla(-1, -0.5, 2, 1), color: colores[i % colores.length]!, contorno: false },
      ],
    }
  })
}

// Destellos que laten en el cielo; cada uno es [x, y, radio, fase]
export function destellosDeFondo(lista: ReadonlyArray<readonly [number, number, number, number]>, color: ColorPieza = 'sol'): CapaVector[] {
  return lista.map(([x, y, r, fase]) => ({
    x,
    y,
    plano: 'fondo' as const,
    anima: 'pulso' as const,
    fase,
    piezas: [{ d: destello(0, 0, r), color, contorno: false }],
  }))
}

// Fuego artificial: rayos con puntos en las puntas que se abren, brillan y se apagan en bucle
export function fuegoArtificial(x: number, y: number, radio: number, color: ColorPieza, fase: number): CapaVector {
  const rayos = 10
  const piezas: Pieza[] = []
  for (let k = 0; k < rayos; k++) {
    const a = (k * 2 * Math.PI) / rayos
    const [c, s] = [Math.cos(a), Math.sin(a)]
    const largo = k % 2 === 0 ? radio : radio * 0.72
    piezas.push(
      { d: linea([[c * radio * 0.3, s * radio * 0.3], [c * largo, s * largo]]), color, trazo: true, ancho: 1 },
      { d: circulo(c * largo, s * largo, 0.9), color, contorno: false },
    )
  }
  piezas.push({ d: circulo(0, 0, radio * 0.16), color: 'blanco', contorno: false })
  return { x, y, plano: 'fondo', anima: 'estalla', fase, piezas }
}

// Cuerda de banderines de papel picado de (x0, y0) a (x1, y1) con un hundimiento al centro
export function guirnaldaPapel(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  hundimiento: number,
  colores: ReadonlyArray<ColorPieza>,
  banderin: { ancho: number; alto: number; separacion: number },
  plano: Plano,
  desfase = 0,
): CapaVector[] {
  const alturaEn = (x: number) => {
    const t = (x - x0) / (x1 - x0)
    return y0 + (y1 - y0) * t + hundimiento * Math.sin(Math.PI * t)
  }
  const puntos: Punto[] = Array.from({ length: x1 - x0 + 1 }, (_, i) => [x0 + i, alturaEn(x0 + i)] as const)
  const capas: CapaVector[] = [{ x: 0, y: 0, plano, piezas: [{ d: linea(puntos), color: 'tinta', trazo: true, ancho: 0.6 }] }]
  for (let x = x0 + banderin.separacion / 2, i = 0; x <= x1 - banderin.separacion / 2; x += banderin.separacion, i++) {
    capas.push({
      x: x - banderin.ancho / 2,
      y: alturaEn(x) + 0.3,
      plano,
      anima: 'balanceo',
      fase: (i * 0.23 + desfase) % 1,
      piezas: [{ d: papelPicado(banderin.ancho, banderin.alto), color: colores[(i + Math.round(desfase * 10)) % colores.length]!, huecos: true }],
    })
  }
  return capas
}

// ---- formas de las escenas de cariño y de juego

// Corazón centrado en (cx, cy) de unos 2,4 r de ancho
export function corazon(cx: number, cy: number, r: number): string {
  return `M${cx} ${r2(cy + r * 0.95)}C${r2(cx - r * 1.5)} ${r2(cy + r * 0.1)} ${r2(cx - r * 0.95)} ${r2(cy - r * 1.05)} ${cx} ${r2(cy - r * 0.35)}C${r2(cx + r * 0.95)} ${r2(cy - r * 1.05)} ${r2(cx + r * 1.5)} ${r2(cy + r * 0.1)} ${cx} ${r2(cy + r * 0.95)}Z`
}

export function elipse(cx: number, cy: number, rx: number, ry: number): string {
  return `M${r2(cx - rx)} ${cy}a${rx} ${ry} 0 1 1 ${r2(2 * rx)} 0a${rx} ${ry} 0 1 1 ${r2(-2 * rx)} 0Z`
}

// Globo con brillo y nudo, centrado en (cx, cy); la cuerda sale del nudo hacia abajo
export function globo(cx: number, cy: number, rx: number, ry: number, color: ColorPieza, forma: 'redondo' | 'corazon' = 'redondo'): Pieza[] {
  return [
    { d: forma === 'corazon' ? corazon(cx, cy, rx) : elipse(cx, cy, rx, ry), color },
    { d: circulo(cx - rx * 0.45, cy - ry * 0.45, rx * 0.2), color: 'blanco', contorno: false },
    { d: poligono([[cx, cy + ry * 0.95], [cx - 0.9, cy + ry * 0.95 + 1.4], [cx + 0.9, cy + ry * 0.95 + 1.4]]), color },
  ]
}

// Estandarte con cola de golondrina y estrella en un asta; sale de (0, 0) = la punta del asta
export function estandarte(alto: number, color: ColorPieza): Pieza[] {
  return [
    { d: rectRedondeado(-0.5, 0, 1, alto, 0.4), color: 'tinta', contorno: false },
    { d: circulo(0, -0.6, 1.4), color: 'sol' },
    { d: poligono([[0.5, 2], [9, 2], [9, 14], [4.75, 11.5], [0.5, 14]]), color },
    { d: estrella(4.75, 6.6, 2.3, 1), color: 'sol', contorno: false },
  ]
}

// ---- útiles de la escuela

// Lápiz parado con la punta arriba; la base está en (cx, base)
export function lapiz(cx: number, base: number, alto: number, color: ColorPieza): Pieza[] {
  const w = 2.6
  const tope = base - alto
  return [
    { d: rectRedondeado(cx - w / 2, tope + 3.4, w, alto - 3.4, 0.5), color },
    { d: poligono([[cx - w / 2, tope + 3.4], [cx + w / 2, tope + 3.4], [cx, tope]]), color: 'blanco' },
    { d: poligono([[cx - 0.7, tope + 1.6], [cx + 0.7, tope + 1.6], [cx, tope]]), color: 'servicioSombra', contorno: false },
    { d: linea([[cx - 0.5, tope + 4.6], [cx - 0.5, base - 1]]), color: 'blanco', trazo: true, ancho: 0.4, opacidad: 0.6 },
  ]
}

// Libro acostado con las hojas a la derecha y una cinta; la base está en (cx, base)
export function libro(cx: number, base: number, ancho: number, color: ColorPieza): Pieza[] {
  const [x0, x1] = [cx - ancho / 2, cx + ancho / 2]
  return [
    { d: rectRedondeado(x0, base - 3.6, ancho, 3.6, 0.8), color },
    { d: poligono([[x1 - 3, base - 3], [x1 - 0.5, base - 3], [x1 - 0.5, base - 0.7], [x1 - 3, base - 0.7]]), color: 'blanco', contorno: false },
    { d: linea([[x0 + 2.4, base - 3.4], [x0 + 2.4, base - 0.2]]), color: 'sol', trazo: true, ancho: 0.6 },
  ]
}
