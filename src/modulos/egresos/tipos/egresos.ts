/** Tipos de POST /egresos (solo administrador). */

export interface EgresoRequest {
  idCategoria: string
  monto: number
  descripcion: string
  comprobante?: string
}

export interface Egreso {
  idEgreso: string
  idCategoria: string
  categoria: string
  monto: number
  descripcion: string
  comprobante: string | null
  registradoPor: string
  fechaHora: string
}
