// Lo que entrega GET /ausencias
export interface Ausencia {
  id: number
  nombre_alumno: string
  apellido_alumno: string
  fecha: string
  motivo: string
  horario_afectado: string // entrada, salida o ambos
  reportado_en: string
}
