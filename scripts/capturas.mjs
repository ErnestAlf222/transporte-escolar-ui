// Capturas de regresión visual (SOLO LECTURA).
//
// Uso:
//   node scripts/capturas.mjs capturar --salida base                 # estado actual del árbol de trabajo
//   node scripts/capturas.mjs capturar --salida base --desde-head    # compila HEAD (git archive) y captura
//   node scripts/capturas.mjs diff --a base --b actual [--max-px 0]  # compara dos carpetas
//   node scripts/capturas.mjs comparar                               # captura "actual" y compara con "base"
//
// Requisitos: API en el puerto de VITE_API_URL (8091), el puerto 5173 libre (CORS de la API solo
// permite http://localhost:5173) y las credenciales ADMIN_CORREO/ADMIN_PASSWORD en
// ../transporte-escolar-api/.env (se leen en memoria; nunca se escriben ni se imprimen).
//
// Seguridad: toda petición que no sea GET/HEAD/OPTIONS se aborta en el navegador (salvo el inicio
// de sesión, que usa otro contexto). Los bloqueos se cuentan y aparecen en el resumen.

import { chromium } from '@playwright/test'
import { spawn, execSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

// CAPTURAS_RAIZ permite ejecutar el script desde otra copia (con sus propias dependencias) sobre este proyecto
const RAIZ = process.env.CAPTURAS_RAIZ ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DOCS = path.join(RAIZ, 'docs')
const ESTADO = path.join(RAIZ, 'scripts', '.estado-sesion.json')
const ORIGEN = 'http://localhost:5173'
const ENV_API = path.resolve(RAIZ, '..', 'transporte-escolar-api', '.env')

// Umbral de pixelmatch: sensibilidad por píxel (0 = estricto, 1 = laxo) en espacio YIQ.
// Por defecto 0.01 (calibrado con la prueba de sensibilidad: ver docs/inventario-frontend.md).
// Se puede cambiar con --umbral.
let UMBRAL_PIXEL = 0.01

const VIEWPORTS = { movil: { width: 390, height: 844 }, escritorio: { width: 1440, height: 900 } }
const TEMAS = ['dark', 'light']

// ---------- utilidades ----------

function args() {
  const [cmd = 'capturar', ...resto] = process.argv.slice(2)
  const o = { _: cmd }
  for (let i = 0; i < resto.length; i++) {
    if (!resto[i].startsWith('--')) continue
    const k = resto[i].slice(2)
    const sig = resto[i + 1]
    if (sig === undefined || sig.startsWith('--')) o[k] = true
    else {
      o[k] = sig
      i++
    }
  }
  return o
}

function leerEnv(ruta) {
  const out = {}
  for (const l of fs.readFileSync(ruta, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(l)
    if (m) out[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
  return out
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms))

// El puerto debe estar libre en IPv4 e IPv6: en Windows un servidor de desarrollo en [::1]:5173 y un
// preview en 127.0.0.1:5173 pueden coexistir, y 'localhost' acabaría sirviendo el de desarrollo.
async function exigirPuertoLibre() {
  const net = await import('node:net')
  for (const host of ['127.0.0.1', '::1']) {
    const ocupado = await new Promise((resolve) => {
      const c = net.connect({ port: 5173, host })
      c.once('connect', () => (c.destroy(), resolve(true)))
      c.once('error', () => resolve(false))
    })
    if (ocupado) throw new Error('El puerto 5173 ya está ocupado en ' + host + ': detén el servidor de desarrollo')
  }
}

// Confirma que lo servido es el build de preview y no el servidor de desarrollo de Vite.
// El de desarrollo responde /@vite/client con un módulo JS (createHotContext); preview no lo tiene
// (devuelve 404 o el index.html por el respaldo de SPA).
async function exigirBuild() {
  const r = await fetch(ORIGEN + '/@vite/client')
  const t = r.ok ? await r.text() : ''
  if (r.ok && t.includes('createHotContext')) throw new Error('5173 sirve el servidor de DESARROLLO, no el build')
  console.log('  /@vite/client -> HTTP ' + r.status + (r.ok ? ' (index.html por respaldo de SPA, no es el cliente de Vite)' : ''))
}

async function servidorListo(proceso) {
  for (let i = 0; i < 60; i++) {
    if (proceso.exitCode !== null) throw new Error('vite preview terminó (¿puerto 5173 ocupado?)')
    try {
      const r = await fetch(ORIGEN + '/')
      if (r.ok) return
    } catch {}
    await dormir(500)
  }
  throw new Error('vite preview no respondió a tiempo')
}

// Cada fuente (HEAD o árbol actual) se copia a una carpeta temporal propia, con su npm ci y su build;
// la carpeta del usuario (node_modules, dist) no se toca.
function prepararFuente(fuente) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'capturas-' + fuente + '-'))
  const src = path.join(dir, 'src')
  fs.mkdirSync(src)
  if (fuente === 'head') {
    execSync(`git archive --format=tar HEAD -o "${path.join(dir, 'head.tar')}"`, { cwd: RAIZ })
    // rutas relativas: el tar de Git Bash interpreta "C:" como un host remoto
    execSync('tar -xf head.tar -C src', { cwd: dir })
  } else {
    // árbol actual = archivos versionados + nuevos no ignorados (con sus cambios sin confirmar)
    const lista = execSync('git ls-files -co --exclude-standard -z', { cwd: RAIZ, maxBuffer: 1 << 26 })
      .toString('utf8')
      .split(String.fromCharCode(0))
      .filter(Boolean)
    for (const f of lista) {
      const origen = path.join(RAIZ, f)
      if (!fs.existsSync(origen) || f.startsWith('docs/') || f.startsWith('scripts/')) continue
      fs.mkdirSync(path.dirname(path.join(src, f)), { recursive: true })
      fs.copyFileSync(origen, path.join(src, f))
    }
  }
  fs.copyFileSync(path.join(RAIZ, '.env'), path.join(src, '.env')) // VITE_API_URL (ignorado por git)
  return { dir, src }
}

