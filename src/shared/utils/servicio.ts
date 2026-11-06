// Qué servicio necesita el alumno: ida y vuelta, solo la ida (casa a escuela) o solo la vuelta (escuela a casa)
export type Servicio = 'completo' | 'ida' | 'vuelta'

export const OPCIONES_SERVICIO: { value: Servicio; titulo: string; detalle: string }[] = [
  { value: 'completo', titulo: 'Completo', detalle: 'Ida y vuelta' },
  { value: 'ida', titulo: 'Solo ida', detalle: 'De la casa a la escuela' },
  { value: 'vuelta', titulo: 'Solo vuelta', detalle: 'De la escuela a la casa' },
]

// Si el dato falta (registros viejos) se toma completo, que es lo que se ha manejado hasta hoy
export function servicioDe(valor: string | null | undefined): Servicio {
  return valor === 'ida' || valor === 'vuelta' ? valor : 'completo'
}

export function tituloServicio(valor: string | null | undefined): string {
  return OPCIONES_SERVICIO.find((o) => o.value === servicioDe(valor))!.titulo
}
