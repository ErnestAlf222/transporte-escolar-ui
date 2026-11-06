// Pausa mínima del loader al cambiar de semana en Pagos (ms)
export const PAUSA_CARGA_MS = 100

export function esperar(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, Math.max(0, ms)))
}
