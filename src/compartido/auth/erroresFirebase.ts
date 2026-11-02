/**
 * Firebase responde códigos como "auth/email-already-in-use"; aquí se traducen para la persona.
 * No importa el SDK de Firebase para poder probarlo sin configurarlo.
 */

/** El código de un error de Firebase ("auth/…"), o cadena vacía si no es de Firebase. */
export function codigoErrorFirebase(error: unknown): string {
  if (typeof error !== 'object' || error === null || !('code' in error)) return ''
  return typeof error.code === 'string' ? error.code : ''
}

const MENSAJES_REGISTRO: Record<string, string> = {
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo. Inicia sesión.',
  'auth/weak-password': 'La contraseña es muy débil. Usa al menos 8 caracteres.',
  'auth/password-does-not-meet-requirements':
    'La contraseña no cumple los requisitos. Usa al menos 8 caracteres.',
  'auth/invalid-email': 'El correo no tiene un formato válido.',
  'auth/operation-not-allowed':
    'Por ahora no se pueden crear cuentas. Avisa al administrador del sistema.',
  'auth/too-many-requests': 'Demasiados intentos. Espera un momento e intenta de nuevo.',
  'auth/network-request-failed': 'No se pudo conectar. Revisa tu conexión a internet.',
}

/** Mensaje para la persona cuando falla crear la cuenta. */
export function mensajeErrorRegistro(error: unknown): string {
  return (
    MENSAJES_REGISTRO[codigoErrorFirebase(error)] ?? 'No se pudo crear la cuenta. Intenta de nuevo.'
  )
}
