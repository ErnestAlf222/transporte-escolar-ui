import { escucharEventos } from '@/shared/api/eventos'
import { RUTA_EVENTOS_DIRECCIONES } from '@/shared/constants/direcciones'

export function escucharEventosDirecciones(
  alEvento: (nombre: string) => void,
  senal: AbortSignal,
  alConectar?: () => void,
): Promise<void> {
  return escucharEventos(RUTA_EVENTOS_DIRECCIONES, alEvento, senal, { alConectar })
}
