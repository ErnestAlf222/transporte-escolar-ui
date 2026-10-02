export type EstatusSemana = 'confirmado' | 'pendiente_revision' | 'rechazado' | 'no_reportada'

export interface AlumnoPagoSemana {
  cliente_id: number
  alumno: string
  metodo_pago: string
  estatus: EstatusSemana
  monto: number
  con_recargo: boolean
  pago_id?: number
  evidencia_url?: string
  nota?: string
  fecha_reporte?: string
  motivo_rechazo?: string
  mensaje_admin?: string
  archivado: boolean
  sin_cuota: boolean
}

export interface EscuelaPagoSemana {
  escuela_id: number | null
  nombre: string
  turno?: string
  alumnos: AlumnoPagoSemana[]
}

export interface ResumenPagoSemana {
  por_verificar: number
  sin_reportar: number
  rechazados: number
  archivados: number
  pagados: number
}

export interface PagosSemana {
  semana_inicio: string
  es_actual: boolean
  resumen: ResumenPagoSemana
  escuelas: EscuelaPagoSemana[]
}
