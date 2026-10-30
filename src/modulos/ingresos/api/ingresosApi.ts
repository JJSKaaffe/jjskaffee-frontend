import { clienteHttp } from '@/compartido/api/clienteHttp'
import type {
  CatalogoDeVenta,
  IngresoLibre,
  IngresoLibreRequest,
  Venta,
  VentaRequest,
} from '../tipos/ingresos'

export const ingresosApi = {
  catalogo: () => clienteHttp.get<CatalogoDeVenta>('/ingresos/catalogo'),

  /** Con la misma clave, un reintento devuelve la venta ya registrada en vez de duplicarla. */
  registrarVenta: (venta: VentaRequest, claveIdempotencia: string) =>
    clienteHttp.post<Venta>('/ingresos', venta, { claveIdempotencia }),

  /** Solo quien la registró y dentro de los 60 segundos (ADR-0008). */
  deshacerVenta: (idVenta: string) =>
    clienteHttp.post<void>(`/ingresos/${encodeURIComponent(idVenta)}/deshacer`),

  registrarIngresoLibre: (ingreso: IngresoLibreRequest, claveIdempotencia: string) =>
    clienteHttp.post<IngresoLibre>('/ingresos/libres', ingreso, { claveIdempotencia }),
}
