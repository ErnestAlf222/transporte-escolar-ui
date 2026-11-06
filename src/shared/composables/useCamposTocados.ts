import { ref, type Ref } from 'vue'

// Qué campos de un formulario ya "se tocaron", para mostrar su aviso solo cuando la persona salió del campo
// (`@blur="tocado.campo = true"` en la plantilla) o intentó enviar, no mientras escribe.
// - `tocarTodos()`: al intentar enviar, todos pasan a tocados.
// - `reiniciar()`: todos vuelven a no tocados (cada pantalla decide cuándo; Casos especiales, por ejemplo,
//   solo reinicia tras guardar, no al elegir otro alumno).
// Cada llamada crea su propio estado. Login (refs sueltos, sin reinicio) y Registro público (aviso tras enviar, sin blur)
// manejan esto distinto y no lo usan.
export function useCamposTocados<K extends string>(campos: readonly K[]) {
  const con = (valor: boolean) => Object.fromEntries(campos.map((c) => [c, valor])) as Record<K, boolean>
  const tocado = ref(con(false)) as Ref<Record<K, boolean>>

  function tocarTodos() {
    tocado.value = con(true)
  }

  function reiniciar() {
    tocado.value = con(false)
  }

  return { tocado, tocarTodos, reiniciar }
}
