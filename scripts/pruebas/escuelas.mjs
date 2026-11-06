// Opciones de escuela de cada selector (etiquetas, orden, formato "nombre (turno)") y las peticiones de datos
// que hace cada pantalla al cargar (cuáles, en qué orden y cuántas veces). Solo lectura.
// Se ejecuta contra HEAD y contra el árbol actual y se comparan los JSON.

// Peticiones de datos durante `accion` (se ignora el canal de eventos en tiempo real)
async function conPeticiones(page, accion) {
  const vistas = []
  const alPedir = (req) => {
    if (!['xhr', 'fetch'].includes(req.resourceType())) return
    const u = new URL(req.url())
    if (u.port === '5173' || /eventos/.test(u.pathname)) return
    vistas.push(req.method() + ' ' + u.pathname + u.search)
  }
  page.on('request', alPedir)
  try {
    const resultado = await accion()
    await page.waitForTimeout(800)
    return { peticiones: vistas, ...resultado }
  } finally {
    page.off('request', alPedir)
  }
}

// Abre cada selector del ámbito, anota sus opciones y lo cierra
async function leerSelectores(page, ambito) {
  const cont = page.locator(`${ambito} .relative.w-fit`)
  const n = await cont.count()
  const salida = []
  for (let i = 0; i < n; i++) {
    const c = cont.nth(i)
    const boton = c.locator('> button').first()
    const actual = (await boton.innerText()).trim()
    await boton.click()
    await page.waitForTimeout(250)
    const opciones = await c.locator('div.absolute button').allInnerTexts()
    await boton.click()
    await page.waitForTimeout(250)
    salida.push({ actual, opciones: opciones.map((o) => o.trim()) })
  }
  return salida
}

const solo = (lista, marca) => lista.filter((s) => s.opciones.some((o) => marca.test(o)) || marca.test(s.actual))

export async function probar({ page, ir, ORIGEN, H1 }) {
  const salida = {}
  const esperarListo = () => page.waitForFunction(() => !document.querySelector('svg.van, svg.spinner'), null, { timeout: 20000 }).catch(() => {})

  // Clientes y Prospectos: selector del encabezado + peticiones al montar
  for (const [clave, ruta, titulo] of [
    ['clientes', '/clientes', 'Clientes'],
    ['prospectos', '/prospectos', 'Prospectos'],
  ]) {
    salida[clave] = await conPeticiones(page, async () => {
      await ir(page, ruta, H1(titulo))
      await esperarListo()
      return { selectores: solo(await leerSelectores(page, 'main'), /escuelas/i) }
    })
  }

  // Formularios de edición (dentro del modal de detalle)
  await ir(page, '/clientes', H1('Clientes'))
  await page.locator('main .glass.cursor-pointer').first().click()
  await page.waitForURL(/\/clientes\/\d+$/, { timeout: 10000 })
  const urlCliente = page.url()
  await page.goto(urlCliente + '/editar', { waitUntil: 'domcontentloaded' })
  salida.clienteEditar = await conPeticiones(page, async () => {
    await page.locator('.fixed form, .fixed input').first().waitFor({ state: 'visible', timeout: 20000 })
    await esperarListo()
    await page.waitForTimeout(1000) // que lleguen las escuelas antes de leer la etiqueta elegida
    return { selectores: solo(await leerSelectores(page, '.fixed'), /Sin escuela asignada/) }
  })

  await ir(page, '/prospectos', H1('Prospectos'))
  // El botón de editar solo existe en prospectos pendientes: se prueba tarjeta por tarjeta
  for (let i = 0; i < 15; i++) {
    await page.locator('main .glass.cursor-pointer').nth(i).click()
    await page.waitForURL(/\/prospectos\/\d+$/, { timeout: 10000 })
    await esperarListo()
    await page.waitForTimeout(600)
    if (await page.locator('.fixed button[title="Editar"]').count()) break
    await page.goBack()
    await page.waitForTimeout(400)
  }
  salida.prospectoEditar = await conPeticiones(page, async () => {
    await page.locator('.fixed button[title="Editar"]').click()
    await page.locator('.fixed form, .fixed input').first().waitFor({ state: 'visible', timeout: 20000 })
    await page.waitForTimeout(1000) // que lleguen las escuelas antes de leer la etiqueta elegida
    return { selectores: solo(await leerSelectores(page, '.fixed'), /Sin escuela asignada/) }
  })

  // Pagos y Asistencias (derivan sus escuelas de los datos de la semana / del día)
  for (const [clave, ruta, titulo] of [
    ['pagos', '/pagos', 'Pagos'],
    ['asistencias', '/asistencias', 'Asistencias'],
  ]) {
    salida[clave] = await conPeticiones(page, async () => {
      await ir(page, ruta, H1(titulo))
      await esperarListo()
      return { selectores: solo(await leerSelectores(page, 'main'), /Todas las escuelas/) }
    })
  }

  // Registro público (sin sesión)
  const anonimo = await page.context().browser().newContext({ viewport: { width: 1440, height: 900 }, locale: 'es-MX' })
  await anonimo.route('**/*', (r) => (['GET', 'HEAD', 'OPTIONS'].includes(r.request().method()) ? r.continue() : r.abort()))
  const pr = await anonimo.newPage()
  salida.registro = await conPeticiones(pr, async () => {
    await pr.goto(ORIGEN + '/registro', { waitUntil: 'domcontentloaded' })
    await pr.locator('h1').first().waitFor()
    await pr.waitForTimeout(1200)
    return { selectores: solo(await leerSelectores(pr, 'main, body'), /Selecciona una escuela/) }
  })
  await anonimo.close()
  return salida
}
