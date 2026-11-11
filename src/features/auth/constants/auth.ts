export const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Mismo mínimo que exige el servidor para una contraseña nueva
export const LONGITUD_MINIMA_CONTRASENA = 8
// Espera antes de llevar al login tras cambiar la contraseña, para alcanzar a leer el aviso
export const ESPERA_REDIRIGIR_LOGIN_MS = 2500

export const AVISO_ENLACE_SIN_CODIGO = 'sin-codigo'

export const TEXTO_ERROR_CORREO_VACIO = 'Escribe tu correo'
export const TEXTO_ERROR_CORREO_FORMATO = 'El correo no parece válido, revisa que tenga @ y dominio'
export const TEXTO_ERROR_CONTRASENA_CORTA = `La contraseña debe tener al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres`
export const TEXTO_ERROR_CONTRASENA_DISTINTA = 'Las contraseñas no coinciden'
export const TEXTO_ERROR_CONFIRMACION_VACIA = 'Repite la contraseña nueva'
export const TEXTO_ERROR_GENERICO = 'No se pudo completar la solicitud, inténtalo de nuevo'
export const TEXTO_ERROR_DEMASIADOS_INTENTOS = 'Hiciste demasiados intentos. Espera un minuto e inténtalo de nuevo'
export const TEXTO_AVISO_ENLACE_SIN_CODIGO = 'El enlace no trae el código de recuperación. Pide uno nuevo con tu correo'
export const TEXTO_EXITO_RESPALDO = 'Contraseña actualizada, ya puedes iniciar sesión'
