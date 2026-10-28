import http from './http'
import type { CasoEspecial, CasoEspecialPayload } from '@/types/caso-especial'

export async function listarCasosEspeciales(): Promise<CasoEspecial[]> {
  const { data } = await http.get<CasoEspecial[] | null>('/pagos/casos-especiales')
  return data ?? []
}

// Siempre es la semana en curso: el servidor la calcula y no se manda
export async function registrarCasoEspecial(
  clienteId: number,
  payload: CasoEspecialPayload,
): Promise<void> {
  await http.post(`/clientes/${clienteId}/pagos/caso-especial`, payload)
}
