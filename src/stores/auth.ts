import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import http from '@/api/http'

interface JwtPayload {
  admin_id: number
  rol: string
  version_sesion: number
  exp: number
}

function decodeToken(token: string): JwtPayload {
  const payload = token.split('.').at(1)
  if (!payload) {
    throw new Error('Token JWT malformado')
  }
  return JSON.parse(atob(payload))
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))

  const claims = computed<JwtPayload | null>(() => (token.value ? decodeToken(token.value) : null))

  const isAuthenticated = computed(() => !!token.value)
  const rol = computed(() => claims.value?.rol ?? null)

  async function login(correo: string, password: string) {
    const { data } = await http.post<{ token: string }>('/login', { correo, password })
    token.value = data.token
    localStorage.setItem('token', data.token)
  }

  function logout() {
    token.value = null
    localStorage.removeItem('token')
  }

  return { token, claims, isAuthenticated, rol, login, logout }
})
