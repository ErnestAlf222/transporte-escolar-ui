import type { AlumnoPagoSemana, FamiliaPago } from '@/features/pagos/types/pago'
import { ESTADO_CICLO, ESTADOS_QUE_PIDEN_ABONO, VISTA_ARCHIVADO, type EstadoCiclo } from '@/shared/constants/estadoCiclo'
import { estadoDeEstatusAdmin } from '@/shared/utils/estadoCiclo'
import { formatearMonto } from '@/shared/utils/moneda'

export const METODO_DIGITAL = 'digital'

export const ETIQUETAS_METODO: Record<string, string> = { digital: 'Digital', efectivo: 'Efectivo' }

// El estado del ciclo de un alumno: el del servidor, o el viejo traducido por el adaptador
export function estadoDe(a: AlumnoPagoSemana): EstadoCiclo {
  return estadoDeEstatusAdmin(a.estatus, a.estado)
}

// Lo que falta de esa semana
export function saldoDe(a: AlumnoPagoSemana): number {
  return a.saldo ?? a.monto
}

// Un archivado sin pago por verificar no es deuda de la semana: se ve atenuado
export function estaAtenuado(a: AlumnoPagoSemana): boolean {
  const estado = estadoDe(a)
  return a.archivado && (estado === 'sin_reportar' || estado === 'rechazada')
}

export function etiquetaDe(a: AlumnoPagoSemana) {
  return estaAtenuado(a) ? VISTA_ARCHIVADO : ESTADO_CICLO[estadoDe(a)]
}

// La única acción visible de un alumno en la lista, según su estado
export interface AccionPago {
  tipo: 'revisar' | 'recibi' | 'configurar'
  texto: string
}

export function accionDe(a: AlumnoPagoSemana): AccionPago | null {
  if (estaAtenuado(a)) return null
  if (a.sin_cuota) return { tipo: 'configurar', texto: 'Configurar cuota' }
  const estado = estadoDe(a)
  const recibi = saldoDe(a) > 0 ? { tipo: 'recibi' as const, texto: `Recibí ${formatearMonto(saldoDe(a))}` } : null
  if (estado === 'por_verificar') {
    // Un pago digital reportado se revisa (confirmar, recibí menos o rechazar); el efectivo se recibe en persona
    return a.metodo_semana === METODO_DIGITAL && a.pago_id !== undefined ? { tipo: 'revisar', texto: 'Revisar' } : recibi
  }
  return ESTADOS_QUE_PIDEN_ABONO.includes(estado) ? recibi : null
}

// Una fila por familia (mismo tutor); quien no tiene tutor va solo. Conserva el orden en que llegan los alumnos
export function agruparFamilias(alumnos: AlumnoPagoSemana[]): FamiliaPago[] {
  const porClave = new Map<string, AlumnoPagoSemana[]>()
  for (const a of alumnos) {
    const clave = a.tutor_id === null || a.tutor_id === undefined ? `solo-${a.cliente_id}` : `tutor-${a.tutor_id}`
    porClave.set(clave, [...(porClave.get(clave) ?? []), a])
  }
  return [...porClave.entries()].map(([clave, miembros]) => {
    const primero = miembros[0]!
    const centavos = miembros.reduce(
      (suma, a) => (estadoDe(a) === 'pagada' || a.archivado ? suma : suma + Math.round(saldoDe(a) * 100)),
      0,
    )
    return {
      clave,
      tutor: primero.tutor ?? '',
      alumnos: miembros,
      totalFamilia: primero.total_familia ?? centavos / 100,
    }
  })
}
