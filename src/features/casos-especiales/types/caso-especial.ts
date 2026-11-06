// Un pago de la semana en curso que se cobró por otro monto
export interface CasoEspecial {
  pago_id: number
  cliente_id: number
  alumno: string
  escuela: string
  semana_inicio: string
  monto: number
  motivo: string
}

export interface CasoEspecialPayload {
  monto: number
  motivo: string
}
