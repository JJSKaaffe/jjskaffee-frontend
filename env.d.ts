/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base de la API: "/api" en local (proxy de Vite) o la URL del API Gateway en la nube. */
  readonly VITE_API_URL?: string
  /** Backend local al que el proxy de Vite manda /api. */
  readonly VITE_BACKEND_LOCAL?: string
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
  readonly VITE_FIREBASE_APP_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
