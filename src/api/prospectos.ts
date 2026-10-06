import http from './http'
import { escucharEventos } from './eventos'
import type {
  ProspectoListItem,
  ProspectoDetalle,
  EstatusProspecto,
  ConversionResponse,
  ActualizarProspectoPayload,
} from '@/types/prospecto'

interface FiltrosProspectos {
  escuela_id?: number
  estatus?: EstatusProspecto
}

export async function listarProspectos(
  filtros: FiltrosProspectos = {},
): Promise<ProspectoListItem[]> {
  const { data } = await http.get<ProspectoListItem[] | null>('/prospectos', { params: filtros })
  return data ?? []
}

export async function verProspecto(id: number): Promise<ProspectoDetalle> {
  const { data } = await http.get<ProspectoDetalle>(`/prospectos/${id}`)
  return data
}

export async function convertirProspecto(id: number): Promise<ConversionResponse> {
  const { data } = await http.post<ConversionResponse>(`/prospectos/${id}/convertir`)
  return data
}

export async function descartarProspecto(id: number): Promise<void> {
  await http.post(`/prospectos/${id}/descartar`)
}

export async function restaurarProspecto(id: number): Promise<void> {
  await http.post(`/prospectos/${id}/restaurar`)
}

// Escucha /prospectos/eventos con fetch (EventSource no permite el encabezado Authorization).
// Llama a alEvento por cada evento real; los comentarios de conexión y latido se ignoran.
export function escucharEventosProspectos(alEvento: () => void, senal: AbortSignal): Promise<void> {
  return escucharEventos('/prospectos/eventos', alEvento, senal)
}

export async function actualizarProspecto(
  id: number,
  payload: ActualizarProspectoPayload,
): Promise<void> {
  await http.patch(`/prospectos/${id}`, payload)
}
