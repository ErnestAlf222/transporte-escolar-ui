import { ref, watch, onUnmounted } from 'vue'
import { consultarTelefono } from '@/api/registro-publico'
import type { ConsultaTelefonoResponse } from '@/types/registro-publico'

const LONGITUD_TELEFONO = 10
const ESPERA_CONSULTA_MS = 400

// Escucha un teléfono mientras se escribe: al completar los dígitos y dejar de teclear, pregunta al servidor
export function useConsultaTelefono(telefono: () => string) {
  const resultado = ref<ConsultaTelefonoResponse | null>(null)
  let temporizador: ReturnType<typeof setTimeout> | undefined
  let ultimaSolicitud = 0

  watch(telefono, (valor) => {
    clearTimeout(temporizador)
    ultimaSolicitud++ // invalida cualquier respuesta que aún no llegó
    resultado.value = null

    const digitos = valor.replace(/\D/g, '')
    if (digitos.length !== LONGITUD_TELEFONO) return

    temporizador = setTimeout(async () => {
      const solicitud = ++ultimaSolicitud
      try {
        const respuesta = await consultarTelefono(digitos)
        if (solicitud === ultimaSolicitud) resultado.value = respuesta
      } catch {
        // Si la consulta falla no se bloquea el registro: el servidor valida de nuevo al enviar
      }
    }, ESPERA_CONSULTA_MS)
  })

  onUnmounted(() => clearTimeout(temporizador))

  return { resultado }
}
