export type EstatusProspecto = 'pendiente' | 'convertido' | 'descartado'

export interface ProspectoListItem {
  id: number
  nombre_alumno: string
  apellido_paterno_alumno?: string
  apellido_materno_alumno?: string
  nombre_tutor: string
  telefono_tutor: string
  tutor_id: number | null
  escuela_id: number | null
  nombre_escuela?: string
  estatus: EstatusProspecto
  fecha_contacto: string
}

export interface ProspectoDetalle {
  id: number
  nombre_alumno: string
  apellido_paterno_alumno?: string
  apellido_materno_alumno?: string
  nombre_tutor: string
  telefono_tutor: string
  telefono_emergencia?: string
  correo?: string
  codigo_postal?: string
  calle?: string
  numero_exterior?: string
  numero_interior?: string
  colonia?: string
  direccion_referencias?: string
  foto_domicilio_url?: string
  escuela_id: number | null
  nombre_escuela?: string
  estatus: EstatusProspecto
  fecha_contacto: string
  tutor_id: number | null
  telefono_alumno?: string
  parentesco?: string
  parentesco_detalle?: string
  alumnos: AlumnoFamilia[]
}

// Cada alumno de la misma familia (mismo tutor), incluido el que se está viendo
export interface AlumnoFamilia {
  id: number
  nombre_alumno: string
  apellido_paterno_alumno?: string
  apellido_materno_alumno?: string
  nombre_escuela?: string
  estatus: EstatusProspecto
}

export interface ConversionResponse {
  cliente_id: number
  token_acceso: string
  mensaje: string
}

export interface ActualizarProspectoPayload {
  nombre_alumno?: string
  apellido_paterno_alumno?: string
  apellido_materno_alumno?: string
  telefono_alumno?: string
  nombre_tutor?: string
  telefono_tutor?: string
  telefono_emergencia?: string
  correo?: string
  escuela_id?: number
  codigo_postal?: string
  calle?: string
  numero_exterior?: string
  numero_interior?: string
  colonia?: string
  direccion_referencias?: string
}
