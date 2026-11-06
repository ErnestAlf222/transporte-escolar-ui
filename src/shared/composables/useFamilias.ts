import { computed } from 'vue'
import { coincidePorAlumno, type CamposDeBusqueda } from '@/shared/utils/busqueda'
import { agruparPorTutor, type Familia } from '@/shared/utils/familias'

interface ConTutor {
  id: number
  tutor_id: number | null
  nombre_tutor: string
  telefono_tutor: string
}

// Las familias de una lista ya filtrada (Clientes y Prospectos): agrupa por tutor y resuelve qué alumno da la cara
// y cuándo la tarjeta se titula con el tutor. Familias NO usa esto: agrupa distinto (ver docs/fase3b-composables.md).
// - `items` y `busqueda` son funciones para conservar la reactividad de quien llama.
// - `prefijoSinTutor`: prefijo de la clave del alumno sin tutor ('c' en Clientes, 'a' en Prospectos).
export function useFamilias<T extends ConTutor>(
  items: () => T[],
  busqueda: () => string,
  campos: CamposDeBusqueda<T>,
  prefijoSinTutor: string,
) {
  const familias = computed<Familia<T>[]>(() => agruparPorTutor(items(), prefijoSinTutor))

  // El alumno que da la cara por la familia: el primero que coincide con lo buscado.
  // Si no hay búsqueda, o se buscó por el tutor, es el primero de la lista
  function alumnoPrincipal(f: Familia<T>): T {
    if (busqueda().trim()) {
      const coincide = f.alumnos.find((a) => coincidePorAlumno(busqueda(), a, campos))
      if (coincide) return coincide
    }
    return f.alumnos[0]!
  }

  // La búsqueda coincidió con el tutor y con ningún alumno: la tarjeta se titula con el tutor
  function coincidePorTutor(f: Familia<T>): boolean {
    if (!busqueda().trim() || !f.nombre_tutor) return false
    return !f.alumnos.some((a) => coincidePorAlumno(busqueda(), a, campos))
  }

  return { familias, alumnoPrincipal, coincidePorTutor }
}
