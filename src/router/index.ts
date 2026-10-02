import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNavegacionStore } from '@/stores/navegacion'

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
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/registro',
      name: 'registro-publico',
      component: () => import('@/views/RegistroPublicoView.vue'),
    },
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/DashboardView.vue'),
        },
        {
          path: 'clientes',
          name: 'clientes',
          component: () => import('@/views/ClientesView.vue'),
        },
        {
          path: 'clientes/:id',
          name: 'cliente-detalle',
          component: () => import('@/views/ClientesView.vue'),
        },
        {
          path: 'clientes/:id/editar',
          name: 'cliente-editar',
          component: () => import('@/views/ClientesView.vue'),
        },
        {
          path: 'prospectos',
          name: 'prospectos',
          component: () => import('@/views/ProspectosView.vue'),
        },
        {
          path: 'prospectos/:id',
          name: 'prospecto-detalle',
          component: () => import('@/views/ProspectosView.vue'),
        },
        {
          path: 'pagos',
          name: 'pagos',
          component: () => import('@/views/PagosView.vue'),
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

  if (to.name === 'login' && auth.isAuthenticated) {
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
