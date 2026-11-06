# Fase 1: utilidades puras

Sin commits. Cada duplicado se reemplazó por separado y, después de cada uno, se corrió `vue-tsc --noEmit` y `npm run build` (ambos en verde).

## Comparación escrita de versiones antiguas vs nuevas

Las versiones antiguas se copiaron tal cual del repo a un script de comparación y se ejecutaron junto a las nuevas con las mismas entradas (vacíos, `undefined`/`null`, espacios, acentos, mayúsculas, apellidos opcionales, estados HTTP 200/400/404/409/500 con cuerpo texto/vacío/objeto/ausente, errores que no son de axios, búsquedas por alumno, tutor y teléfono). Sin librerías de prueba nuevas: es un script suelto de Node fuera del repo. Resultado: **786 comparaciones, 0 diferencias** en lo unificado.

| Grupo | Casos | Difieren |
|---|---|---|
| `inicialesDeTexto` vs las 4 copias | 60 | 0 |
| `nombreCompleto` vs ClienteDetalleModal / ProspectoDetalleModal | 11 | 0 |
| `nombreCompletoEstricto` vs ClientesView / FamiliasView / CasosEspecialesView | 10 | 0 (incluye los casos que lanzan TypeError: lanzan igual) |
| `inicialesAlumno` vs los 2 modales | 10 | 0 |
| `mensajeDeError` vs las 4 copias | 65 | 0 |
| `mensajeDeEstado(…, 400, …)` vs 3 sitios | 65 | 0 |
| `mensajeDeEstado(…, 409, …)` vs 2 sitios | 65 | 0 |
| `textoDeEstado(…, 409)` vs PagoDetalleModal (condición y texto) | 71 | 0 |
| `esEstadoConTexto(…, 409, 'ya se registró')` vs AbonoFamiliaForm | 65 | 0 |
| `esEstado(…, 409)` vs RecibosSemana | 65 | 0 |
| `filtrarPorAlumnoOTutor` vs Clientes y vs Prospectos (23 consultas c/u, mismo orden de resultados; sin búsqueda devuelve la misma lista) | 69 | 0 |
| `coincidePorAlumno` vs Clientes y Prospectos | 230 | 0 |

## Funciones nuevas

`src/shared/utils/nombres.ts`
- `inicialesDeTexto(texto)`: reemplaza `inicialesTexto` (ClientesView, ProspectosView), `iniciales` (FamiliasView, ListaEstatusModal).
- `nombreCompleto(alumno)`: reemplaza `nombreCompleto` de ClienteDetalleModal y ProspectoDetalleModal. Tolera apellidos null/undefined.
- `nombreCompletoEstricto(alumno)`: reemplaza `nombreAlumno` (ClientesView, CasosEspecialesView) y `nombreCompleto` (FamiliasView). Lanza TypeError con null/undefined, como las originales.
- `inicialesAlumno(alumno)`: reemplaza `inicialesAlumno` de ClienteDetalleModal y ProspectoDetalleModal.

`src/shared/utils/errores.ts`
- `mensajeDeError(e, respaldo)`: texto del servidor (cualquier estado, no vacío, recortado) o el respaldo propio. Sitios: AbonoFamiliaForm (`mensajeDe`), RecibosSemana, CasosEspecialesView, FamiliasView.
- `mensajeDeEstado(e, estado, respaldo)`: igual pero exige ese estado (acepta cuerpo vacío, igual que antes). Sitios con 400: ClienteDetalleModal (archivar), ClienteDineroPanel, PagoConfiguracionForm. Sitios con 409: ClienteEditarForm, ProspectoEditarForm.
- `textoDeEstado(e, estado)`: el texto o `null`; lo usa `mensajeDeEstado` y PagoDetalleModal (que además emite `resuelto` en esa rama).
- `esEstadoConTexto(e, 409, 'ya se registró')`: la comprobación del doble toque en el alta de abono (AbonoFamiliaForm), con la frase intacta.
- `esEstado(e, 409)`: el 409 de anular en RecibosSemana.
- Ningún mensaje de respaldo cambió (cada pantalla conserva el suyo).
- Se quitó `import axios` de los archivos donde dejó de usarse (AbonoFamiliaForm, RecibosSemana, CasosEspecialesView, FamiliasView, ClienteDineroPanel, PagoConfiguracionForm, ClienteEditarForm, ProspectoEditarForm, PagoDetalleModal).

