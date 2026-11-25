// Límites de las imágenes que acepta el servidor (internal/archivos): 5 MB y solo JPEG, PNG o WebP
export const TIPOS_IMAGEN_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_BYTES_IMAGEN = 5 * 1024 * 1024
export const ACEPTA_IMAGENES = TIPOS_IMAGEN_PERMITIDOS.join(',')

// Reducción en el navegador antes de subir
export const LADO_MAYOR_IMAGEN_PX = 1600
export const CALIDAD_IMAGEN = 0.82
export const TIPO_IMAGEN_SALIDA = 'image/jpeg'
// Una imagen original más grande que esto ni se intenta procesar (podría trabar el navegador)
export const MAX_BYTES_IMAGEN_ORIGINAL = 40 * 1024 * 1024

export const TEXTO_IMAGEN_TIPO = 'Elige una imagen JPEG, PNG o WebP'
export const TEXTO_IMAGEN_GRANDE = 'La imagen pesa demasiado. Elige una de menos de 5 MB'
