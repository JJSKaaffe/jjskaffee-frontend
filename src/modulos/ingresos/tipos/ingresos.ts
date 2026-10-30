/** Tipos de los DTO del módulo ingresos del backend. Los montos llegan como número (BigDecimal). */

// ---- Catálogo de la pantalla de venta (GET /ingresos/catalogo)
export interface AdicionDelMenu {
  idProducto: string
  nombre: string
  precio: number
}

export interface ProductoDelMenu {
  idProducto: string
  nombre: string
  precio: number
  adiciones: AdicionDelMenu[]
}

export interface CategoriaIngreso {
  idCategoria: string
  nombre: string
}

export interface CatalogoDeVenta {
  productos: ProductoDelMenu[]
  /** Vacía para el cajero: solo el administrador registra ingresos libres. */
  categoriasIngreso: CategoriaIngreso[]
}

// ---- Venta (POST /ingresos)
export interface AdicionPedida {
  idProducto: string
  /** Si no se envía, cuenta como 1. */
  cantidad?: number
}

export interface ItemPedido {
  idProducto: string
  cantidad: number
  adiciones?: AdicionPedida[]
}

export interface VentaRequest {
  items: ItemPedido[]
}

export interface AdicionVendida {
  idProducto: string
  nombre: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface ItemVendido {
  idProducto: string
  nombre: string
  cantidad: number
  precioUnitario: number
  subtotal: number
  adiciones: AdicionVendida[]
}

export interface Venta {
  idVenta: string
  fechaHora: string
  estado: 'CONFIRMADA' | 'ANULADA'
  /** Lo calcula el servidor con los precios del catálogo. */
  total: number
  registradoPor: string
  items: ItemVendido[]
}

// ---- Ingreso libre (POST /ingresos/libres, solo administrador)
export interface IngresoLibreRequest {
  idCategoria: string
  monto: number
  descripcion: string
  comprobante?: string
}

export interface IngresoLibre {
  idIngreso: string
  idCategoria: string
  categoria: string
  monto: number
  descripcion: string
  comprobante: string | null
  registradoPor: string
  fechaHora: string
}
