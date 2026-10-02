const DIAS_POR_SEMANA = 7
const FORMATO_DIA = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' })

// Las fechas se manejan como "AAAA-MM-DD" para no depender de la zona horaria del navegador
function aFecha(iso: string): Date {
  const [anio, mes, dia] = iso.slice(0, 10).split('-').map(Number)
  return new Date(anio!, mes! - 1, dia!)
}

function aIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

// El lunes de la semana que está "semanas" semanas antes (negativo) o después (positivo)
export function moverSemana(iso: string, semanas: number): string {
  const fecha = aFecha(iso)
  fecha.setDate(fecha.getDate() + semanas * DIAS_POR_SEMANA)
  return aIso(fecha)
}

// "28 sep – 4 oct"
export function rangoSemana(iso: string): string {
  const inicio = aFecha(iso)
  const fin = aFecha(iso)
  fin.setDate(fin.getDate() + DIAS_POR_SEMANA - 1)
  return `${FORMATO_DIA.format(inicio)} – ${FORMATO_DIA.format(fin)}`
}

// "2026-09-28T00:00:00-06:00" -> "2026-09-28" (la fecha que espera el servidor)
export function soloFecha(iso: string): string {
  return iso.slice(0, 10)
}
