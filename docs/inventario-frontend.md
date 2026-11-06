# Inventario del frontend (Fase 0)

Generado leyendo el código real el 2026-11-04. Solo lectura: no se tocó código de producción.

## 1. Estado base

| Comprobación | Resultado |
|---|---|
| `npx vue-tsc --noEmit` | exit 0, sin errores ni advertencias |
| `npm run build` (`vue-tsc --build` + `vite build`) | OK en ~1.2 s, sin advertencias (ni de chunks ni de Vite) |
| `git status` tras build | limpio (`dist/`, `*.tsbuildinfo` están en `.gitignore`) |
| Node | v24.19.0 |
| Chunk más grande | `http-*.js` 114 kB (axios), `index-*.js` 52 kB; vistas perezosas separadas (la mayor: ClientesView 42 kB) |
| Lint | `npm run lint` existe (oxlint + eslint, con `--fix`); **no se corrió** porque modifica archivos |

Nota: `npm run build` ejecuta `type-check` = `vue-tsc --build` (distinto de `--noEmit`); ambos pasan.

## 2. Rutas reales (`src/router/index.ts`)

Todas con `import()` perezoso. Solo `meta.requiresAuth: true` en el padre `/` (hereda a los hijos). No hay otro `meta`.

| path | name | componente | meta |
|---|---|---|---|
| `/login` | `login` | LoginView | — |
| `/registro` | `registro-publico` | RegistroPublicoView | — |
| `/` (layout AppLayout) | — | AppLayout | requiresAuth |
| `/` | `home` | DashboardView | (hereda) |
| `/clientes` | `clientes` | ClientesView | (hereda) |
| `/clientes/:id` | `cliente-detalle` | ClientesView | (hereda) |
| `/clientes/:id/editar` | `cliente-editar` | ClientesView | (hereda) |
| `/prospectos` | `prospectos` | ProspectosView | (hereda) |
| `/prospectos/:id` | `prospecto-detalle` | ProspectosView | (hereda) |
| `/pagos` | `pagos` | PagosView | (hereda) |
| `/conductores` | `conductores` | ConductoresView | (hereda) |
| `/conductores/:id` | `conductor-detalle` | ConductoresView | (hereda) |
| `/conductores/:id/alumnos` | `conductor-alumnos` | ConductorAlumnosView | (hereda) |
| `/conductores/:id/agregar` | `conductor-agregar` | ConductorAgregarView | (hereda) |
| `/apariencia` | `apariencia` | AparienciaView | (hereda) |
| `/familias` | `familias` | FamiliasView | (hereda) |
| `/asistencias` | `asistencias` | AsistenciasView | (hereda) |
| `/casos-especiales` | `casos-especiales` | CasosEspecialesView | (hereda) |

Guard (`beforeEach`): sin sesión + `requiresAuth` → `login`; con sesión en `login` → `home`; si cambia el primer segmento del path, `navegacion.mostrar()`. `afterEach` → `navegacion.ocultar()`.

Rutas con la misma vista (detalle/editar se resuelven por params dentro de la vista): clientes ×3, prospectos ×2, conductores ×2.

## 3. Nombres de ruta usados en el código

Por nombre (`router.push({ name })`):
- `cliente-detalle`, `clientes`, `cliente-editar` — ClientesView
- `prospecto-detalle`, `prospectos` — ProspectosView
- `conductor-detalle`, `conductores`, `conductor-alumnos` — ConductoresView
- `conductor-alumnos` — ConductorAgregarView; `conductor-detalle`, `conductor-agregar` — ConductorAlumnosView
- `login` — RegistroPublicoView (`RouterLink`), guard; `home` — guard

Por path literal (no por nombre, hay que mantener los paths):
- `router.push('/login')` — AppLayout; `router.push('/')` — LoginView
- `router.push(ruta)` — DashboardView `irA`, con rutas `/prospectos`, `/clientes` y otras definidas en datos del dashboard (revisar en Fase 1)
- `to="/apariencia"` — AppLayout (solo rol `admin`)
- Menú (`navItems` en AppLayout): `/`, `/clientes`, `/prospectos`, `/pagos`, `/casos-especiales` (hijo), `/familias`, `/asistencias`, `/conductores`
- `router.replace({ query })` — PagosView (sincroniza la URL)

