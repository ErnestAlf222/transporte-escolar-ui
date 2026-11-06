// Comparación pura (sin navegador) de cómo agrupan HOY Clientes, Prospectos y Familias frente a `agruparPorTutor`.
// Las "copias antiguas" son el bucle original de cada vista, copiado tal cual de HEAD (solo cambia el nombre de variable).
// Uso: node scripts/pruebas/agrupacion-unit.mjs    (Node 24 ejecuta el .ts quitando los tipos)
import { agruparPorTutor } from '../../src/shared/utils/familias.ts'

// --- ClientesView (HEAD): clave t-/c-
function antiguaClientes(lista) {
  const mapa = new Map()
  for (const c of lista) {
    const clave = c.tutor_id ? `t-${c.tutor_id}` : `c-${c.id}`
    let familia = mapa.get(clave)
    if (!familia) {
      familia = { clave, nombre_tutor: c.nombre_tutor, telefono_tutor: c.telefono_tutor, alumnos: [] }
      mapa.set(clave, familia)
    }
    familia.alumnos.push(c)
  }
  return [...mapa.values()]
}

// --- ProspectosView (HEAD): clave t-/a-
function antiguaProspectos(lista) {
  const mapa = new Map()
  for (const p of lista) {
    const clave = p.tutor_id ? `t-${p.tutor_id}` : `a-${p.id}`
    let familia = mapa.get(clave)
    if (!familia) {
      familia = { clave, nombre_tutor: p.nombre_tutor, telefono_tutor: p.telefono_tutor, alumnos: [] }
      mapa.set(clave, familia)
    }
    familia.alumnos.push(p)
  }
  return [...mapa.values()]
}

// --- FamiliasView (HEAD): por tutor, descarta quien no tiene tutor, ordena por nombre del tutor
function antiguaFamilias(lista) {
  const mapa = new Map()
  for (const c of lista) {
    if (c.tutor_id === null || c.tutor_id === undefined) continue
    const alumno = { id: c.id }
    const existente = mapa.get(c.tutor_id)
    if (existente) existente.alumnos.push(alumno)
    else mapa.set(c.tutor_id, { tutorId: c.tutor_id, tutor: c.nombre_tutor, telefono: c.telefono_tutor, alumnoBaseId: c.id, alumnos: [alumno] })
  }
  return [...mapa.values()].sort((a, b) => a.tutor.localeCompare(b.tutor, 'es'))
}

const al = (id, tutor_id, nombre_tutor = 'T' + tutor_id, telefono_tutor = '55' + tutor_id) => ({ id, tutor_id, nombre_tutor, telefono_tutor, nombre_alumno: 'A' + id })

const casos = {
  'lista vacía': [],
  'un alumno con tutor': [al(1, 10)],
  'un alumno sin tutor (null)': [al(1, null, '', '')],
  'tutor_id 0 (falsy, pero no null)': [al(1, 0, 'Cero', '5')],
  'tutor_id undefined': [al(1, undefined, 'U', '5')],
  'tutores intercalados': [al(1, 20), al(2, 10), al(3, 20), al(4, 10), al(5, 30)],
  'sin tutor mezclados con tutores': [al(1, null, '', ''), al(2, 10), al(3, null, '', ''), al(4, 10)],
  'mismo tutor con DISTINTO nombre y teléfono': [al(1, 10, 'Zeta Z', '111'), al(2, 10, 'Alfa A', '222'), al(3, 5, 'Mario', '333')],
  'ids repetidos entre sin-tutor y con tutor': [al(5, null, '', ''), al(5, 5), al(7, 7)],
  'nombres con acentos para el orden de Familias': [al(1, 1, 'Ñandú', '1'), al(2, 2, 'Álvaro', '2'), al(3, 3, 'Zoe', '3'), al(4, 4, 'alberto', '4')],
}

// Conjuntos aleatorios (semilla fija)
let semilla = 12345
const azar = () => ((semilla = (semilla * 1664525 + 1013904223) % 4294967296) / 4294967296)
for (let n = 0; n < 300; n++) {
  const total = Math.floor(azar() * 40)
  const lista = []
  for (let i = 1; i <= total; i++) {
    const r = azar()
    const tutor = r < 0.2 ? null : Math.floor(azar() * 12) + 1
    lista.push(al(i, tutor, tutor === null ? '' : 'T' + Math.floor(azar() * 3), '5' + Math.floor(azar() * 3)))
  }
  casos['aleatorio #' + n] = lista
}

const j = JSON.stringify
let cmp = { clientes: 0, prospectos: 0 }
let diferencias = { clientes: 0, prospectos: 0 }
let familiasIguales = 0
let familiasDistintas = 0
const ejemplosFamilias = []
for (const [nombre, lista] of Object.entries(casos)) {
  cmp.clientes++
  if (j(agruparPorTutor(lista, 'c')) !== j(antiguaClientes(lista))) {
    diferencias.clientes++
    console.log('DIFIERE Clientes:', nombre)
  }
  cmp.prospectos++
  if (j(agruparPorTutor(lista, 'a')) !== j(antiguaProspectos(lista))) {
    diferencias.prospectos++
    console.log('DIFIERE Prospectos:', nombre)
  }
  // ¿Dan lo mismo Familias y la agrupación común? (mismas familias, mismo orden)
  const comun = agruparPorTutor(lista, 'c').filter((f) => f.alumnos[0].tutor_id !== null && f.alumnos[0].tutor_id !== undefined).map((f) => [f.alumnos[0].tutor_id, f.alumnos.map((a) => a.id)])
  const fam = antiguaFamilias(lista).map((f) => [f.tutorId, f.alumnos.map((a) => a.id)])
  if (j(comun) === j(fam)) familiasIguales++
  else {
    familiasDistintas++
    if (ejemplosFamilias.length < 3 && !nombre.startsWith('aleatorio')) ejemplosFamilias.push(nombre)
  }
}

// Comparación directa de la única diferencia entre Clientes y Prospectos: el prefijo de la clave del alumno sin tutor
const lista = casos['sin tutor mezclados con tutores']
const dif = antiguaClientes(lista).map((f) => f.clave).join(',') + '  vs  ' + antiguaProspectos(lista).map((f) => f.clave).join(',')

console.log(`\nClientes  : ${cmp.clientes} conjuntos, ${diferencias.clientes} difieren (incluye la clave)`)
console.log(`Prospectos: ${cmp.prospectos} conjuntos, ${diferencias.prospectos} difieren (incluye la clave)`)
console.log(`Claves hoy, mismos datos -> Clientes: ${dif.split('  vs  ')[0]} | Prospectos: ${dif.split('  vs  ')[1]}`)
console.log(`Familias frente a la agrupación común (mismas familias y mismo orden, tras descartar a quien no tiene tutor): iguales ${familiasIguales}, distintas ${familiasDistintas}`)
console.log('  ejemplos donde Familias NO coincide:', ejemplosFamilias.join(' | ') || '(solo aleatorios)')
process.exit(diferencias.clientes + diferencias.prospectos ? 1 : 0)
