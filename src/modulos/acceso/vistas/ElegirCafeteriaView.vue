<script setup lang="ts">
// Una persona puede estar en varias cafeterías, con un rol distinto en cada una (ADR-0016).
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import MarcaJJSKaffee from '@/compartido/componentes/MarcaJJSKaffee.vue'
import MensajeAviso from '@/compartido/componentes/MensajeAviso.vue'
import { ErrorApi } from '@/compartido/api/clienteHttp'
import { useSesionStore } from '@/compartido/sesion/sesionStore'
import { useAccesoStore } from '../store/accesoStore'
import type { CafeteriaDelUsuario } from '../tipos/acceso'

const acceso = useAccesoStore()
const sesion = useSesionStore()
const router = useRouter()

const cargando = ref(false)
const eligiendo = ref<string | null>(null)
const error = ref<string | null>(null)

const textoRol: Record<CafeteriaDelUsuario['rol'], string> = {
  ADMINISTRADOR: 'Administrador',
  CAJERO: 'Cajero',
}

function mensaje(e: unknown): string {
  return e instanceof ErrorApi ? e.detalle : 'Ocurrió un error inesperado. Intenta de nuevo.'
}

async function cargar() {
  error.value = null
  cargando.value = true
  try {
    await acceso.cargarCafeterias()
  } catch (e) {
    error.value = mensaje(e)
  } finally {
    cargando.value = false
  }
}

async function elegir(cafeteria: CafeteriaDelUsuario) {
  if (!cafeteria.activa || eligiendo.value) return
  error.value = null
  eligiendo.value = cafeteria.idCafeteria
  try {
    await acceso.elegirCafeteria(cafeteria)
    await router.push({ name: 'venta' })
  } catch (e) {
    error.value = mensaje(e)
  } finally {
    eligiendo.value = null
  }
}

async function cerrarSesion() {
  await acceso.cerrarSesion()
  await router.push({ name: 'iniciar-sesion' })
}

onMounted(() => {
  if (acceso.cafeterias.length === 0) void cargar()
})
</script>

<template>
  <div class="pantalla-acceso">
    <MarcaJJSKaffee tamano="grande" />
    <section class="tarjeta">
      <h1>Elige la cafetería</h1>
      <p class="pantalla__descripcion">
        {{ sesion.correo ? `Entraste como ${sesion.correo}. ` : '' }}Tu rol puede ser distinto en
        cada cafetería.
      </p>

      <MensajeAviso v-if="error" tipo="error">{{ error }}</MensajeAviso>
      <p v-if="cargando" class="pantalla__descripcion" role="status">Cargando tus cafeterías…</p>

      <MensajeAviso v-else-if="!error && acceso.cafeterias.length === 0" tipo="info">
        Todavía no perteneces a ninguna cafetería. Pide al administrador que te agregue.
      </MensajeAviso>

      <ul v-else class="lista-cafeterias">
        <li v-for="cafeteria in acceso.cafeterias" :key="cafeteria.idCafeteria">
          <button
            type="button"
            class="cafeteria"
            :class="{
              'cafeteria--actual': sesion.cafeteria?.idCafeteria === cafeteria.idCafeteria,
            }"
            :disabled="!cafeteria.activa || eligiendo !== null"
            @click="elegir(cafeteria)"
          >
            <span class="cafeteria__nombre">{{ cafeteria.nombre }}</span>
            <span class="etiqueta">{{ textoRol[cafeteria.rol] }}</span>
            <span v-if="!cafeteria.activa" class="cafeteria__estado">Inactiva</span>
            <span v-else-if="eligiendo === cafeteria.idCafeteria" class="cafeteria__estado">
              Entrando…
            </span>
          </button>
        </li>
      </ul>

      <div class="acciones">
        <button v-if="error" type="button" class="boton" @click="cargar">Reintentar</button>
        <button type="button" class="boton boton--texto" @click="cerrarSesion">
          Cerrar sesión
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
h1 {
  margin-top: 0;
}
.lista-cafeterias {
  list-style: none;
  margin: 1rem 0;
  padding: 0;
  display: grid;
  gap: 0.5rem;
}
.cafeteria {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background: var(--color-tarjeta);
  color: var(--color-texto);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.cafeteria:hover:not(:disabled) {
  border-color: var(--color-marca);
}
.cafeteria:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.cafeteria--actual {
  border-color: var(--color-marca);
  box-shadow: inset 3px 0 0 var(--color-marca);
}
.cafeteria__nombre {
  flex: 1;
  font-weight: 600;
}
.cafeteria__estado {
  color: var(--color-suave);
  font-size: 0.85rem;
}
</style>