Query de Pagos: `semana`, `estatus`, `escuela`, `q`, `alumno` (PagosView líneas 44-100).

## 4. Claves de `localStorage`

| Clave | Archivos |
|---|---|
| `token` | `api/http.ts` (leer/borrar en 401), `api/eventos.ts` (leer), `stores/auth.ts` (leer/escribir/borrar) |
| `tema` | `composables/useTema.ts` (escribe, constante `CLAVE`), `index.html` (script previo al pintado, lee) |
| `asistencias-escuela` | `views/AsistenciasView.vue` (constante `CLAVE_ESCUELA`) |

No hay uso de `sessionStorage`. Variable de entorno: `VITE_API_URL` (`.env`, ignorado por git).

## 5. Consumidores de `src/api`

| Archivo | Lo importan |
|---|---|
| `http.ts` | todos los demás `api/*`, `stores/auth.ts` |
| `eventos.ts` (SSE) | `api/conductores.ts`, `api/pagos.ts`, `api/prospectos.ts` |
| `asignaciones.ts` | ConductorAgregarView |
| `asistencias.ts` | AsistenciasView |
| `ausencias.ts` | **nadie** |
| `casos-especiales.ts` | CasosEspecialesView, DashboardView |
| `clientes.ts` | ClienteDetalleModal, ClienteDineroPanel, ClienteEditarForm, PagoConfiguracionForm, CasosEspecialesView, ClientesView, FamiliasView |
| `conductores.ts` | ConductorAgregarView, ConductorAlumnosView, ConductoresView |
| `configuracion.ts` | useConfiguracion, AparienciaView |
| `dashboard.ts` | DashboardView |
| `escuelas.ts` | ClienteEditarForm, ProspectoEditarForm, ClientesView, ProspectosView, RegistroPublicoView |
| `pagos.ts` | AbonoFamiliaForm, PagoDetalleModal, RecibosSemana, DashboardView, PagosView |
| `prospectos.ts` | ProspectoDetalleModal, ProspectoEditarForm, ProspectosView |
| `registro-publico.ts` | useConsultaTelefono, RegistroPublicoView |

Observaciones útiles para la Fase 4 (acoplamiento entre futuros features):
- `api/clientes` lo consumen componentes de clientes, pagos (`PagoConfiguracionForm`), casos especiales y familias → candidata a vivir en el feature `clientes` y exponerse por su `index.ts`.
- `api/escuelas` lo usan 5 consumidores de 4 features → candidata a `shared/api`.
- `DashboardView` toca `pagos`, `casos-especiales` y `dashboard`.

## 6. Candidatos a código muerto (nadie los importa)

Calculado con un grafo de imports (`from` / `import()` con alias `@/` y rutas relativas) sobre todos los `.ts`/`.vue` de `src`.

| Archivo | Evidencia |
|---|---|
| `src/api/ausencias.ts` | Sin importadores (`/ausencias` solo aparece dentro del propio archivo) |
| `src/types/ausencia.ts` | Solo lo importa `api/ausencias.ts`, que está muerto |
| `src/components/SelectorFecha.vue` | Sin importadores |

Falsos positivos descartados: `main.ts` (entrada); `types/escuela.ts` solo lo usa `api/escuelas.ts` pero ese sí está vivo.
Limitación: no detecta uso por registro global de componentes ni por strings dinámicos; ninguno de los 3 aparece en `index.html`/config. Confirmar con vue-tsc al borrar (Fase 6). **No se borró nada.**

## 7. Mapa rápido de dependencias (para planificar fases)

