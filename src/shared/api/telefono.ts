import http from '@/shared/api/http'
import type { ConsultaTelefonoResponse } from '@/shared/types/telefono'

export async function consultarTelefono(telefono: string): Promise<ConsultaTelefonoResponse> {
  const { data } = await http.get<ConsultaTelefonoResponse>(`/registro/telefono/${telefono}`)
  return data
}
