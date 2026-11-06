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

type Texto = string | null | undefined

// Cómo leer, de cada elemento de una lista, lo que la búsqueda de alumnos/tutores necesita
export interface CamposDeBusqueda<T> {
  // Nombre y apellidos del alumno (los apellidos pueden venir vacíos o ausentes)
  nombresAlumno: (item: T) => Texto[]
  telefonoTutor: (item: T) => string
  nombreTutor: (item: T) => string
}

// Un alumno coincide por su nombre y apellidos o por el teléfono del tutor
export function coincidePorAlumno<T>(busqueda: string, item: T, campos: CamposDeBusqueda<T>): boolean {
  return coincideBusqueda(
    busqueda,
    campos.nombresAlumno(item).map((s) => s ?? ''),
    [campos.telefonoTutor(item)],
  )
}

// Primero se busca entre los alumnos; solo si ninguno coincide se busca por el nombre del tutor
export function filtrarPorAlumnoOTutor<T>(items: T[], busqueda: string, campos: CamposDeBusqueda<T>): T[] {
  if (!busqueda.trim()) return items

  const porAlumno = items.filter((i) => coincidePorAlumno(busqueda, i, campos))
  if (porAlumno.length > 0) return porAlumno

  return items.filter((i) => coincideBusqueda(busqueda, [campos.nombreTutor(i)], []))
}
