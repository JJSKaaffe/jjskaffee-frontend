import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth'

/**
 * Inicio de sesión con Firebase Authentication (ADR-0001). El sistema nunca guarda contraseñas:
 * Firebase entrega un token y el backend lo verifica en cada petición.
 * La configuración sale de las variables VITE_FIREBASE_* del archivo .env.local.
 */

let auth: Auth | null = null

export function firebaseConfigurado(): boolean {
  return Boolean(import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID)
}

function obtenerAuth(): Auth {
  if (auth) return auth
  if (!firebaseConfigurado()) {
    throw new Error(
      'Falta configurar Firebase: copia .env.example como .env.local y llena VITE_FIREBASE_*',
    )
  }
  const app: FirebaseApp = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || undefined,
  })
  auth = getAuth(app)
  return auth
}

/** Espera a que Firebase diga si ya había una sesión abierta (por ejemplo, al recargar la página). */
export function esperarUsuarioInicial(): Promise<User | null> {
  if (!firebaseConfigurado()) {
    console.warn('Firebase no está configurado (.env.local): la aplicación arranca sin sesión.')
    return Promise.resolve(null)
  }
  const instancia = obtenerAuth()
  return new Promise((resolver) => {
    const dejarDeEscuchar = onAuthStateChanged(instancia, (usuario) => {
      dejarDeEscuchar()
      resolver(usuario)
    })
  })
}

export async function iniciarSesionFirebase(correo: string, clave: string): Promise<User> {
  const credencial = await signInWithEmailAndPassword(obtenerAuth(), correo, clave)
  return credencial.user
}

export async function cerrarSesionFirebase(): Promise<void> {
  if (auth) await signOut(auth)
}

/** Token vigente de la persona; Firebase lo renueva solo cuando está por vencer. */
export async function obtenerToken(): Promise<string | null> {
  const usuario = auth?.currentUser
  return usuario ? usuario.getIdToken() : null
}
