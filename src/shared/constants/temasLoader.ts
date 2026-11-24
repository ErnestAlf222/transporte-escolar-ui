import type { CapaVector } from '@/shared/utils/formasTemporada'
import { CAPAS_AMOR_AMISTAD } from '@/shared/utils/escenaAmorAmistad'
import { CAPAS_ANO_NUEVO } from '@/shared/utils/escenaAnoNuevo'
import { CAPAS_BENITO_JUAREZ } from '@/shared/utils/escenaBenitoJuarez'
import { CAPAS_CINCO_DE_MAYO } from '@/shared/utils/escenaCincoDeMayo'
import { CAPAS_DIA_DE_LAS_MADRES } from '@/shared/utils/escenaDiaDeLasMadres'
import { CAPAS_DIA_DEL_MAESTRO } from '@/shared/utils/escenaDiaDelMaestro'
import { CAPAS_DIA_DEL_NINO } from '@/shared/utils/escenaDiaDelNino'
import { CAPAS_DIA_DEL_PADRE } from '@/shared/utils/escenaDiaDelPadre'
import { CAPAS_FIN_DE_CURSO } from '@/shared/utils/escenaFinDeCurso'
import { CAPAS_GUADALUPE } from '@/shared/utils/escenaGuadalupe'
import { CAPAS_INDEPENDENCIA } from '@/shared/utils/escenaIndependencia'
import { CAPAS_MUERTOS } from '@/shared/utils/escenaMuertos'
import { CAPAS_NAVIDAD } from '@/shared/utils/escenaNavidad'
import { CAPAS_REGRESO_A_CLASES } from '@/shared/utils/escenaRegresoAClases'
import { CAPAS_REVOLUCION } from '@/shared/utils/escenaRevolucion'
import { CAPAS_REYES } from '@/shared/utils/escenaReyes'

// Catálogo de temas de temporada del loader. El servidor solo guarda el id (1 a 40 caracteres en
// minúsculas, dígitos, guion o guion bajo) y no valida contra esta lista: aquí vive el catálogo.
export const TEMA_NORMAL = '' // sin tema: el loader de siempre
export const TEMA_ANO_NUEVO = 'ano_nuevo'
export const TEMA_REYES = 'reyes'
export const TEMA_AMOR_Y_AMISTAD = 'amor_amistad'
export const TEMA_BENITO_JUAREZ = 'benito_juarez'
export const TEMA_DIA_DEL_NINO = 'dia_nino'
export const TEMA_CINCO_DE_MAYO = 'cinco_mayo'
export const TEMA_DIA_DE_LAS_MADRES = 'dia_madres'
export const TEMA_DIA_DEL_MAESTRO = 'dia_maestro'
export const TEMA_DIA_DEL_PADRE = 'dia_padre'
export const TEMA_FIN_DE_CURSO = 'fin_curso'
export const TEMA_REGRESO_A_CLASES = 'regreso_clases'
export const TEMA_INDEPENDENCIA = 'independencia'
export const TEMA_MUERTOS = 'muertos'
export const TEMA_REVOLUCION = 'revolucion'
export const TEMA_GUADALUPE = 'guadalupe'
export const TEMA_NAVIDAD = 'navidad'

// Con este nombre se recuerda el último tema en el navegador, para que el primer loader ya salga decorado
export const CLAVE_TEMA_LOADER = 'tema_loader'

// Grosor (en pixeles de la camioneta) del contorno de las formas en vector
export const GROSOR_CONTORNO = 0.9

export const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export interface DiaDelAnio {
  dia: number // 1 a 31
  mes: number // 1 a 12
}

// Ventana de fechas de una celebración. Si el fin cae antes que el inicio, la ventana cruza de un año al siguiente
// (por ejemplo, Año Nuevo: del 28 de diciembre al 1 de enero).
export interface VentanaFechas {
  inicio: DiaDelAnio
  fin: DiaDelAnio
}

const ventana = (diaInicio: number, mesInicio: number, diaFin: number, mesFin: number): VentanaFechas => ({
  inicio: { dia: diaInicio, mes: mesInicio },
  fin: { dia: diaFin, mes: mesFin },
})

