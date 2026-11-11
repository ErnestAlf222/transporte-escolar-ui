import http from '@/shared/api/http'

interface RespuestaMensaje {
  mensaje: string
}

export async function solicitarReset(correo: string): Promise<RespuestaMensaje> {
  const { data } = await http.post<RespuestaMensaje>('/admins/solicitar-reset', { correo })
  return data
}

export async function confirmarReset(token: string, nuevaContrasena: string): Promise<RespuestaMensaje> {
  const { data } = await http.post<RespuestaMensaje>('/admins/confirmar-reset', {
    token,
    nueva_contrasena: nuevaContrasena,
  })
  return data
}
