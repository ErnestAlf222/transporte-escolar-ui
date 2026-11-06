import { useRouter } from 'vue-router'
import { useNavegacionStore } from '@/shared/stores/navegacion'
import { PAUSA_NAVEGACION_MS } from '@/shared/constants/tiempo'
import { esperar } from '@/shared/utils/tiempo'

// Cambia de sección mostrando el loader de pantalla al menos PAUSA_NAVEGACION_MS antes de navegar
// (el router lo oculta al terminar con su afterEach).
export function useNavegacionConLoader() {
  const router = useRouter()
  const navegacion = useNavegacionStore()

  async function irA(ruta: string) {
    navegacion.mostrar()
    await esperar(PAUSA_NAVEGACION_MS)
    router.push(ruta)
  }

  return { irA }
}
