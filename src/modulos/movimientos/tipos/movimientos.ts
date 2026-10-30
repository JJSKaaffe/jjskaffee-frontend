/** Tipos de GET /movimientos. Las fechas desde/hasta van como "AAAA-MM-DD" en hora de Colombia. */

export type TipoMovimiento = 'INGRESO' | 'EGRESO'

export interface FiltroMovimientos {
  desde?: string
  hasta?: string
  tipo?: TipoMovimiento
  idCategoria?: string
  pagina?: number
  /** De 1 a 50; por defecto 20. */
  tamano?: number
}

export interface Movimiento {
  idMovimiento: string
  tipo: TipoMovimiento
  fechaHora: string
  monto: number
  descripcion: string
  /** Las ventas no tienen categoría. */
  categoria: string | null
  registradoPor: string
}

export interface Totales {
  ingresos: number
  egresos: number
  balance: number
}

export interface Movimientos {
  movimientos: Movimiento[]
  /** Totales de todo el filtro, no solo de la página. */
  totales: Totales
  pagina: number
  tamano: number
  totalMovimientos: number
}
