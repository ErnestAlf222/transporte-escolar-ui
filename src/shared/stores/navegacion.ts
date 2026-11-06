import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNavegacionStore = defineStore('navegacion', () => {
  const cargandoPantalla = ref(false)

  function mostrar() {
    cargandoPantalla.value = true
  }

  function ocultar() {
    cargandoPantalla.value = false
  }

  return { cargandoPantalla, mostrar, ocultar }
})
