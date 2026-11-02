import { ref } from 'vue'
import { defineStore } from 'pinia'

import { useSesionStore } from '@/compartido/sesion/sesionStore'
import { accesoApi } from '../api/accesoApi'
import type { CafeteriaDelUsuario } from '../tipos/acceso'

/**
 * Flujo de entrada: iniciar sesión (o crear la cuenta) → ver las cafeterías de la persona → elegir una → cargar el rol.
 * Lo que queda elegido se guarda en la sesión (compartido) para que lo use todo el sistema.
 */
export const useAccesoStore = defineStore('acceso', () => {
  const sesion = useSesionStore()
  const cafeterias = ref<CafeteriaDelUsuario[]>([])

  async function iniciarSesion(correo: string, clave: string): Promise<void> {
    await sesion.iniciarSesion(correo, clave)
    await cargarCafeterias()
  }

  /**
   * Crea la cuenta y deja la sesión iniciada. Una cuenta nueva no pertenece a ninguna cafetería:
   * la lista se vacía y la pantalla de elegir cafetería la vuelve a pedir al backend.
   */
  async function registrar(nombre: string, correo: string, clave: string): Promise<void> {
    await sesion.registrar(nombre, correo, clave)
    cafeterias.value = []
  }

  async function cargarCafeterias(): Promise<void> {
    cafeterias.value = await accesoApi.misCafeterias()
  }

  async function elegirCafeteria(cafeteria: CafeteriaDelUsuario): Promise<void> {
    sesion.fijarCafeteria({ idCafeteria: cafeteria.idCafeteria, nombre: cafeteria.nombre })
    try {
      const yo = await accesoApi.yo()
      sesion.fijarUsuario({ id: yo.id, nombre: yo.nombre, rol: yo.rol, permisos: yo.permisos })
    } catch (error) {
      // Sin rol (403, red caída…) no se puede trabajar en esa cafetería: no queda elegida
      sesion.fijarCafeteria(null)
      throw error
    }
  }

  async function cerrarSesion(): Promise<void> {
    cafeterias.value = []
    await sesion.cerrarSesion()
  }

  return { cafeterias, iniciarSesion, registrar, cargarCafeterias, elegirCafeteria, cerrarSesion }
})
