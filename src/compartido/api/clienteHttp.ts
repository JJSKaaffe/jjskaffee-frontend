import { useSesionStore } from '@/compartido/sesion/sesionStore'

/**
 * Único lugar de la aplicación que hace peticiones HTTP. Agrega a cada petición:
 * - Authorization: Bearer <token de Firebase>
 * - X-Cafeteria-Id: la cafetería elegida (ADR-0016), salvo en GET /acceso/cafeterias
 * - Idempotency-Key, cuando se registra un ingreso
 * En local, VITE_API_URL=/api y el proxy de Vite manda la petición al backend.
 * En la nube, VITE_API_URL apunta al API Gateway (ADR-0017).
 */

/** Error de la API en formato ProblemDetail (RFC 9457), como lo responde el backend. */
export class ErrorApi extends Error {
  constructor(
    readonly estado: number,
    readonly titulo: string,
    readonly detalle: string,
    readonly errores: Record<string, string> = {},
  ) {
    super(detalle)
    this.name = 'ErrorApi'
  }
}

export interface OpcionesPeticion {
  metodo?: 'GET' | 'POST'
  cuerpo?: unknown
  parametros?: Record<string, string | number | undefined | null>
  /** Solo para GET /acceso/cafeterias: la persona todavía no ha elegido cafetería. */
  sinCafeteria?: boolean
  claveIdempotencia?: string
}

const MENSAJES: Record<number, string> = {
  400: 'Revisa los datos ingresados.',
  401: 'Tu sesión venció. Inicia sesión de nuevo.',
  403: 'No tienes permiso para hacer esto en esta cafetería.',
  404: 'No se encontró lo que buscabas.',
  422: 'La operación no cumple las reglas del negocio.',
}

function construirUrl(ruta: string, parametros: OpcionesPeticion['parametros']): string {
  const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
  const consulta = new URLSearchParams()
  for (const [clave, valor] of Object.entries(parametros ?? {})) {
    if (valor !== undefined && valor !== null && valor !== '') consulta.set(clave, String(valor))
  }
  const texto = consulta.toString()
  return `${base}${ruta}${texto ? `?${texto}` : ''}`
}

async function aErrorApi(respuesta: Response): Promise<ErrorApi> {
  try {
    const problema = (await respuesta.json()) as {
      title?: string
      detail?: string
      errores?: Record<string, string>
    }
    return new ErrorApi(
      respuesta.status,
      problema.title ?? 'Error',
      problema.detail ?? MENSAJES[respuesta.status] ?? 'Ocurrió un error inesperado.',
      problema.errores ?? {},
    )
  } catch {
    return new ErrorApi(
      respuesta.status,
      'Error',
      MENSAJES[respuesta.status] ?? 'Ocurrió un error inesperado. Intenta de nuevo.',
    )
  }
}

export async function peticion<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  const sesion = useSesionStore()
  const encabezados: Record<string, string> = { Accept: 'application/json' }

  const token = await sesion.obtenerToken()
  if (token) encabezados.Authorization = `Bearer ${token}`
  if (!opciones.sinCafeteria && sesion.cafeteria) {
    encabezados['X-Cafeteria-Id'] = sesion.cafeteria.idCafeteria
  }
  if (opciones.claveIdempotencia) encabezados['Idempotency-Key'] = opciones.claveIdempotencia
  if (opciones.cuerpo !== undefined) encabezados['Content-Type'] = 'application/json'

  let respuesta: Response
  try {
    respuesta = await fetch(construirUrl(ruta, opciones.parametros), {
      method: opciones.metodo ?? 'GET',
      headers: encabezados,
      body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
    })
  } catch {
    throw new ErrorApi(
      0,
      'Sin conexión',
      'No se pudo conectar con el servidor. Revisa tu conexión.',
    )
  }

  if (respuesta.status === 401) sesion.expirarSesion()
  if (!respuesta.ok) throw await aErrorApi(respuesta)
  if (respuesta.status === 204) return undefined as T
  return (await respuesta.json()) as T
}

export const clienteHttp = {
  get: <T>(ruta: string, opciones: Omit<OpcionesPeticion, 'metodo' | 'cuerpo'> = {}) =>
    peticion<T>(ruta, { ...opciones, metodo: 'GET' }),
  post: <T>(
    ruta: string,
    cuerpo?: unknown,
    opciones: Omit<OpcionesPeticion, 'metodo' | 'cuerpo'> = {},
  ) => peticion<T>(ruta, { ...opciones, metodo: 'POST', cuerpo }),
}
