const FORMATO_MONEDA = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export function formatearMonto(monto: number): string {
  return FORMATO_MONEDA.format(monto)
}
