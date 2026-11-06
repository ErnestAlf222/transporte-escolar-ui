// Campos "tocados" de Familias y Casos especiales: cuándo aparece el aviso de cada campo (al salir del campo,
// al intentar enviar) y cuándo se reinicia (al elegir otra familia, al cambiar de alumno). Solo lectura:
// el envío abre la confirmación y se cancela; las peticiones que no son GET se abortan.

// Estado visible de cada campo del formulario: borde de error y mensaje (el texto del mensaje, no datos personales)
async function estado(page, formSel) {
  return page.evaluate((formSel) => {
    const form = document.querySelector(formSel)
    if (!form) return null
    return [...form.querySelectorAll('input')].map((c) => ({
      id: c.id,
      bordeDeError: c.className.includes('border-danger'),
      mensaje: (c.parentElement.querySelector('p.text-danger')?.textContent ?? '').trim() || null,
    }))
  }, formSel)
}

async function blur(page, id) {
  await page.locator('#' + id).focus()
  await page.locator('#' + id).blur()
  await page.waitForTimeout(150)
}

const hayDialogo = async (page, nombre) => (await page.getByRole('dialog', { name: nombre }).count()) > 0

export async function probar({ page, ir, H1 }) {
  const salida = {}

  // ---------- Familias ----------
  await ir(page, '/familias', H1('Familias'))
  const fams = page.locator('main section ul button')
  await fams.first().waitFor({ state: 'visible', timeout: 15000 })
  await fams.first().click()
  await page.waitForTimeout(400)
  const F = 'main form'
  const ids = ['fam-nombre', 'fam-apellido-p', 'fam-apellido-m', 'fam-telefono']
  const f = (salida.familias = {})
  f.inicial = await estado(page, F)
  // Escribir sin salir del campo no muestra aviso
  await page.locator('#fam-nombre').fill('x')
  await page.locator('#fam-nombre').fill('')
  f.escribirSinSalir = await estado(page, F)
  // Salir de cada campo, de uno en uno
  f.alSalirDeCadaCampo = {}
  for (const id of ids) {
    await blur(page, id)
    f.alSalirDeCadaCampo[id] = await estado(page, F)
  }
  // Elegir otra familia (o la misma) reinicia los avisos
  await fams.first().click()
  await page.waitForTimeout(300)
  f.trasElegirFamilia = await estado(page, F)
  // El botón de enviar está deshabilitado mientras haya errores: con el formulario vacío no se puede enviar
  f.botonEnviarConFormularioVacio = await page.evaluate(() => document.querySelector('form button[type=submit]').disabled)
  // Arreglar un campo no quita los avisos de los demás
  await page.locator('#fam-nombre').fill('Prueba')
  f.trasArreglarUno = await estado(page, F)
  // Teléfono corto: aviso solo si se salió del campo
  await page.locator('#fam-telefono').fill('123')
  f.telefonoCortoSinSalir = await estado(page, F)
  await blur(page, 'fam-telefono')
  f.telefonoCortoTrasSalir = await estado(page, F)
  // Reiniciar al elegir otra familia
  if ((await fams.count()) > 1) {
    await fams.nth(1).click()
    await page.waitForTimeout(300)
    f.trasCambiarDeFamilia = await estado(page, F)
  }
  // Enviar con Enter desde el último apellido (sin salir del campo): marca TODOS como tocados, incluido el teléfono,
  // que nunca recibió el foco. Se cancela la confirmación y se escribe un teléfono inválido sin salir del campo.
  await fams.first().click()
  await page.waitForTimeout(300)
  await page.locator('#fam-nombre').fill('Prueba')
  await page.locator('#fam-apellido-p').fill('Captura')
  await page.locator('#fam-apellido-m').fill('Visual')
  await page.waitForTimeout(700)
  await page.locator('#fam-apellido-m').press('Enter')
  await page.waitForTimeout(500)
  f.enterValido = { confirmacion: await hayDialogo(page, 'Agregar alumno') }
  const cancelarF = page.getByRole('dialog', { name: 'Agregar alumno' }).getByRole('button', { name: 'Cancelar', exact: true })
  if (await cancelarF.count()) await cancelarF.click()
  await page.waitForTimeout(400)
  await page.locator('#fam-telefono').fill('12')
  f.telefonoInvalidoSinHaberloTocado = await estado(page, F)
  // Elegir la misma familia reinicia y los avisos se van
  await fams.first().click()
  await page.waitForTimeout(300)
  f.trasReiniciarDespuesDeEnviar = await estado(page, F)

  // ---------- Casos especiales ----------
  await ir(page, '/casos-especiales', H1('Casos especiales'))
  let elegir = page.locator('main section ul button').first()
  if (!(await elegir.count())) {
    await page.getByPlaceholder('Buscar alumno o escuela').fill('a')
    await page.waitForTimeout(300)
    elegir = page.locator('main section ul button').first()
  }
  await elegir.click()
  await page.waitForTimeout(400)
  const C = 'main form'
  const c = (salida.casos = {})
  c.inicial = await estado(page, C)
  c.alSalirDelMonto = (await blur(page, 'caso-monto'), await estado(page, C))
  c.alSalirDelMotivo = (await blur(page, 'caso-motivo'), await estado(page, C))
  // Cambiar de alumno y elegir otro: ¿se conservan los avisos? (hoy NO se reinicia en elegirAlumno)
  const cambiar = page.locator('main').getByRole('button', { name: 'Cambiar', exact: true })
  if (await cambiar.count()) {
    await cambiar.click()
    await page.waitForTimeout(300)
    let otro = page.locator('main section ul button').first()
    if (!(await otro.count())) {
      await page.getByPlaceholder('Buscar alumno o escuela').fill('a')
      await page.waitForTimeout(300)
      otro = page.locator('main section ul button').first()
    }
    await otro.click()
    await page.waitForTimeout(400)
    c.trasCambiarDeAlumno = await estado(page, C)
  } else c.trasCambiarDeAlumno = { omitido: 'no hay botón Cambiar' }
  // El botón de enviar está deshabilitado mientras haya errores
  c.botonEnviarConFormularioVacio = await page.evaluate(() => document.querySelector('main form button[type=submit]').disabled)
  // Monto inválido tocado; luego válido: el aviso desaparece pero el campo sigue "tocado"
  await page.locator('#caso-monto').fill('0')
  c.montoCero = await estado(page, C)
  await page.locator('#caso-monto').fill('100')
  c.montoValido = await estado(page, C)
  await page.locator('#caso-monto').fill('')
  c.montoVacioOtraVez = await estado(page, C)
  // Enviar con Enter desde el motivo (sin salir del campo) marca ambos como tocados. Para aislarlo, se parte de otro alumno
  // recién elegido tras un Cambiar (no reinicia) y se usa un motivo que se vacía después sin salir del campo.
  await page.locator('#caso-monto').fill('100')
  await page.locator('#caso-motivo').fill('Prueba de comportamiento')
  await page.locator('#caso-motivo').press('Enter')
  await page.waitForTimeout(500)
  c.enterValido = { confirmacion: await hayDialogo(page, 'Registrar caso especial') }
  const cancelar = page.getByRole('dialog', { name: 'Registrar caso especial' }).getByRole('button', { name: 'Cancelar', exact: true })
  if (await cancelar.count()) await cancelar.click()
  await page.waitForTimeout(400)
  c.trasCancelar = await estado(page, C)
  await page.locator('#caso-motivo').fill('')
  c.motivoVaciadoSinSalir = await estado(page, C)
  return salida
}
