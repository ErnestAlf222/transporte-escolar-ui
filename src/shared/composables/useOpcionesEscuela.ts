import { ref } from 'vue'
import { listarEscuelas } from '@/shared/api/escuelas'
import type { Escuela } from '@/shared/types/escuela'

// Opciones de un selector de escuela cargadas desde la API: una primera opción sin valor (`primera`:
// "Todas las escuelas", "Sin escuela asignada"…) y luego las escuelas en el orden en que llegan, como "nombre (turno)".
// No pide nada hasta que se llama a `cargar()`: cada pantalla la llama donde ya lo hacía, así que no cambia cuándo
// ni cuántas veces se piden. Si la petición falla, `cargar()` rechaza (cada pantalla decide si lo captura, como antes).
// Pagos y Asistencias NO usan esto: derivan sus escuelas de los datos de la semana / del día.
export function useOpcionesEscuela(primera: string, listar: () => Promise<Escuela[]> = listarEscuelas) {
  const opciones = ref([{ value: '', label: primera }])

  async function cargar() {
    const escuelas = await listar()
    opciones.value = [
      { value: '', label: primera },
      ...escuelas.map((e) => ({
        value: String(e.id),
        label: e.turno ? `${e.nombre} (${e.turno})` : e.nombre,
      })),
    ]
  }

  return { opciones, cargar }
}
