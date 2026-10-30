import { describe, expect, it } from 'vitest'

import { formatoFechaHora, formatoPesos, hoyEnColombia } from '../formato'

describe('formato', () => {
  it('muestra los montos en pesos colombianos', () => {
    expect(formatoPesos(8500)).toMatch(/\$\s?8\.500$/)
    expect(formatoPesos(150000.5)).toMatch(/150\.000,5/)
  })

  it('muestra la fecha y hora en la hora de Colombia (UTC-5)', () => {
    // 03:00 UTC del 28 de octubre son las 10:00 p. m. del 27 en Colombia
    expect(formatoFechaHora('2026-10-28T03:00:00Z')).toContain('27/10/26')
  })

  it('calcula el día de hoy en Colombia, no en UTC', () => {
    expect(hoyEnColombia(new Date('2026-10-28T03:00:00Z'))).toBe('2026-10-27')
    expect(hoyEnColombia(new Date('2026-10-28T15:00:00Z'))).toBe('2026-10-28')
  })
})
