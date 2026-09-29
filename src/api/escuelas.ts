import http from './http'
import type { Escuela } from '@/types/escuela'

export async function listarEscuelas(): Promise<Escuela[]> {
  const { data } = await http.get<Escuela[] | null>('/escuelas')
  return data ?? []
}

// Versión pública, sin token — usada por el formulario público de registro de prospectos
export async function listarEscuelasPublicas(): Promise<Escuela[]> {
  const { data } = await http.get<Escuela[] | null>('/escuelas/publicas')
  return data ?? []
}
