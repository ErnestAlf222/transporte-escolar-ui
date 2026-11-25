import { ESTADO_CICLO, type EstadoCiclo } from '@/shared/constants/estadoCiclo'

// Adaptador único: los endpoints que todavía hablan con los estados viejos se traducen aquí, no en cada componente.
const DE_ESTATUS_ADMIN: Record<string, EstadoCiclo> = {
  confirmado: 'pagada',
  pendiente_revision: 'por_verificar',
  rechazado: 'rechazada',
  no_reportada: 'sin_reportar',
  pago_parcial: 'parcial',
  sin_cobro: 'sin_cobro',
}

const DE_ESTADO_SEMANA_PORTAL: Record<string, EstadoCiclo> = {
  pendiente: 'sin_reportar',
  por_verificar: 'por_verificar',
  parcial: 'parcial',
  pagado: 'pagada',
  sin_cobro: 'sin_cobro',
}

const DE_ESTADO_REPORTE_PORTAL: Record<string, EstadoCiclo> = {
  por_verificar: 'por_verificar',
  pagado: 'pagada',
  rechazado: 'rechazada',
  parcial: 'parcial',
}

export function esEstadoCiclo(valor: unknown): valor is EstadoCiclo {
  return typeof valor === 'string' && valor in ESTADO_CICLO
}

// Lo que ya viene del servidor como estado del ciclo gana; si no, se traduce el estado viejo
export function estadoDeEstatusAdmin(estatus: string, estado?: string): EstadoCiclo {
  if (esEstadoCiclo(estado)) return estado
  return DE_ESTATUS_ADMIN[estatus] ?? 'sin_reportar'
}

export function estadoDeSemanaPortal(estadoSemana: string, estado?: string): EstadoCiclo {
  if (esEstadoCiclo(estado)) return estado
  return DE_ESTADO_SEMANA_PORTAL[estadoSemana] ?? 'sin_reportar'
}

export function estadoDeReportePortal(estadoReporte: string, estado?: string): EstadoCiclo {
  if (esEstadoCiclo(estado)) return estado
  return DE_ESTADO_REPORTE_PORTAL[estadoReporte] ?? 'sin_reportar'
}

// Un valor guardado o de la URL (viejo o nuevo) como estado del ciclo; '' si no sirve
export function estadoDeTexto(texto: string): EstadoCiclo | '' {
  if (esEstadoCiclo(texto)) return texto
  return DE_ESTATUS_ADMIN[texto] ?? ''
}
