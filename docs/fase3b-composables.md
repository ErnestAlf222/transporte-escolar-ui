# Fase 3, bloque 3b: useFamilias, useOpcionesEscuela, useCamposTocados

Sin commits (HEAD sigue en f53da0b). Una pantalla por vez con `vue-tsc`, `build` y `capturas --solo` (0 diferencias en clientes, prospectos, registro, familias y casos-especiales).

## 1. Agrupación por tutor: cómo agrupa HOY cada pantalla
| | Clientes | Prospectos | Familias |
|---|---|---|---|
| Clave | `t-${tutor_id}` o `c-${id}` | `t-${tutor_id}` o `a-${id}` | `tutor_id` (número) |
| Sin tutor | tarjeta propia | tarjeta propia | **se descarta** |
| Tutor repetido con otro nombre/teléfono | gana el del primer alumno | igual | gana el del primer alumno |
| Orden de las familias | primera aparición del tutor | igual | **por nombre del tutor** (`localeCompare` 'es') |
| Forma | `{clave, nombre_tutor, telefono_tutor, alumnos[]}` | igual | `{tutorId, tutor, telefono, alumnoBaseId, alumnos[{id,nombre,escuela,escuelaId}]}` |

`scripts/pruebas/agrupacion-unit.mjs` (copias originales literales frente a la función nueva; 10 casos límite + 300 aleatorios; salida en `docs/comportamiento/agrupacion-unit.txt`):
- Clientes: 310 conjuntos, **0 difieren**, incluida la clave. Prospectos: 310, **0 difieren**.
- Familias frente a la agrupación común: 43 iguales y 267 distintas (orden por nombre, sin tutor descartado). **No es equivalente: se queda separada.**
- Los datos reales no tienen tutores con nombres distintos (0 de 30 y 0 de 7); ese caso solo lo cubre la comparación sintética.

Unificado: `shared/utils/familias.ts` (`agruparPorTutor(items, prefijoSinTutor)`, función pura) y `shared/composables/useFamilias.ts` (familias + `alumnoPrincipal` + `coincidePorTutor`). Solo difiere el prefijo de la clave del alumno sin tutor, que es parámetro (`'c'` / `'a'`), así que la clave es idéntica a la de antes.

## 2. useOpcionesEscuela (`shared/composables/useOpcionesEscuela.ts`)
`useOpcionesEscuela(primera, listar = listarEscuelas)` devuelve `{ opciones, cargar }`. No pide nada hasta `cargar()`: cada pantalla lo llama donde ya lo hacía (mismo momento, mismo número de peticiones; verificado en `escuelas.mjs`).

| Reemplazó | Primera opción | API |
|---|---|---|
| ClientesView, ProspectosView | Todas las escuelas | `listarEscuelas` |
| ClienteEditarForm, ProspectoEditarForm | Sin escuela asignada | `listarEscuelas` |
| RegistroPublicoView | Selecciona una escuela | `listarEscuelasPublicas` (conserva su `try/catch` y `errorEscuelas`) |

Separados: PagosView (ordena y deriva de `datos.escuelas`, "Sin escuela" al final) y AsistenciasView (deriva de la lista del día, clave `sin-escuela`).

## 3. useCamposTocados (`shared/composables/useCamposTocados.ts`)
`useCamposTocados(['campo', …])` devuelve `{ tocado, tocarTodos, reiniciar }`; las plantillas siguen con `tocado.campo` y `@blur="tocado.campo = true"`.
- Reemplazó: FamiliasView (4 campos) y CasosEspecialesView (2). Mismo blur, mismo envío (marcar todos), mismo reinicio (todos a falso); cada pantalla conserva cuándo reinicia.
- Separados: LoginView (refs sueltos, sin reinicio) y RegistroPublicoView (`intentoEnviar`, sin blur).

## Pruebas de comportamiento (contra HEAD, luego contra el árbol)
| Prueba | Qué mide | HEAD vs árbol |
|---|---|---|
| `agrupacion` | orden, letra, insignia y huella de cada tarjeta (Clientes, Prospectos, lista de Familias) con 9 consultas | 858 obs., 0 difieren |
| `escuelas` | etiquetas y orden de cada selector; peticiones de datos por pantalla (cuáles, orden, cuántas) | 60 obs., 0 difieren |
| `tocados` | aviso por campo al salir, al enviar (Enter), al reiniciar | 214 obs., 0 difieren |
| `destello` (3a) | sin cambios | 89 obs., 0 difieren |

Sensibilidad (mutaciones temporales, restauradas y verificadas): clave sin tutor colapsada + alumno principal fijo → 105 diferencias en `agrupacion`; doble petición + etiqueta sin turno → 16 en `escuelas`; reiniciar y marcar-todos inoperantes → 32 en `tocados`.
Ajustes de las pruebas durante el bloque: `escuelas` leía el selector antes de que llegaran las escuelas (carrera, ahora espera); `destello` redondea a 250 ms en el Dashboard (un salto de 100 ms dio un falso positivo aislado, no reproducible).

## Verificación
`vue-tsc` y `build` en verde; oxlint 0; eslint los 2 errores de la línea base. Capturas: una comparación completa (140 imágenes, 0 diferencias). **Pendiente: la segunda comparación completa seguida**, porque la API dejó de responder (ver informe).