function compilar(cwd) {
  execSync('npm ci --ignore-scripts --no-audit --no-fund', { cwd, stdio: 'pipe' })
  const vite = path.join(cwd, 'node_modules', 'vite', 'bin', 'vite.js')
  execSync('"' + process.execPath + '" "' + vite + '" build', { cwd, stdio: 'pipe' })
  return vite
}

// ---------- esperas ----------

async function esperarCarga(page) {
  // Sin networkidle: Pagos, Prospectos y Conductores mantienen SSE abierto.
  await page
    .waitForFunction(() => !document.querySelector('svg.van, svg.spinner'), null, { timeout: 20000 })
    .catch(() => {})
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(500)
}

async function ir(page, ruta, listo) {
  await page.goto(ORIGEN + ruta, { waitUntil: 'domcontentloaded' })
  if (listo) await page.locator(listo).first().waitFor({ state: 'visible', timeout: 20000 })
  await esperarCarga(page)
}

// ---------- pantallas ----------
// Cada pantalla: { id, anonima?, correr(ctx) }. ctx = { page, snap, omitir, ir, ... }
// snap(nombre, { modal }) -> modal=true captura solo el viewport (los modales son fixed).

const H1 = (t) => `h1:has-text("${t}")`
const primeraTarjeta = 'main .glass.cursor-pointer'

// GET a la API desde la página, con el token de la sesión (solo lectura). La URL sale de VITE_API_URL.
async function getApi(page, ruta) {
  const base = leerEnv(path.join(RAIZ, '.env')).VITE_API_URL
  return page.evaluate(
    async ([url]) => {
      const r = await fetch(url, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } })
      return r.ok ? r.json() : null
    },
    [base.replace(/\/$/, '') + ruta],
  )
}

async function tocarCampos(page, selector) {
  const campos = page.locator(selector)
  const n = await campos.count()
  for (let i = 0; i < n; i++) {
    await campos.nth(i).focus()
    await campos.nth(i).blur()
  }
  await page.waitForTimeout(200)
}

