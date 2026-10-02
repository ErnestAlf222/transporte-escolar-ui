import http from './http'
import type { PagosSemana } from '@/types/pago'

// Sin semana devuelve la semana en curso; con semana (un lunes, AAAA-MM-DD) devuelve esa
export async function verPagosSemana(semana?: string): Promise<PagosSemana> {
  const { data } = await http.get<PagosSemana>('/pagos/semana', { params: { semana } })
  return { ...data, escuelas: data.escuelas ?? [] }
}

export async function confirmarPago(id: number, mensaje: string): Promise<void> {
  await http.post(`/pagos/${id}/confirmar`, { mensaje })
}

export async function rechazarPago(id: number, motivo: string): Promise<void> {
  await http.post(`/pagos/${id}/rechazar`, { motivo })
}

// Para una semana que el cliente no reportó (efectivo, o pagó en persona): el admin la marca como pagada
export async function marcarPagado(
  clienteId: number,
  semanaInicio: string,
  mensaje: string,
): Promise<void> {
  await http.post(`/clientes/${clienteId}/pagos/confirmar-manual`, {
    semana_inicio: semanaInicio,
    mensaje,
  })
}
