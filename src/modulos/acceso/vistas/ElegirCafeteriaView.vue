<script setup lang="ts">
// Una persona puede estar en varias cafeterías, con un rol distinto en cada una (ADR-0016).
import { nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
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
/** La persona ya pidió actualizar: si sigue sin cafeterías, se le avisa. */
const actualizado = ref(false)
const actualizando = ref(false)
const lista = useTemplateRef<HTMLUListElement>('lista')
const copia = ref<'copiado' | 'error' | null>(null)
let temporizadorCopia: ReturnType<typeof setTimeout> | undefined

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

/** El administrador agrega a la persona con este código (su UID de Firebase). */
async function copiarCodigo() {
  if (!sesion.uid) return
  clearTimeout(temporizadorCopia)
  try {
    // navigator.clipboard no existe fuera de HTTPS o si el navegador no da permiso
    if (!navigator.clipboard) throw new Error('Portapapeles no disponible')
    await navigator.clipboard.writeText(sesion.uid)
    copia.value = 'copiado'
    temporizadorCopia = setTimeout(() => (copia.value = null), 4000)
  } catch {
    copia.value = 'error'
  }
}

async function actualizar() {
  if (actualizando.value) return
  actualizando.value = true
  try {
    await cargar()
  } finally {
    actualizando.value = false
  }
  actualizado.value = true
  // Si ya aparecen cafeterías, el foco pasa a la primera para seguir con el teclado
  await nextTick()
  lista.value?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()
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

onBeforeUnmount(() => clearTimeout(temporizadorCopia))
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
      <p v-if="cargando && !actualizando" class="pantalla__descripcion" role="status">
        Cargando tus cafeterías…
      </p>

      <div v-else-if="!error && acceso.cafeterias.length === 0" class="sin-cafeteria">
        <MensajeAviso tipo="info">
          Tu cuenta está lista, pero todavía no perteneces a ninguna cafetería. Pide al
          administrador de tu cafetería que te agregue y compártele este código:
        </MensajeAviso>

        <div v-if="sesion.uid" class="codigo">
          <code id="codigo-usuario" class="codigo__valor">{{ sesion.uid }}</code>
          <button
            type="button"
            class="boton"
            aria-describedby="codigo-usuario"
            @click="copiarCodigo"
          >
            Copiar código
          </button>
        </div>
        <p class="codigo__aviso" role="status">
          <span v-if="copia === 'copiado'" class="codigo__aviso--exito">Copiado</span>
        </p>
        <MensajeAviso v-if="copia === 'error'" tipo="error">
          Tu navegador no permitió copiar. Selecciona el código y cópialo a mano.
        </MensajeAviso>

        <p v-if="actualizado" class="pantalla__descripcion" role="status">
          Todavía no apareces en ninguna cafetería. Intenta de nuevo cuando el administrador te
          confirme que te agregó.
        </p>
        <button
          type="button"
          class="boton boton--principal"
          :disabled="actualizando"
          @click="actualizar"
        >
          {{ actualizando ? 'Actualizando…' : 'Ya me agregaron, actualizar' }}
        </button>
      </div>

      <ul v-else ref="lista" class="lista-cafeterias">
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
.sin-cafeteria {
  display: grid;
  gap: 0.5rem;
  margin: 1rem 0;
}
.sin-cafeteria > .boton--principal {
  justify-self: start;
}
.codigo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}
.codigo__valor {
  flex: 1 1 12rem;
  min-width: 0;
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--color-borde-campo);
  border-radius: 6px;
  background: var(--color-arena);
  color: var(--color-texto);
  font-size: 0.9rem;
  overflow-wrap: anywhere;
  user-select: all;
}
.codigo__aviso {
  min-height: 1.2em;
  margin: 0;
  font-size: 0.9rem;
}
.codigo__aviso--exito {
  color: var(--color-ingreso-texto);
  font-weight: 600;
}
</style>