const PANTALLAS = [
  {
    id: 'login',
    anonima: true,
    async correr({ page, snap }) {
      await ir(page, '/login', '#login-correo')
      await snap('login')
      await tocarCampos(page, '#login-correo, #login-password')
      await snap('login-errores')
    },
  },
  {
    id: 'recuperar-contrasena',
    anonima: true,
    async correr({ page, snap }) {
      await ir(page, '/recuperar-contrasena', '#recuperar-correo')
      await snap('recuperar-contrasena')
      await tocarCampos(page, '#recuperar-correo')
      await snap('recuperar-contrasena-errores')
    },
  },
  {
    id: 'nueva-contrasena',
    anonima: true,
    async correr({ page, snap }) {
      await ir(page, '/nueva-contrasena?token=captura', '#nueva-password')
      await snap('nueva-contrasena')
      await tocarCampos(page, '#nueva-password, #nueva-confirmacion')
      await snap('nueva-contrasena-errores')
    },
  },
  {
    id: 'registro',
    anonima: true,
    async correr({ page, snap }) {
      await ir(page, '/registro', 'h1')
      await snap('registro')
      await tocarCampos(page, 'form input[type=text], form input[type=tel]')
      await snap('registro-errores')
    },
  },
  {
    id: 'dashboard',
    async correr({ page, snap, omitir }) {
      await ir(page, '/', H1('Dashboard'))
      await snap('dashboard')
      const b = page.locator('main button.bg-panel-2.text-left').first()
      if (await b.count()) {
        await b.click()
        await esperarCarga(page)
        await snap('dashboard-lista-estatus', { modal: true })
      } else omitir('dashboard-lista-estatus', 'sin contadores de estatus')
    },
  },
  {
    id: 'clientes',
    async correr({ page, snap, omitir }) {
      await ir(page, '/clientes', H1('Clientes'))
      await snap('clientes')
      await page.getByPlaceholder('Buscar por alumno, tutor o teléfono').fill('zzzqqq')
      await esperarCarga(page)
      await snap('clientes-sin-resultados')
      await ir(page, '/clientes', H1('Clientes'))
      if (!(await page.locator(primeraTarjeta).count())) return omitir('clientes-detalle', 'sin clientes')
      await page.locator(primeraTarjeta).first().click()
      await page.waitForURL(/\/clientes\/\d+/)
      await esperarCarga(page)
      await snap('clientes-detalle', { modal: true })
      // Panel de dinero: se abre y se cierra, sin tocar nada
      const dinero = page.getByRole('button', { name: 'Abrir dinero' })
      if (await dinero.count()) {
        await dinero.click()
        await page.getByRole('dialog', { name: 'Dinero del cliente' }).waitFor({ state: 'visible', timeout: 5000 })
        await snap('clientes-dinero', { modal: true })
        await page.getByRole('button', { name: 'Cerrar dinero' }).click()
        await page.waitForTimeout(500)
      } else omitir('clientes-dinero', 'sin burbuja de dinero')
      // Diálogo de archivar: se abre y se cancela; nunca se pulsa "Archivar"
      const archivar = page.getByRole('button', { name: 'Archivar alumno', exact: true })
      if (await archivar.count()) {
        await archivar.click()
        const dlg = page.getByRole('dialog', { name: 'Archivar alumno' })
        await dlg.waitFor({ state: 'visible', timeout: 5000 })
        await page.waitForFunction(() => !document.body.innerText.includes('Revisando adeudo'), null, { timeout: 10000 }).catch(() => {})
        await snap('clientes-archivar', { modal: true })
        await dlg.getByRole('button', { name: 'Otro', exact: true }).click()
        await page.waitForTimeout(300)
        await snap('clientes-archivar-otro', { modal: true })
        await dlg.getByRole('button', { name: 'Cancelar', exact: true }).click()
        await page.waitForTimeout(500)
      } else omitir('clientes-archivar', 'sin botón de archivar')
      // Cliente archivado (si existe): se ve el aviso y el botón Reincorporar, sin pulsarlo
      const archivados = await getApi(page, '/clientes?estatus=archivado')
      if (archivados && archivados.length) {
        await ir(page, '/clientes/' + archivados[0].id)
        await esperarCarga(page)
        await snap('clientes-archivado', { modal: true })
        await ir(page, '/clientes', H1('Clientes'))
        await page.locator(primeraTarjeta).first().click()
        await page.waitForURL(/\/clientes\/\d+/)
        await esperarCarga(page)
      } else omitir('clientes-archivado', 'no hay clientes archivados')
      const url = page.url().replace(ORIGEN, '')
      await ir(page, url.replace(/\/$/, '') + '/editar')
      await esperarCarga(page)
      await snap('clientes-editar', { modal: true })
    },
  },
  {
    id: 'prospectos',
    async correr({ page, snap, omitir }) {
      await ir(page, '/prospectos', H1('Prospectos'))
      await snap('prospectos')
      if (!(await page.locator(primeraTarjeta).count())) return omitir('prospectos-detalle', 'sin prospectos')
      await page.locator(primeraTarjeta).first().click()
      await page.waitForURL(/\/prospectos\/\d+/)
      await esperarCarga(page)
      await snap('prospectos-detalle', { modal: true })
      const pendientes = await getApi(page, '/prospectos?estatus=pendiente')
      if (pendientes && pendientes.length) {
        await ir(page, '/prospectos/' + pendientes[0].id)
        await esperarCarga(page)
        await page.getByRole('button', { name: 'Descartar', exact: true }).first().click()
        await page.waitForTimeout(400)
        await snap('prospectos-descartar-confirmar', { modal: true })
        await page.getByRole('button', { name: 'Cancelar', exact: true }).first().click()
        await page.waitForTimeout(300)
        await page.getByRole('button', { name: 'Convertir a cliente', exact: true }).first().click()
        await page.waitForTimeout(400)
        await snap('prospectos-convertir-confirmar', { modal: true })
        await page.getByRole('button', { name: 'Cancelar', exact: true }).first().click()
        await page.waitForTimeout(300)
      } else omitir('prospectos-descartar-confirmar', 'no hay prospectos pendientes')
    },
  },
  {
    id: 'pagos',
    async correr({ page, snap, omitir }) {
      await ir(page, '/pagos', H1('Pagos'))
      await snap('pagos')
      const tarjeta = page.locator('main [role=button].cursor-pointer').first()
      if (!(await tarjeta.count())) return omitir('pagos-detalle', 'sin alumnos en la semana')
      await tarjeta.click()
      await esperarCarga(page)
      await snap('pagos-detalle', { modal: true })
      // Anular recibo: confirmación en línea; se abre y se cancela
      const anular = page.getByRole('button', { name: 'Anular', exact: true }).first()
      if (await anular.count()) {
        await anular.click()
        await page.waitForTimeout(300)
        await snap('pagos-anular-confirmar', { modal: true })
        await page.getByRole('button', { name: 'Cancelar', exact: true }).first().click()
        await page.waitForTimeout(300)
      } else omitir('pagos-anular-confirmar', 'el primer alumno no tiene recibos')
      // Alumno sin pagar (efectivo): formulario de abono
      await ir(page, '/pagos', H1('Pagos'))
      const sinReportar = page.locator('main [role=button].cursor-pointer', { hasText: 'Sin reportar' }).first()
      if (await sinReportar.count()) {
        await sinReportar.click()
        await esperarCarga(page)
        await snap('pagos-detalle-abono', { modal: true })
      } else omitir('pagos-detalle-abono', 'no hay alumnos sin reportar')
      // Alumno sin cuota: burbuja de configuración
      await ir(page, '/pagos', H1('Pagos'))
      const sinCuota = page.locator('main [role=button].cursor-pointer', { hasText: 'Cuota sin configurar' }).first()
      if (await sinCuota.count()) {
        await sinCuota.click()
        await esperarCarga(page)
        const config = page.getByRole('button', { name: 'Configurar el pago' })
        if (await config.count()) {
          await config.click()
          await page.getByRole('dialog', { name: 'Configurar el pago del alumno' }).waitFor({ state: 'visible', timeout: 5000 })
          await snap('pagos-configurar-cuota', { modal: true })
        } else omitir('pagos-configurar-cuota', 'sin burbuja de configuración')
      } else omitir('pagos-configurar-cuota', 'no hay alumnos sin cuota')
    },
  },
  {
    id: 'familias',
    async correr({ page, snap, omitir }) {
      await ir(page, '/familias', H1('Familias'))
      await snap('familias')
      const tutor = page.locator('main ul button').first()
      if (!(await tutor.count())) return omitir('familias-seleccionada', 'sin familias')
      await tutor.click()
      await page.waitForTimeout(500)
      await snap('familias-seleccionada')
      await tocarCampos(page, 'form input')
      await snap('familias-errores')
      // Confirmación: se llega hasta el diálogo y se cancela. Nunca se pulsa "Agregar".
      const campos = ['#fam-nombre', '#fam-apellido-p', '#fam-apellido-m', '#fam-telefono']
      if ((await page.locator(campos.join(',')).count()) === 4) {
        const valores = ['Prueba', 'Captura', 'Visual', '5500000000']
        for (let i = 0; i < 4; i++) await page.locator(campos[i]).fill(valores[i])
        await page.waitForTimeout(700)
        const enviar = page.locator('form button[type=submit]')
        if (await enviar.isEnabled()) {
          await enviar.click()
          const dlg = page.getByRole('dialog', { name: 'Agregar alumno' })
          await dlg.waitFor({ state: 'visible', timeout: 5000 })
          await snap('familias-confirmar', { modal: true })
          await dlg.getByRole('button', { name: 'Cancelar' }).click()
        } else omitir('familias-confirmar', 'botón de guardar deshabilitado (teléfono ocupado/errores)')
      } else omitir('familias-confirmar', 'no se hallaron los 4 campos')
    },
  },
  {
    id: 'asistencias',
    async correr({ page, snap }) {
      await ir(page, '/asistencias', H1('Asistencias'))
      await snap('asistencias')
    },
  },
  {
    id: 'casos-especiales',
    async correr({ page, snap, omitir }) {
      await ir(page, '/casos-especiales', H1('Casos especiales'))
      await snap('casos-especiales')
      let elegir = page.locator('main section ul button').first()
      if (!(await elegir.count())) {
        await page.getByPlaceholder('Buscar alumno o escuela').fill('a')
        await page.waitForTimeout(300)
        elegir = page.locator('main section ul button').first()
      }
      if (!(await elegir.count())) return omitir('casos-especiales-formulario', 'sin alumnos')
      await elegir.click()
      await page.waitForTimeout(400)
      await tocarCampos(page, '#caso-monto, #caso-motivo')
      await snap('casos-especiales-errores')
      await page.locator('#caso-monto').fill('100')
      await page.locator('#caso-motivo').fill('Prueba de captura')
      await page.waitForTimeout(300)
      const enviar = page.getByRole('button', { name: 'Registrar caso especial' })
      if (await enviar.isEnabled()) {
        await enviar.click()
        const dlg = page.getByRole('dialog', { name: 'Registrar caso especial' })
        await dlg.waitFor({ state: 'visible', timeout: 5000 })
        await snap('casos-especiales-confirmar', { modal: true })
        await dlg.getByRole('button', { name: 'Cancelar' }).click()
      } else omitir('casos-especiales-confirmar', 'botón deshabilitado')
    },
  },
  {
    id: 'conductores',
    async correr({ page, snap, omitir }) {
      await ir(page, '/conductores', H1('Conductores'))
      await snap('conductores')
      const c = page.locator('article[role=button]').first()
      if (!(await c.count())) return omitir('conductores-detalle', 'sin conductores')
      await c.click()
      await page.waitForURL(/\/conductores\/\d+/)
      await esperarCarga(page)
      await snap('conductores-detalle', { modal: true })
      const base = new URL(page.url()).pathname.replace(/\/$/, '')
      await ir(page, base + '/alumnos', H1('Sus alumnos'))
      await snap('conductor-alumnos')
      const p = page.locator('main [role=button].cursor-pointer').first()
      if (await p.count()) {
        await p.click()
        await esperarCarga(page)
        await snap('conductor-parada-detalle', { modal: true })
      } else omitir('conductor-parada-detalle', 'conductor sin alumnos')
      await ir(page, base + '/agregar', H1('Agregar alumnos'))
      await snap('conductor-agregar')
    },
  },
  {
    id: 'apariencia',
    async correr({ page, snap }) {
      await ir(page, '/apariencia', H1('Apariencia'))
      await snap('apariencia') // solo lectura: no se cambia ni se guarda nada
    },
  },
]

