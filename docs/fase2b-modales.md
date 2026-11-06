# Fase 2, bloque 2b: ModalConfirmacion, CampoTexto, ModalBase

Solo lectura en todas las pruebas: se abre y se cancela, nunca se confirma; el navegador aborta toda petición que no sea GET. Mediciones: `docs/comportamiento/*-head.json` (HEAD, compilado con `git archive`) frente a `*-arbol.json` (árbol actual); se regeneran con `node scripts/capturas.mjs probar --prueba <dialogos|campos|modales> [--desde-head]` y se comparan con `comparar-comportamiento --prueba <nombre>`.

## Comportamiento HOY (medido en HEAD)

### Hechos comunes a todos los modales y diálogos
- **Foco**: ninguno lo mueve al abrir ni lo restaura al cerrar (el foco se queda donde estaba; al cerrar, `BODY`). Única excepción: la burbuja de `PagoConfiguracionForm`, que enfoca el campo de cuota.
- **Scroll del fondo**: ninguno lo bloquea (`overflow` de `body` y `html` siguen `visible`).
- **Esc**: solo cierra si el foco ya está dentro (todos llevan `tabindex="-1"` y un clic dentro los enfoca). Con el foco fuera, Esc no hace nada.
- **aria**: ninguno lleva `aria-modal`. Los diálogos de confirmación llevan `role="dialog"` + `aria-label`; los modales de detalle no llevan `role` ni `aria-label`.
- **Teleport**: todos a `body`, salvo el diálogo de archivar y el panel de dinero (dentro del modal de detalle).

### Tabla
| Modal | Capas | Esc | Clic fuera | Transición | role / aria |
|---|---|---|---|---|---|
| Diálogo Familias / Casos especiales | fondo `z-40` + contenedor `z-50`; diálogo `border border-border bg-panel` | foco dentro: cierra; foco fuera: nada | cierra | fondo 200 ms; diálogo 300 ms desde `scale-50` | `role="dialog"`, `aria-label`, `tabindex=-1` |
| Cliente / Pago / Prospecto | una capa `z-50 … bg-black/60` | foco dentro: cierra (Cliente y Prospecto también cambian la URL) | cierra | fondo 200/150 ms; tarjeta `appear` desde `scale-95` | sin role/aria, `tabindex=-1` |
| ConductorPerfil / Parada | una capa `z-50 … bg-black/40` + blur | igual | cierra | igual | sin role/aria, `tabindex=-1` |
| ListaEstatus | dos capas: fondo `z-50` y contenedor `z-51` (panel `bg-panel border`) | foco dentro (p. ej. buscador): cierra | cierra | panel desde `translate-y-4` | sin role/aria |
| **Diálogo de archivar** (dentro de Cliente) | fondo `z-40` + contenedor `z-50`, panel `glass … overflow-y-auto`, sin `tabindex` | **cierra TODO el modal de detalle** (sin handler propio; el evento sube) | cierra solo el diálogo | 300 ms desde `scale-50` | `role="dialog"`, `aria-label="Archivar alumno"` |

## Qué se migró
### ModalConfirmacion (`src/shared/ui/ModalConfirmacion.vue`)
- **Reemplazó**: el diálogo de confirmación de `FamiliasView` y el de `CasosEspecialesView` (idénticos). Props: `abierto` (fondo), `listo` (condición extra del diálogo: Familias `!!familia`; Casos `!!alumno && montoNumero !== null`), `etiqueta`; evento `cerrar`.
- **Conserva**: Teleport a body, `z-40`/`z-50`, clases, Esc solo con foco dentro, clic en fondo cierra, sin foco ni bloqueo de scroll, transiciones, `role`, `aria-label`, `tabindex=-1`.
- **Prueba** (`dialogos`): 200 observaciones, 0 difieren.
- **Separados (y por qué)**:
  - Diálogo de archivar de `ClienteDetalleModal`: superficie `glass` con scroll interno, sin `tabindex` ni handler de Esc (el Esc cierra todo el modal), anidado dentro del Teleport del modal. Unificarlo cambiaría el Esc.
  - Configurar cuota (`PagoConfiguracionForm`): `z-[60]`, origen de la transición en la burbuja, enfoca un campo al abrir.
  - Panel de dinero (`ClienteDineroPanel`): `absolute` dentro del modal, otro origen de transición.
  - Confirmaciones en línea (descartar/convertir en Prospecto, anular recibo, deuda al reincorporar): no son diálogos superpuestos.

