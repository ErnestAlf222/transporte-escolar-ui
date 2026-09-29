import http from './http'
import type {
  ClienteListItem,
  ClienteDetalle,
  EstatusCliente,
  MetodoPago,
  ActualizarClientePayload,
} from '@/types/cliente'

interface FiltrosClientes {
  estatus?: EstatusCliente
  escuela_id?: number
  metodo_pago?: MetodoPago
}

export async function listarClientes(filtros: FiltrosClientes = {}): Promise<ClienteListItem[]> {
  const { data } = await http.get<ClienteListItem[] | null>('/clientes', { params: filtros })
  return data ?? []
}

export async function verCliente(id: number): Promise<ClienteDetalle> {
  const { data } = await http.get<ClienteDetalle>(`/clientes/${id}`)
  return data
}

export async function archivarCliente(id: number, motivo: string, detalle: string): Promise<void> {
  await http.post(`/clientes/${id}/archivar`, { motivo, detalle })
}

export async function reincorporarCliente(id: number): Promise<void> {
  await http.post(`/clientes/${id}/reincorporar`)
}

export async function actualizarCliente(
  id: number,
  payload: ActualizarClientePayload,
): Promise<void> {
  await http.patch(`/clientes/${id}`, payload)
}
