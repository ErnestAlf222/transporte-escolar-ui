import { httpPortal } from '@/features/portal-cliente/api/portal'
import {
  API_PORTAL_PERFIL,
  API_PORTAL_PERFIL_FOTO,
  apiPortalFotoAlumno,
  apiPortalDireccionAlumno,
  apiPortalFotoDomicilio,
  apiPortalReportarPago,
  CAMPO_ARCHIVO,
  CAMPO_METODO,
  CAMPO_NOTA,
} from '@/features/portal-cliente/constants/perfil'
import type { PerfilPortal, CambiosDireccion, DatosReportePago } from '@/features/portal-cliente/types/perfil'

export async function obtenerPerfil(): Promise<PerfilPortal> {
  const { data } = await httpPortal.get<PerfilPortal>(API_PORTAL_PERFIL)
  return data
}

function formularioArchivo(archivo: File): FormData {
  const f = new FormData()
  f.append(CAMPO_ARCHIVO, archivo)
  return f
}

export async function subirFotoTutor(archivo: File): Promise<void> {
  await httpPortal.patch(API_PORTAL_PERFIL_FOTO, formularioArchivo(archivo))
}

export async function subirFotoAlumno(id: number, archivo: File): Promise<void> {
  await httpPortal.patch(apiPortalFotoAlumno(id), formularioArchivo(archivo))
}

export async function subirFotoDomicilio(id: number, archivo: File): Promise<void> {
  await httpPortal.patch(apiPortalFotoDomicilio(id), formularioArchivo(archivo))
}

export async function guardarDireccion(id: number, cambios: CambiosDireccion): Promise<void> {
  await httpPortal.patch(apiPortalDireccionAlumno(id), cambios)
}

// La fecha y la hora las pone el servidor: no se manda ninguna
export async function reportarPago(id: number, datos: DatosReportePago): Promise<void> {
  const f = new FormData()
  f.append(CAMPO_METODO, datos.metodo)
  if (datos.nota.trim()) f.append(CAMPO_NOTA, datos.nota.trim())
  if (datos.metodo === 'digital' && datos.captura) f.append(CAMPO_ARCHIVO, datos.captura)
  await httpPortal.post(apiPortalReportarPago(id), f)
}
