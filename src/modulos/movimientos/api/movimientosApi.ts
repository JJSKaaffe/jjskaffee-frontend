import { clienteHttp } from '@/compartido/api/clienteHttp'
import type { FiltroMovimientos, Movimientos } from '../tipos/movimientos'

export const movimientosApi = {
  /** El administrador ve todo lo de la cafetería; el cajero, solo lo que él registró. */
  consultar: (filtro: FiltroMovimientos) =>
    clienteHttp.get<Movimientos>('/movimientos', { parametros: { ...filtro } }),
}