// ---------- captura ----------

async function iniciarSesion(browser) {
  const env = leerEnv(ENV_API)
  if (!env.ADMIN_CORREO || !env.ADMIN_PASSWORD) throw new Error('Faltan ADMIN_CORREO/ADMIN_PASSWORD en el .env de la API')
  const ctx = await browser.newContext({ viewport: VIEWPORTS.escritorio })
  const page = await ctx.newPage()
  await page.goto(ORIGEN + '/login')
  await page.locator('#login-correo').fill(env.ADMIN_CORREO)
  await page.locator('#login-password').fill(env.ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await page.waitForURL(ORIGEN + '/', { timeout: 15000 })
  if (await page.locator('#vue-devtools-anchor').count()) throw new Error('Aparece el botón de Vue DevTools: no es el build de producción')
  await ctx.storageState({ path: ESTADO })
  await ctx.close()
}

async function capturar(salida, { fuente, solo }) {
  const dirSalida = path.join(DOCS, 'capturas-' + salida)
  if (!solo) fs.rmSync(dirSalida, { recursive: true, force: true }) // con --solo se conserva lo demás

  await exigirPuertoLibre()
  const temporal = prepararFuente(fuente)
  const cwd = temporal.src
  console.log('  fuente: ' + fuente + ' -> ' + cwd)
  const vite = compilar(cwd)
  const servidor = spawn(process.execPath, [vite, 'preview', '--port', '5173', '--strictPort'], {
    cwd,
    stdio: 'ignore',
  })
  const resumen = { salida, fuente, capturas: [], omitidas: [], fallos: [], bloqueadas: 0, vistasPreviasBloqueadas: 0 }
  let browser
  try {
    await servidorListo(servidor)
    await exigirBuild()
    browser = await chromium.launch()
    await iniciarSesion(browser)

    for (const tema of TEMAS) {
      for (const [vpNombre, viewport] of Object.entries(VIEWPORTS)) {
        const dir = path.join(dirSalida, `${tema === 'dark' ? 'oscuro' : 'claro'}-${vpNombre}`)
        fs.mkdirSync(dir, { recursive: true })
        for (const pantalla of PANTALLAS) {
          if (solo && !solo.includes(pantalla.id)) continue
          const ctx = await browser.newContext({
            viewport,
            reducedMotion: 'reduce',
            colorScheme: tema === 'dark' ? 'dark' : 'light',
            locale: 'es-MX',
            storageState: pantalla.anonima ? undefined : ESTADO,
          })
          await ctx.addInitScript((t) => localStorage.setItem('tema', t), tema)
          await ctx.route('**/*', (route) => {
            const m = route.request().method()
            if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return route.continue()
            // El formulario de abono pide al abrirse una vista previa (POST con simular:true, que la API
            // calcula sin guardar nada). Tampoco se deja pasar: se aborta y se cuenta aparte, sin fallo.
            const esVistaPreviaDeAbono =
              m === 'POST' &&
              /\/clientes\/\d+\/abonos$/.test(route.request().url()) &&
              /"simular"\s*:\s*true/.test(route.request().postData() ?? '')
            if (esVistaPreviaDeAbono) {
              resumen.vistasPreviasBloqueadas++
              return route.abort()
            }
            resumen.bloqueadas++
            console.warn(`  BLOQUEADA ${m} ${route.request().url()}`)
            return route.abort()
          })
          const page = await ctx.newPage()
          const etiqueta = `${tema}-${vpNombre}`
          const snap = async (nombre, { modal = false } = {}) => {
            await esperarCarga(page)
            const archivo = path.join(dir, nombre + '.png')
            await page.screenshot({
              path: archivo,
              fullPage: !modal,
              animations: 'disabled',
              caret: 'hide',
              mask: [page.locator('[data-captura-mascara]')],
            })
            resumen.capturas.push(`${etiqueta}/${nombre}`)
          }
          const omitir = (nombre, motivo) => resumen.omitidas.push(`${etiqueta}/${nombre}: ${motivo}`)
          try {
            await pantalla.correr({ page, snap, omitir })
          } catch (e) {
            resumen.fallos.push(`${etiqueta}/${pantalla.id}: ${String(e.message).split('\n')[0]}`)
          }
          await ctx.close()
        }
      }
    }
  } finally {
    if (browser) await browser.close()
    servidor.kill()
    fs.rmSync(temporal.dir, { recursive: true, force: true })
  }
  fs.writeFileSync(path.join(dirSalida, solo ? 'resumen-' + solo.join('+') + '.json' : 'resumen.json'), JSON.stringify(resumen, null, 2))
  console.log(
    `\n[${salida}] capturas: ${resumen.capturas.length}, omitidas: ${resumen.omitidas.length}, fallos: ${resumen.fallos.length}, escrituras bloqueadas: ${resumen.bloqueadas} (vistas previas de abono abortadas: ${resumen.vistasPreviasBloqueadas})`,
  )
  resumen.omitidas.slice(0, 12).forEach((o) => console.log('  omitida  ' + o))
  resumen.fallos.forEach((f) => console.log('  FALLO    ' + f))
  return resumen
}

// ---------- pruebas de comportamiento ----------
// node scripts/capturas.mjs probar --prueba dialogos [--desde-head]
// Compila la fuente (HEAD o árbol actual), la sirve con preview y ejecuta scripts/pruebas/<prueba>.mjs,
// que exporta probar({ page, ir, ORIGEN, esperarCarga }) y devuelve un objeto JSON con lo observado.
// Solo lectura: las peticiones que no son GET se abortan, igual que en las capturas.
async function probar(nombre, { fuente }) {
  const modulo = await import(pathToFileURL(path.join(RAIZ, 'scripts', 'pruebas', nombre + '.mjs')).href)
  await exigirPuertoLibre()
  const temporal = prepararFuente(fuente)
  const vite = compilar(temporal.src)
  const servidor = spawn(process.execPath, [vite, 'preview', '--port', '5173', '--strictPort'], { cwd: temporal.src, stdio: 'ignore' })
  let browser
  const resultado = {}
  let bloqueadas = 0
  try {
    await servidorListo(servidor)
    await exigirBuild()
    browser = await chromium.launch()
    await iniciarSesion(browser)
    const ctx = await browser.newContext({
      viewport: VIEWPORTS.escritorio,
      locale: 'es-MX',
      storageState: ESTADO,
    })
    await ctx.addInitScript(() => localStorage.setItem('tema', 'dark'))
    await ctx.route('**/*', (route) => {
      const m = route.request().method()
      if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return route.continue()
      bloqueadas++
      return route.abort()
    })
    const page = await ctx.newPage()
    Object.assign(resultado, await modulo.probar({ page, ir, ORIGEN, esperarCarga, H1 }))
    await ctx.close()
  } finally {
    if (browser) await browser.close()
    servidor.kill()
    fs.rmSync(temporal.dir, { recursive: true, force: true })
  }
  const dir = path.join(DOCS, 'comportamiento')
  fs.mkdirSync(dir, { recursive: true })
  const archivo = path.join(dir, nombre + '-' + fuente + '.json')
  fs.writeFileSync(archivo, JSON.stringify(resultado, null, 2))
  console.log('  escrito ' + path.relative(RAIZ, archivo) + ' (peticiones no-GET abortadas: ' + bloqueadas + ')')
  return resultado
}

function aplanar(valor, prefijo = '', salida = {}) {
  // El atributo data-v-<hash> (estilos con alcance) depende de la ruta de la carpeta de compilación:
  // cambia entre HEAD y el árbol aunque el código sea el mismo, así que no se compara.
  if (/(^|\.)data-v-[0-9a-f]+$/.test(prefijo)) return salida
  if (valor !== null && typeof valor === 'object') {
    for (const [k, v] of Object.entries(valor)) aplanar(v, prefijo ? prefijo + '.' + k : k, salida)
  } else salida[prefijo] = JSON.stringify(valor)
  return salida
}

function compararJson(nombre) {
  const dir = path.join(DOCS, 'comportamiento')
  const a = aplanar(JSON.parse(fs.readFileSync(path.join(dir, nombre + '-head.json'), 'utf8')))
  const b = aplanar(JSON.parse(fs.readFileSync(path.join(dir, nombre + '-arbol.json'), 'utf8')))
  const claves = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  let difieren = 0
  for (const k of claves) {
    if (a[k] !== b[k]) {
      difieren++
      console.log(`  DIFIERE ${k}\n     HEAD : ${a[k]}\n     ARBOL: ${b[k]}`)
    }
  }
  console.log('[comportamiento ' + nombre + '] ' + claves.length + ' observaciones, ' + difieren + ' difieren')
  return difieren
}

// ---------- diff ----------

function listarPng(dir) {
  const out = []
  const rec = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) rec(p)
      else if (e.name.endsWith('.png')) out.push(path.relative(dir, p))
    }
  }
  if (fs.existsSync(dir)) rec(dir)
  return out.sort()
}

