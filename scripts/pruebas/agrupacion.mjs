// Agrupación y orden de las tarjetas de Clientes, Prospectos y Familias con y sin búsqueda (solo lectura).
// Las capturas no ven el orden ni la agrupación: esta prueba vuelca, por tarjeta, su posición, la letra del
// índice (Clientes), la insignia ("+N" / "Tutor · N") y una huella del texto completo. Las huellas evitan
// volcar nombres y teléfonos al JSON. Se ejecuta contra HEAD y contra el árbol actual y se comparan.

const TARJETA = 'main .glass.cursor-pointer'
const BUSCADOR_LISTA = 'Buscar por alumno, tutor o teléfono'
const BUSCADOR_FAMILIAS = 'Buscar tutor, alumno o teléfono'

// Las huellas (FNV-1a) se calculan dentro de la página: evitan volcar nombres y teléfonos al JSON

async function volcarTarjetas(page) {
  return page.evaluate(
    (sel) => {
      const huella = (s) => { let x = 2166136261; for (const c of s) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619) } return (x >>> 0).toString(36) } // FNV-1a
      const norm = (t) => (t ?? '').replace(/\s+/g, ' ').trim()
      let letra = null
      const filas = []
      for (const el of document.querySelectorAll(`[id^="letra-"], ${sel}`)) {
        if (el.id?.startsWith('letra-')) {
          letra = el.id.slice(6)
          continue
        }
        const insignia = norm(el.querySelector('p.font-semibold span')?.textContent)
        filas.push({ letra, insignia, huella: huella(norm(el.innerText)) })
      }
      return filas
    },
    TARJETA,
  )
}

async function volcarFamilias(page) {
  return page.evaluate(() => {
    const huella = (s) => { let x = 2166136261; for (const c of s) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619) } return (x >>> 0).toString(36) } // FNV-1a
    const norm = (t) => (t ?? '').replace(/\s+/g, ' ').trim()
    const lis = [...document.querySelectorAll('main section ul > li')]
    return {
      contador: norm(document.querySelector('main section span.text-xs')?.textContent),
      filas: lis.map((li) => ({
        puntos: li.querySelectorAll('span.rounded-full.h-2').length,
        conAlumnoCoincidente: !!li.querySelector('p.text-accent'),
        cuentaAlumnos: norm(li.querySelector('p.text-text-secondary')?.textContent).replace(/^.*·\s*/, ''),
        huella: huella(norm(li.innerText)),
      })),
    }
  })
}

// Estadísticas de los datos (solo números) para saber qué casos límite cubre la muestra
async function estadisticas(page, ruta) {
  return page.evaluate(async (ruta) => {
    const entrada = performance.getEntriesByType('resource').find((e) => /\/(clientes|prospectos)(\?|$)/.test(new URL(e.name).pathname + new URL(e.name).search) && !e.name.includes('localhost:5173'))
    if (!entrada) return null
    const base = new URL(entrada.name).origin
    const r = await fetch(base + ruta, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } })
    if (!r.ok) return null
    const items = (await r.json()) ?? []
    const porTutor = new Map()
    let sinTutor = 0
    for (const i of items) {
      if (!i.tutor_id) {
        sinTutor++
        continue
      }
      const g = porTutor.get(i.tutor_id) ?? { nombres: new Set(), telefonos: new Set(), n: 0 }
      g.nombres.add(i.nombre_tutor)
      g.telefonos.add(i.telefono_tutor)
      g.n++
      porTutor.set(i.tutor_id, g)
    }
    return {
      items: items.length,
      sinTutor,
      tutores: porTutor.size,
      tutoresConVariosAlumnos: [...porTutor.values()].filter((g) => g.n > 1).length,
      tutoresConNombresDistintos: [...porTutor.values()].filter((g) => g.nombres.size > 1).length,
      tutoresConTelefonosDistintos: [...porTutor.values()].filter((g) => g.telefonos.size > 1).length,
    }
  }, ruta)
}

async function escribir(page, placeholder, texto) {
  await page.getByPlaceholder(placeholder).fill(texto)
  await page.waitForTimeout(500)
}

async function lista(page, ir, H1, ruta, titulo, rutaApi) {
  const salida = {}
  await ir(page, ruta, H1(titulo))
  await page.locator(TARJETA).first().waitFor({ state: 'visible', timeout: 15000 })
  salida.datos = await estadisticas(page, rutaApi)

  const sinFiltro = await volcarTarjetas(page)
  salida.sinBusqueda = sinFiltro

  // Consultas sacadas de los datos reales (en memoria; no se guardan en el JSON)
  const t = await page.evaluate(() => {
    const norm = (x) => (x ?? '').replace(/\s+/g, ' ').trim()
    const tarjetas = [...document.querySelectorAll('main .glass.cursor-pointer')].map((c) => ({
      titulo: norm(c.querySelector('p.font-semibold')?.childNodes[0]?.textContent),
      sub: norm(c.querySelector('p.font-semibold')?.nextElementSibling?.textContent),
      tel: norm(c.querySelector('div.flex-wrap p.text-sm')?.textContent),
    }))
    return tarjetas
  })
  const alumno = t.find((x) => x.titulo)?.titulo
  const tutores = [...new Set(t.map((x) => x.sub.replace(/^Tutor:\s*/, '')).filter((s) => s && !s.startsWith('Registro')))]
  const consultas = {
    letraA: 'a',
    unaLetraE: 'e',
    alumno,
    tutor1: tutores[0],
    tutor2: tutores[1],
    telefono: t.find((x) => x.tel)?.tel,
    parteDeApellido: alumno?.split(' ')[1],
    mayusculasYAcentos: alumno ? alumno.toUpperCase() : undefined,
    sinResultados: 'zzzqqq',
  }
  salida.consultas = {}
  for (const [nombre, q] of Object.entries(consultas)) {
    if (!q) {
      salida.consultas[nombre] = { omitida: true }
      continue
    }
    await escribir(page, BUSCADOR_LISTA, q)
    salida.consultas[nombre] = await volcarTarjetas(page)
  }
  return salida
}

async function familias(page, ir, H1) {
  const salida = {}
  await ir(page, '/familias', H1('Familias'))
  const botones = page.locator('main section ul button')
  await botones.first().waitFor({ state: 'visible', timeout: 15000 })
  salida.sinBusqueda = await volcarFamilias(page)

  const leer = async (i) => {
    await botones.nth(i).click()
    await page.waitForTimeout(300)
    return page.evaluate(() => ({
      alumno: (document.querySelector('main ul.mt-2 li p')?.textContent ?? '').trim(),
      tutor: (document.querySelector('main .glass p.font-semibold')?.textContent ?? '').trim(),
      tel: (document.querySelector('main .glass p.text-xs.text-text-secondary:not(:first-child)')?.textContent ?? '').trim(),
    }))
  }
  const A = await leer(0)
  const consultas = { letraA: 'a', unaLetraE: 'e', alumno: A.alumno, tutor: A.tutor, mayusculasYAcentos: A.alumno.toUpperCase(), sinResultados: 'zzzqqq' }
  salida.consultas = {}
  for (const [nombre, q] of Object.entries(consultas)) {
    await escribir(page, BUSCADOR_FAMILIAS, q)
    salida.consultas[nombre] = await volcarFamilias(page)
  }
  return salida
}

export async function probar({ page, ir, H1 }) {
  return {
    clientes: await lista(page, ir, H1, '/clientes', 'Clientes', '/clientes?estatus=activo'),
    prospectos: await lista(page, ir, H1, '/prospectos', 'Prospectos', '/prospectos'),
    familias: await familias(page, ir, H1),
  }
}
