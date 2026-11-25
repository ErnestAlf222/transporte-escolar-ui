import { ref, type Ref } from 'vue'

export type EstadoCarga = 'cargando' | 'listo' | 'error'

// Una sección que se pide al servidor: muestra "cargando" solo la primera vez; al refrescar
// (tiempo real) conserva lo que ya hay en pantalla y, si falla, no lo reemplaza por un error.
export function useCargaPortal<T>(pedir: () => Promise<T>) {
  const datos = ref<T | null>(null) as Ref<T | null>
  const estado = ref<EstadoCarga>('cargando')

  async function cargar() {
    const hayDatos = estado.value === 'listo'
    if (!hayDatos) estado.value = 'cargando'
    try {
      datos.value = await pedir()
      estado.value = 'listo'
    } catch {
      if (!hayDatos) estado.value = 'error'
    }
  }

  return { datos, estado, cargar }
}
