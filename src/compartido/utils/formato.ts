/**
 * Formatos que usa toda la aplicación. El backend guarda y devuelve las fechas en UTC;
 * aquí se muestran en la hora de Colombia, igual que los filtros desde/hasta del backend.
 */

export const ZONA_HORARIA = 'America/Bogota'

const pesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const fechaHora = new Intl.DateTimeFormat('es-CO', {
  timeZone: ZONA_HORARIA,
  dateStyle: 'short',
  timeStyle: 'short',
})

/** 8500 → "$ 8.500" */
export function formatoPesos(valor: number): string {
  return pesos.format(valor)
}

/** "2026-10-28T03:00:00Z" → "27/10/26, 10:00 p. m." (hora de Colombia) */
export function formatoFechaHora(instanteIso: string): string {
  return fechaHora.format(new Date(instanteIso))
}

/** Fecha de hoy en Colombia como "AAAA-MM-DD", el formato de los filtros desde/hasta. */
export function hoyEnColombia(ahora: Date = new Date()): string {
  // en-CA escribe las fechas como AAAA-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA }).format(ahora)
}
