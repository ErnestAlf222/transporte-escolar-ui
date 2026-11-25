import {
  TIPOS_IMAGEN_PERMITIDOS,
  MAX_BYTES_IMAGEN,
  MAX_BYTES_IMAGEN_ORIGINAL,
  LADO_MAYOR_IMAGEN_PX,
  CALIDAD_IMAGEN,
  TIPO_IMAGEN_SALIDA,
  TEXTO_IMAGEN_TIPO,
  TEXTO_IMAGEN_GRANDE,
} from '@/shared/constants/imagen'

export type ResultadoImagen = { archivo: File; error?: undefined } | { archivo?: undefined; error: string }

// Dibuja la imagen reducida (lado mayor limitado) y la comprime. Devuelve null si el navegador no puede.
async function comprimir(original: File): Promise<File | null> {
  try {
    const mapa = await createImageBitmap(original)
    const escala = Math.min(1, LADO_MAYOR_IMAGEN_PX / Math.max(mapa.width, mapa.height))
    const lienzo = document.createElement('canvas')
    lienzo.width = Math.max(1, Math.round(mapa.width * escala))
    lienzo.height = Math.max(1, Math.round(mapa.height * escala))
    const ctx = lienzo.getContext('2d')
    if (!ctx) return null
    // El JPEG no tiene transparencia: se pinta sobre blanco
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, lienzo.width, lienzo.height)
    ctx.drawImage(mapa, 0, 0, lienzo.width, lienzo.height)
    mapa.close()
    const blob = await new Promise<Blob | null>((ok) => lienzo.toBlob(ok, TIPO_IMAGEN_SALIDA, CALIDAD_IMAGEN))
    if (!blob) return null
    const nombre = original.name.replace(/\.[^.]+$/, '') || 'imagen'
    return new File([blob], `${nombre}.jpg`, { type: TIPO_IMAGEN_SALIDA })
  } catch {
    return null
  }
}

// Valida tipo y tamaño contra los límites del servidor y reduce la imagen. Si no se puede comprimir,
// se usa la original (siempre que cumpla los límites). Devuelve el archivo listo para subir o un mensaje claro.
export async function prepararImagen(original: File): Promise<ResultadoImagen> {
  if (!TIPOS_IMAGEN_PERMITIDOS.includes(original.type)) return { error: TEXTO_IMAGEN_TIPO }
  if (original.size > MAX_BYTES_IMAGEN_ORIGINAL) return { error: TEXTO_IMAGEN_GRANDE }
  const reducida = await comprimir(original)
  const elegida = reducida && reducida.size < original.size ? reducida : original
  if (elegida.size > MAX_BYTES_IMAGEN) return { error: TEXTO_IMAGEN_GRANDE }
  return { archivo: elegida }
}
