import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/features/auth'
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
