import type { AlumnoPortal, TipoPortal } from '@/features/portal-cliente/types/portal'

export type MetodoPagoPortal = 'digital' | 'efectivo'

export interface DireccionPortal {
  codigo_postal?: string
  calle: string
  numero_exterior?: string
  numero_interior?: string
  colonia: string
  direccion_referencias?: string
  foto_domicilio_url?: string
  actualizada_en: string | null
}

export interface AlumnoPerfilPortal extends AlumnoPortal {
  direccion: DireccionPortal
}

export interface PerfilPortal {
  tipo: TipoPortal
  nombre: string
  telefono: string
  correo?: string
  foto_url?: string
  alumnos: AlumnoPerfilPortal[]
}

export interface CambiosDireccion {
  calle?: string
  numero_exterior?: string
  numero_interior?: string
  colonia?: string
  direccion_referencias?: string
}

export interface DatosReportePago {
  metodo: MetodoPagoPortal
  nota: string
  captura: File | null
}
