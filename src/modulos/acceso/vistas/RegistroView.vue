<script setup lang="ts">
/**
 * Crear cuenta con Firebase Authentication (ADR-0001): el correo y la contraseña quedan en
 * Firebase, nunca en el backend. La cuenta nace sin cafetería; el administrador la agrega después.
 */
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import MarcaJJSKaffee from '@/compartido/componentes/MarcaJJSKaffee.vue'
import MensajeAviso from '@/compartido/componentes/MensajeAviso.vue'
import { firebaseConfigurado } from '@/compartido/auth/firebase'
import { mensajeErrorRegistro } from '@/compartido/auth/erroresFirebase'
import { useAccesoStore } from '../store/accesoStore'
import {
  CLAVE_MINIMA,
  NOMBRE_MAXIMO,
  validarRegistro,
  type DatosRegistro,
} from '../store/validacionRegistro'

const acceso = useAccesoStore()
const router = useRouter()
const formulario = useTemplateRef<HTMLFormElement>('formulario')

const nombre = ref('')
const correo = ref('')
const clave = ref('')
const confirmacion = ref('')
const enviando = ref(false)
const tocado = ref(false)
const error = ref<string | null>(null)
const configurado = firebaseConfigurado()

const errores = computed(() =>
  validarRegistro({
    nombre: nombre.value,
    correo: correo.value,
    clave: clave.value,
    confirmacion: confirmacion.value,
  }),
)

function errorDe(campo: keyof DatosRegistro): string | undefined {
  return tocado.value ? errores.value[campo] : undefined
}

/** Con el teclado, el foco va al primer campo con error para corregirlo de una vez. */
async function enfocarPrimerError() {
  await nextTick()
  formulario.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
}

async function registrar() {
  if (enviando.value) return
  tocado.value = true
  error.value = null
  if (Object.keys(errores.value).length > 0) {
    await enfocarPrimerError()
    return
  }

  enviando.value = true
  try {
    await acceso.registrar(nombre.value.trim(), correo.value.trim(), clave.value)
    await router.push({ name: 'elegir-cafeteria' })
  } catch (e) {
    error.value = mensajeErrorRegistro(e)
    clave.value = ''
    confirmacion.value = ''
    tocado.value = false
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="pantalla-acceso">
    <MarcaJJSKaffee tamano="grande" />
    <section class="tarjeta">
      <h1>Crear cuenta</h1>
      <p class="pantalla__descripcion">
        Después de crearla, el administrador de tu cafetería te agrega para que puedas trabajar.
      </p>

      <MensajeAviso v-if="!configurado" tipo="error">
        Falta configurar Firebase: copia <code>.env.example</code> como <code>.env.local</code> y
        llena las variables <code>VITE_FIREBASE_*</code>.
      </MensajeAviso>

      <form ref="formulario" class="formulario" novalidate @submit.prevent="registrar">
        <label class="campo">
          <span>Nombre</span>
          <input
            v-model="nombre"
            type="text"
            name="nombre"
            autocomplete="name"
            :maxlength="NOMBRE_MAXIMO"
            required
            autofocus
            :disabled="enviando"
            :aria-invalid="Boolean(errorDe('nombre'))"
            aria-describedby="error-nombre"
          />
          <small id="error-nombre" class="campo__error">{{ errorDe('nombre') }}</small>
        </label>

        <label class="campo">
          <span>Correo</span>
          <input
            v-model="correo"
            type="email"
            name="correo"
            autocomplete="email"
            required
            :disabled="enviando"
            :aria-invalid="Boolean(errorDe('correo'))"
            aria-describedby="error-correo"
          />
          <small id="error-correo" class="campo__error">{{ errorDe('correo') }}</small>
        </label>

        <label class="campo">
          <span>Contraseña</span>
          <input
            v-model="clave"
            type="password"
            name="clave"
            autocomplete="new-password"
            :minlength="CLAVE_MINIMA"
            required
            :disabled="enviando"
            :aria-invalid="Boolean(errorDe('clave'))"
            aria-describedby="ayuda-clave error-clave"
          />
          <small id="ayuda-clave" class="campo__ayuda">Mínimo {{ CLAVE_MINIMA }} caracteres.</small>
          <small id="error-clave" class="campo__error">{{ errorDe('clave') }}</small>
        </label>

        <label class="campo">
          <span>Confirmar contraseña</span>
          <input
            v-model="confirmacion"
            type="password"
            name="confirmacion"
            autocomplete="new-password"
            required
            :disabled="enviando"
            :aria-invalid="Boolean(errorDe('confirmacion'))"
            aria-describedby="error-confirmacion"
          />
          <small id="error-confirmacion" class="campo__error">{{ errorDe('confirmacion') }}</small>
        </label>

        <MensajeAviso v-if="error" tipo="error">{{ error }}</MensajeAviso>

        <button type="submit" class="boton boton--principal" :disabled="enviando || !configurado">
          {{ enviando ? 'Creando cuenta…' : 'Crear cuenta' }}
        </button>
      </form>

      <p class="pantalla-acceso__cambiar">
        ¿Ya tienes cuenta?
        <RouterLink :to="{ name: 'iniciar-sesion' }">Inicia sesión</RouterLink>
      </p>
    </section>
  </div>
</template>

<style scoped>
h1 {
  margin: 0;
}
.campo__ayuda {
  color: var(--color-suave);
  font-weight: 400;
}
</style>
