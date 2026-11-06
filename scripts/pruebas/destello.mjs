// Comportamiento del destello al abrir desde una búsqueda (Clientes, Prospectos, Familias) y de la
// navegación con loader del Dashboard (solo lectura: se abre y se cierra, nunca se guarda; las peticiones
// que no son GET se abortan). Las capturas desactivan animaciones y no ven temporizadores: esta prueba sí.
// Se ejecuta contra HEAD y contra el árbol actual y se comparan los JSON resultantes.
//
// Los tiempos se miden dentro de la página (performance.now) desde justo antes del clic y se redondean
// a 250 ms para absorber la latencia del clic; las muestras en
// instantes fijos son booleanas.

const BUSCADOR_LISTA = 'Buscar por alumno, tutor o teléfono'
const BUSCADOR_FAMILIAS = 'Buscar tutor, alumno o teléfono'
const TARJETA = 'main .glass.cursor-pointer'
const redondear = (ms) => Math.round(ms / 250) * 250

// Registra en la página cada cambio del conjunto de elementos con la clase "destello".
// Un elemento se describe por estructura (etiqueta, posición, si está en el modal y si es el alumno actual),
// nunca por texto, para no volcar datos personales al JSON.
async function instalarRegistro(page) {
  await page.evaluate(() => {
    const desc = (el) => {
      const p = el.parentElement
      const idx = p ? [...p.children].indexOf(el) : -1
      return (
        el.tagName.toLowerCase() +
        '[' +
        idx +
        ']' +
        '<' +
        (p ? p.tagName.toLowerCase() : '') +
        (el.closest('.fixed') ? '|modal' : '|pagina') +
        (el.classList.contains('glass') ? '|glass' : '') +
        (el.className.includes('border-accent/50') ? '|alumno-actual' : '')
      )
    }
    const conjunto = () => [...document.querySelectorAll('.destello')].map(desc).sort()
    window.__reg = { t0: performance.now(), eventos: [], ultimo: '[]' }
    const anotar = () => {
      const c = JSON.stringify(conjunto())
      if (c !== window.__reg.ultimo) {
        window.__reg.ultimo = c
        window.__reg.eventos.push({ t: performance.now() - window.__reg.t0, vistos: JSON.parse(c) })
      }
    }
    window.__regObs?.disconnect()
    window.__regObs = new MutationObserver(anotar)
    window.__regObs.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] })
    window.__marcar = () => {
      window.__reg.t0 = performance.now()
      window.__reg.eventos = []
      window.__reg.ultimo = JSON.stringify(conjunto())
    }
    window.__muestra = conjunto
  })
}

const marcar = (page) => page.evaluate(() => window.__marcar())
const muestra = (page) => page.evaluate(() => window.__muestra())

// Recoge el historial de cambios desde la última marca y muestras booleanas en instantes fijos (ms desde el clic)
async function observar(page, { muestras = [300, 1500, 2500, 3500] } = {}) {
  const res = { muestras: {} }
  for (const m of muestras) {
    const transcurrido = await page.evaluate(() => performance.now() - window.__reg.t0)
    if (m > transcurrido) await page.waitForTimeout(m - transcurrido)
    res.muestras['+' + m] = await muestra(page)
  }
  await page.waitForTimeout(800) // margen para que se vea la retirada tardía
  res.cambios = (await page.evaluate(() => window.__reg.eventos)).map((e) => ({ aprox_ms: redondear(e.t), vistos: e.vistos }))
  res.alFinal = await muestra(page)
  return res
}

// ---------- Clientes y Prospectos: tarjetas con modal de detalle ----------

async function datosTarjetas(page) {
  return page.evaluate((sel) => {
    return [...document.querySelectorAll(sel)].map((t) => {
      const titulo = t.querySelector('p.font-semibold')
      const subtitulo = titulo?.nextElementSibling
      return {
        titulo: (titulo?.childNodes[0]?.textContent ?? '').trim(),
        esTutor: !!titulo?.querySelector('span')?.textContent?.includes('Tutor'),
        subtitulo: (subtitulo?.textContent ?? '').replace(/\s+/g, ' ').trim(),
      }
    })
  }, TARJETA)
}

