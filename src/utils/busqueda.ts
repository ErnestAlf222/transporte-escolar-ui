// Texto para comparar: sin acentos, sin mayúsculas y con los espacios repetidos reducidos a uno
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function soloDigitos(texto: string): string {
  return texto.replace(/\D/g, '')
}

const MIN_DIGITOS_TELEFONO = 3

// Todas las palabras que escribió deben aparecer, en cualquier orden, en alguno de los nombres;
// un número de al menos 3 dígitos también se busca dentro de los teléfonos
export function coincideBusqueda(
  busqueda: string,
  nombres: string[],
  telefonos: string[],
): boolean {
  const palabras = normalizar(busqueda).split(' ').filter(Boolean)
  if (palabras.length === 0) return true

  const texto = normalizar(nombres.join(' '))
  const digitos = telefonos.map(soloDigitos).join(' ')
  return palabras.every((palabra) => {
    const numero = soloDigitos(palabra)
    return (
      texto.includes(palabra) || (numero.length >= MIN_DIGITOS_TELEFONO && digitos.includes(numero))
    )
  })
}
