import http from './http'
import { escucharEventos } from './eventos'
import type { PagosSemana, AbonoPayload, AbonoRespuesta } from '@/types/pago'

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

// Lo que se recibió de una familia en una semana: el servidor lo reparte entre los hermanos que deben
export async function registrarAbono(
  clienteId: number,
  payload: AbonoPayload,
): Promise<AbonoRespuesta> {
  const { data } = await http.post<AbonoRespuesta>(`/clientes/${clienteId}/abonos`, payload)
  return data
}

// Anula un recibo completo (todos los hermanos que se pagaron juntos)
export async function anularAbono(lote: string): Promise<void> {
  await http.post(`/abonos/${lote}/anular`)
}

export function escucharEventosPagos(alEvento: () => void, senal: AbortSignal): Promise<void> {
  return escucharEventos('/pagos/eventos', alEvento, senal)
}
