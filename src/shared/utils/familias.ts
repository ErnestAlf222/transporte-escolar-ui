// Una "familia" es el grupo de alumnos de un mismo tutor. Sin imports a propósito: es lógica pura.

export interface Familia<T> {
  clave: string
  nombre_tutor: string
  telefono_tutor: string
  alumnos: T[]
}

interface ConTutor {
  id: number
  tutor_id: number | null
  nombre_tutor: string
  telefono_tutor: string
}

// Una familia por tutor, con sus alumnos en el orden en que llegan; quien no tiene tutor va solo.
// Las familias salen en el orden en que aparece por primera vez cada tutor; el nombre y el teléfono del tutor son los
// del primer alumno de la familia. `prefijoSinTutor` solo forma la clave del alumno sin tutor (`${prefijo}-${id}`):
// Clientes usa 'c' y Prospectos 'a', como antes.
export function agruparPorTutor<T extends ConTutor>(items: T[], prefijoSinTutor: string): Familia<T>[] {
  const mapa = new Map<string, Familia<T>>()
  for (const item of items) {
    const clave = item.tutor_id ? `t-${item.tutor_id}` : `${prefijoSinTutor}-${item.id}`
    let familia = mapa.get(clave)
    if (!familia) {
      familia = { clave, nombre_tutor: item.nombre_tutor, telefono_tutor: item.telefono_tutor, alumnos: [] }
      mapa.set(clave, familia)
    }
    familia.alumnos.push(item)
  }
  return [...mapa.values()]
}
