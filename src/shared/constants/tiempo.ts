// Espera antes de reintentar la conexión de tiempo real (SSE) tras un corte
export const ESPERA_RECONEXION_MS = 3000

// Cuánto se mantiene encendido el destello al abrir un detalle desde una búsqueda.
// Coincide con la duración de la animación `destello` de main.css (3 s): si cambia una, cambia la otra.
export const DURACION_DESTELLO_MS = 3000

// Al tocar una tarjeta del Dashboard se ve el loader de pantalla al menos este tiempo antes de cambiar de sección
export const PAUSA_NAVEGACION_MS = 500

// Duración de cada movimiento en bucle de los temas de temporada del loader
export const DURACION_TITILEO_MS = 1200 // parpadeo de las luces
export const DURACION_CAIDA_MS = 7000 // una vuelta de la nieve o los pétalos
export const DURACION_BALANCEO_MS = 3400 // vaivén del gorro y los banderines
export const DURACION_PULSO_MS = 2200 // latido de los rayos y destellos
export const DURACION_REBOTE_MS = 1200 // un salto de la camioneta con tema (y del gorro)
export const DURACION_ESTALLIDO_MS = 2600 // un fuego artificial: se abre y se apaga
export const DURACION_GIRO_MS = 6000 // una vuelta de la manecilla del reloj
export const DURACION_RAFAGA_MS = 1100 // la ráfaga de confeti al aparecer el loader
export const DURACION_MENSAJE_MS = 700 // entrada del mensaje festivo

// Pantalla de bienvenida con el loader de temporada, tras iniciar sesión y tras registrarse. Con "reducir movimiento" dura menos
export const DURACION_BIENVENIDA_MS = 3000
export const DURACION_BIENVENIDA_REDUCIDA_MS = 800

// Cuánto se ve un aviso breve (toast) antes de irse solo
export const DURACION_AVISO_MS = 3500

// Tope de la espera creciente al reconectar el tiempo real del portal tras cortes seguidos
export const ESPERA_RECONEXION_MAX_MS = 30000
