export interface Configuracion {
  color_acento: string // vacío = se usa el color original del sistema
  fuente: string
  texto_footer: string
  nombre_negocio: string
  logo_url: string // vacío = se usa el icono genérico
  tema_loader: string | null // vacío = loader normal; el catálogo de temas vive en shared/constants/temasLoader.ts
  fuentes_disponibles: string[]
}

export interface ActualizarConfiguracionPayload {
  color_acento?: string // "" vuelve al color original
  fuente?: string
  nombre_negocio?: string
  tema_loader?: string | null // "" o null vuelve al loader normal
}
