/** Validación del formulario de crear cuenta. Firebase vuelve a revisar correo y contraseña. */

export const NOMBRE_MAXIMO = 80
export const CLAVE_MINIMA = 8

/** Algo@algo.dominio, sin espacios. El formato exacto lo decide Firebase. */
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface DatosRegistro {
  nombre: string
  correo: string
  clave: string
  confirmacion: string
}

export type ErroresRegistro = Partial<Record<keyof DatosRegistro, string>>

/** Devuelve un mensaje por cada campo con error; vacío si todo está bien. */
export function validarRegistro(datos: DatosRegistro): ErroresRegistro {
  const errores: ErroresRegistro = {}

  const nombre = datos.nombre.trim()
  if (!nombre) errores.nombre = 'Escribe tu nombre'
  else if ([...nombre].length > NOMBRE_MAXIMO) {
    errores.nombre = `Máximo ${NOMBRE_MAXIMO} caracteres`
  }

  const correo = datos.correo.trim()
  if (!correo) errores.correo = 'Escribe tu correo'
  else if (!CORREO_VALIDO.test(correo)) errores.correo = 'El correo no tiene un formato válido'

  if (!datos.clave) errores.clave = 'Escribe una contraseña'
  else if (datos.clave.length < CLAVE_MINIMA) {
    errores.clave = `Debe tener al menos ${CLAVE_MINIMA} caracteres`
  }

  if (!datos.confirmacion) errores.confirmacion = 'Repite la contraseña'
  else if (datos.confirmacion !== datos.clave) errores.confirmacion = 'Las contraseñas no coinciden'

  return errores
}
