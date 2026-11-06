// Mapa de la Fase 4: ruta actual (relativa a src/) -> ruta nueva, y en qué paso se mueve.
// Lo usan scripts/verificar-arquitectura.mjs (zona lógica de cada archivo) y scripts/arquitectura/mover.mjs.
//   paso 2: shared   paso 3: features pequeños   paso 4: features grandes + index.ts   paso 5: app/

const f = (feature, sub, nombre) => `features/${feature}/${sub}/${nombre}`

// [origen, destino, paso]
export const MOVIMIENTOS = [
  // ---- paso 2: shared
  ['api/http.ts', 'shared/api/http.ts', 2],
  ['api/eventos.ts', 'shared/api/eventos.ts', 2],
  ['api/escuelas.ts', 'shared/api/escuelas.ts', 2],
  ['api/configuracion.ts', 'shared/api/configuracion.ts', 2],
  ['types/escuela.ts', 'shared/types/escuela.ts', 2],
  ['types/configuracion.ts', 'shared/types/configuracion.ts', 2],
  ['stores/navegacion.ts', 'shared/stores/navegacion.ts', 2],
  ['composables/useTema.ts', 'shared/composables/useTema.ts', 2],
  ['composables/useConfiguracion.ts', 'shared/composables/useConfiguracion.ts', 2],
  ['composables/useConsultaTelefono.ts', 'shared/composables/useConsultaTelefono.ts', 2],
  ...['busqueda', 'escuelas', 'fecha', 'moneda', 'orden', 'semana', 'servicio', 'spritesVan', 'telefono'].map(
    (n) => [`utils/${n}.ts`, `shared/utils/${n}.ts`, 2],
  ),
  ...['Spinner', 'SinResultados', 'DropdownSelect', 'SelectorSemana', 'ServicioEtiqueta', 'VisorCaptura', 'BotonScroll', 'LoaderVan', 'LoaderVanJuego'].map(
    (n) => [`components/${n}.vue`, `shared/ui/${n}.vue`, 2],
  ),
  ['components/icons/WhatsappIcon.vue', 'shared/ui/icons/WhatsappIcon.vue', 2],
  ['components/icons/TelegramIcon.vue', 'shared/ui/icons/TelegramIcon.vue', 2],

  // ---- paso 3: features pequeños (auth y casos-especiales llevan index.ts)
  ['views/LoginView.vue', f('auth', 'views', 'LoginView.vue'), 3],
  ['stores/auth.ts', f('auth', 'stores', 'auth.ts'), 3],
  ['views/CasosEspecialesView.vue', f('casos-especiales', 'views', 'CasosEspecialesView.vue'), 3],
  ['api/casos-especiales.ts', f('casos-especiales', 'api', 'casos-especiales.ts'), 3],
  ['types/caso-especial.ts', f('casos-especiales', 'types', 'caso-especial.ts'), 3],
  ['views/AsistenciasView.vue', f('asistencias', 'views', 'AsistenciasView.vue'), 3],
  ['api/asistencias.ts', f('asistencias', 'api', 'asistencias.ts'), 3],
  ['types/asistencia.ts', f('asistencias', 'types', 'asistencia.ts'), 3],
  ['views/FamiliasView.vue', f('familias', 'views', 'FamiliasView.vue'), 3],
  ['views/AparienciaView.vue', f('apariencia', 'views', 'AparienciaView.vue'), 3],
  ['components/SelectorColor.vue', f('apariencia', 'components', 'SelectorColor.vue'), 3],
  ['views/RegistroPublicoView.vue', f('registro-publico', 'views', 'RegistroPublicoView.vue'), 3],
  ['api/registro-publico.ts', f('registro-publico', 'api', 'registro-publico.ts'), 3],
  ['types/registro-publico.ts', f('registro-publico', 'types', 'registro-publico.ts'), 3],

  // ---- paso 4: features grandes
  ['views/ClientesView.vue', f('clientes', 'views', 'ClientesView.vue'), 4],
  ['components/ClienteDetalleModal.vue', f('clientes', 'components', 'ClienteDetalleModal.vue'), 4],
  ['components/ClienteEditarForm.vue', f('clientes', 'components', 'ClienteEditarForm.vue'), 4],
  ['components/ClienteDineroPanel.vue', f('clientes', 'components', 'ClienteDineroPanel.vue'), 4],
  ['api/clientes.ts', f('clientes', 'api', 'clientes.ts'), 4],
  ['types/cliente.ts', f('clientes', 'types', 'cliente.ts'), 4],
  ['views/ProspectosView.vue', f('prospectos', 'views', 'ProspectosView.vue'), 4],
  ['components/ProspectoDetalleModal.vue', f('prospectos', 'components', 'ProspectoDetalleModal.vue'), 4],
  ['components/ProspectoEditarForm.vue', f('prospectos', 'components', 'ProspectoEditarForm.vue'), 4],
  ['api/prospectos.ts', f('prospectos', 'api', 'prospectos.ts'), 4],
  ['types/prospecto.ts', f('prospectos', 'types', 'prospecto.ts'), 4],
  ['views/PagosView.vue', f('pagos', 'views', 'PagosView.vue'), 4],
  ['components/PagoDetalleModal.vue', f('pagos', 'components', 'PagoDetalleModal.vue'), 4],
  ['components/PagoConfiguracionForm.vue', f('pagos', 'components', 'PagoConfiguracionForm.vue'), 4],
  ['components/AbonoFamiliaForm.vue', f('pagos', 'components', 'AbonoFamiliaForm.vue'), 4],
  ['components/RecibosSemana.vue', f('pagos', 'components', 'RecibosSemana.vue'), 4],
  ['api/pagos.ts', f('pagos', 'api', 'pagos.ts'), 4],
  ['types/pago.ts', f('pagos', 'types', 'pago.ts'), 4],
  ['utils/pagos.ts', f('pagos', 'utils', 'pagos.ts'), 4],
  ['views/DashboardView.vue', f('dashboard', 'views', 'DashboardView.vue'), 4],
  ['components/ListaEstatusModal.vue', f('dashboard', 'components', 'ListaEstatusModal.vue'), 4],
  ['api/dashboard.ts', f('dashboard', 'api', 'dashboard.ts'), 4],
  ['types/dashboard.ts', f('dashboard', 'types', 'dashboard.ts'), 4],
  ['views/ConductoresView.vue', f('conductores', 'views', 'ConductoresView.vue'), 4],
  ['views/ConductorAlumnosView.vue', f('conductores', 'views', 'ConductorAlumnosView.vue'), 4],
  ['views/ConductorAgregarView.vue', f('conductores', 'views', 'ConductorAgregarView.vue'), 4],
  ['components/ConductorPerfilModal.vue', f('conductores', 'components', 'ConductorPerfilModal.vue'), 4],
  ['components/ParadaDetalleModal.vue', f('conductores', 'components', 'ParadaDetalleModal.vue'), 4],
  ['api/conductores.ts', f('conductores', 'api', 'conductores.ts'), 4],
  ['api/asignaciones.ts', f('conductores', 'api', 'asignaciones.ts'), 4],
  ['types/conductor.ts', f('conductores', 'types', 'conductor.ts'), 4],
  ['types/asignacion.ts', f('conductores', 'types', 'asignacion.ts'), 4],
  ['utils/conductores.ts', f('conductores', 'utils', 'conductores.ts'), 4],

  // ---- paso 5: app/ (main.ts y App.vue se quedan en src/)
  ['router/index.ts', 'app/router/index.ts', 5],
  ['layouts/AppLayout.vue', 'app/layouts/AppLayout.vue', 5],
]

// Archivos muertos: se quedan donde están hasta la Fase 6
export const MUERTOS = [] // (Fase 6: api/ausencias.ts, types/ausencia.ts y components/SelectorFecha.vue ya se borraron)

// Archivos que se quedan en src/ por decisión
export const RAIZ = ['main.ts', 'App.vue', 'env.d.ts']

// Aristas aprobadas entre features (desde -> hacia)
export const ARISTAS_APROBADAS = {
  clientes: ['auth'],
  pagos: ['clientes', 'auth'],
  familias: ['clientes'],
  'casos-especiales': ['clientes'],
  dashboard: ['pagos', 'casos-especiales'],
}

// Features que exponen index.ts (los demás no lo necesitan: nadie los importa desde fuera)
export const FEATURES_CON_INDEX = ['clientes', 'pagos', 'casos-especiales', 'auth']
