const DIAS_POR_SEMANA = 7
const DIAS_LABORALES = 5 // lunes a viernes: el fin de semana no cuenta
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
  fin.setDate(fin.getDate() + DIAS_LABORALES - 1)
  return `${FORMATO_DIA.format(inicio)} – ${FORMATO_DIA.format(fin)}`
}

// "2026-09-28T00:00:00-06:00" -> "2026-09-28" (la fecha que espera el servidor)
export function soloFecha(iso: string): string {
  return iso.slice(0, 10)
}

// Lunes de la semana que contiene la fecha ("2026-10-01" -> "2026-09-28")
export function lunesDe(iso: string): string {
  const fecha = aFecha(iso)
  fecha.setDate(fecha.getDate() - ((fecha.getDay() + 6) % DIAS_POR_SEMANA))
  return aIso(fecha)
}

// Sábado y domingo no cuentan
export function esFinDeSemana(iso: string): boolean {
  const dia = aFecha(iso).getDay()
  return dia === 0 || dia === 6
}

// Hoy como "AAAA-MM-DD", en la zona horaria del navegador
export function hoyIso(): string {
  return aIso(new Date())
}

export interface DiaCalendario {
  iso: string
  dia: number
  delMes: boolean // false: pertenece al mes anterior o al siguiente (se ve atenuado)
}

// Las semanas (lunes a viernes) que se muestran en el calendario de un mes. mes: 0 = enero
export function semanasDelMes(anio: number, mes: number): DiaCalendario[][] {
  const primero = new Date(anio, mes, 1)
  const ultimo = new Date(anio, mes + 1, 0)
  const lunes = new Date(anio, mes, 1 - ((primero.getDay() + 6) % DIAS_POR_SEMANA))
  const semanas: DiaCalendario[][] = []

  while (lunes.getTime() <= ultimo.getTime()) {
    const semana: DiaCalendario[] = []
    for (let i = 0; i < DIAS_LABORALES; i++) {
      const dia = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + i)
      semana.push({ iso: aIso(dia), dia: dia.getDate(), delMes: dia.getMonth() === mes })
    }
    // Una semana con sus cinco días en otro mes (el mes empieza en fin de semana) no se muestra
    if (semana.some((d) => d.delMes)) semanas.push(semana)
    lunes.setDate(lunes.getDate() + DIAS_POR_SEMANA)
  }
  return semanas
}
