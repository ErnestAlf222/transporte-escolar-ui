import { DIGITOS_POR_GRUPO_TARJETA } from '@/shared/constants/tarjeta'

// Solo los dígitos del número, sin espacios ni guiones
export function digitosTarjeta(numero: string): string {
  return numero.replace(/\D/g, '')
}

// "1234567812345678" -> "1234 5678 1234 5678"
export function agruparTarjeta(numero: string): string {
  const digitos = digitosTarjeta(numero)
  const grupos: string[] = []
  for (let i = 0; i < digitos.length; i += DIGITOS_POR_GRUPO_TARJETA) {
    grupos.push(digitos.slice(i, i + DIGITOS_POR_GRUPO_TARJETA))
  }
  return grupos.join(' ')
}

// Copia al portapapeles; si el navegador no lo permite, prueba el método antiguo. Devuelve si se logró.
export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    const campo = document.createElement('textarea')
    campo.value = texto
    campo.setAttribute('readonly', '')
    campo.style.position = 'fixed'
    campo.style.opacity = '0'
    document.body.appendChild(campo)
    campo.select()
    try {
      return document.execCommand('copy')
    } catch {
      return false
    } finally {
      document.body.removeChild(campo)
    }
  }
}
