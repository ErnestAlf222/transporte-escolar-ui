import { ref, onMounted } from 'vue'
import {
  obtenerPerfil,
  subirFotoTutor,
  subirFotoAlumno,
  subirFotoDomicilio,
  guardarDireccion,
} from '@/features/portal-cliente/api/perfil'
import { useCargaPortal } from '@/features/portal-cliente/composables/useCargaPortal'
import { usePortalStore } from '@/features/portal-cliente/stores/portal'
import { mensajeErrorPortal } from '@/features/portal-cliente/utils/errores'
import {
  TEXTO_FOTO_ACTUALIZADA,
  TEXTO_DIRECCION_ACTUALIZADA,
  TEXTO_FOTO_DOMICILIO_ACTUALIZADA,
  TEXTO_ERROR_503_FOTO,
  TEXTO_ERROR_GUARDAR,
} from '@/features/portal-cliente/constants/perfil'
import type { CambiosDireccion } from '@/features/portal-cliente/types/perfil'
import { useAviso } from '@/shared/composables/useAviso'

// Perfil del portal: lectura y cambios (fotos y dirección). Tras cada cambio exitoso se vuelve a pedir el perfil y sale un aviso breve.
export function usePerfil() {
  const portal = usePortalStore()
  const { mostrarAviso } = useAviso()
  const perfil = useCargaPortal(obtenerPerfil)

  // Qué se está subiendo o guardando ahora: 'tutor', 'foto-<id>', 'domicilio-<id>' o 'direccion-<id>'
  const ocupado = ref<string[]>([])
  const errores = ref<Record<string, string>>({})

  async function hacer(clave: string, accion: () => Promise<void>, aviso: string) {
    if (ocupado.value.includes(clave)) return
    ocupado.value.push(clave)
    delete errores.value[clave]
    try {
      await accion()
      portal.sesion = null // el inicio vuelve a pedir su nombre y fotos
      await perfil.cargar()
      mostrarAviso(aviso)
    } catch (e) {
      // Un 503 en fotos es "no hay almacenamiento"; en la dirección es un fallo al guardar
      errores.value[clave] = mensajeErrorPortal(e, clave.startsWith('direccion-') ? TEXTO_ERROR_GUARDAR : TEXTO_ERROR_503_FOTO)
      mostrarAviso(errores.value[clave], 'error')
    } finally {
      ocupado.value = ocupado.value.filter((c) => c !== clave)
    }
  }

  const estaOcupado = (clave: string) => ocupado.value.includes(clave)
  const errorImagen = (mensaje: string) => mostrarAviso(mensaje, 'error')

  onMounted(perfil.cargar)

  return {
    perfil,
    errores,
    estaOcupado,
    errorImagen,
    cambiarFotoTutor: (a: File) => hacer('tutor', () => subirFotoTutor(a), TEXTO_FOTO_ACTUALIZADA),
    cambiarFotoAlumno: (id: number, a: File) => hacer(`foto-${id}`, () => subirFotoAlumno(id, a), TEXTO_FOTO_ACTUALIZADA),
    cambiarFotoDomicilio: (id: number, a: File) =>
      hacer(`domicilio-${id}`, () => subirFotoDomicilio(id, a), TEXTO_FOTO_DOMICILIO_ACTUALIZADA),
    cambiarDireccion: (id: number, c: CambiosDireccion) =>
      hacer(`direccion-${id}`, () => guardarDireccion(id, c), TEXTO_DIRECCION_ACTUALIZADA),
  }
}
