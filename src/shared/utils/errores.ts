import axios from 'axios'

// El servidor explica sus errores con texto plano en el cuerpo de la respuesta.

// Texto del servidor (recortado) si la respuesta tiene ese estado y el cuerpo es texto; si no, null.
// Un cuerpo vacío devuelve '' (no null), igual que las comprobaciones originales.
export function textoDeEstado(e: unknown, estado: number): string | null {
  return axios.isAxiosError(e) && e.response?.status === estado && typeof e.response.data === 'string'
    ? e.response.data.trim()
    : null
}

// Mensaje del servidor si la respuesta (con cualquier estado) trae texto no vacío; si no, el respaldo
export function mensajeDeError(e: unknown, respaldo: string): string {
  return axios.isAxiosError(e) && typeof e.response?.data === 'string' && e.response.data.trim()
    ? e.response.data.trim()
    : respaldo
}

// Mensaje del servidor si la respuesta tiene ese estado y trae texto (aunque sea vacío); si no, el respaldo
export function mensajeDeEstado(e: unknown, estado: number, respaldo: string): string {
  return textoDeEstado(e, estado) ?? respaldo
}

// ¿Es un error HTTP con ese estado?
export function esEstado(e: unknown, estado: number): boolean {
  return axios.isAxiosError(e) && e.response?.status === estado
}

// ¿Es un error HTTP con ese estado cuyo cuerpo contiene esa frase? (p. ej. 409 "ya se registró")
export function esEstadoConTexto(e: unknown, estado: number, frase: string): boolean {
  return axios.isAxiosError(e) && e.response?.status === estado && String(e.response.data).includes(frase)
}
