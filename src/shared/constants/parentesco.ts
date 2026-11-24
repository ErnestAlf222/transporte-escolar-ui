// Parentescos que acepta el backend (prospectos.ParentescosPermitidos). El alumno ya no se registra solo.
export type Parentesco = 'padre' | 'madre' | 'abuelo' | 'abuela' | 'otro'

export const OPCIONES_PARENTESCO: { value: Parentesco; label: string }[] = [
  { value: 'padre', label: 'Padre' },
  { value: 'madre', label: 'Madre' },
  { value: 'abuelo', label: 'Abuelo' },
  { value: 'abuela', label: 'Abuela' },
  { value: 'otro', label: 'Otro' },
]