async function escribir(page, placeholder, texto) {
  await page.getByPlaceholder(placeholder).fill(texto)
  await page.waitForTimeout(400)
}

async function lista(page, nombre, ruta, h1, regexModal) {
  const salida = {}
  await rutaLimpia(page, ruta, h1)
  await instalarRegistro(page)
  await page.locator(TARJETA).first().waitFor({ state: 'visible', timeout: 15000 })

  const cerrar = async () => {
    await page.goBack()
    await page.waitForFunction((re) => !new RegExp(re).test(location.pathname), regexModal, { timeout: 5000 })
    await page.waitForTimeout(300)
  }
  const clic = async (i) => {
    await marcar(page)
    await page.locator(TARJETA).nth(i).click()
  }

  // 1. Sin búsqueda
  await clic(0)
  salida.sinBusqueda = await observar(page)
  await cerrar()

  // 2. Búsqueda que coincide con un alumno (se busca por el nombre del alumno principal de la primera tarjeta)
  const tarjetas = await datosTarjetas(page)
  const nombreAlumno = tarjetas.find((t) => !t.esTutor && t.titulo)?.titulo
  if (nombreAlumno) {
    await escribir(page, BUSCADOR_LISTA, nombreAlumno)
    const t = await datosTarjetas(page)
    salida.porAlumno = { tarjetasVisibles: t.length, primeraEsTutor: t[0]?.esTutor ?? null }
    await clic(0)
    Object.assign(salida.porAlumno, await observar(page))
    await cerrar()
  }

  // 3. Búsqueda que coincide solo con el tutor (se prueban hasta 10 nombres de tutor hasta que la tarjeta se titule con el tutor)
  await escribir(page, BUSCADOR_LISTA, '')
  const todas = await datosTarjetas(page)
  const tutores = [...new Set(todas.map((t) => t.subtitulo.replace(/^Tutor:\s*/, '')).filter((s) => s && !s.startsWith('Registro')))].slice(0, 10)
  let encontrado = false
  for (const tutor of tutores) {
    await escribir(page, BUSCADOR_LISTA, tutor)
    const t = await datosTarjetas(page)
    const i = t.findIndex((x) => x.esTutor)
    if (i >= 0) {
      salida.porTutor = { tarjetasVisibles: t.length, indiceTarjetaTutor: i }
      await clic(i)
      Object.assign(salida.porTutor, await observar(page))
      await cerrar()
      encontrado = true
      break
    }
  }
  if (!encontrado) salida.porTutor = { omitido: 'ningún tutor de la lista se titula como tutor al buscarlo' }

  // 4. Abrir otra tarjeta con el destello en curso: el temporizador se reinicia
  //    (búsqueda amplia "a": A en t=0, se cierra a ~1500 ms, B a ~1800 ms; el destello de B debe durar sus 3 s completos)
  await escribir(page, BUSCADOR_LISTA, 'a')
  const visibles = (await datosTarjetas(page)).length
  if (visibles >= 2) {
    await clic(0)
    await page.waitForTimeout(1500)
    await cerrar()
    await clic(1)
    salida.reinicioAlAbrirOtra = { tarjetasVisibles: visibles, ...(await observar(page, { muestras: [300, 1500, 2500, 3500] })) }
    await cerrar()
  } else salida.reinicioAlAbrirOtra = { omitido: 'menos de 2 tarjetas con la búsqueda "a"' }

  // 5. Con el destello en curso, borrar la búsqueda y abrir otra: no debe quedar ningún destello (ni el viejo)
  await clic(0)
  await page.waitForTimeout(1000)
  await cerrar()
  await escribir(page, BUSCADOR_LISTA, '')
  await clic(0)
  salida.sinBusquedaConDestelloPrevio = await observar(page)
  await cerrar()

  // 6. Estado local por pantalla: tras iniciar un destello aquí, otra pantalla no hereda nada
  await escribir(page, BUSCADOR_LISTA, 'a')
  await clic(0)
  await page.waitForTimeout(600)
  await cerrar()
  const otra = nombre === 'clientes' ? '/prospectos' : '/clientes'
  await page.locator(`a[href="${otra}"]`).first().click()
  await page.locator(TARJETA).first().waitFor({ state: 'visible', timeout: 15000 })
  await instalarRegistro(page)
  await page.waitForTimeout(500)
  await clic(0)
  salida.otraPantallaNoHereda = await observar(page, { muestras: [300, 1500] })
  return salida
}

