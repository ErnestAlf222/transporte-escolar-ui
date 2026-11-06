# Fase 2, bloque 2a: BuscadorInput, EncabezadoFijo, EncabezadoEscuela

Una pantalla por vez; tras cada una: `vue-tsc --noEmit`, `npm run build` y capturas `--solo` (0 diferencias). Al final, dos comparaciones completas seguidas (112 imágenes, 0 diferencias, umbral 0.01 / 50 px) y linter sin `--fix` (oxlint 0; eslint los 2 errores de la línea base).

## Componentes (`src/shared/ui/`)
| Componente | Props | Reemplazó |
|---|---|---|
| `BuscadorInput` | `v-model`, `placeholder`, `fondo` (`panel`/`panel/40`/`panel-2`), `conFoco`, `etiquetaLimpiar`, `limpiarConEsc`; `class` va al contenedor | Clientes, Prospectos, Pagos, Familias, Asistencias, Casos especiales, `ListaEstatusModal` |
| `EncabezadoFijo` | `capa` (20/25), `relleno` (3/4); extras por `class` | Clientes, Prospectos, Pagos, Asistencias, ConductorAlumnos, ConductorAgregar |
| `EncabezadoEscuela` | `color` opcional (sin él: `bg-accent/15 text-accent`) | Pagos, Asistencias |

## Variantes que se parametrizaron (no se unificaron en silencio)
- Fondo del campo `bg-panel` / `bg-panel/40` / `bg-panel-2`; anillo de foco presente o no; `aria-label` del botón de borrar ausente (Clientes, Prospectos) / "Limpiar búsqueda" (Pagos) / "Borrar búsqueda"; solo Pagos borra con Esc y devuelve el foco; contenedor distinto por `class`.
- Encabezado: `z-20` o `z-25`, `pb-3` o `pb-4`, diseño interno por `class` (`mb-2 flex flex-wrap …`, `space-y-4`).
- Rótulo de escuela: acento fijo (Pagos) o color de escuela (Asistencias).

## Se dejaron separadas
- Buscador de `ConductorAgregarView`: diseño distinto (cápsula `glass-plano rounded-full`, icono en flujo, `inputmode="search"`).
- Rótulo de grupo de `ListaEstatusModal`: `<p>` con `flex items-center gap-2`, punto de color, sin `tracking-wide`.

## Comportamiento (comprobado en navegador, solo lectura, 12/12)
- Pagos: X con `aria-label="Limpiar búsqueda"`, borra y devuelve el foco al campo; Esc dentro del campo borra y mantiene el foco.
- Clientes: X sin `aria-label`, borra y no enfoca el campo; Esc no borra.
- Dashboard (modal): "Borrar búsqueda" presente; Esc dentro del buscador sigue cerrando el modal (el evento sube).

## Notas
- El orden de las clases dentro del atributo `class` cambia (el componente pone las suyas primero); el conjunto es el mismo y las capturas coinciden.
- Prospectos y Familias no tienen captura con texto escrito: la X no se ve en la base de esas dos; es el mismo componente que en Clientes (sí capturado con X visible).
