// Comportamiento de los modales de detalle (solo lectura: se abren y se cierran; las peticiones que
// no son GET se abortan). Mide estructura, capas, transición, Esc, clic fuera, foco y scroll.

const primeraTarjeta = 'main .glass.cursor-pointer'

// Anota las clases de todos los nodos nuevos de <body> (y sus hijos directos) durante la transición
async function vigilar(page) {
  await page.evaluate(() => {
    window.__tokens = {}
    const clave = (el) => {
      const p = el.parentElement
      if (p === document.body) return 'raiz:' + [...document.body.children].indexOf(el)
      if (p && p.parentElement === document.body) return 'hijo:' + [...p.parentElement.children].indexOf(p)
      return null
    }
    const anotar = (el) => {
      if (!(el instanceof HTMLElement)) return
      const k = clave(el)
      if (!k || el.id === 'app') return
      window.__tokens[k] ??= new Set()
      el.classList.forEach((c) => window.__tokens[k].add(c))
    }
    window.__obs = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === 'attributes') anotar(m.target)
        m.addedNodes.forEach((n) => {
          anotar(n)
          if (n instanceof HTMLElement) n.querySelectorAll(':scope > *').forEach(anotar)
        })
      }
    })
    window.__obs.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] })
  })
}

async function estructura(page) {
  return page.evaluate(() => {
    const attrs = (el) => Object.fromEntries([...el.attributes].filter((a) => a.name !== 'class').map((a) => [a.name, a.value]).sort())
    const nuevos = [...document.body.children].filter((n) => n.id !== 'app' && n.tagName === 'DIV' && getComputedStyle(n).position === 'fixed')
    const descr = (n) => {
      const cs = getComputedStyle(n)
      const hijo = n.firstElementChild
      return {
        tag: n.tagName,
        clases: [...n.classList].sort(),
        attrs: attrs(n),
        zIndex: cs.zIndex,
        fondo: cs.backgroundColor,
        filtro: cs.backdropFilter,
        hijoDirecto: hijo ? { tag: hijo.tagName, clases: [...hijo.classList].sort(), attrs: attrs(hijo) } : null,
      }
    }
    const act = document.activeElement
    return {
      capas: nuevos.map(descr),
      cantidadDeCapas: nuevos.length,
      conRoleDialog: [...document.querySelectorAll('[role=dialog]')].map((d) => d.getAttribute('aria-label')),
      ariaModal: [...document.querySelectorAll('[aria-modal]')].length,
      tabindexMenosUno: nuevos.filter((n) => n.getAttribute('tabindex') === '-1').length,
      enfocado: act ? act.tagName + (act.id ? '#' + act.id : '') : null,
      overflowBody: getComputedStyle(document.body).overflow,
      overflowHtml: getComputedStyle(document.documentElement).overflow,
      ruta: location.pathname + location.search,
    }
  })
}

async function capasAbiertas(page) {
  return page.evaluate(() => [...document.body.children].filter((n) => n.id !== 'app' && n.tagName === 'DIV' && getComputedStyle(n).position === 'fixed').length)
}

async function descr(page) {
  return page.evaluate(() => {
    const n = document.activeElement
    return n ? n.tagName + (n.id ? '#' + n.id : '') : null
  })
}

async function recorrer(page, { abrir, clicDentro, cerrado }) {
  const res = {}
  await abrir()
  await page.waitForTimeout(700)
  res.alAbrir = await estructura(page)
  res.clasesVistasDuranteLaTransicion = await page.evaluate(() => Object.fromEntries(Object.entries(window.__tokens).map(([k, v]) => [k, [...v].sort()])))

  // Esc con el foco fuera
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  res.escConFocoFuera = { capas: await capasAbiertas(page), ruta: await page.evaluate(() => location.pathname) }

  // Clic dentro (enfoca el modal) y luego Esc
  if ((await capasAbiertas(page)) > 0) {
    await clicDentro()
    res.focoTrasClicDentro = await descr(page)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(600)
    res.escConFocoDentro = { capas: await capasAbiertas(page), ruta: await page.evaluate(() => location.pathname) }
  }

  // Clic fuera
  if ((await capasAbiertas(page)) === 0) {
    await abrir()
    await page.waitForTimeout(700)
  }
  await page.mouse.click(5, 5)
  await page.waitForTimeout(600)
  res.clicFuera = { capas: await capasAbiertas(page), ruta: await page.evaluate(() => location.pathname), enfocadoDespues: await descr(page) }
  await page.evaluate(() => window.__obs && window.__obs.disconnect())
  if (cerrado) res.siguienteEstado = await cerrado()
  return res
}

