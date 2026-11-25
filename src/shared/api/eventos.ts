import http from '@/shared/api/http'

// Error de la conexión de eventos con el estado HTTP, para que quien escucha decida (p. ej. 401: sesión vencida)
export class ErrorEventos extends Error {
  readonly estado: number
  constructor(estado: number) {
    super(`Eventos: ${estado}`)
    this.estado = estado
  }
}

// Por omisión escucha como el admin (su token y su cliente HTTP); otra sesión (p. ej. el portal) pasa las suyas
export interface OpcionesEventos {
  token?: string | null
  baseURL?: string
  alConectar?: () => void // la conexión quedó abierta (sirve para reiniciar una espera creciente)
}

// Escucha un flujo de eventos del servidor (SSE) con fetch: EventSource no permite el encabezado Authorization.
// Llama a alEvento por cada evento real (con su nombre); los comentarios de conexión y de latido se ignoran.
export async function escucharEventos(
  ruta: string,
  alEvento: (nombre: string) => void,
  senal: AbortSignal,
  opciones: OpcionesEventos = {},
): Promise<void> {
  const token = 'token' in opciones ? opciones.token : localStorage.getItem('token')
  const respuesta = await fetch(`${opciones.baseURL ?? http.defaults.baseURL}${ruta}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
    },
    signal: senal,
  })
  if (!respuesta.ok || !respuesta.body) throw new ErrorEventos(respuesta.status)
  opciones.alConectar?.()

  const lector = respuesta.body.pipeThrough(new TextDecoderStream()).getReader()
  let pendiente = ''
  while (true) {
    const { value, done } = await lector.read()
    if (done) return
    pendiente += value
    const bloques = pendiente.split('\n\n')
    pendiente = bloques.pop() ?? ''
    for (const bloque of bloques) {
      if (bloque.startsWith('event:')) alEvento(/^event:\s*(.*)$/m.exec(bloque)?.[1]?.trim() ?? '')
    }
  }
}
