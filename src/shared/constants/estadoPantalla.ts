// Prefijo de las claves del almacenamiento de sesión donde se recuerda el estado de cada pantalla del panel
export const PREFIJO_ESTADO_PANTALLA = 'estado-pantalla:'

// Pantallas del panel de admin que recuerdan su búsqueda, filtros y posición
export const PANTALLAS = {
  dashboard: 'dashboard',
  clientes: 'clientes',
  prospectos: 'prospectos',
  pagos: 'pagos',
  familias: 'familias',
  asistencias: 'asistencias',
} as const

export type PantallaRecordable = (typeof PANTALLAS)[keyof typeof PANTALLAS]
