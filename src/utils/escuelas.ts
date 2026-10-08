// Un color por escuela, fijo: la misma escuela siempre sale del mismo color.
// Se dejó fuera el rosa de la marca para que no se confunda con los botones y los números.
const COLORES = [
  { etiqueta: 'bg-sun/15 text-sun', punto: 'bg-sun' },
  { etiqueta: 'bg-mint/15 text-mint', punto: 'bg-mint' },
  { etiqueta: 'bg-[#229ED9]/15 text-[#229ED9]', punto: 'bg-[#229ED9]' },
  { etiqueta: 'bg-[#a78bfa]/15 text-[#a78bfa]', punto: 'bg-[#a78bfa]' },
]

const SIN_ESCUELA = { etiqueta: 'bg-panel-2 text-text-secondary', punto: 'bg-text-secondary' }

export function colorEscuela(id: number | null | undefined): { etiqueta: string; punto: string } {
  if (id === null || id === undefined) return SIN_ESCUELA
  return COLORES[id % COLORES.length]!
}
