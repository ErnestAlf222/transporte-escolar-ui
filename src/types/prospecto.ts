export type EstatusProspecto = 'pendiente' | 'convertido'

export interface ProspectoListItem {
  id: number
  nombre_alumno: string
  apellido_paterno_alumno?: string
  apellido_materno_alumno?: string
  nombre_tutor: string
  telefono_tutor: string
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
}

export interface ConversionResponse {
  cliente_id: number
  token_acceso: string
  mensaje: string
}
