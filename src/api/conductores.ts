import http from './http'
import { escucharEventos } from './eventos'
import type { ConductorLista, RutaConductor, RecorridoTerminado } from '@/types/conductor'

export async function listarConductores(): Promise<ConductorLista[]> {
  const { data } = await http.get<ConductorLista[] | null>('/conductores')
  return data ?? []
}

export async function verRutaConductor(id: number): Promise<RutaConductor> {
  const { data } = await http.get<RutaConductor>(`/conductores/${id}/ruta`)
  return { ...data, paradas: data.paradas ?? [] }
}

// Guarda la ruta completa: los alumnos en el orden de recogida. Quien no venga en la lista queda sin conductor
export async function guardarRutaConductor(id: number, alumnosIds: number[]): Promise<void> {
  await http.put(`/conductores/${id}/ruta`, { alumnos_ids: alumnosIds })
}

export function escucharEventosRecorridos(alEvento: () => void, senal: AbortSignal): Promise<void> {
  return escucharEventos('/recorridos/eventos', alEvento, senal)
}

// Vista del conductor: se identifica con su enlace personal, sin login
export async function verMiRuta(token: string): Promise<RutaConductor> {
  const { data } = await http.get<RutaConductor>(`/conductores/token/${token}/mi-ruta`)
  return { ...data, paradas: data.paradas ?? [] }
}

export async function terminarRecorrido(token: string): Promise<RecorridoTerminado> {
  const { data } = await http.post<RecorridoTerminado>(`/conductores/token/${token}/terminar`)
  return data
}
