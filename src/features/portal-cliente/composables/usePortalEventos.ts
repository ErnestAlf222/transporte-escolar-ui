import { onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { escucharEventosPortal } from '@/features/portal-cliente/api/portal'
import { sesionPortalVigente, usePortalStore } from '@/features/portal-cliente/stores/portal'
import { NOMBRE_RUTA_PORTAL_ACCESO } from '@/features/portal-cliente/constants/portal'
import { ErrorEventos } from '@/shared/api/eventos'
import { ESPERA_RECONEXION_MS, ESPERA_RECONEXION_MAX_MS } from '@/shared/constants/tiempo'
import { esperar } from '@/shared/utils/tiempo'

// Tiempo real del portal. Se cierra al salir de la pantalla y cuando la sesión vence o se revoca (401).
// Si se corta, reconecta con espera creciente (3 s, 6 s, 12 s... hasta el tope) para no saturar al servidor;
// al reconectar avisa con alReconectar para que la pantalla se ponga al día por si se perdió un evento.
export function usePortalEventos(alEvento: (nombre: string) => void, alReconectar: () => void) {
  const router = useRouter()
  const portal = usePortalStore()
  let detener: AbortController | null = null

  function cerrarPorSesion() {
    detener?.abort()
    portal.cerrarSesion()
    router.replace({ name: NOMBRE_RUTA_PORTAL_ACCESO })
  }

  async function suscribir() {
    detener = new AbortController()
    const { signal } = detener
    let fallos = 0
    while (!signal.aborted) {
      try {
        await escucharEventosPortal(alEvento, signal, () => (fallos = 0))
      } catch (e) {
        if (signal.aborted) return
        if (e instanceof ErrorEventos && e.estado === 401) return cerrarPorSesion()
      }
      if (signal.aborted) return
      if (!sesionPortalVigente()) return cerrarPorSesion()
      await esperar(Math.min(ESPERA_RECONEXION_MS * 2 ** fallos, ESPERA_RECONEXION_MAX_MS))
      if (signal.aborted) return
      fallos++
      alReconectar()
    }
  }

  function iniciar() {
    if (!detener || detener.signal.aborted) suscribir()
  }

  onUnmounted(() => detener?.abort())

  return { iniciar }
}
