// Verifica las reglas de dependencia de la Fase 4 (solo lectura, sin dependencias).
//   node scripts/verificar-arquitectura.mjs [--detalle]
//
// Zona lógica de cada archivo: la de su carpeta si ya está en src/shared, src/features/<x> o src/app;
// si todavía no se movió, la de su destino en scripts/arquitectura/mapa.mjs.
// Con --estricto todo pendiente pasa a fallo. Un problema en un archivo YA movido es un FALLO (exit 1). Un problema en un archivo que aún no se
// movió es PENDIENTE: se reescribirá al moverlo, y se informa para que no se pierda de vista.
//
// Reglas:
//  R1  shared no importa de ningún feature, de app ni de auth (http.ts/401 incluido).
//  R2  un feature solo importa de otro por su index.ts, y solo las aristas aprobadas (acíclicas).
//  R3  ningún feature importa de app. (app y raíz sí pueden importar features por index.ts.)
//  R4  las vistas (*View.vue) nunca se importan de forma estática: solo con import() desde app/router.
//  R5  un index.ts solo reexporta con nombre (sin `export *`) y nunca archivos .vue ni vistas.
//  R6  un archivo no importa el index.ts de su propio feature.
//  R7  sin ciclos entre archivos ni entre features.
//  R8  todo import con @/ o relativo resuelve a un archivo existente.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MOVIMIENTOS, MUERTOS, RAIZ, ARISTAS_APROBADAS } from './arquitectura/mapa.mjs'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(REPO, 'src')
const detalle = process.argv.includes('--detalle')
const estricto = process.argv.includes('--estricto') // todo pendiente cuenta como fallo (para el cierre del paso 5)

const destinoDe = new Map(MOVIMIENTOS.map(([o, d]) => [o, d]))
const pasoDe = new Map(MOVIMIENTOS.map(([o, , p]) => [o, p]))

function zonaDeRuta(rel) {
  // rel relativo a src/, con /
  let m = /^features\/([^/]+)\//.exec(rel)
  if (m) return m[1]
  if (rel.startsWith('shared/')) return 'shared'
  if (rel.startsWith('app/')) return 'app'
  return null
}
const info = (rel) => {
  const real = zonaDeRuta(rel)
  if (real) return { zona: real, movido: true }
  if (RAIZ.includes(rel)) return { zona: 'raiz', movido: true }
  if (MUERTOS.includes(rel)) return { zona: 'muerto', movido: true }
  const d = destinoDe.get(rel)
  if (d) return { zona: zonaDeRuta(d), movido: false, paso: pasoDe.get(rel) }
  return { zona: '?', movido: false }
}

// ---- grafo
const archivos = []
;(function recorrer(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) recorrer(p)
    else if (/\.(ts|vue)$/.test(e.name) && !e.name.endsWith('.d.ts')) archivos.push(path.relative(SRC, p).replaceAll('\\', '/'))
  }
})(SRC)
const existe = new Set(archivos)

function resolver(desde, spec) {
  let base
  if (spec.startsWith('@/')) base = spec.slice(2)
  else if (spec.startsWith('.')) base = path.posix.normalize(path.posix.join(path.posix.dirname(desde), spec))
  else return { externo: true }
  if (/\.(css|svg|png|jpe?g|webp|json)$/.test(base)) return { externo: true } // recursos, no módulos del grafo
  for (const c of [base, base + '.ts', base + '.vue', base + '/index.ts']) if (existe.has(c)) return { rel: c }
  return { roto: spec }
}

