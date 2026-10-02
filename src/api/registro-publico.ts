import http from './http'
import type {
  RegistroProspectoPayload,
  RegistroProspectoResponse,
  ConsultaTelefonoResponse,
} from '@/types/registro-publico'

export async function registrarProspecto(
  payload: RegistroProspectoPayload,
): Promise<RegistroProspectoResponse> {
  const { data } = await http.post<RegistroProspectoResponse>('/prospectos', payload)
  return data
}

export async function consultarTelefono(telefono: string): Promise<ConsultaTelefonoResponse> {
  const { data } = await http.get<ConsultaTelefonoResponse>(`/registro/telefono/${telefono}`)
  return data
}
