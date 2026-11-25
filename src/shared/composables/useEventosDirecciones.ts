import { onUnmounted, ref } from 'vue'
import { escucharEventosDirecciones } from '@/shared/api/direcciones'
import { ErrorEventos } from '@/shared/api/eventos'
import { useAviso } from '@/shared/composables/useAviso'
import { EVENTO_DIRECCION_CAMBIADA, TEXTO_AVISO_DIRECCION_CAMBIADA } from '@/shared/constants/direcciones'
import { ESPERA_RECONEXION_MS, ESPERA_RECONEXION_MAX_MS } from '@/shared/constants/tiempo'
import { esperar } from '@/shared/utils/tiempo'

// Sube cada vez que un cliente cambia su dirección: las pantallas que lo muestran lo vigilan y se refrescan
export const cambiosDireccion = ref(0)

// Tiempo real de direcciones, para el panel. Se cierra al salir; si se corta, reconecta con espera creciente
// (3 s, 6 s, 12 s... hasta el tope) para no saturar al servidor. Con 401 o 403 no reintenta: la sesión venció o su rol no ve este aviso.
export function useEventosDirecciones() {
  const { mostrarAviso } = useAviso()
  let detener: AbortController | null = null

  function alEvento(nombre: string) {
    if (nombre !== EVENTO_DIRECCION_CAMBIADA) return
    cambiosDireccion.value++
    mostrarAviso(TEXTO_AVISO_DIRECCION_CAMBIADA)
  }

  async function suscribir() {
    detener = new AbortController()
    const { signal } = detener
    let fallos = 0
    while (!signal.aborted) {
      try {
        await escucharEventosDirecciones(alEvento, signal, () => (fallos = 0))
      } catch (e) {
        if (signal.aborted) return
        if (e instanceof ErrorEventos && (e.estado === 401 || e.estado === 403)) return
      }
      if (signal.aborted) return
      await esperar(Math.min(ESPERA_RECONEXION_MS * 2 ** fallos, ESPERA_RECONEXION_MAX_MS))
      fallos++
    }
  }

  function iniciar() {
    if (!detener || detener.signal.aborted) suscribir()
  }

  onUnmounted(() => detener?.abort())

  return { iniciar }
}
