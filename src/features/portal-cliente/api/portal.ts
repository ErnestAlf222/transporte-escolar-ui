import axios from 'axios'
import {
  API_PORTAL_CODIGO,
  API_PORTAL_VERIFICAR,
  API_PORTAL_ENTRAR,
  API_PORTAL_SESION,
  API_PORTAL_DATOS_PAGO,
  API_PORTAL_PAGOS_RESUMEN,
  API_PORTAL_PAGOS_REPORTES,
  API_PORTAL_PAGOS_EVENTOS,
  RUTA_PORTAL_ACCESO,
} from '@/features/portal-cliente/constants/portal'
import { dispositivoPortal, tokenPortal, borrarSesionPortal } from '@/features/portal-cliente/stores/portal'
import type {
  SesionPortalResponse,
  InfoSesionPortal,
  DatosPagoPortal,
  ResumenPagosPortal,
  ReportePortal,
  ReportesPortalResponse,
} from '@/features/portal-cliente/types/portal'
import { escucharEventos } from '@/shared/api/eventos'

// Cliente propio del portal: no comparte token ni interceptor con el del admin
export const httpPortal = axios.create({ baseURL: import.meta.env.VITE_API_URL })

httpPortal.interceptors.request.use((config) => {
  const token = tokenPortal()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Un 401 con sesión abierta la cierra y regresa al acceso del portal. Sin token (p. ej. /portal/entrar
// desde un dispositivo nuevo) no pasa nada: ese 401 es parte del flujo.
httpPortal.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      borrarSesionPortal()
      window.location.href = RUTA_PORTAL_ACCESO
    }
    return Promise.reject(error)
  },
)

export async function solicitarCodigo(telefono: string): Promise<{ mensaje: string }> {
  const { data } = await httpPortal.post<{ mensaje: string }>(API_PORTAL_CODIGO, { telefono })
  return data
}

export async function verificarCodigo(telefono: string, codigo: string): Promise<SesionPortalResponse> {
  const { data } = await httpPortal.post<SesionPortalResponse>(API_PORTAL_VERIFICAR, {
    telefono,
    codigo,
    dispositivo: dispositivoPortal(),
  })
  return data
}

export async function entrarPortal(telefono: string): Promise<SesionPortalResponse> {
  const { data } = await httpPortal.post<SesionPortalResponse>(API_PORTAL_ENTRAR, {
    telefono,
    dispositivo: dispositivoPortal(),
  })
  return data
}

export async function obtenerSesionPortal(): Promise<InfoSesionPortal> {
  const { data } = await httpPortal.get<InfoSesionPortal>(API_PORTAL_SESION)
  return data
}

export async function obtenerDatosPago(): Promise<DatosPagoPortal> {
  const { data } = await httpPortal.get<DatosPagoPortal>(API_PORTAL_DATOS_PAGO)
  return data
}

export async function obtenerResumenPagos(): Promise<ResumenPagosPortal> {
  const { data } = await httpPortal.get<ResumenPagosPortal>(API_PORTAL_PAGOS_RESUMEN)
  return data
}

export async function obtenerReportesPagos(): Promise<ReportePortal[]> {
  const { data } = await httpPortal.get<ReportesPortalResponse>(API_PORTAL_PAGOS_REPORTES)
  return data.reportes ?? []
}

// Tiempo real de la familia: el mismo helper del admin, con la sesión y el servidor del portal
export function escucharEventosPortal(
  alEvento: (nombre: string) => void,
  senal: AbortSignal,
  alConectar: () => void,
): Promise<void> {
  return escucharEventos(API_PORTAL_PAGOS_EVENTOS, alEvento, senal, {
    token: tokenPortal(),
    baseURL: httpPortal.defaults.baseURL,
    alConectar,
  })
}