- `utils/busqueda`: 7 consumidores. `utils/pagos`, `utils/semana`: 6 c/u. `utils/moneda`: 6.
- `components/Spinner`: 18 consumidores; `DropdownSelect`: 8; `LoaderVan`: 7.
- `PagoDetalleModal` anida `AbonoFamiliaForm`, `PagoConfiguracionForm`, `RecibosSemana`, `VisorCaptura`, `ServicioEtiqueta`.
- `ClienteDetalleModal` anida `ClienteDineroPanel`, `ClienteEditarForm`, `ServicioEtiqueta`.
- Tipos sin importadores directos desde vistas/otros: ninguno huérfano salvo `ausencia`.

## 8. Línea base del linter (sin `--fix`, 2026-11-04)

- `npx oxlint .` → 0 problemas.
- `npx eslint .` (sin `--fix`, sin caché) → 2 errores preexistentes:
  - `src/components/Spinner.vue`: `vue/multi-word-component-names` (el nombre "Spinner" es de una sola palabra).
  - `src/views/DashboardView.vue:3`: `RouterLink` importado y sin usar (`@typescript-eslint/no-unused-vars`).
- No son nuevos del refactor. El de `DashboardView` se resuelve solo al limpiar imports (Fase 6); el de `Spinner` implica renombrar o una excepción de regla (decisión pendiente, es cambio de nombre de componente).

## 9. Grafo de imports entre features (madge + análisis propio)

- `madge --circular` (ts,vue, `tsconfig.app.json`, 85 archivos): **sin ciclos a nivel de archivo hoy**.
- Con la asignación provisional a features (script de análisis, no entra al repo), **tampoco hay ciclos entre features**. La sospecha clientes ↔ pagos **no se confirma**:
  - `pagos → clientes`: solo `PagoConfiguracionForm.vue` importa `api/clientes` y `types/cliente`.
  - `clientes → pagos`: **no existe**. `ClienteDineroPanel` y `ClienteDetalleModal` usan solo `api/clientes`.
- Aristas entre features que sí existen (todas en un solo sentido):

| Arista | Por qué |
|---|---|
| casos-especiales → clientes | `api/clientes`, `types/cliente` |
| familias → clientes | `api/clientes`, `types/cliente` |
| pagos → clientes | `PagoConfiguracionForm` (`api/clientes`, `types/cliente`) |
| dashboard → pagos | `api/pagos`, `utils/pagos`, `types/pago` (DashboardView, ListaEstatusModal) |
| dashboard → casos-especiales | `api/casos-especiales`, `types/caso-especial` |
| conductores → pagos | `ParadaDetalleModal` → `VisorCaptura` |
| familias → registro-publico | `useConsultaTelefono` |
| clientes, pagos → auth | `stores/auth` |

### Decisiones propuestas (a confirmar)
- **`api/escuelas` + `types/escuela` → `shared/api` / `shared/types`** (5 consumidores en 4 features), como pediste.
- **`api/clientes` + `types/cliente` se quedan en `features/clientes`** y se exponen por su `index.ts`. No hay ciclo, y las tres aristas entrantes (pagos, familias, casos-especiales) van todas hacia `clientes`, que solo depende de `shared` y `auth`. Moverlas a `shared` mezclaría dominio con infraestructura. Condición: `clientes` **no** debe importar nunca de `pagos`; si `ClienteDineroPanel` necesitara tipos de pago, deben salir a `shared/types`.
- `VisorCaptura` → `shared/ui` (lo usan pagos y conductores).
- `useConsultaTelefono` → `shared/composables` (lo usan familias y registro-publico).
- `utils/pagos` y `types/pago`: los usa `dashboard`; exponerlos por `features/pagos/index.ts` (o a `shared` si son puramente de presentación; decidir en Fase 4).
- `stores/auth` → `features/auth` con `index.ts`; `AppLayout` y el router lo importan por ahí.

## 10. Capturas de referencia

Ver `scripts/capturas.mjs` (cabecera con uso). Las carpetas `docs/capturas-*/` y `scripts/.estado-sesion.json` están en `.gitignore`.

## 11. Línea base visual: parámetros y validación

