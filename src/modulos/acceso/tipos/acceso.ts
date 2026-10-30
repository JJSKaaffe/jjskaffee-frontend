import type { Permiso, Rol } from '@/compartido/sesion/tipos'

/** GET /acceso/cafeterias: las cafeterías de la persona, con su rol en cada una. */
export interface CafeteriaDelUsuario {
  idCafeteria: string
  nombre: string
  rol: Rol
  activa: boolean
}

/** GET /acceso/yo: quién es la persona en la cafetería elegida y qué puede hacer. */
export interface UsuarioActual {
  id: string
  nombre: string
  rol: Rol
  idCafeteria: string
  permisos: Permiso[]
}
