import { ref, type Ref } from 'vue'
import { DURACION_DESTELLO_MS } from '@/shared/constants/tiempo'

// Qué iluminar al abrir un detalle desde una búsqueda: se enciende, dura DURACION_DESTELLO_MS y se apaga.
// `apagado` es el valor en reposo (por ejemplo '' o null). Cada llamada crea su propio estado: no se comparte entre pantallas.
//
// Igual que el código que reemplaza, el temporizador no se limpia al desmontar la pantalla
// (al dispararse solo escribe en una referencia local, sin efecto visible).
export function useDestello<T>(apagado: T) {
  const resaltado = ref(apagado) as Ref<T>
  let temporizador: ReturnType<typeof setTimeout> | undefined

  // Reinicia el temporizador (abrir otra tarjeta apaga el destello anterior), enciende `valor`,
  // ejecuta `entretanto` (abrir el detalle, elegir la familia…) y arranca la cuenta de los 3 s.
  // El temporizador se arranca siempre, incluso con `valor === apagado` (sin búsqueda), como antes.
  function iluminar(valor: T, entretanto?: () => void) {
    clearTimeout(temporizador)
    resaltado.value = valor
    entretanto?.()
    temporizador = setTimeout(() => (resaltado.value = apagado), DURACION_DESTELLO_MS)
  }

  return { resaltado, iluminar }
}
