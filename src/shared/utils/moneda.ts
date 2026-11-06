const FORMATO_MONEDA = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export function formatearMonto(monto: number): string {
  return FORMATO_MONEDA.format(monto)
}

const MONTO_MAXIMO = 100000 // el servidor rechaza más que esto

// Convierte lo que se escribe ("123", "123.5", "123,5") en número; null si no sirve
export function parseMonto(texto: string): number | null {
  const limpio = texto.trim().replace(',', '.')
  if (limpio === '') return null
  const n = Number(limpio)
  return Number.isFinite(n) && n >= 0 && n <= MONTO_MAXIMO ? n : null
}
