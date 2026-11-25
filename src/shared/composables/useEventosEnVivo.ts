import { onUnmounted } from 'vue'
import { ESPERA_RECONEXION_MS, ESPERA_RECONEXION_MAX_MS } from '@/shared/constants/tiempo'
import { esperar } from '@/shared/utils/tiempo'

export interface OpcionesEventosEnVivo {
  // Abre la conexión y se queda escuchando hasta que se corta; llama a alConectar cuando queda abierta
  conectar: (alEvento: (nombre: string) => void, senal: AbortSignal, alConectar: () => void) => Promise<void>
  alEvento: (nombre: string) => void
  // La conexión volvió a abrirse tras un corte: la pantalla se pone al día por si se perdió un aviso
  alReconectar: () => void
  // Tras cada corte (con su error, o null si el servidor cerró): true = no reconectar (p. ej. sesión vencida)
  detenerSi?: (error: unknown) => boolean
}

// Tiempo real (SSE) con reconexión: si se corta, espera de forma creciente (3 s, 6 s, 12 s... hasta el tope)
// para no saturar al servidor. Se cierra solo al desmontar la pantalla.
export function useEventosEnVivo(opciones: OpcionesEventosEnVivo) {
  let detener: AbortController | null = null

  async function suscribir() {
    detener = new AbortController()
    const { signal } = detener
    let fallos = 0
    while (!signal.aborted) {
      let error: unknown = null
      try {
        await opciones.conectar(opciones.alEvento, signal, () => (fallos = 0))
      } catch (e) {
        if (signal.aborted) return
        error = e
      }
      if (signal.aborted) return
      if (opciones.detenerSi?.(error)) return
      await esperar(Math.min(ESPERA_RECONEXION_MS * 2 ** fallos, ESPERA_RECONEXION_MAX_MS))
      if (signal.aborted) return
      fallos++
      opciones.alReconectar()
    }
  }

  function iniciar() {
    if (!detener || detener.signal.aborted) suscribir()
  }

  function cerrar() {
    detener?.abort()
  }

  onUnmounted(cerrar)

  return { iniciar, cerrar }
}
