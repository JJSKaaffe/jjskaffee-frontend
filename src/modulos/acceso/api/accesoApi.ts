import { clienteHttp } from '@/compartido/api/clienteHttp'
import type { CafeteriaDelUsuario, UsuarioActual } from '../tipos/acceso'

export const accesoApi = {
  /** Solo lleva el token: la persona todavía no ha elegido cafetería. */
  misCafeterias: () =>
    clienteHttp.get<CafeteriaDelUsuario[]>('/acceso/cafeterias', { sinCafeteria: true }),

  /** Rol y permisos en la cafetería elegida (encabezado X-Cafeteria-Id). */
  yo: () => clienteHttp.get<UsuarioActual>('/acceso/yo'),
}