- **Cómo se graba:**   fuente: arbol -> C:UsersPCAppDataLocalTempcapturas-arbol-9TdFyFsrc
  /@vite/client -> HTTP 200 (index.html por respaldo de SPA, no es el cliente de Vite)

[base] capturas: 112, omitidas: 0, fallos: 0, escrituras bloqueadas: 0. HEAD () se extrae con  a una carpeta temporal, se instala con , se compila y se sirve con . Tu carpeta (node_modules, dist) no se toca. El árbol actual se compila igual (archivos versionados + nuevos no ignorados, copiados a otra carpeta temporal). Ambos builds son los que se comparan.
- **Guardas:** aborta si 5173 está ocupado en 127.0.0.1 o ::1; aborta si  devuelve el módulo del servidor de desarrollo (con preview responde 200 con el index.html por el respaldo de SPA, no 404); aborta si aparece el botón de Vue DevTools (). Un servidor de desarrollo en ::1 puede coexistir con un preview en 127.0.0.1 en Windows, de ahí las dos comprobaciones.
- **Resultado:** 112 imágenes (28 por combinación tema × tamaño), ~16 MB en  (ignorada por git). Dos comparaciones seguidas del árbol actual contra la base: 0 diferencias.
- **Comparar:** > transporte-escolar-frontend@0.0.0 capturas
> node scripts/capturas.mjs comparar (recaptura en  y compara). Mapas de diferencias en .
- **Parámetros de captura** (iguales en base y comparaciones): viewports 390×844 y 1440×900, temas dark/light vía , , , captura de página completa (modales: solo viewport), espera a que no haya loaders (, ) + fuentes + 500 ms. Sin .
- **Parámetros del diff:  por píxel y tolerancia de 50 px por imagen** (, ). Justificación:
  - Con 0.1 (valor por defecto de pixelmatch) un color casi igual (mezcla del 3 %, ≈4 niveles por canal) **no se detecta**; con 0.01 sí (765–780 px).
  - A 0.01 hay ruido real sin cambios de código, solo en modales con desenfoque: medido sobre builds, como máximo **31 px** por imagen ( móvil oscuro) y 6 px en . 50 px deja margen sobre ese ruido y sigue muy por debajo de lo que produce un cambio de color de un título (≈770 px). Umbral 0 daría 6 imágenes con falsos positivos; 0.02, 2.
  - Un cambio de tamaño de la imagen siempre se marca, sin tolerancia.
- **Prueba de sensibilidad** (sobre el build, parámetros finales; cambios temporales ya restaurados con ,  sin cambios en ):
  -  en el título de Asistencias → detectado en las 4 combinaciones (alto de página +1 px).
  - Color del título de Apariencia mezclado 3 % hacia gris → detectado en las 4 combinaciones (765–780 px).
- **Limitación:** un cambio que afecte a menos de 50 px de una imagen sin alterar su tamaño puede pasar inadvertido; ante duda,  y revisar los mapas.
- **Seguridad:** los contextos de captura abortan toda petición que no sea GET/HEAD/OPTIONS (0 bloqueadas en todas las corridas). El POST del login lo hace un contexto aparte, previo, que solo inicia sesión y guarda  (ignorado por git).
- **Estados cubiertos:** login y registro (vacío y errores), dashboard + lista por estatus, clientes (lista, sin resultados, detalle, editar), prospectos (lista, detalle), pagos (lista, detalle), familias (lista, seleccionada, errores, confirmación cancelada), asistencias, casos especiales (lista, errores, confirmación cancelada), conductores (lista, detalle, alumnos, parada, agregar), apariencia. **No cubiertos:** errores de red y listas vacías reales.
- **Dependencia de datos:** las capturas dependen de la BD local y de la fecha; para comparar, usar el mismo día (la base y la comparación se grabaron el 2026-11-04) o regrabar la base desde HEAD el mismo día.

## 12. Asignación propuesta a features (para la Fase 4, pendiente de aprobar)

