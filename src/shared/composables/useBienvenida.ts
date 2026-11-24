import { ref } from 'vue'
import { DURACION_BIENVENIDA_MS, DURACION_BIENVENIDA_REDUCIDA_MS } from '@/shared/constants/tiempo'
import { esperar } from '@/shared/utils/tiempo'

// Pantalla de bienvenida: la muestra PantallaBienvenida (puesta una sola vez en App.vue) mientras `visible` sea true.
// Se activa solo con conBienvenida(), nunca por el estado de la sesión: recargar la página o navegar no la repite.
const visible = ref(false)

const prefiereMenosMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function useBienvenida() {
  // Muestra la bienvenida el tiempo fijado y luego continúa con `despues` (ir al inicio, mostrar el éxito...).
  // La pantalla se queda puesta hasta que `despues` termina, así no se cuela el loader de cambio de sección.
  async function conBienvenida(despues: () => unknown) {
    visible.value = true
    try {
      await esperar(prefiereMenosMovimiento() ? DURACION_BIENVENIDA_REDUCIDA_MS : DURACION_BIENVENIDA_MS)
      await despues()
    } finally {
      visible.value = false
    }
  }

  return { visible, conBienvenida }
}
