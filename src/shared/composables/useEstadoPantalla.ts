import { nextTick, onBeforeUnmount, watch, type Ref } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import { PREFIJO_ESTADO_PANTALLA, type PantallaRecordable } from '@/shared/constants/estadoPantalla'

interface EstadoGuardado {
  campos: Record<string, unknown>
  scroll: number
}

type Campos = Record<string, Ref<any>> // eslint-disable-line @typescript-eslint/no-explicit-any

function leer(clave: string): EstadoGuardado | null {
  try {
    const crudo = sessionStorage.getItem(clave)
    return crudo ? (JSON.parse(crudo) as EstadoGuardado) : null
  } catch {
    return null
  }
}

function escribir(clave: string, estado: EstadoGuardado) {
  try {
    sessionStorage.setItem(clave, JSON.stringify(estado))
  } catch {
    // sin almacenamiento: la pantalla simplemente no recuerda
  }
}

// Borra lo recordado de todas las pantallas: al cerrar sesión o al iniciarla
export function limpiarEstadoPantallas() {
  try {
    for (const clave of Object.keys(sessionStorage)) {
      if (clave.startsWith(PREFIJO_ESTADO_PANTALLA)) sessionStorage.removeItem(clave)
    }
  } catch {
    // sin almacenamiento: no hay nada que borrar
  }
}

/**
 * Recuerda, mientras dure la sesión de la pestaña, el estado de navegación y búsqueda de una pantalla
 * (los refs de `campos`) y su posición de scroll. Se llama al preparar la pantalla, antes de la primera carga,
 * para que ésta ya use los valores restaurados. El scroll se devuelve cuando `cargando` pasa a falso.
 * Si la URL ya trae parámetros (por ejemplo un enlace desde el Dashboard), mandan los de la URL.
 */
export function useEstadoPantalla(pantalla: PantallaRecordable, campos: Campos, cargando: Ref<boolean>) {
  const clave = PREFIJO_ESTADO_PANTALLA + pantalla
  const route = useRoute()
  const guardado = leer(clave)

  if (guardado && Object.keys(route.query).length === 0) {
    for (const [nombre, ref] of Object.entries(campos)) {
      if (nombre in guardado.campos) ref.value = guardado.campos[nombre]
    }
  }

  let scroll = guardado?.scroll ?? 0

  function guardar() {
    const valores: Record<string, unknown> = {}
    for (const [nombre, ref] of Object.entries(campos)) valores[nombre] = ref.value
    escribir(clave, { campos: valores, scroll })
  }

  watch(Object.values(campos), guardar, { deep: true })

  // El scroll se lee al salir de la pantalla, antes de que el contenido cambie
  function leerScroll() {
    scroll = window.scrollY
    guardar()
  }
  onBeforeRouteLeave(leerScroll)
  window.addEventListener('pagehide', leerScroll)
  onBeforeUnmount(() => window.removeEventListener('pagehide', leerScroll))

  // Solo cuando los datos ya cargaron hay altura suficiente para volver a la posición
  if (scroll > 0) {
    const detener = watch(
      cargando,
      async (valor) => {
        if (valor) return
        detener()
        await nextTick()
        window.scrollTo({ top: scroll })
      },
      { immediate: true },
    )
  }
}
