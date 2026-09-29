export type EstatusCliente = 'activo' | 'archivado'
export type MetodoPago = 'digital' | 'efectivo'
export type MotivoArchivo = 'cambio_escuela' | 'no_pago' | 'ya_no_continua' | 'otro'

export interface ClienteListItem {
  id: number
  nombre_alumno: string
  apellido_paterno_alumno: string
  apellido_materno_alumno: string
  nombre_tutor: string
  telefono_tutor: string
  metodo_pago: MetodoPago
  escuela_id: number | null
  nombre_escuela?: string
  motivo_archivo?: MotivoArchivo
  motivo_archivo_detalle?: string
}

export interface ActualizarClientePayload {
  nombre_alumno?: string
  apellido_paterno_alumno?: string
  apellido_materno_alumno?: string
  telefono_alumno?: string
  nombre_tutor?: string
  telefono_tutor?: string
  telefono_emergencia?: string
  correo?: string
  escuela_id?: number
}

export interface ClienteDetalle {
  id: number
  nombre_alumno: string
  apellido_paterno_alumno: string
  apellido_materno_alumno: string
  telefono_alumno?: string
  nombre_tutor: string
  telefono_tutor: string
  telefono_emergencia?: string
  correo: string
  escuela_id: number | null
  nombre_escuela?: string
  metodo_pago: MetodoPago
  monto_cuota: number
  monto_recargo: number
  dia_limite_pago: number
  estatus: EstatusCliente
  motivo_archivo?: MotivoArchivo
  motivo_archivo_detalle?: string
  foto_url?: string
}
