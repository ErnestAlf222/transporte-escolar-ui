import http from './http'

// Escucha un flujo de eventos del servidor (SSE) con fetch: EventSource no permite el encabezado Authorization.
// Llama a alEvento por cada evento real; los comentarios de conexión y de latido se ignoran.
export async function escucharEventos(
  ruta: string,
  alEvento: () => void,
  senal: AbortSignal,
): Promise<void> {
  const respuesta = await fetch(`${http.defaults.baseURL}${ruta}`, {
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
