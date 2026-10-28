// Lo que entrega GET /asistencias: la lista de hoy con una fila por alumno activo
export interface AlumnoAsistencia {
  cliente_id: number
  alumno: string
  escuela_id: number | null
  escuela: string
  turno?: string
  asistio: boolean | null // null = todavía no se marca
  ausencia_motivo?: string
  ausencia_horario?: string // entrada, salida o ambos
  tiene_ausencia: boolean // la familia avisó que hoy no va
}

export interface AsistenciasDia {
  fecha: string
  es_habil: boolean // lunes a viernes
  alumnos: AlumnoAsistencia[]
}
