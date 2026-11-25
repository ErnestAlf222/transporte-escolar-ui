import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { InfoSesionPortal } from '@/features/portal-cliente/types/portal'
import { CLAVE_PORTAL_TOKEN, CLAVE_PORTAL_EXPIRA, CLAVE_PORTAL_DISPOSITIVO } from '@/features/portal-cliente/constants/portal'

// El almacenamiento puede fallar (modo privado, datos bloqueados): todo va en try/catch
function leer(clave: string): string | null {
  try {
    return localStorage.getItem(clave)
  } catch {
    return null
  }
}
function guardar(clave: string, valor: string) {
  try {
    localStorage.setItem(clave, valor)
  } catch {
    /* sin almacenamiento: la sesión dura lo que dure la pestaña */
  }
}
function borrar(clave: string) {
  try {
    localStorage.removeItem(clave)
  } catch {
    /* nada que hacer */
  }
}

// ¿La sesión guardada sigue vigente? (sin fecha guardada se asume que sí)
export function sesionPortalVigente(): boolean {
  return sesionVigente(leer(CLAVE_PORTAL_EXPIRA))
}

function sesionVigente(expira: string | null): boolean {
  if (!expira) return true
  const t = Date.parse(expira)
  return Number.isNaN(t) || t > Date.now()
}

function nuevoIdentificador(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

// Identificador aleatorio de este navegador: se genera una vez y se manda al backend
let dispositivoEnMemoria: string | null = null
export function dispositivoPortal(): string {
  const guardado = leer(CLAVE_PORTAL_DISPOSITIVO)
  if (guardado) return guardado
  if (!dispositivoEnMemoria) dispositivoEnMemoria = nuevoIdentificador()
  guardar(CLAVE_PORTAL_DISPOSITIVO, dispositivoEnMemoria)
  return dispositivoEnMemoria
}

// Token de la sesión del portal (lo usa el cliente HTTP del portal); no toca la sesión de admin
export function tokenPortal(): string | null {
  return leer(CLAVE_PORTAL_TOKEN)
}
export function borrarSesionPortal() {
  borrar(CLAVE_PORTAL_TOKEN)
  borrar(CLAVE_PORTAL_EXPIRA)
}

export const usePortalStore = defineStore('portal', () => {
  const inicial = sesionVigente(leer(CLAVE_PORTAL_EXPIRA)) ? leer(CLAVE_PORTAL_TOKEN) : null
  const token = ref<string | null>(inicial)
  const estaAutenticado = computed(() => !!token.value)
  // Datos de quien entró (nombre, escuela, alumnos): los guarda el acceso para que el inicio no los pida dos veces
  const sesion = ref<InfoSesionPortal | null>(null)

  function iniciarSesion(nuevoToken: string, expira: string) {
    token.value = nuevoToken
    guardar(CLAVE_PORTAL_TOKEN, nuevoToken)
    guardar(CLAVE_PORTAL_EXPIRA, expira)
  }

  function cerrarSesion() {
    token.value = null
    sesion.value = null
    borrarSesionPortal()
  }

  return { token, estaAutenticado, sesion, iniciarSesion, cerrarSesion }
})
