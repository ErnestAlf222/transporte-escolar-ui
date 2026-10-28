import http from './http'
import type { AsistenciasDia } from '@/types/asistencia'

export async function verAsistenciasHoy(): Promise<AsistenciasDia> {
  const { data } = await http.get<AsistenciasDia>('/asistencias')
  return { ...data, alumnos: data.alumnos ?? [] }
}

// asistio en null quita la marca: el alumno vuelve a "sin marcar"
export async function marcarAsistencia(clienteId: number, asistio: boolean | null): Promise<void> {
  await http.put(`/asistencias/${clienteId}`, { asistio })
}