async function rutaLimpia(page, ruta, h1) {
  await page.goto('http://localhost:5173' + ruta, { waitUntil: 'domcontentloaded' })
  await page.locator(h1).first().waitFor({ state: 'visible', timeout: 20000 })
  await page.waitForFunction(() => !document.querySelector('svg.van, svg.spinner'), null, { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(500)
}

// ---------- Familias ----------

async function familias(page, H1) {
  const salida = {}
  await rutaLimpia(page, '/familias', H1('Familias'))
  await instalarRegistro(page)
  const botones = page.locator('main section ul button')
  await botones.first().waitFor({ state: 'visible', timeout: 15000 })
  const total = await botones.count()
  salida.familiasEnLista = total

  // Nombres: se lee el primer alumno de las dos primeras familias (en memoria; no se guarda en el JSON)
  const leerAlumno = async (i) => {
    await botones.nth(i).click()
    await page.waitForTimeout(300)
    return page.evaluate(() => {
      const li = document.querySelector('main ul.mt-2 li')
      return {
        alumno: (li?.querySelector('p')?.textContent ?? '').trim(),
        tutor: (document.querySelector('main .glass p.font-semibold')?.textContent ?? '').trim(),
        alumnos: document.querySelectorAll('main ul.mt-2 li').length,
      }
    })
  }
  const A = await leerAlumno(0)
  const B = total > 1 ? await leerAlumno(1) : null
  await page.waitForTimeout(3300) // que se apague cualquier destello de las lecturas

  const clic = async (i) => {
    await marcar(page)
    await botones.nth(i).click()
  }

  // 1. Sin búsqueda
  await escribir(page, BUSCADOR_FAMILIAS, '')
  await clic(0)
  salida.sinBusqueda = await observar(page)

  // 2. Búsqueda por el nombre de un alumno: se ilumina ese alumno en la lista de la derecha
  await escribir(page, BUSCADOR_FAMILIAS, A.alumno)
  salida.porAlumno = { familiasVisibles: await botones.count() }
  await clic(0)
  Object.assign(salida.porAlumno, await observar(page))

  // 3. Búsqueda por el tutor: no se ilumina ninguno
  await escribir(page, BUSCADOR_FAMILIAS, A.tutor)
  salida.porTutor = { familiasVisibles: await botones.count() }
  await clic(0)
  Object.assign(salida.porTutor, await observar(page))

  // 4. Elegir otra familia con el destello en curso: el temporizador se reinicia
  if (B && B.alumno && B.alumno !== A.alumno) {
    await escribir(page, BUSCADOR_FAMILIAS, A.alumno)
    await clic(0)
    await page.waitForTimeout(1800)
    await escribir(page, BUSCADOR_FAMILIAS, B.alumno)
    await clic(0)
    salida.reinicioAlElegirOtra = await observar(page)
  } else salida.reinicioAlElegirOtra = { omitido: 'solo hay una familia o los dos alumnos se llaman igual' }

  // 5. Con el destello en curso, borrar la búsqueda y volver a elegir: se apaga al instante
  await escribir(page, BUSCADOR_FAMILIAS, A.alumno)
  await clic(0)
  await page.waitForTimeout(1000)
  await escribir(page, BUSCADOR_FAMILIAS, '')
  await clic(0)
  salida.sinBusquedaConDestelloPrevio = await observar(page)
  return salida
}

// ---------- Dashboard: irA con pausa de 500 ms y loader de pantalla ----------

async function instalarRelojDeNavegacion(page) {
  await page.evaluate(() => {
    window.__nav = { t0: performance.now(), cambios: [], url: location.pathname + location.search, loader: false, historial: history.length }
    const estado = () => ({ url: location.pathname + location.search, loader: !!document.querySelector('svg.van--pantalla') })
    const ciclo = () => {
      const e = estado()
      if (e.url !== window.__nav.url || e.loader !== window.__nav.loader) {
        window.__nav.url = e.url
        window.__nav.loader = e.loader
        window.__nav.cambios.push({ t: performance.now() - window.__nav.t0, ...e })
      }
      window.__navRaf = requestAnimationFrame(ciclo)
    }
    cancelAnimationFrame(window.__navRaf)
    window.__navRaf = requestAnimationFrame(ciclo)
    window.__navMarcar = () => {
      window.__nav.t0 = performance.now()
      window.__nav.cambios = []
      window.__nav.historial = history.length
    }
  })
}

async function resumenNavegacion(page) {
  await page.waitForTimeout(2500)
  const r = await page.evaluate(() => ({ cambios: window.__nav.cambios, deltaHistorial: history.length - window.__nav.historial }))
  return {
    // tiempos relativos al primer cambio (el loader aparece en la misma llamada que arranca irA)
    cambios: r.cambios.map((c) => ({ aprox_ms: redondear(c.t - (r.cambios[0]?.t ?? 0)), url: c.url.replace(/(alumno=)\d+/, '$1N'), loaderVisible: c.loader })),
    entradasNuevasEnElHistorial: r.deltaHistorial,
  }
}

async function dashboard(page, H1) {
  const salida = {}
  // Precalienta los chunks perezosos de los destinos: así la demora medida es la pausa y no la carga de la ruta
  for (const ruta of ['/prospectos', '/clientes', '/pagos', '/casos-especiales']) {
    await page.goto('http://localhost:5173' + ruta, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1200)
  }
  const irAlDashboard = async () => {
    await rutaLimpia(page, '/', H1('Dashboard'))
    await page.locator('main button.glass.cursor-pointer').first().waitFor({ state: 'visible', timeout: 15000 })
    await instalarRelojDeNavegacion(page)
  }

  // 1. Tarjeta con destino (un clic)
  await irAlDashboard()
  await page.evaluate(() => window.__navMarcar())
  await page.locator('main button.glass.cursor-pointer').first().click()
  salida.clicEnTarjeta = await resumenNavegacion(page)

  // 2. Doble clic: dos llamadas a irA seguidas
  await irAlDashboard()
  await page.evaluate(() => window.__navMarcar())
  await page.locator('main button.glass.cursor-pointer').first().dblclick()
  salida.dobleClicEnTarjeta = await resumenNavegacion(page)

  // 3. Desde la lista por estatus: "Ver en Pagos" (el modal se cierra al instante y luego navega)
  await irAlDashboard()
  const contador = page.locator('main button.bg-panel-2.text-left').first()
  if (await contador.count()) {
    await contador.click()
    await page.getByRole('button', { name: 'Ver en Pagos' }).waitFor({ state: 'visible', timeout: 5000 })
    await page.waitForTimeout(400)
    await page.evaluate(() => window.__navMarcar())
    await page.getByRole('button', { name: 'Ver en Pagos' }).click()
    await page.waitForTimeout(100)
    salida.verEnPagos = {
      modalCerradoA100ms: (await page.getByRole('button', { name: 'Ver en Pagos' }).count()) === 0,
      ...(await resumenNavegacion(page)),
    }
  } else salida.verEnPagos = { omitido: 'sin contadores de estatus' }

  // 4. Casos especiales (solo si hay casos en la semana en curso)
  await irAlDashboard()
  const casos = page.locator('main button.text-mint')
  if (await casos.count()) {
    await page.evaluate(() => window.__navMarcar())
    await casos.first().click()
    salida.casosEspeciales = await resumenNavegacion(page)
  } else salida.casosEspeciales = { omitido: 'no hay casos especiales en la semana en curso' }
  return salida
}

export async function probar({ page, H1 }) {
  const salida = {}
  salida.clientes = await lista(page, 'clientes', '/clientes', H1('Clientes'), '^/clientes/\\d+')
  salida.prospectos = await lista(page, 'prospectos', '/prospectos', H1('Prospectos'), '^/prospectos/\\d+')
  salida.familias = await familias(page, H1)
  salida.dashboard = await dashboard(page, H1)
  return salida
}
