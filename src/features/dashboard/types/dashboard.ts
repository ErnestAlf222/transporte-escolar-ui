// Lo que entrega GET /dashboard: un resumen rápido, sin filtrar por escuela
export interface DashboardResumen {
  clientes_activos: number
  pagos_confirmados_semana: number
  pagos_pendientes: number
  ausencias_hoy: number
  prospectos_nuevos_7_dias: number
}
