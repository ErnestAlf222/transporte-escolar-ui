export type EstatusSemana =
  'confirmado' | 'pendiente_revision' | 'rechazado' | 'no_reportada' | 'pago_parcial'

export interface AlumnoPagoSemana {
  cliente_id: number
  alumno: string
  metodo_pago: string
  metodo_semana: string // cómo se pagó esa semana; si el pago no lo trae, el método de la cuenta
  estatus: EstatusSemana
  monto: number
  con_recargo: boolean
  abonado?: number // lo ya recibido de esa semana, cuando es parcial
  tutor_id?: number | null // quienes comparten tutor son hermanos
  pago_id?: number
  evidencia_url?: string
  nota?: string
  fecha_reporte?: string
  motivo_rechazo?: string
  mensaje_admin?: string
  archivado: boolean
  sin_cuota: boolean
  tutor?: string
  telefono_tutor?: string
  telefono_alumno?: string
  monto_cuota: number
  monto_recargo: number
  dia_limite_pago: number // 0 = domingo ... 6 = sábado
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

// Lo que le toca a cada hermano cuando se recibe dinero de la familia
export interface ParteAbono {
  cliente_id: number
  monto: number // lo que se le abona
  saldo: number // lo que le falta después
  pagada: boolean
}

export interface AbonoPayload {
  lote: string // identificador único del envío: frena el doble toque
  semana_inicio: string // AAAA-MM-DD, el lunes de la semana
  monto: number
  recibido_en?: string // AAAA-MM-DD; vacío = ahora
  metodo?: 'digital' | 'efectivo'
  mensaje?: string
  simular?: boolean // true: solo calcula el reparto y no guarda nada
}

export interface AbonoRespuesta {
  mensaje: string
  partes: ParteAbono[]
}

export interface PagosSemana {
  semana_inicio: string
  es_actual: boolean
  primera_fecha: string // "AAAA-MM-DD" del primer alumno registrado; vacío si no hay
  resumen: ResumenPagoSemana
  escuelas: EscuelaPagoSemana[]
}