### CampoTexto (`src/shared/ui/CampoTexto.vue`)
- **Reemplazó**: los campos de `LoginView` (2), `FamiliasView` (4) y `CasosEspecialesView` (2), con sus constantes `CLASES_BASE_CAMPO` y `clasesCampo`.
- **Props**: `id`, `etiqueta`, `tamEtiqueta` (`sm` en Login, `xs` en el resto), `type`, `inputmode`, `autocomplete`, `maxlength`, `placeholder`, `invalido`, `mensaje`; `v-model`; evento `blur`. Conserva `id`/`for`, `autocomplete`, `inputmode`, la clase de borde de error y `novalidate` (sigue en el `<form>`). La condición de error la sigue calculando cada pantalla.
- **Prueba** (`campos`, atributos y clases de cada formulario vacío, con errores y rellenado): 725 observaciones, 0 difieren.
- **Separados**: `RegistroPublicoView` (otro estilo: sin `for`, solo `border-danger`), `ClienteEditarForm` y `ProspectoEditarForm` (sin mensajes de error propios, solo `required` nativo), y `AbonoFamiliaForm`/`PagoConfiguracionForm`/`PagoDetalleModal` (`clasesCampo` sin estado de error ni etiqueta con `for`).

### ModalBase (`src/shared/ui/ModalBase.vue`)
- **Reemplazó** el cascarón de `ClienteDetalleModal`, `PagoDetalleModal` y `ProspectoDetalleModal`: eran equivalentes (misma capa, mismo fondo, mismo Esc, mismo clic fuera, misma transición); solo cambia la tarjeta, que va en el slot. Props: `abierto`; evento `cerrar`.
- **Prueba** (`modales`: estructura, capas, Esc con foco fuera y dentro, clic fuera, foco, scroll, clases de la transición, y el diálogo de archivar dentro de Cliente): 484 observaciones, 0 difieren.
- **Separados (y por qué)**:
  - `ConductorPerfilModal` y `ParadaDetalleModal`: solo difieren en el fondo (`bg-black/40` + blur, parametrizable con una prop), pero su raíz lleva el atributo `data-v-…` de sus estilos con alcance y desaparecería al mover el cascarón. No es "mismo DOM"; pendiente de tu visto bueno.
  - `ListaEstatusModal`: dos capas (`z-50` y `z-51`) y panel distinto.
  - `VisorCaptura`: capa `z-[70]`, `bg-black/80`, imagen que crece desde `scale-90`.

## Estados de captura añadidos (base regrabada desde HEAD, 140 imágenes)
`clientes-dinero`, `clientes-archivar`, `clientes-archivar-otro`, `prospectos-descartar-confirmar`, `prospectos-convertir-confirmar`, `pagos-anular-confirmar`, `pagos-detalle-abono`; más `clientes-archivado` y `pagos-configurar-cuota`, que no se pudieron capturar (no hay clientes archivados ni alumnos sin cuota en la base de datos local).
- **El formulario de abono** pide al abrirse una vista previa (POST con `simular:true`; la API la calcula sin guardar nada, verificado en `internal/abonos/servicio.go`). También se aborta: se cuenta aparte y esa captura muestra "No se pudo calcular el reparto", igual en la base y en cada comparación.
- **La reincorporación con deuda** solo aparece tras una respuesta 409 del servidor a una escritura: no se puede capturar sin confirmar.

## Parámetros de las comparaciones
Umbral pixelmatch 0.01, tolerancia 50 px por imagen. La comparación de comportamiento ignora el atributo `data-v-<hash>`, que cambia con la ruta de la carpeta de compilación aunque el código sea el mismo.

## Verificación
- `vue-tsc --noEmit` y `npm run build` tras cada pantalla; linter sin `--fix`: oxlint 0, eslint los 2 errores de la línea base.
- Sensibilidad de las pruebas de comportamiento (cambios deliberados, restaurados): `z-index` y el Esc de `ModalConfirmacion`; `z-index` y la escala de entrada de `ModalBase`. En ambos casos se detectaron.
- Capturas: dos comparaciones completas seguidas contra la base, 140 imágenes, 0 diferencias.
