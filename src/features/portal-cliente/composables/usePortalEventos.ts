import { useRouter } from 'vue-router'
import { escucharEventosPortal } from '@/features/portal-cliente/api/portal'
import { sesionPortalVigente, usePortalStore } from '@/features/portal-cliente/stores/portal'
import { NOMBRE_RUTA_PORTAL_ACCESO } from '@/features/portal-cliente/constants/portal'
import { ErrorEventos } from '@/shared/api/eventos'
import { useEventosEnVivo } from '@/shared/composables/useEventosEnVivo'

// Tiempo real del portal. Se cierra al salir de la pantalla y cuando la sesión vence o se revoca (401).
// La reconexión con espera creciente es la del composable compartido; al reconectar avisa con alReconectar
// para que la pantalla se ponga al día por si se perdió un evento.
export function usePortalEventos(alEvento: (nombre: string) => void, alReconectar: () => void) {
  const router = useRouter()
  const portal = usePortalStore()

  const { iniciar, cerrar } = useEventosEnVivo({
    conectar: escucharEventosPortal,
    alEvento,
    alReconectar,
    detenerSi: (error) => {
      const vencida = (error instanceof ErrorEventos && error.estado === 401) || !sesionPortalVigente()
      if (!vencida) return false
      cerrar()
      portal.cerrarSesion()
      router.replace({ name: NOMBRE_RUTA_PORTAL_ACCESO })
      return true
    },
  })

  return { iniciar }
}
