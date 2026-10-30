<script setup lang="ts">
// Inicio de sesión con Firebase Authentication (ADR-0001). El sistema no guarda contraseñas.
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import MarcaJJSKaffee from '@/compartido/componentes/MarcaJJSKaffee.vue'
import MensajeAviso from '@/compartido/componentes/MensajeAviso.vue'
import { ErrorApi } from '@/compartido/api/clienteHttp'
import { firebaseConfigurado } from '@/compartido/auth/firebase'
import { useAccesoStore } from '../store/accesoStore'

const acceso = useAccesoStore()
const router = useRouter()

const correo = ref('')
const clave = ref('')
const enviando = ref(false)
const error = ref<string | null>(null)
const configurado = firebaseConfigurado()

/** Firebase responde códigos como "auth/invalid-credential"; aquí se traducen para la persona. */
function mensajeDeError(e: unknown): string {
  if (e instanceof ErrorApi) return e.detalle
  const codigo = (e as { code?: string })?.code ?? ''
  if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(codigo)) {
    return 'Correo o contraseña incorrectos.'
  }
  if (codigo === 'auth/invalid-email') return 'El correo no tiene un formato válido.'
  if (codigo === 'auth/user-disabled') return 'Esta cuenta está deshabilitada.'
  if (codigo === 'auth/too-many-requests') {
    return 'Demasiados intentos. Espera un momento e intenta de nuevo.'
  }
  if (codigo === 'auth/network-request-failed') {
    return 'No se pudo conectar. Revisa tu conexión a internet.'
  }
  return 'No se pudo iniciar sesión. Intenta de nuevo.'
}

async function iniciarSesion() {
  if (enviando.value) return
  error.value = null
  enviando.value = true
  try {
    await acceso.iniciarSesion(correo.value.trim(), clave.value)
    // Con una sola cafetería activa se entra directo: un clic menos para el cajero
    const activas = acceso.cafeterias.filter((c) => c.activa)
    if (activas.length === 1 && acceso.cafeterias.length === 1) {
      await acceso.elegirCafeteria(activas[0]!)
      await router.push({ name: 'venta' })
    } else {
      await router.push({ name: 'elegir-cafeteria' })
    }
  } catch (e) {
    error.value = mensajeDeError(e)
  } finally {
    enviando.value = false
    clave.value = ''
  }
}
</script>

<template>
  <div class="pantalla-acceso">
    <MarcaJJSKaffee tamano="grande" />
    <section class="tarjeta">
      <h1>Iniciar sesión</h1>
      <p class="pantalla__descripcion">Registra las ventas e ingresos de tu cafetería.</p>

      <MensajeAviso v-if="!configurado" tipo="error">
        Falta configurar Firebase: copia <code>.env.example</code> como <code>.env.local</code> y
        llena las variables <code>VITE_FIREBASE_*</code>.
      </MensajeAviso>

      <form class="formulario" novalidate @submit.prevent="iniciarSesion">
        <label class="campo">
          <span>Correo</span>
          <input
            v-model="correo"
            type="email"
            name="correo"
            autocomplete="username"
            required
            autofocus
            :disabled="enviando"
          />
        </label>
        <label class="campo">
          <span>Contraseña</span>
          <input
            v-model="clave"
            type="password"
            name="clave"
            autocomplete="current-password"
            required
            :disabled="enviando"
          />
        </label>

        <MensajeAviso v-if="error" tipo="error">{{ error }}</MensajeAviso>

        <button
          type="submit"
          class="boton boton--principal"
          :disabled="enviando || !configurado || !correo || !clave"
        >
          {{ enviando ? 'Entrando…' : 'Entrar' }}
        </button>
      </form>
    </section>
  </div>
</template>

<style scoped>
h1 {
  margin: 0;
}
</style>
