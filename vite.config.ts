import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [vue(), vueDevTools()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      // En local, /api/... se reenvía al backend sin el prefijo /api, igual que hace el API Gateway
      // en la nube. Así el navegador no hace peticiones a otro origen y no hace falta CORS.
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_LOCAL || 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (ruta) => ruta.replace(/^\/api/, ''),
        },
      },
    },
  }
})
