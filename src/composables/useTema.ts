import { ref } from 'vue'

export type Tema = 'dark' | 'light'

const CLAVE = 'tema'

// Se parte de lo que index.html ya aplicó antes de cargar la página
const tema = ref<Tema>(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')

export function useTema() {
  function aplicar(nuevo: Tema) {
    tema.value = nuevo
    document.documentElement.dataset.theme = nuevo
    try {
      localStorage.setItem(CLAVE, nuevo)
    } catch {
      // sin almacenamiento: el cambio vale solo para esta sesión
    }
  }

  function alternar() {
    aplicar(tema.value === 'light' ? 'dark' : 'light')
  }

  return { tema, alternar }
}
