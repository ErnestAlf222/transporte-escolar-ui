import http from '@/shared/api/http'
import type { CasoEspecial, CasoEspecialPayload } from '@/features/casos-especiales/types/caso-especial'

// Sin semana devuelve la semana en curso; con semana (cualquier fecha, AAAA-MM-DD) devuelve la que la contiene
export async function listarCasosEspeciales(semana?: string): Promise<CasoEspecial[]> {
  const { data } = await http.get<CasoEspecial[] | null>('/pagos/casos-especiales', {
    params: { semana },
  })
  return data ?? []
}

// Siempre es la semana en curso: el servidor la calcula y no se manda
export async function registrarCasoEspecial(
  clienteId: number,
  payload: CasoEspecialPayload,
): Promise<void> {
  await http.post(`/clientes/${clienteId}/pagos/caso-especial`, payload)
}
