import { describe, expect, it } from 'vitest'

import { validarRegistro, type DatosRegistro } from '../validacionRegistro'

const validos: DatosRegistro = {
  nombre: 'Ana Pérez',
  correo: 'ana@cafeteria.co',
  clave: 'cafe1234',
  confirmacion: 'cafe1234',
}

const validar = (cambios: Partial<DatosRegistro>) => validarRegistro({ ...validos, ...cambios })

describe('validarRegistro', () => {
  it('no da errores con datos válidos', () => {
    expect(validarRegistro(validos)).toEqual({})
  })

  it('pide todos los campos', () => {
    expect(validarRegistro({ nombre: '', correo: '', clave: '', confirmacion: '' })).toEqual({
      nombre: 'Escribe tu nombre',
      correo: 'Escribe tu correo',
      clave: 'Escribe una contraseña',
      confirmacion: 'Repite la contraseña',
    })
  })

  it('no acepta un nombre de solo espacios', () => {
    expect(validar({ nombre: '   ' }).nombre).toBe('Escribe tu nombre')
  })

  it('acepta hasta 80 caracteres de nombre, sin contar espacios de los extremos', () => {
    expect(validar({ nombre: 'a'.repeat(80) }).nombre).toBeUndefined()
    expect(validar({ nombre: `  ${'a'.repeat(80)}  ` }).nombre).toBeUndefined()
    expect(validar({ nombre: 'ñ'.repeat(80) }).nombre).toBeUndefined()
    expect(validar({ nombre: 'a'.repeat(81) }).nombre).toBe('Máximo 80 caracteres')
  })

  it('revisa el formato del correo', () => {
    expect(validar({ correo: '  ana@cafeteria.co  ' }).correo).toBeUndefined()
    for (const correo of ['ana', 'ana@', 'ana@cafeteria', '@cafeteria.co', 'ana @cafe.co']) {
      expect(validar({ correo }).correo).toBe('El correo no tiene un formato válido')
    }
  })

  it('pide una contraseña de al menos 8 caracteres', () => {
    expect(validar({ clave: '1234567', confirmacion: '1234567' }).clave).toBe(
      'Debe tener al menos 8 caracteres',
    )
    expect(validar({ clave: '12345678', confirmacion: '12345678' }).clave).toBeUndefined()
  })

  it('pide que las contraseñas coincidan', () => {
    expect(validar({ confirmacion: 'cafe12345' }).confirmacion).toBe('Las contraseñas no coinciden')
  })
})
