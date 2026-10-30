/** Rol de una persona en una cafetería (el mismo enum del backend). */
export type Rol = 'ADMINISTRADOR' | 'CAJERO'

/** Lo que una persona puede hacer en la cafetería elegida. Sale de GET /acceso/yo. */
export type Permiso =
  'REGISTRAR_VENTA' | 'REGISTRAR_INGRESO_LIBRE' | 'REGISTRAR_EGRESO' | 'VER_TODOS_LOS_MOVIMIENTOS'

/** La cafetería con la que se está trabajando; su id viaja en el encabezado X-Cafeteria-Id. */
export interface CafeteriaElegida {
  idCafeteria: string
  nombre: string
}

/** Quién es la persona dentro de la cafetería elegida. */
export interface UsuarioEnCafeteria {
  id: string
  nombre: string
  rol: Rol
  permisos: Permiso[]
}
