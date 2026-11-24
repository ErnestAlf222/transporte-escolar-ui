import type { DiaDelAnio, VentanaFechas } from '@/shared/constants/temasLoader'

// Número que ordena los días dentro del año (mes y día juntos)
const ordinal = ({ dia, mes }: DiaDelAnio) => mes * 100 + dia

// ¿Cae la fecha dentro de la ventana, extremos incluidos? Si el fin es anterior al inicio, la ventana cruza de un
// año al siguiente (28 de diciembre al 1 de enero): vale tanto del inicio a fin de año como de principio de año al fin.
export function fechaEnVentana(fecha: DiaDelAnio, { inicio, fin }: VentanaFechas): boolean {
  const f = ordinal(fecha)
  return ordinal(inicio) <= ordinal(fin) ? f >= ordinal(inicio) && f <= ordinal(fin) : f >= ordinal(inicio) || f <= ordinal(fin)
}
