import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import {
  cerrarSesionFirebase,
  esperarUsuarioInicial,
  iniciarSesionFirebase,
  obtenerToken,
} from '@/compartido/auth/firebase'
import type { CafeteriaElegida, Permiso, UsuarioEnCafeteria } from './tipos'

const CLAVE_CAFETERIA = 'jjskaffee.cafeteria'
const CLAVE_USUARIO = 'jjskaffee.usuario'

function leer<T>(clave: string): T | null {
  try {
    const valor = sessionStorage.getItem(clave)
    return valor ? (JSON.parse(valor) as T) : null
  } catch {
    return null
  }
}

function guardar(clave: string, valor: unknown): void {
  try {
    if (valor === null) sessionStorage.removeItem(clave)
    else sessionStorage.setItem(clave, JSON.stringify(valor))
  } catch {
    // Sin sessionStorage (modo privado): la sesión vive solo en memoria
  }
}

/**
 * Sesión de la persona: quién inició sesión, qué cafetería eligió y qué puede hacer en ella.
 * El cliente HTTP lee de aquí el token y la cafetería. Los datos de la API (cafeterías, rol)
 * los carga el módulo acceso y los guarda con fijarCafeteria y fijarUsuario.
 */
export const useSesionStore = defineStore('sesion', () => {
  const uid = ref<string | null>(null)
  const correo = ref<string | null>(null)
  const cafeteria = ref<CafeteriaElegida | null>(leer<CafeteriaElegida>(CLAVE_CAFETERIA))
  const usuario = ref<UsuarioEnCafeteria | null>(leer<UsuarioEnCafeteria>(CLAVE_USUARIO))

  const autenticado = computed(() => uid.value !== null)

  let restaurada: Promise<void> | null = null

  /** Recupera la sesión de Firebase al abrir o recargar la aplicación. Se ejecuta una sola vez. */
  function restaurar(): Promise<void> {
    restaurada ??= esperarUsuarioInicial().then((usuarioFirebase) => {
      if (usuarioFirebase) {
        uid.value = usuarioFirebase.uid
        correo.value = usuarioFirebase.email
      } else {
        limpiar()
      }
    })
    return restaurada
  }

  async function iniciarSesion(correoIngresado: string, clave: string): Promise<void> {
    const usuarioFirebase = await iniciarSesionFirebase(correoIngresado, clave)
    uid.value = usuarioFirebase.uid
    correo.value = usuarioFirebase.email
    fijarCafeteria(null)
  }

  function fijarCafeteria(elegida: CafeteriaElegida | null): void {
    cafeteria.value = elegida
    guardar(CLAVE_CAFETERIA, elegida)
    fijarUsuario(null)
  }

  function fijarUsuario(datos: UsuarioEnCafeteria | null): void {
    usuario.value = datos
    guardar(CLAVE_USUARIO, datos)
  }

  function tienePermiso(permiso: Permiso): boolean {
    return usuario.value?.permisos.includes(permiso) ?? false
  }

  async function cerrarSesion(): Promise<void> {
    await cerrarSesionFirebase()
    limpiar()
  }

  /** El backend respondió 401: el token ya no sirve y hay que volver a iniciar sesión. */
  function expirarSesion(): void {
    void cerrarSesionFirebase()
    limpiar()
  }

  function limpiar(): void {
    uid.value = null
    correo.value = null
    fijarCafeteria(null)
  }

  return {
    uid,
    correo,
    cafeteria,
    usuario,
    autenticado,
    restaurar,
    iniciarSesion,
    fijarCafeteria,
    fijarUsuario,
    tienePermiso,
    cerrarSesion,
    expirarSesion,
    obtenerToken,
  }
})
