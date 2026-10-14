export interface Configuracion {
  color_acento: string // vacío = se usa el color original del sistema
  fuente: string
  texto_footer: string
  nombre_negocio: string
  logo_url: string // vacío = se usa el icono genérico
  fuentes_disponibles: string[]
}

export interface ActualizarConfiguracionPayload {
  color_acento?: string // "" vuelve al color original
  fuente?: string
  nombre_negocio?: string
}
