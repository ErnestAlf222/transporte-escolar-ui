import http from './http'
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
export async function escucharEventosProspectos(
  alEvento: () => void,
  senal: AbortSignal,
): Promise<void> {
  const respuesta = await fetch(`${http.defaults.baseURL}/prospectos/eventos`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      Accept: 'text/event-stream',
    },
    signal: senal,
  })
  if (!respuesta.ok || !respuesta.body) throw new Error(`Eventos: ${respuesta.status}`)

  const lector = respuesta.body.pipeThrough(new TextDecoderStream()).getReader()
  let pendiente = ''
  while (true) {
    const { value, done } = await lector.read()
    if (done) return
    pendiente += value
    const bloques = pendiente.split('\n\n')
    pendiente = bloques.pop() ?? ''
    for (const bloque of bloques) {
      if (bloque.startsWith('event:')) alEvento()
    }
  }
}

export async function actualizarProspecto(
  id: number,
  payload: ActualizarProspectoPayload,
): Promise<void> {
  await http.patch(`/prospectos/${id}`, payload)
}
