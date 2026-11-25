import type { EstadoReportePortal, EstadoSemanaPortal } from '@/features/portal-cliente/types/portal'

// Rutas del portal del cliente (prefijo propio, separado del admin)
export const RUTA_PORTAL_ACCESO = '/portal/acceso'
export const RUTA_PORTAL_INICIO = '/portal'
export const NOMBRE_RUTA_PORTAL_ACCESO = 'portal-acceso'
export const NOMBRE_RUTA_PORTAL_INICIO = 'portal-inicio'

// Claves de almacenamiento propias: distintas de 'token' del admin
export const CLAVE_PORTAL_TOKEN = 'portal_token'
export const CLAVE_PORTAL_EXPIRA = 'portal_expira'
export const CLAVE_PORTAL_DISPOSITIVO = 'portal_dispositivo'

// Rutas de la API
export const API_PORTAL_CODIGO = '/portal/codigo'
export const API_PORTAL_VERIFICAR = '/portal/codigo/verificar'
export const API_PORTAL_ENTRAR = '/portal/entrar'
export const API_PORTAL_SESION = '/portal/sesion'

export const LONGITUD_CODIGO = 6
// Espera antes de poder pedir otro código (el servidor permite 3 cada 15 min)
export const ESPERA_REENVIO_CODIGO_S = 30

export const TEXTO_TITULO_ACCESO = 'Portal del cliente'
export const TEXTO_SUBTITULO_TELEFONO = 'Escribe el teléfono con el que te registraste'
export const ETIQUETA_TELEFONO = 'Teléfono'
export const TEXTO_BOTON_CONTINUAR = 'Continuar'
export const TEXTO_BOTON_ENTRANDO = 'Verificando...'
export const TEXTO_ERROR_TELEFONO = 'Escribe tu teléfono de 10 dígitos'

export const TEXTO_TITULO_CODIGO = 'Revisa tu correo'
export const TEXTO_EXPLICA_CODIGO = 'Te enviamos un código de 6 dígitos'
export const ETIQUETA_CODIGO = 'Código de 6 dígitos'
export const TEXTO_ERROR_CODIGO = 'El código debe ser de 6 dígitos'
export const TEXTO_BOTON_VERIFICAR = 'Verificar código'
export const TEXTO_BOTON_REENVIAR = 'Reenviar código'
export const TEXTO_ESPERA_REENVIO = 'Puedes pedir otro código en'
export const TEXTO_CAMBIAR_NUMERO = 'Cambiar número'
export const TEXTO_ERROR_GENERICO = 'No se pudo completar la solicitud, inténtalo de nuevo'

export const TEXTO_SALUDO = 'Hola'
export const TEXTO_BOTON_SALIR = 'Salir'

// Rutas de la API: pagos y datos de pago
export const API_PORTAL_DATOS_PAGO = '/portal/datos-pago'
export const API_PORTAL_PAGOS_RESUMEN = '/portal/pagos/resumen'
export const API_PORTAL_PAGOS_REPORTES = '/portal/pagos/reportes'
export const API_PORTAL_PAGOS_EVENTOS = '/portal/pagos/eventos'

// Eventos del tiempo real de la familia
export const EVENTO_PAGO_VALIDADO = 'pago_validado'
export const EVENTO_PAGO_RECHAZADO = 'pago_rechazado'

// Tarjeta de depósito
export const TEXTO_TARJETA_TITULO = 'Tarjeta para depositar'
export const TEXTO_TARJETA_AYUDA = 'Toca la tarjeta para copiar el número'
export const TEXTO_TARJETA_VACIA_TITULO = 'Aún no hay una tarjeta para depositar'
export const TEXTO_TARJETA_VACIA_AYUDA = 'La administración la agregará pronto. Si tienes dudas, pregúntale a ella.'
export const TEXTO_TARJETA_COPIADA = (digitos: number) => `Número de tarjeta copiado. Revisa que tenga ${digitos} dígitos`
export const TEXTO_TARJETA_NO_COPIADA = 'No se pudo copiar. Mantén presionado el número para copiarlo'

