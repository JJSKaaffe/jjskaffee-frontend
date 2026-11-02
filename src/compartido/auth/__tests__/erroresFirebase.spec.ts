import { describe, expect, it } from 'vitest'

import { codigoErrorFirebase, mensajeErrorRegistro } from '../erroresFirebase'

const errorFirebase = (code: string) => Object.assign(new Error(code), { code })

describe('codigoErrorFirebase', () => {
  it('saca el código de un error de Firebase', () => {
    expect(codigoErrorFirebase(errorFirebase('auth/weak-password'))).toBe('auth/weak-password')
  })

  it('devuelve cadena vacía si no hay código', () => {
    expect(codigoErrorFirebase(new Error('otro'))).toBe('')
    expect(codigoErrorFirebase(null)).toBe('')
    expect(codigoErrorFirebase('auth/weak-password')).toBe('')
    expect(codigoErrorFirebase({ code: 42 })).toBe('')
  })
})

describe('mensajeErrorRegistro', () => {
  it.each([
    ['auth/email-already-in-use', 'Ya existe una cuenta con ese correo. Inicia sesión.'],
    ['auth/weak-password', 'La contraseña es muy débil. Usa al menos 8 caracteres.'],
    ['auth/invalid-email', 'El correo no tiene un formato válido.'],
    [
      'auth/operation-not-allowed',
      'Por ahora no se pueden crear cuentas. Avisa al administrador del sistema.',
    ],
    ['auth/too-many-requests', 'Demasiados intentos. Espera un momento e intenta de nuevo.'],
    ['auth/network-request-failed', 'No se pudo conectar. Revisa tu conexión a internet.'],
  ])('traduce %s', (codigo, mensaje) => {
    expect(mensajeErrorRegistro(errorFirebase(codigo))).toBe(mensaje)
  })

  it('usa un mensaje general para códigos desconocidos o errores sin código', () => {
    const general = 'No se pudo crear la cuenta. Intenta de nuevo.'
    expect(mensajeErrorRegistro(errorFirebase('auth/internal-error'))).toBe(general)
    expect(mensajeErrorRegistro(new Error('sin código'))).toBe(general)
    expect(mensajeErrorRegistro(undefined)).toBe(general)
  })
})
