import { ref } from 'vue'
import { DURACION_AVISO_MS } from '@/shared/constants/tiempo'

export type TipoAviso = 'ok' | 'error'

export interface Aviso {
  texto: string
  tipo: TipoAviso
}

// Aviso breve (toast) compartido: lo muestra AvisoFlotante (puesto una sola vez en App.vue). Uno a la vez: el nuevo reemplaza al anterior.
const aviso = ref<Aviso | null>(null)
let temporizador: ReturnType<typeof setTimeout> | undefined

export function useAviso() {
  function mostrarAviso(texto: string, tipo: TipoAviso = 'ok') {
    clearTimeout(temporizador)
    aviso.value = { texto, tipo }
    temporizador = setTimeout(() => (aviso.value = null), DURACION_AVISO_MS)
  }

  return { aviso, mostrarAviso }
}
