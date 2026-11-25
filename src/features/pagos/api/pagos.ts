import http from '@/shared/api/http'
import { escucharEventos } from '@/shared/api/eventos'
import type {
  PagosSemana,
  AbonoPayload,
  AbonoRespuesta,
  Recibo,
  RecibiMenosPayload,
  CandadoTarifaRespuesta,
  RecibiMenosRespuesta,
} from '@/features/pagos/types/pago'

// Sin semana devuelve la semana en curso; con semana (un lunes, AAAA-MM-DD) devuelve esa
export async function verPagosSemana(semana?: string): Promise<PagosSemana> {
  const { data } = await http.get<PagosSemana>('/pagos/semana', { params: { semana } })
  return { ...data, escuelas: data.escuelas ?? [] }
}

export async function confirmarPago(id: number, mensaje: string): Promise<void> {
  await http.post(`/pagos/${id}/confirmar`, { mensaje })
}

// Llegó menos de lo reportado: queda como abono, la semana pasa a parcial y el cliente puede reportar de nuevo
export async function recibiMenos(id: number, payload: RecibiMenosPayload): Promise<RecibiMenosRespuesta> {
  const { data } = await http.post<RecibiMenosRespuesta>(`/pagos/${id}/recibi-menos`, payload)
  return data
}

// Pone o quita el candado de tarifa de la familia del alumno. Con candado, todos los hermanos quedan con la tarifa de este alumno
export async function cambiarCandadoTarifa(clienteId: number, activo: boolean): Promise<CandadoTarifaRespuesta> {
  const { data } = await http.put<CandadoTarifaRespuesta>(`/clientes/${clienteId}/candado-tarifa`, { activo })
  return data
}

export async function rechazarPago(id: number, motivo: string): Promise<void> {
  await http.post(`/pagos/${id}/rechazar`, { motivo })
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

// Lo recibido de una familia en una semana (lunes, AAAA-MM-DD), agrupado por recibo. Los anulados no salen
export async function verRecibos(clienteId: number, semanaInicio: string): Promise<Recibo[]> {
  const { data } = await http.get<Recibo[] | null>(`/clientes/${clienteId}/abonos`, {
    params: { semana: semanaInicio },
  })
  return data ?? []
}

export function escucharEventosPagos(
  alEvento: (nombre: string) => void,
  senal: AbortSignal,
  alConectar: () => void,
): Promise<void> {
  return escucharEventos('/pagos/eventos', alEvento, senal, { alConectar })
}
