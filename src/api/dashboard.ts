import http from './http'
import type { DashboardResumen } from '@/types/dashboard'

export async function verDashboard(): Promise<DashboardResumen> {
  const { data } = await http.get<DashboardResumen>('/dashboard')
  return data
}
