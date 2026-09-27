import http from './http'
import type { Escuela } from '@/types/escuela'

export async function listarEscuelas(): Promise<Escuela[]> {
  const { data } = await http.get<Escuela[] | null>('/escuelas')
  return data ?? []
}
