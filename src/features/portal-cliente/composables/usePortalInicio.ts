import { computed, onMounted } from 'vue'
import { obtenerSesionPortal, obtenerDatosPago, obtenerResumenPagos, obtenerReportesPagos } from '@/features/portal-cliente/api/portal'
import { usePortalStore } from '@/features/portal-cliente/stores/portal'
import { useCargaPortal } from '@/features/portal-cliente/composables/useCargaPortal'
import { usePortalEventos } from '@/features/portal-cliente/composables/usePortalEventos'
import {
  EVENTO_PAGO_VALIDADO,
  EVENTO_PAGO_RECHAZADO,
  EVENTO_PAGO_ACTUALIZADO,
  SECCIONES_CON_ERROR_PARA_AVISO_GENERAL,
  TEXTO_AVISO_PAGO_VALIDADO,
  TEXTO_AVISO_PAGO_RECHAZADO,
  TEXTO_AVISO_PAGO_ACTUALIZADO,
} from '@/features/portal-cliente/constants/portal'
import { useAviso } from '@/shared/composables/useAviso'

// Todo lo que muestra el inicio del portal: datos de quien entró, tarjeta, resumen y reportes, más el tiempo real
export function usePortalInicio() {
  const portal = usePortalStore()
  const { mostrarAviso } = useAviso()

  const sesion = useCargaPortal(async () => {
    const info = await obtenerSesionPortal()
    portal.sesion = info
    return info
  })
  const tarjeta = useCargaPortal(obtenerDatosPago)
  const resumen = useCargaPortal(obtenerResumenPagos)
  const reportes = useCargaPortal(obtenerReportesPagos)

  // Si el acceso ya trajo la sesión (bienvenida), no se pide otra vez
  if (portal.sesion) {
    sesion.datos.value = portal.sesion
    sesion.estado.value = 'listo'
  }

  // Si fallan varias secciones a la vez, la pantalla muestra un solo aviso y un solo botón que recarga todo
  const variasFallan = computed(
    () =>
      [sesion, tarjeta, resumen, reportes].filter((s) => s.estado.value === 'error').length >=
      SECCIONES_CON_ERROR_PARA_AVISO_GENERAL,
  )
  function recargarTodo() {
    sesion.cargar()
    tarjeta.cargar()
    resumen.cargar()
    reportes.cargar()
  }

  const esTutor = computed(() => (sesion.datos.value?.tipo ?? resumen.datos.value?.tipo) === 'tutor')

  // Refresca resumen y reportes; si llegan varios eventos juntos, se hace una sola ronda más
  let refrescando = false
  let repetir = false
  async function refrescarPagos() {
    if (refrescando) {
      repetir = true
      return
    }
    refrescando = true
    try {
      do {
        repetir = false
        await Promise.all([resumen.cargar(), reportes.cargar()])
      } while (repetir)
    } finally {
      refrescando = false
    }
  }

  function alEvento(nombre: string) {
    if (nombre === EVENTO_PAGO_VALIDADO) mostrarAviso(TEXTO_AVISO_PAGO_VALIDADO)
    else if (nombre === EVENTO_PAGO_RECHAZADO) mostrarAviso(TEXTO_AVISO_PAGO_RECHAZADO)
    else if (nombre === EVENTO_PAGO_ACTUALIZADO) mostrarAviso(TEXTO_AVISO_PAGO_ACTUALIZADO)
    refrescarPagos()
  }

  const { iniciar } = usePortalEventos(alEvento, refrescarPagos)

  onMounted(() => {
    sesion.cargar() // con la sesión ya guardada se refresca sin mostrar cargando (puede haber cambiado una foto)
    tarjeta.cargar()
    resumen.cargar()
    reportes.cargar()
    iniciar()
  })

  return { sesion, tarjeta, resumen, reportes, esTutor, variasFallan, recargarTodo }
}
