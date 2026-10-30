<script setup lang="ts">
import { computed, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'

import type { Permiso } from '@/compartido/sesion/tipos'
import { useSesionStore } from '@/compartido/sesion/sesionStore'

const sesion = useSesionStore()
const ruta = useRoute()
const router = useRouter()

const opciones: { nombre: string; texto: string; permiso?: Permiso }[] = [
  { nombre: 'venta', texto: 'Venta', permiso: 'REGISTRAR_VENTA' },
  { nombre: 'ingreso-libre', texto: 'Ingreso libre', permiso: 'REGISTRAR_INGRESO_LIBRE' },
  { nombre: 'egreso', texto: 'Egreso', permiso: 'REGISTRAR_EGRESO' },
  { nombre: 'movimientos', texto: 'Movimientos' },
]

// El menú muestra solo lo que el rol puede hacer en la cafetería elegida
const menu = computed(() => opciones.filter((o) => !o.permiso || sesion.tienePermiso(o.permiso)))
const conMenu = computed(() => sesion.autenticado && sesion.cafeteria !== null)

// Si la sesión se cierra o vence (401), vuelve a iniciar sesión
watch(
  () => sesion.autenticado,
  (autenticado) => {
    if (!autenticado && !ruta.meta.publica) void router.push({ name: 'iniciar-sesion' })
  },
)

async function cerrarSesion() {
  await sesion.cerrarSesion()
}
</script>

<template>
  <header v-if="conMenu" class="barra">
    <strong class="barra__marca">JJSKaffee</strong>
    <nav class="barra__menu">
      <RouterLink v-for="opcion in menu" :key="opcion.nombre" :to="{ name: opcion.nombre }">
        {{ opcion.texto }}
      </RouterLink>
    </nav>
    <div class="barra__sesion">
      <span
        >{{ sesion.cafeteria?.nombre }} ·
        {{ sesion.usuario?.rol === 'ADMINISTRADOR' ? 'Administrador' : 'Cajero' }}</span
      >
      <RouterLink :to="{ name: 'elegir-cafeteria' }">Cambiar cafetería</RouterLink>
      <button type="button" @click="cerrarSesion">Cerrar sesión</button>
    </div>
  </header>

  <main class="contenido">
    <RouterView />
  </main>
</template>

<style>
:root {
  --color-texto: #1f2328;
  --color-suave: #59636e;
  --color-marca: #6f4e37;
  --color-fondo: #faf8f6;
  --color-borde: #e3ddd6;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    sans-serif;
  color: var(--color-texto);
  background: var(--color-fondo);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

.barra {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: #ffffff;
  border-bottom: 1px solid var(--color-borde);
}

.barra__marca {
  color: var(--color-marca);
  font-size: 1.1rem;
}

.barra__menu {
  display: flex;
  gap: 1rem;
  flex: 1;
}

.barra a {
  color: var(--color-texto);
  text-decoration: none;
}

.barra a.router-link-active {
  color: var(--color-marca);
  font-weight: 600;
}

.barra__sesion {
  display: flex;
  gap: 1rem;
  align-items: center;
  color: var(--color-suave);
  font-size: 0.9rem;
}

.contenido {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.5rem;
}

.pantalla__descripcion {
  color: var(--color-suave);
}

.pantalla__pendiente {
  padding: 1rem;
  border: 1px dashed var(--color-borde);
  border-radius: 6px;
  background: #ffffff;
}

/* ---- Piezas comunes de las pantallas ---- */
.tarjeta {
  padding: 1.25rem;
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  background: #ffffff;
}

.tarjeta--angosta {
  max-width: 440px;
  margin: 3rem auto;
}

.tarjeta--media {
  max-width: 560px;
  margin: 1rem auto;
}

.formulario {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

.campo {
  display: grid;
  gap: 0.3rem;
  font-size: 0.9rem;
  font-weight: 600;
}

.campo input,
.campo select {
  width: 100%;
  padding: 0.6rem 0.7rem;
  border: 1px solid var(--color-borde);
  border-radius: 6px;
  background: #ffffff;
  font: inherit;
  font-weight: 400;
}

.campo input[aria-invalid='true'],
.campo select[aria-invalid='true'] {
  border-color: #b3261e;
}

.campo--en-linea input {
  min-width: 220px;
}

.campo__error {
  min-height: 1em;
  color: #b3261e;
  font-weight: 400;
}

.boton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.55rem 1rem;
  border: 1px solid var(--color-borde);
  border-radius: 6px;
  background: #ffffff;
  color: var(--color-texto);
  font: inherit;
  cursor: pointer;
}

.boton:hover:not(:disabled) {
  border-color: var(--color-marca);
}

.boton:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.boton--principal {
  background: var(--color-marca);
  border-color: var(--color-marca);
  color: #ffffff;
  font-weight: 600;
}

.boton--principal:hover:not(:disabled) {
  background: #5a3e2b;
}

.boton--grande {
  flex: 1;
  padding: 0.8rem 1rem;
  font-size: 1.05rem;
}

.boton--texto {
  border-color: transparent;
  background: transparent;
  color: var(--color-marca);
  text-decoration: underline;
  padding: 0.25rem 0.5rem;
}

.boton--icono {
  width: 2rem;
  height: 2rem;
  padding: 0;
  font-size: 1.1rem;
}

.barra button {
  border: none;
  background: transparent;
  color: var(--color-marca);
  font: inherit;
  cursor: pointer;
  text-decoration: underline;
}

.acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.etiqueta {
  display: inline-block;
  padding: 0.1rem 0.55rem;
  border-radius: 999px;
  background: #f1ebe5;
  color: var(--color-marca);
  font-size: 0.8rem;
  font-weight: 600;
}

:focus-visible {
  outline: 2px solid var(--color-marca);
  outline-offset: 2px;
}

.solo-lectores {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
