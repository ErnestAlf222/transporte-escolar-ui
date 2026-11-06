// Dibujos en pixeles para el loader de la camioneta. Cada letra es un color (ver los estilos de
// LoaderVanJuego.vue) y el punto es transparente. La camioneta es una Toyota Hiace de perfil, mirando a la derecha.

export const VAN = [
  '...............ODYYYYYYYYYYYYYYYDO................',
  '....OOOOOOOOOOOODYYYYYYYYYYYYYYYDOOOOOOOOOO.......',
  '...OWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWO......',
  '..OWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWO.....',
  '.OWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWO.....',
  '.OWWWGHGGGGGWGHGGGGGWGHGGGGGWGHGGGGGWWGHGGGWWO....',
  '.OWWWGGHGGGGWGGHGGGGWGGHGGGGWGGHGGGGWWGGHGGGWO....',
  '.OWWWGGGGGGGWGGGGGGGWGGGGGGGWGGGGGGGWWGGGGGGWWO...',
  '.OWWWGGGGGGGWGGGGGGGWGGGGGGGWGGGGGGGWWGGGGGGGWOOO.',
  '.OWWWGGGGGGGWGGGGGGGWGGGGGGGWGGGGGGGWWGGGGGGGWWKKO',
  '.OTTWWWWWWWWWWLWWWWWWWWWWWWWWLWWWWWWLWWWWWWWWWWKKO',
  '.OTTWWWWWWWWWWLWWWWWWWWWWWWWWLWWWWWWLWWWWWWWWEEEO.',
  '.OTTWWWWWWWWWWLWWWWWWWWWWWWWWLWWWWWWLWWWWWWWWEEEO.',
  '.OWAAAAAAAAAAALAAAAAAAAALLLAALALLLAALAAAAAAAAOOOO.',
  '.OWAAAAOOOOOOOOOAAAAAAAAAAAAAAAAAOOOOOOOOOAAALLLO.',
  'OOWWWWWO.......OWWWWWWWWWWWWWLWWWO.......OWWWOOOO.',
  'KKKKWWWO.......OWWWWWWWWWWWWWLWWWO.......OWWKKKKKO',
  'KKKKWWWO.......OLLLLLLLLLLLLLLLLLO.......OLLKKKKKO',
  'KKKKWWWO.......OKKKKKKKKKKKKKKKKKO.......OKKKKKKKO',
  'OOOOOOO.........OOOOOOOOOOOOOOOOO.........OOOOOOO.',
]

// Dos cuadros de la rueda: se alternan para que parezca que gira
export const RUEDA_A = [
  '..OOOOO..',
  '.OKKKKKO.',
  'OKKKLKKKO',
  'OKKKLKKKO',
  'OKLLLLLKO',
  'OKKKLKKKO',
  'OKKKLKKKO',
  '.OKKKKKO.',
  '..OOOOO..',
]
export const RUEDA_B = [
  '..OOOOO..',
  '.OKKKKKO.',
  'OKLKKKLKO',
  'OKKLKLKKO',
  'OKKKLKKKO',
  'OKKLKLKKO',
  'OKLKKKLKO',
  '.OKKKKKO.',
  '..OOOOO..',
]

export const CONO = [
  '...O...',
  '..OYO..',
  '..OYO..',
  '.OWWWO.',
  '.OWWWO.',
  '.OYYYO.',
  'OYYYYYO',
  'OYYYYYO',
  'KKKKKKK',
]

export const NUBE = ['....SSSS........', '..SSSSSSSS.SSS..', '.SSSSSSSSSSSSSS.', 'SSSSSSSSSSSSSSSS']

export const LUNA = ['.MMMM.', 'MMM...', 'MM....', 'MM....', 'MMM...', '.MMMM.']

export const ESCUELA = [
  '......F.......',
  '......FFF.....',
  '......F.......',
  '..QQQQQQQQQQ..',
  '.QQQQQQQQQQQQ.',
  '.QZQZQQQQZQZQ.',
  '.QQQQQDDQQQQQ.',
  '.QZQZQDDQZQZQ.',
  'QQQQQQQQQQQQQQ',
]

export const ARBOL = ['..GG..', '.GGGG.', 'GGGGGG', '.GGGG.', '..RR..', '..RR..']

export interface Pixel {
  x: number
  y: number
  ancho: number
  color: string
}

// Une los pixeles contiguos del mismo color de una fila, para dibujar menos rectángulos
export function pixeles(sprite: string[]): Pixel[] {
  const resultado: Pixel[] = []
  sprite.forEach((fila, y) => {
    let x = 0
    while (x < fila.length) {
      const color = fila[x]!
      if (color === '.') {
        x++
        continue
      }
      const inicio = x
      while (x < fila.length && fila[x] === color) x++
      resultado.push({ x: inicio, y, ancho: x - inicio, color })
    }
  })
  return resultado
}