`src/shared/utils/tiempo.ts`
- `PAUSA_CARGA_MS` y `esperar(ms)`: la pausa mínima de carga de Pagos. Solo PagosView los usa.

`src/utils/busqueda.ts` (se añadió al archivo existente; se mueve en la Fase 4)
- `coincidePorAlumno(busqueda, item, campos)` y `filtrarPorAlumnoOTutor(items, busqueda, campos)` + tipo `CamposDeBusqueda<T>`. Reemplazan los tres bloques repetidos en ClientesView (filtro, `alumnoPrincipal`, `coincidePorTutor`) y los de ProspectosView (filtro y la función local `coincidePorAlumno`). Mismo orden y semántica; los apellidos opcionales de Prospectos se tratan con `?? ''`.

`src/shared/constants/`
- `telefono.ts`: `LONGITUD_TELEFONO = 10` (antes en useConsultaTelefono y FamiliasView; además `utils/telefono.ts` tenía el literal `10`).
- `tiempo.ts`: `ESPERA_RECONEXION_MS = 3000` (antes copiado en ConductoresView, PagosView, ProspectosView).
- `pagos.ts`: `MAX_MENSAJE = 300` (antes copiado en AbonoFamiliaForm y PagoDetalleModal).

## Lo que se dejó separado, y por qué

| Qué | Razón |
|---|---|
| `ProspectosView.nombreAlumno` (no se unificó con `nombreCompleto`) | Difiere con `nombre_alumno` null/undefined: la original lanza TypeError, `nombreCompleto` devuelve los apellidos. Los tipos dicen que no pasa, pero la regla es no unificar si hay algún caso distinto. Se restauró tal cual. |
| `nombreCompleto` vs `nombreCompletoEstricto` | Con apellidos null/undefined el estricto lanza y el tolerante no (4 de 10 casos de muestra). Se unificaron solo las copias idénticas entre sí. |
| `ClientesView.iniciales(cliente)` y `ProspectosView.iniciales(p)` | No recortan el nombre; `inicialesAlumno` sí. Con `"  ana"/"pérez"` dan `" P"` frente a `"AP"`. Además la de Clientes lanza con apellido null. Cada una se queda como está. |
| `conductores.inicial(nombre)` | Una sola letra con `charAt(0)`: otra semántica. |
| `esperar` en ConductoresView y ConductorAlumnosView | Instrucción: en `tiempo.ts` solo la pausa de Pagos. Son copias de la misma función (sin `Math.max`, equivalente para sus constantes). Candidatas a unificar si lo apruebas. `DashboardView` y `ProspectosView` usan `new Promise(setTimeout)` en línea: Fase 3 (`useNavegacionConLoader`) / candidata. |
| `DURACION_DESTELLO_MS` (×3), temporizadores de destello | Fase 3 (`useDestello`). |
| `CLASES_BASE_CAMPO`, `clasesCampo` | Fase 2 (`CampoTexto`). |
| `MESES_POR_ANIO`/`FORMATO_MES` repetidos en SelectorFecha y SelectorSemana | `SelectorFecha` es código muerto (Fase 6). |
| El 409 con `deuda` numérica en ClienteDetalleModal | Un solo sitio, lógica distinta (lee `data.deuda`). |

## Verificación
- `vue-tsc --noEmit` y `npm run build`: en verde tras cada duplicado y al final.
- Linter sin `--fix` (oxlint y eslint, sobre una copia aparte): oxlint 0 problemas; eslint 2 errores, **los mismos 2 de la línea base** (`Spinner` multi-palabra, `RouterLink` sin usar en DashboardView). Ninguno nuevo.
- Capturas: ver el reporte de la fase (dos corridas seguidas contra la base, umbral 0.01 y tolerancia 50 px).
