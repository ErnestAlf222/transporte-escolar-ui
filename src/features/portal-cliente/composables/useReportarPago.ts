import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { reportarPago } from '@/features/portal-cliente/api/perfil'
import { mensajeErrorPortal } from '@/features/portal-cliente/utils/errores'
import {
  TEXTO_REPORTAR_SIN_ALUMNOS,
  TEXTO_REPORTAR_SIN_CAPTURA,
  TEXTO_REPORTAR_LISTO,
} from '@/features/portal-cliente/constants/perfil'
import type { AlumnoResumenPortal } from '@/features/portal-cliente/types/portal'
import type { MetodoPagoPortal } from '@/features/portal-cliente/types/perfil'
import { useAviso } from '@/shared/composables/useAviso'

export type EstadoEnvio = 'pendiente' | 'enviando' | 'ok' | 'error'

// Estado del formulario de reporte de pago. La ruta es por alumno: se manda una petición por cada alumno elegido,
// una tras otra (comparten el cupo de escrituras), con la misma captura. Los que ya salieron bien no se repiten.
export function useReportarPago(alumnos: () => AlumnoResumenPortal[], alReportar: () => void) {
  const { mostrarAviso } = useAviso()

  const metodo = ref<MetodoPagoPortal>('digital')
  const nota = ref('')
  const captura = ref<File | null>(null)
  const urlPrevia = ref('')
  const errorCaptura = ref('')
  const seleccion = ref<number[]>([])
  const estados = ref<Record<number, { estado: EstadoEnvio; error: string }>>({})
  const enviando = ref(false)
  const error = ref('')
  const terminado = ref(false)

  // Solo se listan quienes pueden reportar (lo dice el servidor); por defecto van los que deben algo
  const elegibles = computed(() => alumnos().filter((a) => a.puede_reportar === true))

  function reiniciar() {
    metodo.value = 'digital'
    nota.value = ''
    quitarCaptura()
    errorCaptura.value = ''
    estados.value = {}
    error.value = ''
    terminado.value = false
    // Por defecto, los que deben algo
    const quienDebe = elegibles.value.filter((a) => a.debe_esta_semana > 0)
    seleccion.value = (quienDebe.length ? quienDebe : elegibles.value).map((a) => a.id)
  }

  function quitarCaptura() {
    if (urlPrevia.value) URL.revokeObjectURL(urlPrevia.value)
    urlPrevia.value = ''
    captura.value = null
  }

  function ponerCaptura(archivo: File) {
    quitarCaptura()
    captura.value = archivo
    urlPrevia.value = URL.createObjectURL(archivo)
    errorCaptura.value = ''
    error.value = ''
  }

  watch(metodo, () => (error.value = ''))
  onBeforeUnmount(quitarCaptura)

  const hechos = computed(() => Object.values(estados.value).filter((e) => e.estado === 'ok').length)
  const hayFallos = computed(() => Object.values(estados.value).some((e) => e.estado === 'error'))

  async function enviar() {
    if (enviando.value || terminado.value) return // bloquea el doble envío
    const pendientes = seleccion.value.filter((id) => estados.value[id]?.estado !== 'ok')
    if (!pendientes.length) {
      error.value = TEXTO_REPORTAR_SIN_ALUMNOS
      return
    }
    if (metodo.value === 'digital' && !captura.value) {
      error.value = TEXTO_REPORTAR_SIN_CAPTURA
      return
    }
    error.value = ''
    enviando.value = true
    for (const id of pendientes) estados.value[id] = { estado: 'pendiente', error: '' }
    try {
      for (const id of pendientes) {
        estados.value[id] = { estado: 'enviando', error: '' }
        try {
          await reportarPago(id, { metodo: metodo.value, nota: nota.value, captura: captura.value })
          estados.value[id] = { estado: 'ok', error: '' }
        } catch (e) {
          estados.value[id] = { estado: 'error', error: mensajeErrorPortal(e) }
        }
      }
    } finally {
      enviando.value = false
    }
    if (hechos.value > 0) alReportar()
    if (!hayFallos.value) {
      terminado.value = true
      mostrarAviso(TEXTO_REPORTAR_LISTO)
    }
  }

  return {
    metodo, nota, captura, urlPrevia, errorCaptura, seleccion, estados, enviando, error, terminado,
    elegibles, hechos, hayFallos, reiniciar, ponerCaptura, quitarCaptura, enviar,
  }
}
