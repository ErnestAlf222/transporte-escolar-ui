// Misma regla que el backend: una sola dirección, con dominio con punto y máximo 254 caracteres
const FORMATO_CORREO = /^[^\s@,;<>]+@[^\s@,;<>.]+(\.[^\s@,;<>.]+)+$/

export function esCorreoValido(valor: string): boolean {
  const v = valor.trim()
  return v.length <= 254 && FORMATO_CORREO.test(v)
}
