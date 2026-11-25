import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/features/auth'
import { usePortalStore } from '@/features/portal-cliente'
import {
  NOMBRE_RUTA_PORTAL_ACCESO,
  NOMBRE_RUTA_PORTAL_INICIO,
  RUTA_PORTAL_ACCESO,
  RUTA_PORTAL_INICIO,
} from '@/features/portal-cliente/constants/portal'
import { NOMBRE_RUTA_PORTAL_PERFIL, RUTA_PORTAL_PERFIL } from '@/features/portal-cliente/constants/perfil'
import { useNavegacionStore } from '@/shared/stores/navegacion'

// Solo cuenta como "cambio de sección" el primer segmento de la ruta (clientes, prospectos, etc.),
// no los sub-cambios dentro de la misma sección (ej. abrir/cerrar el modal de detalle de un cliente)
function seccionBase(path: string): string {
  return path.split('/').filter(Boolean)[0] ?? ''
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/features/auth/views/LoginView.vue'),
    },
    {
      path: '/recuperar-contrasena',
      name: 'recuperar-contrasena',
      meta: { soloSinSesion: true },
      component: () => import('@/features/auth/views/RecuperarContrasenaView.vue'),
    },
    {
      path: '/nueva-contrasena',
      name: 'nueva-contrasena',
      meta: { soloSinSesion: true },
      component: () => import('@/features/auth/views/NuevaContrasenaView.vue'),
    },
    {
      path: '/registro',
      name: 'registro-publico',
      component: () => import('@/features/registro-publico/views/RegistroPublicoView.vue'),
    },
    {
      path: RUTA_PORTAL_ACCESO,
      name: NOMBRE_RUTA_PORTAL_ACCESO,
      meta: { portalSoloSinSesion: true },
      component: () => import('@/features/portal-cliente/views/PortalAccesoView.vue'),
    },
    {
      path: RUTA_PORTAL_INICIO,
      name: NOMBRE_RUTA_PORTAL_INICIO,
      meta: { requierePortal: true },
      component: () => import('@/features/portal-cliente/views/PortalInicioView.vue'),
    },
    {
      path: RUTA_PORTAL_PERFIL,
      name: NOMBRE_RUTA_PORTAL_PERFIL,
      meta: { requierePortal: true },
      component: () => import('@/features/portal-cliente/views/PortalPerfilView.vue'),
    },
    {
      path: '/',
      component: () => import('@/app/layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/features/dashboard/views/DashboardView.vue'),
        },
        {
          path: 'clientes',
          name: 'clientes',
          component: () => import('@/features/clientes/views/ClientesView.vue'),
        },
        {
          path: 'clientes/:id',
          name: 'cliente-detalle',
          component: () => import('@/features/clientes/views/ClientesView.vue'),
        },
        {
          path: 'clientes/:id/editar',
          name: 'cliente-editar',
          component: () => import('@/features/clientes/views/ClientesView.vue'),
        },
        {
          path: 'prospectos',
          name: 'prospectos',
          component: () => import('@/features/prospectos/views/ProspectosView.vue'),
        },
        {
          path: 'prospectos/:id',
          name: 'prospecto-detalle',
          component: () => import('@/features/prospectos/views/ProspectosView.vue'),
        },
        {
          path: 'pagos',
          name: 'pagos',
          component: () => import('@/features/pagos/views/PagosView.vue'),
        },
        {
          path: 'conductores',
          name: 'conductores',
          component: () => import('@/features/conductores/views/ConductoresView.vue'),
        },
        {
          path: 'conductores/:id',
          name: 'conductor-detalle',
          component: () => import('@/features/conductores/views/ConductoresView.vue'),
        },
        {
          path: 'conductores/:id/alumnos',
          name: 'conductor-alumnos',
          component: () => import('@/features/conductores/views/ConductorAlumnosView.vue'),
        },
        {
          path: 'conductores/:id/agregar',
          name: 'conductor-agregar',
          component: () => import('@/features/conductores/views/ConductorAgregarView.vue'),
        },
        {
          path: 'apariencia',
          name: 'apariencia',
          component: () => import('@/features/apariencia/views/AparienciaView.vue'),
        },
        {
          path: 'familias',
          name: 'familias',
          component: () => import('@/features/familias/views/FamiliasView.vue'),
        },
        {
          path: 'asistencias',
          name: 'asistencias',
          component: () => import('@/features/asistencias/views/AsistenciasView.vue'),
        },
        {
          path: 'casos-especiales',
          name: 'casos-especiales',
          component: () => import('@/features/casos-especiales/views/CasosEspecialesView.vue'),
        },
      ],
    },
  ],
})

router.beforeEach((to, from) => {
  // El portal tiene su propia sesión: no mira la del admin
  if (to.meta.requierePortal || to.meta.portalSoloSinSesion) {
    const portal = usePortalStore()
    if (to.meta.requierePortal && !portal.estaAutenticado) return { name: NOMBRE_RUTA_PORTAL_ACCESO }
    if (to.meta.portalSoloSinSesion && portal.estaAutenticado) return { name: NOMBRE_RUTA_PORTAL_INICIO }
    return
  }

  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if ((to.name === 'login' || to.meta.soloSinSesion) && auth.isAuthenticated) {
    return { name: 'home' }
  }

  if (seccionBase(to.path) !== seccionBase(from.path)) {
    useNavegacionStore().mostrar()
  }
})

router.afterEach(() => {
  useNavegacionStore().ocultar()
})

export default router
