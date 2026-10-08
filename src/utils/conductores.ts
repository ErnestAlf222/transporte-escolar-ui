import type { ConductorLista } from '@/types/conductor'

export function inicial(nombre: string): string {
  return nombre.trim().charAt(0).toUpperCase()
}

export function textoAlumnos(n: number): string {
  return n === 1 ? '1 alumno' : `${n} alumnos`
}

export function terminoHoy(c: ConductorLista): boolean {
  return (
    !!c.ultimo_recorrido &&
    new Date(c.ultimo_recorrido).toDateString() === new Date().toDateString()
  )
}

export function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })
}

export function textoTermino(c: ConductorLista): string {
  if (!c.ultimo_recorrido) return 'Sin recorridos aún'
  if (terminoHoy(c)) return `Terminó hoy · ${hora(c.ultimo_recorrido)}`
  const dia = new Date(c.ultimo_recorrido).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  })
  return `Último: ${dia} · ${hora(c.ultimo_recorrido)}`
}
