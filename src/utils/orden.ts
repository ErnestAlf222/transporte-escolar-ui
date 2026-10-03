const COLLATOR = new Intl.Collator('es', { sensitivity: 'base' })

// Orden alfabético en español: no distingue mayúsculas ni acentos
export function compararTexto(a: string, b: string): number {
  return COLLATOR.compare(a, b)
}
