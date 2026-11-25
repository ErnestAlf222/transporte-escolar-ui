// Rutas de la API: perfil y reporte de pago
export const API_PORTAL_PERFIL = '/portal/perfil'
export const API_PORTAL_PERFIL_FOTO = '/portal/perfil/foto'
export const apiPortalFotoAlumno = (id: number) => `/portal/alumnos/${id}/foto`
export const apiPortalDireccionAlumno = (id: number) => `/portal/alumnos/${id}/direccion`
export const apiPortalFotoDomicilio = (id: number) => `/portal/alumnos/${id}/foto-domicilio`
export const apiPortalReportarPago = (id: number) => `/portal/alumnos/${id}/pagos`
export const CAMPO_ARCHIVO = 'archivo'
export const CAMPO_METODO = 'metodo'
export const CAMPO_NOTA = 'nota'

// Rutas y navegación
export const RUTA_PORTAL_PERFIL = '/portal/perfil'
export const NOMBRE_RUTA_PORTAL_PERFIL = 'portal-perfil'
export const TEXTO_NAV_INICIO = 'Inicio'
export const TEXTO_NAV_PERFIL = 'Perfil'
export const TEXTO_NAV_ETIQUETA = 'Secciones del portal'

// Límites de los textos (los mismos del servidor)
export const MAX_NOTA_PAGO = 200
export const MAX_CALLE = 120
export const MAX_COLONIA = 80
export const MAX_NUMERO = 20
export const MAX_REFERENCIAS = 300

// Reportar pago
export const TEXTO_BOTON_REPORTAR = 'Reportar mi pago'
export const TEXTO_REPORTAR_TITULO = 'Reportar pago'
export const TEXTO_REPORTAR_ALUMNOS = '¿De quién es este pago?'
export const TEXTO_REPORTAR_METODO = '¿Cómo pagaste?'
export const TEXTO_METODO_TARJETA = 'Con tarjeta'
export const TEXTO_METODO_EFECTIVO = 'En efectivo'
export const TEXTO_REPORTAR_CAPTURA = 'Captura de tu pago'
export const TEXTO_REPORTAR_ELEGIR_CAPTURA = 'Elegir captura'
export const TEXTO_REPORTAR_CAMBIAR_CAPTURA = 'Cambiar captura'
export const TEXTO_REPORTAR_CAPTURA_AYUDA = 'Sube la foto o captura de pantalla de tu transferencia'
export const TEXTO_REPORTAR_NOTA = 'Nota (opcional)'
export const TEXTO_REPORTAR_FECHA_FIJA = 'La fecha y la hora se anotan al enviar y no se pueden cambiar.'
export const TEXTO_REPORTAR_ENVIAR = 'Enviar reporte'
export const TEXTO_REPORTAR_AVANCE = (hechos: number, total: number) => `Enviando ${hechos} de ${total}`
export const TEXTO_REPORTAR_CERRAR = 'Cerrar'
export const TEXTO_REPORTAR_LISTO = 'Tu pago fue anotado y te avisaremos aquí cuando se haya aplicado'
export const TEXTO_REPORTAR_SIN_ALUMNOS = 'Elige al menos un alumno'
export const TEXTO_REPORTAR_SIN_CAPTURA = 'Sube la captura de tu pago con tarjeta'
export const TEXTO_REPORTAR_FALLOS = 'Algunos no se pudieron enviar. Revisa abajo e intenta de nuevo solo con ellos'
export const TEXTO_REPORTAR_REINTENTAR = 'Reintentar los que faltan'
export const TEXTO_ERROR_503 = 'Por ahora no se pueden subir capturas. Intenta más tarde o paga en efectivo'
export const TEXTO_ERROR_429 = 'Hiciste muchos cambios seguidos. Espera unos minutos e intenta de nuevo'
export const TEXTO_ERROR_RED = 'No pudimos enviar. Revisa tu conexión e intenta de nuevo'
export const TEXTO_ESTADO_ENVIADO = 'Enviado'

// Perfil
export const TEXTO_PERFIL_TITULO = 'Tu perfil'
export const TEXTO_PERFIL_SOLO_LECTURA = 'Para cambiar tu nombre, teléfono o correo, avisa a la administración.'
export const ETIQUETA_NOMBRE = 'Nombre'
export const ETIQUETA_TELEFONO_PERFIL = 'Teléfono'
export const ETIQUETA_CORREO = 'Correo'
export const TEXTO_CAMBIAR_FOTO = 'Cambiar foto'
export const TEXTO_SUBIENDO = 'Subiendo...'
export const TEXTO_FOTO_ACTUALIZADA = 'Foto actualizada'
export const TEXTO_DIRECCION_TITULO = 'Dirección'
export const ETIQUETA_CALLE = 'Calle'
export const ETIQUETA_NUM_EXTERIOR = 'Número exterior'
export const ETIQUETA_NUM_INTERIOR = 'Número interior'
export const ETIQUETA_COLONIA = 'Colonia'
export const ETIQUETA_REFERENCIAS = 'Referencias'
export const ETIQUETA_CODIGO_POSTAL = 'Código postal'
export const TEXTO_CP_AYUDA = 'El código postal no se puede cambiar desde aquí'
export const TEXTO_ERROR_CALLE = 'Escribe la calle'
export const TEXTO_ERROR_COLONIA = 'Escribe la colonia'
export const TEXTO_GUARDAR_DIRECCION = 'Guardar dirección'
export const TEXTO_GUARDANDO = 'Guardando...'
export const TEXTO_DIRECCION_ACTUALIZADA = 'Dirección actualizada'
export const TEXTO_FOTO_DOMICILIO = 'Foto de la casa'
export const TEXTO_FOTO_DOMICILIO_AYUDA = 'Ayuda al conductor a encontrar tu domicilio'
export const TEXTO_CAMBIAR_FOTO_DOMICILIO = 'Cambiar foto de la casa'
export const TEXTO_AGREGAR_FOTO_DOMICILIO = 'Agregar foto de la casa'
export const TEXTO_FOTO_DOMICILIO_ACTUALIZADA = 'Foto de la casa actualizada'
export const TEXTO_ERROR_GUARDAR = 'No se pudo guardar, inténtalo de nuevo'
