import { computed, ref, watch } from 'vue'
import { verConfiguracion } from '@/shared/api/configuracion'
import { CLAVE_TEMA_LOADER, TEMA_NORMAL } from '@/shared/constants/temasLoader'
import type { Configuracion } from '@/shared/types/configuracion'

// La configuración vigente: la comparten el arranque de la app y la pantalla de Apariencia
const configuracion = ref<Configuracion | null>(null)

// El último tema de loader que se vio se recuerda en el navegador: así el primer loader ya sale decorado,
// sin esperar la respuesta del servidor
function leerTemaGuardado(): string {
  try {
    return localStorage.getItem(CLAVE_TEMA_LOADER) ?? TEMA_NORMAL
  } catch {
    return TEMA_NORMAL
  }
}
const temaGuardado = ref(leerTemaGuardado())

// Al llegar (o cambiar) la configuración del servidor se reescribe; si viene vacío, se borra
watch(configuracion, (c) => {
  if (!c) return
  temaGuardado.value = c.tema_loader ?? TEMA_NORMAL
  try {
    if (temaGuardado.value) localStorage.setItem(CLAVE_TEMA_LOADER, temaGuardado.value)
    else localStorage.removeItem(CLAVE_TEMA_LOADER)
  } catch {
    // sin almacenamiento: solo se pierde el ahorro del primer loader
  }
})

function cargarLetra(nombre: string) {
  const id = `letra-${nombre}`
  if (document.getElementById(id)) return
  const enlace = document.createElement('link')
  enlace.id = id
  enlace.rel = 'stylesheet'
  enlace.href = `https://fonts.googleapis.com/css2?family=${nombre.replace(/ /g, '+')}:wght@400;700&display=swap`
  document.head.appendChild(enlace)
}

// Pone el color de acento y la letra sobre las variables del tema (las de main.css)
export function aplicarConfiguracion(
  c: Pick<Configuracion, 'color_acento' | 'fuente'> & { nombre_negocio?: string },
) {
  const raiz = document.documentElement.style

  if (c.nombre_negocio) document.title = c.nombre_negocio

  if (c.color_acento) raiz.setProperty('--color-accent-user', c.color_acento)
  else raiz.removeProperty('--color-accent-user') // vacío: vuelve al color original de main.css

  if (c.fuente) {
    cargarLetra(c.fuente)
    raiz.setProperty('--font-sans', `'${c.fuente}', ui-sans-serif, system-ui, sans-serif`)
  }
}

export function useConfiguracion() {
  async function cargar() {
    try {
      configuracion.value = await verConfiguracion()
      aplicarConfiguracion(configuracion.value)
    } catch {
      // sin respuesta de la API se queda el diseño original: no debe impedir usar el sistema
    }
  }

  // Tema de temporada vigente del loader ('' = normal)
  const temaLoader = computed(() => (configuracion.value ? (configuracion.value.tema_loader ?? TEMA_NORMAL) : temaGuardado.value))

  return { configuracion, temaLoader, cargar }
}
