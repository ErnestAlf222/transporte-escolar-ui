import http from './http'
import type { Asignaciones, ResultadoLote } from '@/types/asignacion'

export async function verAsignaciones(): Promise<Asignaciones> {
  const { data } = await http.get<Asignaciones>('/asignaciones')
  return { conductores: data.conductores ?? [], alumnos: data.alumnos ?? [] }
}

// conductorId null = dejar a los alumnos sin conductor
export async function asignarLote(
  conductorId: number | null,
  alumnosIds: number[],
): Promise<ResultadoLote> {
  const { data } = await http.post<ResultadoLote>('/asignaciones/lote', {
    conductor_id: conductorId,
    alumnos_ids: alumnosIds,
  })
  return data
}

// Revierte el último cambio de conductor de ese alumno
export async function deshacerAsignacion(clienteId: number): Promise<void> {
  await http.post(`/clientes/${clienteId}/revertir`)
}
