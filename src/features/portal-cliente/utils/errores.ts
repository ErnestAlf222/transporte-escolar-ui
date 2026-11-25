import axios from 'axios'
import { TEXTO_ERROR_503, TEXTO_ERROR_429, TEXTO_ERROR_RED, TEXTO_ERROR_GUARDAR } from '@/features/portal-cliente/constants/perfil'
import { mensajeDeError } from '@/shared/utils/errores'

// Texto claro para el cliente: el del servidor cuando es útil (tamaño, tipo, validaciones) y uno propio para 503, 429 y sin conexión
export function mensajeErrorPortal(e: unknown): string {
  if (axios.isAxiosError(e)) {
    if (!e.response) return TEXTO_ERROR_RED
    if (e.response.status === 503) return TEXTO_ERROR_503
    if (e.response.status === 429) return TEXTO_ERROR_429
  }
  return mensajeDeError(e, TEXTO_ERROR_GUARDAR)
}
