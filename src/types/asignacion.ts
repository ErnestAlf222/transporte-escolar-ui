export interface ConductorAsignacion {
  id: number
  nombre: string
  foto_url?: string
}

export interface AlumnoAsignacion {
  id: number
  alumno: string
  escuela_id: number | null
  escuela: string
  turno?: string
  colonia?: string
  conductor_id: number | null // null = sin asignar
  orden_ruta: number | null
}

export interface Asignaciones {
  conductores: ConductorAsignacion[]
  alumnos: AlumnoAsignacion[]
}

export interface ResultadoLote {
  asignados: number
  sin_cambio: number
}
