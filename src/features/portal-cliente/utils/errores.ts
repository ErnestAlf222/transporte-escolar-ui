import axios from 'axios'
import { TEXTO_ERROR_503, TEXTO_ERROR_429, TEXTO_ERROR_RED, TEXTO_ERROR_GUARDAR } from '@/features/portal-cliente/constants/perfil'
import { mensajeDeError } from '@/shared/utils/errores'

// Texto claro para el cliente: el del servidor cuando es útil (tamaño, tipo, validaciones) y uno propio para 503, 429 y sin conexión.
// El 503 depende de lo que se estaba haciendo: por omisión es el de la captura de un pago; las fotos y la dirección pasan el suyo.
export function mensajeErrorPortal(e: unknown, texto503: string = TEXTO_ERROR_503): string {
  if (axios.isAxiosError(e)) {
    if (!e.response) return TEXTO_ERROR_RED
    if (e.response.status === 503) return texto503
    if (e.response.status === 429) return TEXTO_ERROR_429
  }
  return mensajeDeError(e, TEXTO_ERROR_GUARDAR)
}
