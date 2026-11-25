// Parentescos que acepta el backend (prospectos.ParentescosPermitidos). El alumno ya no se registra solo.
export type Parentesco = 'padre' | 'madre' | 'abuelo' | 'abuela' | 'otro'

export const OPCIONES_PARENTESCO: { value: Parentesco; label: string }[] = [
  { value: 'padre', label: 'Padre' },
  { value: 'madre', label: 'Madre' },
  { value: 'abuelo', label: 'Abuelo' },
  { value: 'abuela', label: 'Abuela' },
  { value: 'otro', label: 'Otro' },
]

// Parentesco como texto para mostrar; '' si no hay dato (no se inventa). Un valor que no está en la lista se muestra tal cual.
export function etiquetaParentesco(valor: string | null | undefined): string {
  const limpio = (valor ?? '').trim()
  if (!limpio) return ''
  const conocido = OPCIONES_PARENTESCO.find((o) => o.value === limpio.toLowerCase())
  return conocido ? conocido.label : limpio.charAt(0).toUpperCase() + limpio.slice(1)
}
