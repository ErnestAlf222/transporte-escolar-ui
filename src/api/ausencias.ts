import http from './http'
import type { Ausencia } from '@/types/ausencia'

// Sin fecha devuelve todas las ausencias; con fecha (AAAA-MM-DD) solo las de ese día
export async function listarAusencias(fecha?: string): Promise<Ausencia[]> {
  const { data } = await http.get<Ausencia[] | null>('/ausencias', { params: { fecha } })
  return data ?? []
}