export async function probar({ page, ir, H1 }) {
  const salida = {}

  // --- ClienteDetalleModal (por URL /clientes/:id)
  const abrirCliente = async () => {
    await ir(page, '/clientes', H1('Clientes'))
    await vigilar(page)
    await page.locator(primeraTarjeta).first().click()
    await page.waitForURL(/\/clientes\/\d+/)
  }
  salida.cliente = await recorrer(page, { abrir: abrirCliente, clicDentro: () => page.locator('body > div:not(#app) :is(h2, h3, p)').first().click() })

  // --- Diálogo de archivar dentro del modal de cliente: Esc y clic en su fondo
  await abrirCliente()
  await page.waitForTimeout(600)
  const archivar = page.getByRole('button', { name: 'Archivar alumno', exact: true })
  if (await archivar.count()) {
    await archivar.click()
    const dlg = page.getByRole('dialog', { name: 'Archivar alumno' })
    await dlg.waitFor({ state: 'visible', timeout: 5000 })
    await page.waitForFunction(() => !document.body.innerText.includes('Revisando adeudo'), null, { timeout: 10000 }).catch(() => {})
    salida.archivar = { estructura: await dlg.evaluate((el) => {
      const c = el.parentElement
      return { clases: [...el.classList].sort(), clasesContenedor: [...c.classList].sort(), fondoPrevio: c.previousElementSibling ? [...c.previousElementSibling.classList].sort() : null, anidadoEnTeleport: !!el.closest('body > div:not(#app)'), tabindex: el.getAttribute('tabindex'), ariaLabel: el.getAttribute('aria-label') }
    }) }
    await dlg.locator('p').first().click()
    await page.keyboard.press('Escape')
    await page.waitForTimeout(600)
    salida.archivar.escDentroDelDialogo = { dialogoAbierto: await dlg.count(), capas: await capasAbiertas(page), ruta: await page.evaluate(() => location.pathname) }
    // reabrir si hace falta y probar el clic en su fondo
    if (!(await capasAbiertas(page))) await abrirCliente()
    await page.waitForTimeout(600)
    if (!(await dlg.count())) {
      await page.getByRole('button', { name: 'Archivar alumno', exact: true }).click()
      await dlg.waitFor({ state: 'visible', timeout: 5000 })
    }
    await page.mouse.click(5, 5)
    await page.waitForTimeout(600)
    salida.archivar.clicFuera = { dialogoAbierto: await dlg.count(), capas: await capasAbiertas(page), ruta: await page.evaluate(() => location.pathname) }
  }

  // --- PagoDetalleModal
  const abrirPago = async () => {
    await ir(page, '/pagos', H1('Pagos'))
    await vigilar(page)
    await page.locator('main [role=button].cursor-pointer').first().click()
  }
  salida.pago = await recorrer(page, { abrir: abrirPago, clicDentro: () => page.locator('body > div:not(#app) :is(h2, h3, p)').first().click() })

  // --- ProspectoDetalleModal
  const abrirProspecto = async () => {
    await ir(page, '/prospectos', H1('Prospectos'))
    await vigilar(page)
    await page.locator(primeraTarjeta).first().click()
    await page.waitForURL(/\/prospectos\/\d+/)
  }
  salida.prospecto = await recorrer(page, { abrir: abrirProspecto, clicDentro: () => page.locator('body > div:not(#app) :is(h2, h3, p)').first().click() })

  // --- ListaEstatusModal (Dashboard)
  const abrirLista = async () => {
    await ir(page, '/', H1('Dashboard'))
    await vigilar(page)
    await page.locator('main button.bg-panel-2.text-left').first().click()
  }
  salida.listaEstatus = await recorrer(page, { abrir: abrirLista, clicDentro: () => page.getByPlaceholder('Buscar alumno, tutor o teléfono').click() })

  // --- ConductorPerfilModal
  const abrirConductor = async () => {
    await ir(page, '/conductores', H1('Conductores'))
    await vigilar(page)
    await page.locator('article[role=button]').first().click()
    await page.waitForURL(/\/conductores\/\d+/)
  }
  salida.conductorPerfil = await recorrer(page, { abrir: abrirConductor, clicDentro: () => page.locator('body > div:not(#app) :is(h2, h3, p)').first().click() })

  // --- ParadaDetalleModal
  let baseConductor = ''
  await abrirConductor()
  baseConductor = new URL(page.url()).pathname.replace(/\/$/, '')
  const abrirParada = async () => {
    await ir(page, baseConductor + '/alumnos', H1('Sus alumnos'))
    await vigilar(page)
    await page.locator('main [role=button].cursor-pointer').first().click()
  }
  salida.parada = await recorrer(page, { abrir: abrirParada, clicDentro: () => page.locator('body > div:not(#app) :is(h2, h3, p)').first().click() })
  return salida
}
