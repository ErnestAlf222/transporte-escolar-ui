import http from '@/shared/api/http'
import type { Escuela } from '@/shared/types/escuela'

export async function listarEscuelas(): Promise<Escuela[]> {
  const { data } = await http.get<Escuela[] | null>('/escuelas')
  return data ?? []
}
