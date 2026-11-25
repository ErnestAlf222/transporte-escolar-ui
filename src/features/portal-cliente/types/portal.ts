import type { EstadoCiclo } from '@/shared/constants/estadoCiclo'

export type TipoPortal = 'tutor' | 'alumno'

export interface SesionPortalResponse {
  token: string
  tipo: TipoPortal
  expira: string
}

export interface EscuelaPortal {
  id: number
  nombre: string
  turno?: string
}

export interface AlumnoPortal {
  id: number
  nombre_alumno: string
  apellido_paterno_alumno: string
  apellido_materno_alumno: string
  telefono_alumno?: string
  escuela: EscuelaPortal | null
  foto_url?: string
}

export interface InfoSesionPortal {
  tipo: TipoPortal
  nombre: string
  foto_url?: string
  alumnos: AlumnoPortal[]
}

export interface DatosPagoPortal {
  tarjeta_deposito: string
}

export type EstadoSemanaPortal = 'pendiente' | 'por_verificar' | 'parcial' | 'pagado' | 'sin_cobro'

// Ciclo de pago de la semana, tal como lo calcula el servidor. En el resumen va plano en cada alumno;
// en los reportes va dentro de `ciclo`
export interface CicloPortal {
  cargo: number
  abonado_confirmado: number
  por_verificar: number
  saldo: number
  estado: EstadoCiclo
  puede_reportar: boolean
  total_familia: number
}

export interface AtrasoPortal {
  semana_inicio: string
  estado: string
  falta: number
  abonado?: number
  con_recargo: boolean
}

export interface AlumnoResumenPortal extends Partial<CicloPortal> {
  id: number
  nombre: string
  estado_semana: EstadoSemanaPortal
  debe_esta_semana: number
  abonado?: number
  con_recargo: boolean
  total_adeudo: number
  atrasos: AtrasoPortal[]
}

export interface ResumenPagosPortal {
  tipo: TipoPortal
  semana_actual: string
  debe_esta_semana: number
  total_adeudo: number
  alumnos: AlumnoResumenPortal[]
}

export type EstadoReportePortal = 'por_verificar' | 'pagado' | 'rechazado' | 'parcial'

export interface ReportePortal {
  pago_id: number
  alumno_id: number
  alumno: string
  semana_inicio: string
  estado: EstadoReportePortal
  metodo: string
  reportado_en: string
  confirmado_en?: string
  mensaje?: string
  abonado?: number
  falta?: number
  ciclo?: CicloPortal
}

export interface ReportesPortalResponse {
  reportes: ReportePortal[]
}
