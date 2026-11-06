// Atributos y clases de los campos de formulario de Login, Familias y Casos especiales, con y sin
// errores visibles. Solo lectura: nunca se envía nada (las peticiones que no son GET se abortan).

// Vuelca el formulario: atributos de <form>, de cada <label>, <input>/<textarea> y mensajes de error
function volcarFormulario(selector) {
  const form = document.querySelector(selector)
  if (!form) return null
  const attrs = (el) => Object.fromEntries([...el.attributes].filter((a) => a.name !== 'class').map((a) => [a.name, a.value]).sort())
  const clases = (el) => [...el.classList].sort()
  return {
    form: { attrs: attrs(form), clases: clases(form) },
    etiquetas: [...form.querySelectorAll('label')].map((l) => ({ texto: l.innerText.trim(), attrs: attrs(l), clases: clases(l) })),
    campos: [...form.querySelectorAll('input, textarea, select')].map((c) => ({
      etiqueta: c.id ? (form.querySelector('label[for="' + c.id + '"]')?.innerText.trim() ?? null) : null,
      attrs: attrs(c),
      clases: clases(c),
      valor: c.value,
    })),
    mensajes: [...form.querySelectorAll('p.text-danger')].map((p) => ({ texto: p.innerText.replace(/\s+/g, ' ').trim(), clases: clases(p) })),
    // Estructura: cada campo con sus hermanos directos (etiqueta, campo, mensaje) en orden
    envoltorios: [...form.querySelectorAll('input, textarea')].map((c) => ({
      etiquetaDelCampo: c.parentElement ? [...c.parentElement.children].map((h) => h.tagName).join(',') : null,
      tagPadre: c.parentElement ? c.parentElement.tagName : null,
      clasesPadre: c.parentElement ? [...c.parentElement.classList].sort() : null,
    })),
  }
}

async function tocar(page, selector) {
  const campos = page.locator(selector)
  const n = await campos.count()
  for (let i = 0; i < n; i++) {
    await campos.nth(i).focus()
    await campos.nth(i).blur()
  }
  await page.waitForTimeout(200)
}

export async function probar({ page, ir, ORIGEN, H1 }) {
  const salida = {}

  // --- Login (sin sesión)
  const anonimo = await page.context().browser().newContext({ viewport: { width: 1440, height: 900 }, locale: 'es-MX' })
  await anonimo.route('**/*', (r) => (['GET', 'HEAD', 'OPTIONS'].includes(r.request().method()) ? r.continue() : r.abort()))
  const pl = await anonimo.newPage()
  await pl.goto(ORIGEN + '/login')
  await pl.locator('#login-correo').waitFor()
  salida.loginVacio = await pl.evaluate(volcarFormulario, 'form')
  await tocar(pl, '#login-correo, #login-password')
  salida.loginConErrores = await pl.evaluate(volcarFormulario, 'form')
  await pl.locator('#login-correo').fill('a@b.c')
  await pl.locator('#login-password').fill('x')
  salida.loginRellenado = await pl.evaluate(volcarFormulario, 'form')
  await anonimo.close()

  // --- Familias
  await ir(page, '/familias', H1('Familias'))
  await page.locator('main ul button').first().click()
  await page.waitForTimeout(500)
  salida.familiasVacio = await page.evaluate(volcarFormulario, 'form')
  await tocar(page, 'form input')
  salida.familiasConErrores = await page.evaluate(volcarFormulario, 'form')
  await page.locator('#fam-nombre').fill('Prueba')
  await page.locator('#fam-apellido-p').fill('Captura')
  await page.locator('#fam-apellido-m').fill('Visual')
  await page.locator('#fam-telefono').fill('123')
  await tocar(page, 'form input')
  salida.familiasTelefonoCorto = await page.evaluate(volcarFormulario, 'form')

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
  salida.casosVacio = await page.evaluate(volcarFormulario, 'main form')
  await tocar(page, '#caso-monto, #caso-motivo')
  salida.casosConErrores = await page.evaluate(volcarFormulario, 'main form')
  await page.locator('#caso-monto').fill('12.345')
  await page.locator('#caso-motivo').fill('x')
  await tocar(page, '#caso-monto, #caso-motivo')
  salida.casosMontoInvalido = await page.evaluate(volcarFormulario, 'main form')
  return salida
}