export interface TemaLoader {
  id: string
  nombre: string
  descripcion: string
  mensaje?: string // texto festivo que se muestra con el loader; sin él no aparece nada
  mes: number // mes principal de la celebración (1 a 12): es la etiqueta que se ve en el selector
  ventana: VentanaFechas
  disponible: boolean // solo los temas ya dibujados salen en el selector y se aplican al loader
  squash?: boolean // la camioneta rebota estirándose y aplastándose en vez del brinco simple
  capas: CapaVector[]
}

// Las celebraciones del año, con sus ventanas. Todas tienen ya su dibujo (`disponible`); un tema nuevo sin dibujo
// se registra aquí con `disponible: false` y `capas: []`, y no sale en el selector. Las ventanas de regreso a
// clases y fin de curso cambian cada año: se ajustan aquí.
export const TEMAS_LOADER: TemaLoader[] = [
  {
    id: TEMA_ANO_NUEVO,
    nombre: 'Año Nuevo',
    descripcion: 'Reloj, uvas, fuegos artificiales y serpentinas',
    mensaje: '¡Feliz Año Nuevo!',
    mes: 1,
    ventana: ventana(28, 12, 1, 1),
    disponible: true,
    squash: true,
    capas: CAPAS_ANO_NUEVO,
  },
  {
    id: TEMA_REYES,
    nombre: 'Día de Reyes',
    descripcion: 'Corona, estrella guía y regalos',
    mensaje: '¡Feliz Día de Reyes!',
    mes: 1,
    ventana: ventana(2, 1, 6, 1),
    disponible: true,
    squash: true,
    capas: CAPAS_REYES,
  },
  {
    id: TEMA_AMOR_Y_AMISTAD,
    nombre: 'Amor y Amistad',
    descripcion: 'Corazones, globos, flecha y cartitas',
    mensaje: '¡Feliz Día del Amor y la Amistad!',
    mes: 2,
    ventana: ventana(8, 2, 14, 2),
    disponible: true,
    squash: true,
    capas: CAPAS_AMOR_AMISTAD,
  },
  {
    id: TEMA_BENITO_JUAREZ,
    nombre: 'Benito Juárez',
    descripcion: 'Libro de leyes, balanza y laurel',
    mensaje: '¡Viva Benito Juárez!',
    mes: 3,
    ventana: ventana(15, 3, 21, 3),
    disponible: true,
    squash: true,
    capas: CAPAS_BENITO_JUAREZ,
  },
  {
    id: TEMA_DIA_DEL_NINO,
    nombre: 'Día del Niño',
    descripcion: 'Pelota, paleta, cubos, globos y burbujas',
    mensaje: '¡Feliz Día del Niño!',
    mes: 4,
    ventana: ventana(24, 4, 30, 4),
    disponible: true,
    squash: true,
    capas: CAPAS_DIA_DEL_NINO,
  },
  {
    id: TEMA_CINCO_DE_MAYO,
    nombre: '5 de Mayo',
    descripcion: 'Fuerte en el cerro, estandartes y fuegos artificiales',
    mensaje: '¡Feliz 5 de Mayo!',
    mes: 5,
    ventana: ventana(1, 5, 5, 5),
    disponible: true,
    squash: true,
    capas: CAPAS_CINCO_DE_MAYO,
  },
  {
    id: TEMA_DIA_DE_LAS_MADRES,
    nombre: 'Día de las Madres',
    descripcion: 'Ramo, corazón, mariposas y macetas',
    mensaje: '¡Feliz Día de las Madres!',
    mes: 5,
    ventana: ventana(5, 5, 10, 5),
    disponible: true,
    squash: true,
    capas: CAPAS_DIA_DE_LAS_MADRES,
  },
  {
    id: TEMA_DIA_DEL_MAESTRO,
    nombre: 'Día del Maestro',
    descripcion: 'Manzana, pizarrón, lápices y libros',
    mensaje: '¡Feliz Día del Maestro!',
    mes: 5,
    ventana: ventana(11, 5, 15, 5),
    disponible: true,
    squash: true,
    capas: CAPAS_DIA_DEL_MAESTRO,
  },
  {
    id: TEMA_DIA_DEL_PADRE,
    nombre: 'Día del Padre',
    descripcion: 'Corbata, lentes, gorra, llave y taza',
    mensaje: '¡Feliz Día del Padre!',
    mes: 6,
    ventana: ventana(10, 6, 21, 6),
    disponible: true,
    squash: true,
    capas: CAPAS_DIA_DEL_PADRE,
  },
  {
    id: TEMA_FIN_DE_CURSO,
    nombre: 'Fin de curso',
    descripcion: 'Birrete, diploma, medalla y confeti',
    mensaje: '¡Feliz fin de curso!',
    mes: 7,
    ventana: ventana(1, 7, 15, 7),
    disponible: true,
    squash: true,
    capas: CAPAS_FIN_DE_CURSO,
  },
  {
    id: TEMA_REGRESO_A_CLASES,
    nombre: 'Regreso a clases',
    descripcion: 'Mochila, útiles, sol y campana',
    mensaje: '¡Bienvenidos de vuelta a clases!',
    mes: 8,
    ventana: ventana(18, 8, 5, 9),
    disponible: true,
    squash: true,
    capas: CAPAS_REGRESO_A_CLASES,
  },
  {
    id: TEMA_INDEPENDENCIA,
    nombre: 'Independencia',
    descripcion: 'Campana, papel picado y fuegos artificiales',
    mensaje: '¡Viva México!',
    mes: 9,
    ventana: ventana(10, 9, 16, 9),
    disponible: true,
    squash: true,
    capas: CAPAS_INDEPENDENCIA,
  },
  {
    id: TEMA_MUERTOS,
    nombre: 'Día de Muertos',
    descripcion: 'Calavera, papel picado, cempasúchil y velas',
    mensaje: '¡Feliz Día de Muertos!',
    mes: 11,
    ventana: ventana(25, 10, 2, 11),
    disponible: true,
    squash: true,
    capas: CAPAS_MUERTOS,
  },
  {
    id: TEMA_REVOLUCION,
    nombre: 'Revolución',
    descripcion: 'Estrella, estandartes, vía y vapor',
    mensaje: '¡Feliz Día de la Revolución!',
    mes: 11,
    ventana: ventana(14, 11, 20, 11),
    disponible: true,
    squash: true,
    capas: CAPAS_REVOLUCION,
  },
  {
    id: TEMA_GUADALUPE,
    nombre: 'Guadalupe',
    descripcion: 'Arco de rosas, rayos de luz y velas',
    mensaje: '¡Feliz día de la Virgen de Guadalupe!',
    mes: 12,
    ventana: ventana(8, 12, 12, 12),
    disponible: true,
    squash: true,
    capas: CAPAS_GUADALUPE,
  },
  {
    id: TEMA_NAVIDAD,
    nombre: 'Navidad',
    descripcion: 'Gorro de Santa, luces y nieve',
    mensaje: '¡Feliz Navidad!',
    mes: 12,
    ventana: ventana(1, 12, 25, 12),
    disponible: true,
    squash: true,
    capas: CAPAS_NAVIDAD,
  },
]

// Orden del calendario: por el día en que termina la ventana (así Año Nuevo, que empieza en diciembre, va primero)
const ordenDeCalendario = (t: TemaLoader) => t.ventana.fin.mes * 100 + t.ventana.fin.dia

// Los temas que ya se pueden elegir, en orden de calendario
export const TEMAS_DISPONIBLES: TemaLoader[] = TEMAS_LOADER.filter((t) => t.disponible).sort(
  (a, b) => ordenDeCalendario(a) - ordenDeCalendario(b),
)

// Vacío, null, un id que no está en el catálogo o un tema sin dibujar: no hay tema y el loader se ve como siempre
export function temaLoaderPorId(id: string | null | undefined): TemaLoader | undefined {
  return TEMAS_DISPONIBLES.find((t) => t.id === id)
}
