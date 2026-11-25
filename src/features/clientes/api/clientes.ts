import http from '@/shared/api/http'
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
  AgregarAlumnoPayload,
  AgregarAlumnoRespuesta,
  MensajeRespuesta,
} from '@/features/clientes/types/cliente'

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

// Suma un alumno a una familia que ya existe; id es cualquier cliente de esa familia
export async function agregarAlumno(
  id: number,
  payload: AgregarAlumnoPayload,
): Promise<AgregarAlumnoRespuesta> {
  const { data } = await http.post<AgregarAlumnoRespuesta>(`/clientes/${id}/hermanos`, payload)
  return data
}

// Acceso al portal del cliente (solo admin). Apagarlo corta las sesiones abiertas
export async function cambiarAccesoPortal(id: number, activo: boolean): Promise<MensajeRespuesta> {
  const { data } = await http.patch<MensajeRespuesta>(`/clientes/${id}/acceso-portal`, { activo })
  return data
}

// Corrige el correo del tutor (y su copia en sus alumnos); con reenviarCodigo manda un código al correo nuevo
export async function corregirCorreoTutor(
  tutorId: number,
  correo: string,
  reenviarCodigo = false,
): Promise<MensajeRespuesta> {
  const { data } = await http.patch<MensajeRespuesta>(`/tutores/${tutorId}/correo`, {
    correo,
    reenviar_codigo: reenviarCodigo,
  })
  return data
}

export async function reenviarCodigoTutor(tutorId: number): Promise<MensajeRespuesta> {
  const { data } = await http.post<MensajeRespuesta>(`/tutores/${tutorId}/portal/codigo`)
  return data
}

export async function avisarTutor(tutorId: number): Promise<MensajeRespuesta> {
  const { data } = await http.post<MensajeRespuesta>(`/tutores/${tutorId}/portal/aviso`)
  return data
}
