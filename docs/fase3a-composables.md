# Fase 3, bloque 3a: useDestello y useNavegacionConLoader

Sin commits (HEAD sigue en f53da0b). Base de capturas regrabada desde HEAD el 2026-11-05 (140 imágenes, 8 omitidas por falta de datos, igual que antes).

## Prueba de comportamiento (escrita contra HEAD antes de migrar)
`scripts/pruebas/destello.mjs`; salida en `docs/comportamiento/destello-{head,arbol}.json`.
`node scripts/capturas.mjs probar --prueba destello [--desde-head]` y `comparar-comportamiento --prueba destello`.
Solo lectura (peticiones no-GET abortadas: 0). Los elementos con `destello` se describen por estructura, no por texto (sin datos personales en el JSON).

| Escenario | Clientes | Prospectos | Familias |
|---|---|---|---|
| Sin búsqueda | ningún destello | ningún destello | ningún destello |
| Búsqueda por alumno | botón del alumno actual en el modal, 3000 ms, se apaga | igual | el `li` del alumno coincidente, 3000 ms, se apaga |
| Búsqueda por tutor | panel `glass` del tutor en el modal, 3000 ms | igual | ninguno |
| Abrir otra con el destello en curso | el temporizador se reinicia: la segunda dura sus 3000 ms completos | igual | igual |
| Borrar búsqueda y abrir otra con destello previo | se apaga al instante | igual | igual |
| Otra pantalla | no hereda nada (estado local) | no hereda nada | — |

Dashboard (`irA`): loader de pantalla a t=0, cambio de URL a t=500 ms, una sola entrada nueva en el historial incluso con doble clic; mismo patrón desde "Ver en Pagos" y desde casos especiales. Tiempos de navegación relativos al loader, redondeados a 100 ms, con los chunks de destino precalentados; tiempos de destello redondeados a 250 ms.

- HEAD frente al árbol sin migrar: 89 observaciones, 0 difieren (la prueba es estable).
- Tras migrar: 89 observaciones, 0 difieren.
- Sensibilidad (mutaciones temporales, ya restauradas byte a byte): quitar `clearTimeout` + duración 2000 ms + pausa 300 ms → 26 diferencias, repartidas en `porAlumno`, `porTutor`, `reinicio*` y las cuatro rutas del Dashboard. Una primera versión de la prueba NO detectaba la pausa de 300 ms (redondeo de 250 ms y carga del chunk de la ruta); se afinó.

## Composables (`src/shared/composables/`)
| Composable | API | Reemplazó |
|---|---|---|
| `useDestello<T>(apagado)` | `{ resaltado, iluminar(valor, entretanto?) }` | `ClientesView`, `ProspectosView` (`'tutor' \| 'alumno' \| ''`) y `FamiliasView` (`number \| null`): estado, `DURACION_DESTELLO_MS` y temporizador |
| `useNavegacionConLoader()` | `{ irA(ruta) }` | `irA` y `PAUSA_NAVEGACION_MS` de `DashboardView` |

Constantes nuevas en `src/shared/constants/tiempo.ts`: `DURACION_DESTELLO_MS` (3000; coincide con la animación de `main.css`) y `PAUSA_NAVEGACION_MS` (500).

Orden de operaciones conservado: limpiar temporizador → asignar valor → acción (abrir detalle / elegir familia) → arrancar temporizador, que se arranca siempre, incluso sin búsqueda.

## Ciclo de vida (igual que el código actual)
- Estado local: cada llamada crea su propio `ref` y temporizador; nada compartido entre pantallas (comprobado en la prueba).
- El temporizador de destello NO se limpia al desmontar, porque hoy tampoco se limpia (al dispararse solo escribe en un `ref` local). Añadir `onScopeDispose` sería un cambio de ciclo de vida; queda anotado por si se quiere.
- `irA` tampoco se cancela al desmontar (hoy tampoco): un `router.push` pendiente se ejecuta igual.

## Lo que se dejó separado
- `esperar` en `useNavegacionConLoader`: se usa `shared/utils/tiempo.esperar` (equivalente para 500 ms: `Math.max(0, 500)`); era `new Promise(setTimeout)` en línea.
- `ProspectosView` sigue con su `new Promise(setTimeout)` de reconexión (no es navegación; candidata a `esperar` si se aprueba).
- Los modales de detalle (`ClienteDetalleModal`, `ProspectoDetalleModal`) no cambian: reciben `resaltar` por prop como antes.
- El `RouterLink` sin usar de `DashboardView` (error de eslint de la línea base) se deja para la Fase 6.

## Verificación
`vue-tsc --noEmit` y `npm run build` en verde; oxlint 0; eslint los mismos 2 errores de la línea base. Capturas: `--solo` por pantalla migrada (clientes, prospectos, familias, dashboard) sin diferencias, y dos comparaciones completas seguidas: 140 imágenes, 0 diferencias.
