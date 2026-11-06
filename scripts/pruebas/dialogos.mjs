// Comportamiento de los diálogos de confirmación de Familias y Casos especiales (solo lectura:
// se abren y se cancelan, nunca se confirman; las peticiones que no son GET se abortan).
// Se ejecuta contra HEAD y contra el árbol actual y se comparan los JSON resultantes.

// Registra todas las clases que aparecen en el fondo (z-40), el contenedor y el diálogo durante la transición
async function vigilarTransicion(page) {
  await page.evaluate(() => {
    window.__vistas = { fondo: new Set(), dialogo: new Set(), contenedor: new Set() }
    const anotar = (el) => {
      if (!(el instanceof HTMLElement)) return
      let destino = null
      if (el.getAttribute('role') === 'dialog') destino = 'dialogo'
      else if (el.classList.contains('z-40')) destino = 'fondo'
      else if (el.classList.contains('z-50') && el.classList.contains('pointer-events-none')) destino = 'contenedor'
      if (destino) el.classList.forEach((c) => window.__vistas[destino].add(c))
    }
    window.__obs = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === 'attributes') anotar(m.target)
        m.addedNodes.forEach((n) => {
          anotar(n)
          if (n instanceof HTMLElement) n.querySelectorAll('*').forEach(anotar)
        })
      }
    })
    window.__obs.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] })
  })
}

async function medirEstructura(dlg) {
  return dlg.evaluate((el) => {
    const cs = getComputedStyle(el)
    const contenedor = el.parentElement
    const fondo = contenedor.previousElementSibling
    const descr = (n) =>
      n
        ? n.tagName +
          (n.getAttribute('role') ? '[' + n.getAttribute('role') + ']' : '') +
          (n.id ? '#' + n.id : '') +
          (n.getAttribute('aria-label') ? '(' + n.getAttribute('aria-label') + ')' : '')
        : null
    return {
      role: el.getAttribute('role'),
      ariaLabel: el.getAttribute('aria-label'),
      ariaModal: el.getAttribute('aria-modal'),
      tabindex: el.getAttribute('tabindex'),
      clases: [...el.classList].sort(),
      tagContenedor: contenedor.tagName,
      clasesContenedor: [...contenedor.classList].sort(),
      tagFondo: fondo ? fondo.tagName : null,
      clasesFondo: fondo ? [...fondo.classList].sort() : null,
      zIndexFondo: fondo ? getComputedStyle(fondo).zIndex : null,
      zIndexContenedor: getComputedStyle(contenedor).zIndex,
      fondoColor: fondo ? getComputedStyle(fondo).backgroundColor : null,
      fondoFiltro: fondo ? getComputedStyle(fondo).backdropFilter : null,
      teleportadoFueraDeApp: !el.closest('#app'),
      padreDelContenedor: contenedor.parentElement ? contenedor.parentElement.tagName : null,
      hijosDeBody: [...document.body.children].map((n) => n.tagName + (n.id ? '#' + n.id : '')),
      posicion: cs.position,
      overflowBody: getComputedStyle(document.body).overflow,
      overflowHtml: getComputedStyle(document.documentElement).overflow,
      enfocado: descr(document.activeElement),
      textoDelDialogo: el.innerText.replace(/\s+/g, ' ').trim().slice(0, 400),
      botones: [...el.querySelectorAll('button')].map((b) => ({
        texto: b.innerText.trim(),
        type: b.getAttribute('type'),
        deshabilitado: b.disabled,
      })),
    }
  })
}

