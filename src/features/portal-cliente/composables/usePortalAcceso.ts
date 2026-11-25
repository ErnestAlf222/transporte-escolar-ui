import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { solicitarCodigo, verificarCodigo, entrarPortal, obtenerSesionPortal } from '@/features/portal-cliente/api/portal'
import { usePortalStore } from '@/features/portal-cliente/stores/portal'
import {
  LONGITUD_CODIGO,
  ESPERA_REENVIO_CODIGO_S,
  NOMBRE_RUTA_PORTAL_INICIO,
  TEXTO_ERROR_TELEFONO,
  TEXTO_ERROR_CODIGO,
  TEXTO_ERROR_GENERICO,
  TEXTO_SALUDO,
} from '@/features/portal-cliente/constants/portal'
import type { SesionPortalResponse } from '@/features/portal-cliente/types/portal'
import { LONGITUD_TELEFONO } from '@/shared/constants/telefono'
import { esEstado, mensajeDeError } from '@/shared/utils/errores'
import { useBienvenida } from '@/shared/composables/useBienvenida'

// Flujo de acceso: teléfono → (dispositivo nuevo) código → sesión + bienvenida → inicio
export function usePortalAcceso() {
  const router = useRouter()
  const portal = usePortalStore()
  const { conBienvenida } = useBienvenida()

  const paso = ref<'telefono' | 'codigo'>('telefono')
  const telefono = ref('')
  const codigo = ref('')
  const error = ref('')
  const aviso = ref('') // mensaje neutro de la API, tal cual
  const cargando = ref(false)
  const espera = ref(0)
  let reloj: ReturnType<typeof setInterval> | undefined

  const digitosTelefono = computed(() => telefono.value.replace(/\D/g, ''))
  const digitosCodigo = computed(() => codigo.value.replace(/\D/g, ''))

  function iniciarEspera() {
    clearInterval(reloj)
    espera.value = ESPERA_REENVIO_CODIGO_S
    reloj = setInterval(() => {
      espera.value--
      if (espera.value <= 0) clearInterval(reloj)
    }, 1000)
  }
  onUnmounted(() => clearInterval(reloj))

  async function abrirSesion(s: SesionPortalResponse) {
    portal.iniciarSesion(s.token, s.expira)
    // Nombre y escuela para la bienvenida; si no se pueden traer, se saluda sin ellos
    const info = await obtenerSesionPortal().catch(() => null)
    portal.sesion = info
    const escuela = s.tipo === 'alumno' ? info?.alumnos[0]?.escuela?.nombre : undefined
    await conBienvenida(
      () => router.push({ name: NOMBRE_RUTA_PORTAL_INICIO }),
      info?.nombre ? { titulo: `${TEXTO_SALUDO}, ${info.nombre}`, detalle: escuela } : undefined,
    )
  }

  async function pedirCodigo() {
    const r = await solicitarCodigo(digitosTelefono.value)
    aviso.value = r.mensaje
    codigo.value = ''
    paso.value = 'codigo'
    iniciarEspera()
  }

  async function continuarConTelefono() {
    if (digitosTelefono.value.length !== LONGITUD_TELEFONO) {
      error.value = TEXTO_ERROR_TELEFONO
      return
    }
    error.value = ''
    cargando.value = true
    try {
      await abrirSesion(await entrarPortal(digitosTelefono.value))
    } catch (e) {
      if (esEstado(e, 401)) {
        // Dispositivo nuevo: se pide el código
        try {
          await pedirCodigo()
        } catch (e2) {
          error.value = mensajeDeError(e2, TEXTO_ERROR_GENERICO)
        }
      } else {
        error.value = mensajeDeError(e, TEXTO_ERROR_GENERICO)
      }
    } finally {
      cargando.value = false
    }
  }

  async function verificar() {
    if (digitosCodigo.value.length !== LONGITUD_CODIGO) {
      error.value = TEXTO_ERROR_CODIGO
      return
    }
    error.value = ''
    cargando.value = true
    try {
      await abrirSesion(await verificarCodigo(digitosTelefono.value, digitosCodigo.value))
    } catch (e) {
      error.value = mensajeDeError(e, TEXTO_ERROR_GENERICO)
    } finally {
      cargando.value = false
    }
  }

  async function reenviar() {
    if (espera.value > 0 || cargando.value) return
    error.value = ''
    cargando.value = true
    try {
      await pedirCodigo()
    } catch (e) {
      error.value = mensajeDeError(e, TEXTO_ERROR_GENERICO)
    } finally {
      cargando.value = false
    }
  }

  function cambiarNumero() {
    clearInterval(reloj)
    espera.value = 0
    codigo.value = ''
    error.value = ''
    aviso.value = ''
    paso.value = 'telefono'
  }

  return { paso, telefono, codigo, error, aviso, cargando, espera, continuarConTelefono, verificar, reenviar, cambiarNumero }
}