// Resumen de pagos
export const TEXTO_RESUMEN_TITULO = 'Tus pagos'
export const TEXTO_RESUMEN_DEBES = 'Esta semana debes'
export const TEXTO_RESUMEN_AL_CORRIENTE = 'Estás al corriente'
export const TEXTO_RESUMEN_AL_CORRIENTE_AYUDA = 'No tienes pagos pendientes. ¡Gracias!'
export const TEXTO_RESUMEN_SOLO_ATRASOS = 'Tienes pagos atrasados'
export const TEXTO_RESUMEN_TOTAL = 'Total que se debe'
export const TEXTO_RESUMEN_ATRASOS = 'Semanas atrasadas'
export const TEXTO_RESUMEN_FALTA = 'Falta'
export const TEXTO_RESUMEN_ABONADO = 'Ya se recibió'
export const TEXTO_RESUMEN_RECARGO = 'Incluye recargo'
export const TEXTO_RESUMEN_POR_ALUMNO = 'Por alumno'
export const TEXTO_RESUMEN_VACIO = 'Todavía no hay pagos que mostrar'

// Reportes
export const TEXTO_REPORTES_TITULO = 'Tus reportes de pago'
export const TEXTO_REPORTES_VACIO = 'Aún no has reportado ningún pago'
export const TEXTO_REPORTES_MENSAJE_ADMIN = 'Mensaje de la administración'
export const TEXTO_REPORTES_FALTA = 'Falta por pagar'
export const TEXTO_REPORTES_SEMANA = 'Semana del'
export const ETIQUETAS_METODO_PORTAL: Record<string, string> = { digital: 'Tarjeta', efectivo: 'Efectivo' }

// Familia
export const TEXTO_FAMILIA_TITULO_TUTOR = 'Tu familia'
export const TEXTO_FAMILIA_TITULO_ALUMNO = 'Tus datos'
export const TEXTO_FAMILIA_SIN_ESCUELA = 'Sin escuela asignada'
export const TEXTO_FAMILIA_VACIA = 'Aún no hay alumnos con acceso al portal'

// Cargas
export const TEXTO_CARGANDO = 'Cargando...'
export const TEXTO_ERROR_CARGA = 'No pudimos cargar esta información'
export const TEXTO_BOTON_REINTENTAR = 'Intentar de nuevo'

// Avisos de tiempo real
export const TEXTO_AVISO_PAGO_VALIDADO = 'Se confirmó un pago de tu familia'
export const TEXTO_AVISO_PAGO_RECHAZADO = 'Se rechazó un reporte de pago. Revisa el detalle'

// Chips de estado (mismos tokens de color que el admin)
export const CLASES_CHIP_NEUTRO = 'bg-panel-2 text-text-secondary'
export const ETIQUETAS_ESTADO_SEMANA: Record<EstadoSemanaPortal, { texto: string; clases: string }> = {
  pendiente: { texto: 'Pendiente', clases: 'bg-danger/15 text-danger' },
  por_verificar: { texto: 'Por verificar', clases: 'bg-sun/15 text-sun' },
  parcial: { texto: 'Pago parcial', clases: 'bg-servicio/15 text-servicio' },
  pagado: { texto: 'Pagado', clases: 'bg-mint/15 text-mint' },
  sin_cobro: { texto: 'Sin cobro todavía', clases: 'bg-panel-2 text-text-muted' },
}
export const ETIQUETAS_ESTADO_REPORTE: Record<EstadoReportePortal, { texto: string; clases: string }> = {
  por_verificar: { texto: 'Por verificar', clases: 'bg-sun/15 text-sun' },
  pagado: { texto: 'Pagado', clases: 'bg-mint/15 text-mint' },
  rechazado: { texto: 'Rechazado', clases: 'bg-danger/15 text-danger' },
  parcial: { texto: 'Pago parcial', clases: 'bg-servicio/15 text-servicio' },
}
export const TEXTO_ERROR_VARIAS = 'Estamos teniendo problemas para mostrar tu información. Intenta de nuevo en un momento.'
// Desde cuántas secciones con error a la vez se muestra un solo aviso general en lugar de uno por sección
export const SECCIONES_CON_ERROR_PARA_AVISO_GENERAL = 2
