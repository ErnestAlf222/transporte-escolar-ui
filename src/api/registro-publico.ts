import http from './http'
import type { RegistroProspectoPayload, RegistroProspectoResponse } from '@/types/registro-publico'

export async function registrarProspecto(
  payload: RegistroProspectoPayload,
): Promise<RegistroProspectoResponse> {
  const { data } = await http.post<RegistroProspectoResponse>('/prospectos', payload)
  return data
}
