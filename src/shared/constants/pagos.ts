import type { MetodoPago } from '@/shared/types/pago'

// Largo máximo del mensaje/motivo que se escribe al registrar, confirmar o rechazar un pago
export const MAX_MENSAJE = 300

// Pagos: su ruta y el parámetro de búsqueda con el que otras pantallas lo abren filtrado
export const RUTA_PAGOS = '/pagos'
export const PARAM_BUSQUEDA_PAGOS = 'q'

// La semana es de lunes a viernes: el servidor rechaza sábado y domingo como día límite (0 = domingo ... 6 = sábado)
export const DIAS_LIMITE_PAGO = [
  { valor: 1, etiqueta: 'Lun' },
  { valor: 2, etiqueta: 'Mar' },
  { valor: 3, etiqueta: 'Mié' },
  { valor: 4, etiqueta: 'Jue' },
  { valor: 5, etiqueta: 'Vie' },
] as const

export const METODOS_PAGO: { valor: MetodoPago; etiqueta: string }[] = [
  { valor: 'digital', etiqueta: 'Digital' },
  { valor: 'efectivo', etiqueta: 'Efectivo' },
]