const aristas = [] // { de, a, dinamico, tipoNombre }
const rotos = []
for (const rel of archivos) {
  let txt = fs.readFileSync(path.join(SRC, rel), 'utf8')
  if (rel.endsWith('.vue')) {
    const bloques = [...txt.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1])
    txt = bloques.join('\n')
  }
  // quitar comentarios para no contar imports escritos en ellos
  const limpio = txt.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
  for (const m of limpio.matchAll(/(?:\bfrom\s+|\bimport\s*\(\s*|\bimport\s+)['"]([^'"]+)['"]/g)) {
    const dinamico = /import\s*\(/.test(m[0])
    const r = resolver(rel, m[1])
    if (r.roto) rotos.push({ de: rel, spec: r.roto })
    else if (r.rel) aristas.push({ de: rel, a: r.rel, dinamico })
  }
  for (const _ of limpio.matchAll(/export\s+\*\s+(?:as\s+\w+\s+)?from/g)) aristas.push({ de: rel, a: null, exportStar: true })
}

const fallos = []
const pendientes = []
function reportar(de, mensaje, regla) {
  const i = info(de)
  const item = { regla, de, mensaje }
  if (i.movido) fallos.push(item)
  else pendientes.push({ ...item, paso: i.paso })
}

const aristasFeature = new Map() // "x->y" -> [ejemplos]
for (const e of aristas) {
  if (e.exportStar) {
    if (/(^|\/)index\.ts$/.test(e.de)) reportar(e.de, 'usa `export *` (solo reexportaciones con nombre)', 'R5')
    continue
  }
  const o = info(e.de)
  const d = info(e.a)
  const esFeature = (z) => z && !['shared', 'app', 'raiz', 'muerto', '?'].includes(z)

  // R1
  if (o.zona === 'shared') {
    if (esFeature(d.zona) || d.zona === 'app') reportar(e.de, `shared importa de ${d.zona}: ${e.a}`, 'R1')
  }
  // R3
  if (esFeature(o.zona) && d.zona === 'app') reportar(e.de, `el feature ${o.zona} importa de app: ${e.a}`, 'R3')
  // R4: vistas
  if (e.a.endsWith('View.vue') && !(e.dinamico && e.de.startsWith('app/router/')) && !(e.dinamico && e.de === 'router/index.ts')) {
    reportar(e.de, `importa una vista de forma estática o fuera del router: ${e.a}`, 'R4')
  }
  // R2 / R6 (solo entre features)
  if (esFeature(o.zona) && esFeature(d.zona)) {
    if (o.zona === d.zona) {
      if (e.a === `features/${o.zona}/index.ts`) reportar(e.de, `importa el index.ts de su propio feature (${o.zona})`, 'R6')
    } else {
      const k = `${o.zona}->${d.zona}`
      if (!aristasFeature.has(k)) aristasFeature.set(k, [])
      aristasFeature.get(k).push(e.de + ' → ' + e.a)
      if (!(ARISTAS_APROBADAS[o.zona] ?? []).includes(d.zona)) reportar(e.de, `arista no aprobada ${o.zona} → ${d.zona}: ${e.a}`, 'R2')
      // por index.ts: solo se exige si el destino ya está movido (si no, se reescribirá al moverlo)
      if (d.movido && e.a !== `features/${d.zona}/index.ts`) reportar(e.de, `importa de ${d.zona} sin pasar por su index.ts: ${e.a}`, 'R2')
      // el destino aún no está en su feature: no se puede corregir hasta moverlo (siempre pendiente, aunque el origen ya esté movido)
      if (!d.movido) pendientes.push({ regla: 'R2', de: e.de, mensaje: `importa de ${d.zona} un archivo aún sin mover: ${e.a}`, paso: d.paso })
    }
  }
  // R5: index.ts no exporta .vue
  if (/(^|\/)features\/[^/]+\/index\.ts$/.test(e.de) && e.a.endsWith('.vue')) reportar(e.de, `el index.ts reexporta un componente: ${e.a}`, 'R5')
}
for (const r of rotos) fallos.push({ regla: 'R8', de: r.de, mensaje: `import sin resolver: ${r.spec}` })

// R7: ciclos entre archivos (Tarjan)
{
  const ady = new Map(archivos.map((a) => [a, []]))
  for (const e of aristas) if (e.a) ady.get(e.de).push(e.a)
  let idx = 0
  const st = [], on = new Set(), ix = new Map(), lo = new Map(), sccs = []
  const sc = (v) => {
    ix.set(v, idx); lo.set(v, idx); idx++; st.push(v); on.add(v)
    for (const w of ady.get(v)) {
      if (!ix.has(w)) { sc(w); lo.set(v, Math.min(lo.get(v), lo.get(w))) } else if (on.has(w)) lo.set(v, Math.min(lo.get(v), ix.get(w)))
    }
    if (lo.get(v) === ix.get(v)) { const c = []; let w; do { w = st.pop(); on.delete(w); c.push(w) } while (w !== v); if (c.length > 1) sccs.push(c) }
  }
  for (const v of archivos) if (!ix.has(v)) sc(v)
  for (const c of sccs) fallos.push({ regla: 'R7', de: c[0], mensaje: 'ciclo entre archivos: ' + c.join(' ↔ ') })
}
// R7: ciclos entre features (sobre las zonas lógicas)
{
  const g = new Map()
  for (const k of aristasFeature.keys()) { const [a, b] = k.split('->'); (g.get(a) ?? g.set(a, new Set()).get(a)).add(b) }
  const estado = new Map()
  const visitar = (v, ruta) => {
    estado.set(v, 1)
    for (const w of g.get(v) ?? []) {
      if (estado.get(w) === 1) fallos.push({ regla: 'R7', de: v, mensaje: 'ciclo entre features: ' + [...ruta, v, w].join(' → ') })
      else if (!estado.get(w)) visitar(w, [...ruta, v])
    }
    estado.set(v, 2)
  }
  for (const v of g.keys()) if (!estado.get(v)) visitar(v, [])
}

// ---- informe
const zonas = new Map()
for (const a of archivos) { const z = info(a); zonas.set(z.zona, (zonas.get(z.zona) ?? 0) + 1) }
const movidos = archivos.filter((a) => info(a).movido).length
console.log(`archivos: ${archivos.length} | ya en su sitio: ${movidos} | por mover: ${archivos.length - movidos} | sin zona: ${zonas.get('?') ?? 0}`)
console.log('aristas entre features:', [...aristasFeature.entries()].map(([k, v]) => `${k} (${v.length})`).join(', ') || '—')

const porRegla = (lista) => {
  const m = new Map()
  for (const x of lista) m.set(x.regla, (m.get(x.regla) ?? 0) + 1)
  return [...m.entries()].map(([r, n]) => `${r}×${n}`).join(' ') || '—'
}
console.log(`FALLOS: ${fallos.length} (${porRegla(fallos)})`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.de}: ${f.mensaje}`)
console.log(`PENDIENTES (archivos sin mover, se reescriben al moverlos): ${pendientes.length} (${porRegla(pendientes)})`)
if (detalle) for (const p of pendientes) console.log(`  · [${p.regla}] (paso ${p.paso ?? '?'}) ${p.de}: ${p.mensaje}`)
if (estricto && pendientes.length) {
  console.log(`MODO ESTRICTO: ${pendientes.length} pendientes cuentan como fallos`)
  fallos.push(...pendientes.map((p) => ({ regla: p.regla })))
}
const sinZona = archivos.filter((a) => info(a).zona === '?')
if (sinZona.length) { console.log('SIN ZONA (falta en mapa.mjs):'); sinZona.forEach((a) => console.log('  ?', a)); fallos.push({ regla: 'mapa' }) }
process.exit(fallos.length ? 1 : 0)
