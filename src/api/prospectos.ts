import http from './http'
import type {
  ProspectoListItem,
  ProspectoDetalle,
  EstatusProspecto,
  ConversionResponse,
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
