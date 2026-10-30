import { createRouter, createWebHistory } from 'vue-router'

import type { Permiso } from '@/compartido/sesion/tipos'
import { useSesionStore } from '@/compartido/sesion/sesionStore'

declare module 'vue-router' {
  interface RouteMeta {
    /** Se puede abrir sin iniciar sesión. */
    publica?: boolean
    /** Necesita una cafetería elegida (X-Cafeteria-Id). */
    requiereCafeteria?: boolean
    /** Permiso que debe tener el rol en la cafetería elegida. */
    permiso?: Permiso
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: { name: 'venta' } },
    {
      path: '/iniciar-sesion',
      name: 'iniciar-sesion',
      component: () => import('@/modulos/acceso/vistas/LoginView.vue'),
      meta: { publica: true },
    },
    {
      path: '/cafeterias',
      name: 'elegir-cafeteria',
      component: () => import('@/modulos/acceso/vistas/ElegirCafeteriaView.vue'),
    },
    {
      path: '/venta',
      name: 'venta',
      component: () => import('@/modulos/ingresos/vistas/VentaView.vue'),
      meta: { requiereCafeteria: true, permiso: 'REGISTRAR_VENTA' },
    },
    {
      path: '/ingreso-libre',
      name: 'ingreso-libre',
      component: () => import('@/modulos/ingresos/vistas/IngresoLibreView.vue'),
      meta: { requiereCafeteria: true, permiso: 'REGISTRAR_INGRESO_LIBRE' },
    },
    {
      path: '/egreso',
      name: 'egreso',
      component: () => import('@/modulos/egresos/vistas/EgresoView.vue'),
      meta: { requiereCafeteria: true, permiso: 'REGISTRAR_EGRESO' },
    },
    {
      path: '/movimientos',
      name: 'movimientos',
      component: () => import('@/modulos/movimientos/vistas/MovimientosView.vue'),
      meta: { requiereCafeteria: true },
    },
    { path: '/:pathMatch(.*)*', redirect: { name: 'venta' } },
  ],
})

/**
 * Guardas: sin sesión → iniciar sesión; sin cafetería → elegirla; sin permiso → otra pantalla.
 * Ocultar pantallas no es seguridad: el backend vuelve a revisar el permiso en cada petición.
 */
router.beforeEach(async (destino) => {
  const sesion = useSesionStore()
  await sesion.restaurar()

  if (destino.meta.publica) return true
  if (!sesion.autenticado) return { name: 'iniciar-sesion' }
  if (destino.meta.requiereCafeteria && !sesion.cafeteria) return { name: 'elegir-cafeteria' }
  if (destino.meta.permiso && !sesion.tienePermiso(destino.meta.permiso)) {
    // El cajero que intenta abrir una pantalla del administrador vuelve a la de venta
    return destino.name === 'venta' ? { name: 'movimientos' } : { name: 'venta' }
  }
  return true
})

export default router
