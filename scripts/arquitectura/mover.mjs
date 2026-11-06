// Ejecuta un paso de la Fase 4 (no toca el índice de git, no hace commits).
//   node scripts/arquitectura/mover.mjs --paso 2            # simulación: lista qué haría
//   node scripts/arquitectura/mover.mjs --paso 2 --ejecutar # reescribe imports y mueve con Move-Item
//
// 1) Para cada archivo de src/, reescribe los imports que apuntan a un archivo que se mueve en este
//    paso (resolviendo desde la ubicación ACTUAL del archivo importador) a la forma `@/ruta/nueva`.
// 2) Mueve los archivos con Move-Item (PowerShell).
// Conserva el estilo del especificador: con o sin extensión .ts, siempre .vue con extensión.

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { MOVIMIENTOS } from './mapa.mjs'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const SRC = path.join(REPO, 'src')
const argv = process.argv.slice(2)
const paso = Number(argv[argv.indexOf('--paso') + 1])
const ejecutar = argv.includes('--ejecutar')
if (!paso) throw new Error('Falta --paso N')

const features = argv.includes('--features') ? argv[argv.indexOf('--features') + 1].split(',') : null
const movs = MOVIMIENTOS.filter(([, d, p]) => p === paso && (!features || features.some((f) => d.startsWith(`features/${f}/`))))
const aMover = new Map() // origen -> destino
for (const [o, d] of movs) {
  if (!fs.existsSync(path.join(SRC, o))) throw new Error('No existe el origen: ' + o)
  if (fs.existsSync(path.join(SRC, d))) throw new Error('El destino ya existe: ' + d)
  aMover.set(o, d)
}

const archivos = []
;(function recorrer(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) recorrer(p)
    else if (/\.(ts|vue)$/.test(e.name)) archivos.push(path.relative(SRC, p).replaceAll('\\', '/'))
  }
})(SRC)
const existe = new Set(archivos)

function resolver(desde, spec) {
  let base
  if (spec.startsWith('@/')) base = spec.slice(2)
  else if (spec.startsWith('.')) base = path.posix.normalize(path.posix.join(path.posix.dirname(desde), spec))
  else return null
  for (const c of [base, base + '.ts', base + '.vue', base + '/index.ts']) if (existe.has(c)) return c
  return null
}

let reescritos = 0
const archivosTocados = new Set()
const RE = /(\bfrom\s+|\bimport\s*\(\s*|\bimport\s+)(['"])([^'"]+)\2/g
const nuevoContenido = new Map()
for (const rel of archivos) {
  const abs = path.join(SRC, rel)
  const txt = fs.readFileSync(abs, 'utf8')
  const out = txt.replace(RE, (m, pre, q, spec) => {
    const r = resolver(rel, spec)
    if (!r || !aMover.has(r)) return m
    const dest = aMover.get(r)
    let nuevo = '@/' + dest
    if (dest.endsWith('.ts') && !spec.endsWith('.ts')) nuevo = nuevo.slice(0, -3)
    reescritos++
    archivosTocados.add(rel)
    return `${pre}${q}${nuevo}${q}`
  })
  if (out !== txt) nuevoContenido.set(rel, out)
}

console.log(`paso ${paso}: ${aMover.size} archivos a mover, ${reescritos} imports reescritos en ${archivosTocados.size} archivos`)
if (!ejecutar) {
  for (const [o, d] of aMover) console.log(`  ${o} -> ${d}`)
  process.exit(0)
}

for (const [rel, txt] of nuevoContenido) fs.writeFileSync(path.join(SRC, rel), txt, 'utf8')

const lista = [...aMover].map(([o, d]) => ({ de: path.join(SRC, o), a: path.join(SRC, d) }))
const jsonRuta = path.join(os.tmpdir(), `mover-paso-${paso}.json`)
fs.writeFileSync(jsonRuta, JSON.stringify(lista))
const ps = `$l = Get-Content -Raw -Encoding UTF8 '${jsonRuta}' | ConvertFrom-Json; foreach ($m in $l) { Move-Item -LiteralPath $m.de -Destination $m.a -ErrorAction Stop }`
const r = spawnSync('powershell', ['-NoProfile', '-Command', ps], { encoding: 'utf8' })
if (r.status !== 0) {
  console.error(r.stdout, r.stderr)
  process.exit(1)
}
fs.rmSync(jsonRuta)
console.log('movidos con Move-Item:', lista.length)
