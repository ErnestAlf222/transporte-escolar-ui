export interface ConductorLista {
  id: number
  nombre_completo: string
  telefono: string
  estatus: 'activo' | 'inactivo'
  foto_url?: string
  alumnos: number
  ultimo_recorrido?: string // fecha y hora del último "terminé el recorrido"; vacío si nunca ha avisado
}

export interface ParadaRuta {
  alumno_id: number
  alumno: string
  escuela: string
  turno?: string
  tutor_id: number | null
  escuela_id: number | null
  calle?: string
  numero_exterior?: string
  numero_interior?: string
  colonia?: string
  codigo_postal?: string
  referencias?: string
  foto_domicilio_url?: string
  orden_ruta: number | null
}

export interface RutaConductor {
  conductor: { id: number; nombre: string; foto_url?: string }
  paradas: ParadaRuta[]
}

export interface RecorridoTerminado {
  mensaje: string
  terminado_en: string
  alumnos: number
}
