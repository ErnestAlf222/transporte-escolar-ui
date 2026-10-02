export type Parentesco = 'padre' | 'madre' | 'abuelo' | 'abuela' | 'estudiante' | 'otro'

export interface RegistroProspectoPayload {
  nombre_alumno: string
  apellido_paterno_alumno: string
  apellido_materno_alumno: string
  telefono_alumno?: string
  parentesco: Parentesco
  parentesco_detalle?: string
  nombre_tutor?: string
  telefono_tutor?: string
  correo?: string
  codigo_postal?: string
  calle?: string
  numero_exterior?: string
  colonia?: string
  direccion_referencias?: string
  escuela_id: number
}

export interface RegistroProspectoResponse {
  ya_existe: boolean
  tipo?: 'cliente' | 'prospecto' | 'telefono'
  mensaje: string
}

export interface ConsultaTelefonoResponse {
  tipo: 'tutor' | 'alumno' | 'libre'
  nombre?: string
}

