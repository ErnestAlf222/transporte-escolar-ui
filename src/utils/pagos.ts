import type { AlumnoPagoSemana, EstatusSemana } from '@/types/pago'

export const METODO_DIGITAL = 'digital'

export const ETIQUETAS_METODO: Record<string, string> = { digital: 'Digital', efectivo: 'Efectivo' }

export const ETIQUETAS: Record<EstatusSemana, { texto: string; clases: string }> = {
  pendiente_revision: { texto: 'Por verificar', clases: 'bg-sun/15 text-sun' },
  no_reportada: { texto: 'Sin reportar', clases: 'bg-panel-2 text-text-secondary' },
  rechazado: { texto: 'Rechazado', clases: 'bg-danger/15 text-danger' },
  confirmado: { texto: 'Pagado', clases: 'bg-mint/15 text-mint' },
}

const ETIQUETA_ARCHIVADO = { texto: 'Archivado', clases: 'bg-panel-2 text-text-secondary' }

// Un archivado sin pago por verificar no es deuda de la semana: se ve atenuado
export function estaAtenuado(a: AlumnoPagoSemana): boolean {
  return a.archivado && (a.estatus === 'no_reportada' || a.estatus === 'rechazado')
}

export function etiquetaDe(a: AlumnoPagoSemana) {
  return estaAtenuado(a) ? ETIQUETA_ARCHIVADO : ETIQUETAS[a.estatus]
}
