import http from '@/shared/api/http'
import type {
  RegistroProspectoPayload,
  RegistroProspectoResponse,
} from '@/features/registro-publico/types/registro-publico'

export async function registrarProspecto(
  payload: RegistroProspectoPayload,
): Promise<RegistroProspectoResponse> {
  const { data } = await http.post<RegistroProspectoResponse>('/prospectos', payload)
  return data
}