| Feature | Vistas | Componentes | API / tipos / utils |
|---|---|---|---|
| **clientes** | ClientesView | ClienteDetalleModal, ClienteEditarForm, **ClienteDineroPanel** | api/clientes, types/cliente |
| **pagos** | PagosView | PagoDetalleModal, PagoConfiguracionForm, **AbonoFamiliaForm**, **RecibosSemana** | api/pagos, types/pago, utils/pagos |
| **prospectos** | ProspectosView | ProspectoDetalleModal, ProspectoEditarForm | api/prospectos, types/prospecto |
| **familias** | FamiliasView | — | (usa api/clientes y useConsultaTelefono) |
| **casos-especiales** | CasosEspecialesView | — | api/casos-especiales, types/caso-especial |
| **asistencias** | AsistenciasView | — | api/asistencias, types/asistencia |
| **conductores** | ConductoresView, ConductorAlumnosView, ConductorAgregarView | ConductorPerfilModal, ParadaDetalleModal | api/conductores, api/asignaciones, types/conductor, types/asignacion, utils/conductores |
| **dashboard** | DashboardView | ListaEstatusModal | api/dashboard, types/dashboard |
| **apariencia** | AparienciaView | SelectorColor | api/configuracion, types/configuracion |
| **auth** | LoginView | — | stores/auth |
| **registro-publico** | RegistroPublicoView | — | api/registro-publico, types/registro-publico |
| **shared/ui** | — | Spinner, SinResultados, DropdownSelect, SelectorSemana, SelectorFecha(muerto), ServicioEtiqueta, VisorCaptura, BotonScroll, LoaderVan, LoaderVanJuego, icons/* | — |
| **shared (resto)** | — | — | api/http, api/eventos, **api/escuelas + types/escuela**, composables useTema/useConfiguracion/**useConsultaTelefono**, stores/navegacion, utils: moneda, fecha, semana, telefono, busqueda, orden, escuelas, servicio, spritesVan |

### Dependencias entre features (solo entradas por `index.ts`)

| Desde → hacia | Qué usa | Sentido |
|---|---|---|
| pagos → clientes | `PagoConfiguracionForm` llama a `configurarCliente` (api/clientes) y usa tipos de cliente | único |
| familias → clientes | api/clientes, types/cliente | único |
| casos-especiales → clientes | api/clientes, types/cliente | único |
| dashboard → pagos | api/pagos, utils/pagos, types/pago | único |
| dashboard → casos-especiales | api/casos-especiales, types/caso-especial | único |
| clientes, pagos → auth | stores/auth | único |
| todos → shared | ui, utils, composables | — |
| (ninguna) clientes → pagos | **no existe** | — |

Grafo de features: `dashboard → {pagos, casos-especiales}`, `{pagos, familias, casos-especiales} → clientes`, `{clientes, pagos} → auth`. **Acíclico**.

### Dónde caen los tres componentes que preguntaste
- **ClienteDineroPanel → clientes.** Importa solo `api/clientes` y `types/cliente` (verificado). Cuenta de la familia/cliente, no de un pago semanal.
- **AbonoFamiliaForm → pagos.** Usa `api/pagos` (`registrarAbono`) y `types/pago`.
- **RecibosSemana → pagos.** Usa `api/pagos` (`verRecibos`, `anularAbono`) y `types/pago`.
- **Cuidado (único punto que podría crear un ciclo):** `PagoConfiguracionForm` toca ambos mundos (`api/clientes` + `AlumnoPagoSemana` de pago). Debe quedarse en **pagos** (da `pagos → clientes`). Si se moviera a clientes, tendría que importar `types/pago` y se crearía `clientes → pagos`, cerrando el ciclo. Regla para la Fase 4: ningún archivo de `clientes` importa de `pagos`.
- `VisorCaptura` pasa a `shared/ui` (lo usan pagos y conductores); evita `conductores → pagos`.
- `utils/pagos` + `types/pago` los usa dashboard: se exponen por `features/pagos/index.ts`.
