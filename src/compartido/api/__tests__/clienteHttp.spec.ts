import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { clienteHttp, ErrorApi } from '../clienteHttp'
import { useSesionStore } from '@/compartido/sesion/sesionStore'

vi.mock('@/compartido/auth/firebase', () => ({
  obtenerToken: vi.fn<() => Promise<string>>(async () => 'token-de-prueba'),
  cerrarSesionFirebase: vi.fn<() => Promise<void>>(async () => undefined),
  esperarUsuarioInicial: vi.fn<() => Promise<null>>(async () => null),
  iniciarSesionFirebase: vi.fn<() => Promise<never>>(),
}))

const CAFETERIA = { idCafeteria: '11111111-1111-1111-1111-111111111111', nombre: 'Cafetería A' }

function responder(estado: number, cuerpo?: unknown) {
  const respuesta = new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json' },
  })
  const fetchFalso = vi.fn<(url: string, opciones?: RequestInit) => Promise<Response>>(
    async () => respuesta,
  )
  vi.stubGlobal('fetch', fetchFalso)
  return fetchFalso
}

function encabezadosDe(fetchFalso: ReturnType<typeof responder>): Record<string, string> {
  const opciones = fetchFalso.mock.calls[0]?.[1]
  return opciones?.headers as Record<string, string>
}

describe('clienteHttp', () => {
  beforeEach(() => {
    sessionStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('manda el token y la cafetería elegida', async () => {
    useSesionStore().fijarCafeteria(CAFETERIA)
    const fetchFalso = responder(200, { ok: true })

    await clienteHttp.get('/acceso/yo')

    expect(fetchFalso.mock.calls[0]?.[0]).toBe('/api/acceso/yo')
    expect(encabezadosDe(fetchFalso)).toMatchObject({
      Authorization: 'Bearer token-de-prueba',
      'X-Cafeteria-Id': CAFETERIA.idCafeteria,
    })
  })

  it('no manda la cafetería cuando la petición es "mis cafeterías"', async () => {
    useSesionStore().fijarCafeteria(CAFETERIA)
    const fetchFalso = responder(200, [])

    await clienteHttp.get('/acceso/cafeterias', { sinCafeteria: true })

    expect(encabezadosDe(fetchFalso)).not.toHaveProperty('X-Cafeteria-Id')
  })

  it('manda la Idempotency-Key y el cuerpo en JSON al registrar', async () => {
    const fetchFalso = responder(201, { idVenta: 'v1' })

    await clienteHttp.post('/ingresos', { items: [] }, { claveIdempotencia: 'clave-1' })

    const opciones = fetchFalso.mock.calls[0]?.[1]
    expect(opciones?.method).toBe('POST')
    expect(opciones?.body).toBe('{"items":[]}')
    expect(encabezadosDe(fetchFalso)).toMatchObject({
      'Idempotency-Key': 'clave-1',
      'Content-Type': 'application/json',
    })
  })

  it('arma los parámetros de consulta sin los vacíos', async () => {
    const fetchFalso = responder(200, {})

    await clienteHttp.get('/movimientos', {
      parametros: { desde: '2026-10-01', hasta: '2026-10-31', tipo: undefined, pagina: 0 },
    })

    expect(fetchFalso.mock.calls[0]?.[0]).toBe(
      '/api/movimientos?desde=2026-10-01&hasta=2026-10-31&pagina=0',
    )
  })

  it('convierte un ProblemDetail en ErrorApi con los errores por campo', async () => {
    responder(400, {
      title: 'Datos inválidos',
      status: 400,
      detail: 'Revisa los campos marcados',
      errores: { monto: 'Debe ser mayor que 0' },
    })

    const error = await clienteHttp.post('/ingresos/libres', {}).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ErrorApi)
    expect(error).toMatchObject({
      estado: 400,
      titulo: 'Datos inválidos',
      errores: { monto: 'Debe ser mayor que 0' },
    })
  })

  it('cierra la sesión cuando el backend responde 401', async () => {
    const sesion = useSesionStore()
    sesion.uid = 'uid-1'
    sesion.fijarCafeteria(CAFETERIA)
    responder(401, {
      title: 'No autenticado',
      status: 401,
      detail: 'El token no es válido o ya venció',
    })

    await expect(clienteHttp.get('/acceso/yo')).rejects.toBeInstanceOf(ErrorApi)

    expect(sesion.autenticado).toBe(false)
    expect(sesion.cafeteria).toBeNull()
  })
})
