import http from '@/shared/api/http'
import type { Configuracion, ActualizarConfiguracionPayload, DatosPago } from '@/shared/types/configuracion'

export async function verConfiguracion(): Promise<Configuracion> {
  const { data } = await http.get<Configuracion>('/configuracion')
  return data
}

// La tarjeta de depósito no sale en la configuración pública: se lee aquí (admin y colaborador)
export async function verDatosPago(): Promise<DatosPago> {
  const { data } = await http.get<DatosPago>('/configuracion/datos-pago')
  return data
}

export async function actualizarConfiguracion(
  payload: ActualizarConfiguracionPayload,
): Promise<Configuracion> {
  const { data } = await http.patch<Configuracion>('/configuracion', payload)
  return data
}
