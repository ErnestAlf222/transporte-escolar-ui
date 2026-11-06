import http from '@/shared/api/http'
import type { Configuracion, ActualizarConfiguracionPayload } from '@/shared/types/configuracion'

export async function verConfiguracion(): Promise<Configuracion> {
  const { data } = await http.get<Configuracion>('/configuracion')
  return data
}

export async function actualizarConfiguracion(
  payload: ActualizarConfiguracionPayload,
): Promise<Configuracion> {
  const { data } = await http.patch<Configuracion>('/configuracion', payload)
  return data
}
