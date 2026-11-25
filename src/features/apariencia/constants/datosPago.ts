import { TARJETA_DIGITOS_MAX, TARJETA_DIGITOS_MIN } from '@/shared/constants/tarjeta'

// Textos de la sección "Datos de pago" de Configuración
export const TEXTOS_DATOS_PAGO = {
  titulo: 'Datos de pago',
  etiqueta: 'Tarjeta para depositar',
  ayuda: 'Es el número que ven los clientes en su portal para pagar. Escribe solo los números.',
  ayudaLectura: 'Solo la administración puede cambiar este número.',
  vacia: 'Todavía no hay una tarjeta capturada',
  placeholder: '0000 0000 0000 0000',
  longitud: `Debe tener entre ${TARJETA_DIGITOS_MIN} y ${TARJETA_DIGITOS_MAX} números`,
  guardar: 'Guardar tarjeta',
  guardada: 'Tarjeta guardada',
  borrada: 'Tarjeta borrada',
  errorGuardar: 'No se pudo guardar la tarjeta',
  errorCargar: 'No se pudo cargar la tarjeta',
} as const
