import { clienteHttp } from '@/compartido/api/clienteHttp'
import type { Egreso, EgresoRequest } from '../tipos/egresos'

export const egresosApi = {
  registrar: (egreso: EgresoRequest) => clienteHttp.post<Egreso>('/egresos', egreso),
}