function diff(a, b, maxPx) {
  const dirA = path.join(DOCS, 'capturas-' + a)
  const dirB = path.join(DOCS, 'capturas-' + b)
  const dirD = path.join(DOCS, `capturas-diff-${a}-${b}`)
  fs.rmSync(dirD, { recursive: true, force: true })
  const A = new Set(listarPng(dirA))
  const B = new Set(listarPng(dirB))
  let malas = 0
  const filas = []
  for (const rel of [...new Set([...A, ...B])].sort()) {
    if (!A.has(rel) || !B.has(rel)) {
      filas.push(`FALTA   ${rel} (solo en ${A.has(rel) ? a : b})`)
      malas++
      continue
    }
    const ia = PNG.sync.read(fs.readFileSync(path.join(dirA, rel)))
    const ib = PNG.sync.read(fs.readFileSync(path.join(dirB, rel)))
    if (ia.width !== ib.width || ia.height !== ib.height) {
      filas.push(`TAMAÑO  ${rel} ${ia.width}x${ia.height} vs ${ib.width}x${ib.height}`)
      malas++
      continue
    }
    const d = new PNG({ width: ia.width, height: ia.height })
    const n = pixelmatch(ia.data, ib.data, d.data, ia.width, ia.height, { threshold: UMBRAL_PIXEL })
    if (n > maxPx) {
      fs.mkdirSync(path.dirname(path.join(dirD, rel)), { recursive: true })
      fs.writeFileSync(path.join(dirD, rel), PNG.sync.write(d))
      filas.push(`DIFIERE ${rel}: ${n} px`)
      malas++
    }
  }
  console.log(`\n[diff ${a} vs ${b}] umbral pixelmatch=${UMBRAL_PIXEL}, tolerancia=${maxPx} px/imagen`)
  console.log(`  imágenes comparadas: ${new Set([...A].filter((x) => B.has(x))).size}, con diferencias: ${malas}`)
  filas.forEach((f) => console.log('  ' + f))
  if (malas) console.log(`  mapas de diferencias en docs/capturas-diff-${a}-${b}/`)
  return malas
}

// ---------- main ----------

const o = args()
if (o.umbral !== undefined) UMBRAL_PIXEL = Number(o.umbral)
const solo = typeof o.solo === 'string' ? o.solo.split(',') : null
if (o._ === 'capturar') {
  const r = await capturar(o.salida || 'actual', { fuente: o['desde-head'] ? 'head' : 'arbol', solo })
  process.exit(r.fallos.length || r.bloqueadas ? 1 : 0)
} else if (o._ === 'probar') {
  await probar(o.prueba, { fuente: o['desde-head'] ? 'head' : 'arbol' })
  process.exit(0)
} else if (o._ === 'comparar-comportamiento') {
  process.exit(compararJson(o.prueba) ? 1 : 0)
} else if (o._ === 'diff') {
  process.exit(diff(o.a || 'base', o.b || 'actual', Number(o['max-px'] ?? 50)) ? 1 : 0)
} else if (o._ === 'comparar') {
  const r = await capturar('actual', { fuente: 'arbol', solo })
  const malas = diff('base', 'actual', Number(o['max-px'] ?? 50))
  process.exit(r.fallos.length || malas ? 1 : 0)
} else {
  console.error('Comandos: capturar | diff | comparar')
  process.exit(2)
}
