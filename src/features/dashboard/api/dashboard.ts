import http from '@/shared/api/http'
import type { DashboardResumen } from '@/features/dashboard/types/dashboard'

export async function verDashboard(): Promise<DashboardResumen> {
  const { data } = await http.get<DashboardResumen>('/dashboard')
  return data
}
