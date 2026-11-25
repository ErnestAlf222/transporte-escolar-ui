import type { EstadoCiclo } from '@/shared/constants/estadoCiclo'

export type EstatusSemana =
  'confirmado' | 'pendiente_revision' | 'rechazado' | 'no_reportada' | 'pago_parcial' | 'sin_cobro' // su cuota empieza en una semana posterior: todavía no hay nada que cobrar

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
  servicio?: string // completo, ida o vuelta
  monto_cuota: number
  monto_recargo: number
  dia_limite_pago: number // 0 = domingo ... 6 = sábado
  // Ciclo de pago de la semana (lo calcula el servidor, ya viene en cada alumno)
  cargo?: number // lo que toca esa semana (cuota, más recargo si aplica)
  abonado_confirmado?: number
  por_verificar?: number // lo que espera revisión
  saldo?: number // lo que falta
  estado?: EstadoCiclo
  puede_reportar?: boolean
  total_familia?: number // lo que falta esa semana entre los hermanos (mismo tutor)
  tarifa_unificada?: boolean // candado de la familia: todos los hermanos pagan lo mismo
}

// Los hermanos (mismo tutor) de una escuela, juntos en una sola fila
export interface FamiliaPago {
  clave: string
  tutor: string
  alumnos: AlumnoPagoSemana[]
  totalFamilia: number // lo que falta esa semana entre todos los hermanos
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
  pago_parcial: number
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

export interface CandadoTarifaRespuesta {
  mensaje: string
  tarifa_unificada: boolean
  aplica_desde?: string // AAAA-MM-DD: el lunes desde el que rige; vacío si ya tenían esa tarifa
}

export interface RecibiMenosPayload {
  lote: string // identificador único del intento: frena el doble toque
  monto: number
  mensaje?: string
}

export interface RecibiMenosRespuesta {
  mensaje: string
  abonado: number
  falta: number
}

export interface AbonoRespuesta {
  mensaje: string
  partes: ParteAbono[]
}

// Lo que le tocó a cada hermano en un recibo
export interface ParteRecibo {
  cliente_id: number
  alumno: string
  monto: number
}

// Un cobro de la familia en una semana: puede estar repartido entre varios hermanos
export interface Recibo {
  lote: string
  monto: number
  recibido_en: string
  registrado_en: string
  registrado_por?: string
  metodo: string
  partes: ParteRecibo[]
}

export interface PagosSemana {
  semana_inicio: string
  es_actual: boolean
  primera_fecha: string // "AAAA-MM-DD" del primer alumno registrado; vacío si no hay
  resumen: ResumenPagoSemana
  escuelas: EscuelaPagoSemana[]
}