async function recorrer(page, nombre, abrir) {
  const res = {}
  const dlg = page.getByRole('dialog', { name: nombre })
  const abierto = async () => (await dlg.count()) > 0 && (await dlg.isVisible().catch(() => false))
  const descr = () =>
    page.evaluate(() => {
      const n = document.activeElement
      return n ? n.tagName + (n.id ? '#' + n.id : '') + (n.getAttribute('type') ? '[' + n.getAttribute('type') + ']' : '') : null
    })

  await vigilarTransicion(page)
  await abrir()
  await dlg.waitFor({ state: 'visible', timeout: 5000 })
  res.alAbrir = await medirEstructura(dlg)
  res.clasesVistasDuranteLaTransicion = await page.evaluate(() => ({
    fondo: [...window.__vistas.fondo].sort(),
    dialogo: [...window.__vistas.dialogo].sort(),
    contenedor: [...window.__vistas.contenedor].sort(),
  }))

  // 1. Esc con el foco FUERA del diálogo (donde quedó al abrirlo)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  res.escConFocoFuera = { siguieAbierto: await abierto(), enfocadoDespues: await descr() }

  // 2. Clic dentro del diálogo (lo enfoca) y luego Esc
  if (await abierto()) {
    await dlg.locator('p').first().click()
    res.focoTrasClicEnElDialogo = await descr()
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
    res.escConFocoDentro = { siguieAbierto: await abierto(), enfocadoDespues: await descr() }
  }

  // 3. Clic fuera (en el fondo)
  if (!(await abierto())) {
    await abrir()
    await dlg.waitFor({ state: 'visible', timeout: 5000 })
  }
  await page.mouse.click(5, 5)
  await page.waitForTimeout(500)
  res.clicEnElFondo = { siguieAbierto: await abierto(), enfocadoDespues: await descr() }

  // 4. Rueda del ratón sobre el fondo con el diálogo abierto
  if (!(await abierto())) {
    await abrir()
    await dlg.waitFor({ state: 'visible', timeout: 5000 })
  }
  const antes = await page.evaluate(() => window.scrollY)
  await page.mouse.move(700, 450)
  await page.mouse.wheel(0, 400)
  await page.waitForTimeout(300)
  res.rueda = {
    scrollYAntes: antes,
    scrollYDespues: await page.evaluate(() => window.scrollY),
    alturaDocumento: await page.evaluate(() => document.documentElement.scrollHeight),
  }

  // 5. Botón Cancelar
  await dlg.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await page.waitForTimeout(500)
  res.cancelar = { siguieAbierto: await abierto(), enfocadoDespues: await descr() }
  res.dialogosEnElDOMTrasCerrar = await page.locator('[role=dialog]').count()
  await page.evaluate(() => window.__obs && window.__obs.disconnect())
  return res
}

export async function probar({ page, ir, H1 }) {
  const salida = {}

  // --- Familias
  await ir(page, '/familias', H1('Familias'))
  await page.locator('main ul button').first().click()
  await page.waitForTimeout(500)
  const abrirFamilias = async () => {
    const campos = ['#fam-nombre', '#fam-apellido-p', '#fam-apellido-m', '#fam-telefono']
    const valores = ['Prueba', 'Captura', 'Visual', '5500000000']
    for (let i = 0; i < 4; i++) await page.locator(campos[i]).fill(valores[i])
    await page.waitForTimeout(700)
    await page.locator('form button[type=submit]').click()
  }
  salida.familias = await recorrer(page, 'Agregar alumno', abrirFamilias)

  // --- Casos especiales
  await ir(page, '/casos-especiales', H1('Casos especiales'))
  let elegir = page.locator('main section ul button').first()
  if (!(await elegir.count())) {
    await page.getByPlaceholder('Buscar alumno o escuela').fill('a')
    await page.waitForTimeout(300)
    elegir = page.locator('main section ul button').first()
  }
  await elegir.click()
  await page.waitForTimeout(400)
  const abrirCasos = async () => {
    await page.locator('#caso-monto').fill('100')
    await page.locator('#caso-motivo').fill('Prueba de captura')
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: 'Registrar caso especial' }).click()
  }
  salida.casos = await recorrer(page, 'Registrar caso especial', abrirCasos)
  return salida
}
