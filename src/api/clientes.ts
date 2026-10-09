import http from './http'
import type {
  ClienteListItem,
  ClienteDetalle,
  EstatusCliente,
  MetodoPago,
  ActualizarClientePayload,
  AdeudoFamilia,
  ConfigurarClientePayload,
  ConfigurarClienteRespuesta,
  AdeudoCliente,
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

export async function reincorporarCliente(
  id: number,
  perdonar = false,
  pagar = false,
): Promise<void> {
  await http.post(`/clientes/${id}/reincorporar`, { perdonar, pagar })
}

export async function actualizarCliente(
  id: number,
  payload: ActualizarClientePayload,
): Promise<void> {
  await http.patch(`/clientes/${id}`, payload)
}

export async function verAdeudoFamilia(id: number): Promise<AdeudoFamilia> {
  const { data } = await http.get<AdeudoFamilia>(`/clientes/${id}/adeudo-familia`)
  return data
}

export async function configurarCliente(
  id: number,
  payload: ConfigurarClientePayload,
): Promise<ConfigurarClienteRespuesta> {
  const { data } = await http.patch<ConfigurarClienteRespuesta>(
    `/clientes/${id}/configuracion`,
    payload,
  )
  return data
}

export async function verAdeudoCliente(id: number): Promise<AdeudoCliente> {
  const { data } = await http.get<AdeudoCliente>(`/clientes/${id}/adeudo`)
  return data
}
