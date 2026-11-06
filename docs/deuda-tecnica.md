# Deuda técnica anotada durante el refactor

(`REFACTOR_FRONTEND.md` aún no está en la raíz del repo; al añadirlo, pasar estas entradas a su sección 11.)

## Añadida en la Fase 3
- **El temporizador del destello no se limpia al desmontar** (`useDestello`). Se conserva así a propósito: hoy tampoco se limpia en Clientes, Prospectos ni Familias, y al dispararse solo escribe en un `ref` local sin efecto visible. Cambiarlo sería un cambio de ciclo de vida.
- `irA` de `useNavegacionConLoader` tampoco se cancela al desmontar (igual que antes): un `router.push` pendiente se ejecuta igual.
- **Casos especiales no reinicia los avisos de campo al elegir otro alumno** (solo tras guardar); Familias sí los reinicia al elegir otra familia. Medido en `tocados.mjs`; se conserva tal cual.
- `ClientesView` y `ProspectosView` llaman a `listarEscuelas()` sin `try/catch` (un fallo queda como promesa rechazada sin capturar). Se conserva; `RegistroPublicoView` sí lo captura.
