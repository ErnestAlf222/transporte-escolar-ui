export const TEXTO_CANDADO = 'Todos los hermanos pagan lo mismo'
export const TEXTO_CANDADO_ETIQUETA = 'Hermanos con la misma tarifa'
export const TEXTO_CANDADO_CONFIRMAR = 'Confirmar'
export const TEXTO_CANDADO_CANCELAR = 'Cancelar'
export const TEXTO_CANDADO_ERROR = 'No se pudo cambiar la tarifa de la familia'
export const TEXTO_CANDADO_APAGADO_AVISO = 'Cada hermano conserva su tarifa'
export const TEXTO_CANDADO_PUESTO_AVISO = 'Todos los hermanos quedaron con la misma tarifa'

export const textoConfirmarEncender = (alumno: string, lunes: string) =>
  `Todos quedarán con la tarifa de ${alumno} desde el ${lunes}.`
export const TEXTO_CONFIRMAR_APAGAR = 'Cada hermano conserva su tarifa actual y desde ahí son independientes.'

export const textoGuardadoTodos = (lunes: string) => `Se aplicó a todos los hermanos desde el ${lunes}.`
export const textoGuardadoUno = (alumno: string, lunes: string) => `Se aplicó solo a ${alumno} desde el ${lunes}.`
export const TEXTO_GUARDADO_METODO = 'Método de pago aplicado de inmediato.'
export const TEXTO_GUARDADO_SIMPLE = 'Guardado.'
