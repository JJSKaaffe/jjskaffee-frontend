<script setup lang="ts">
import { computed, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'

import MarcaJJSKaffee from '@/compartido/componentes/MarcaJJSKaffee.vue'
import type { Permiso, Rol } from '@/compartido/sesion/tipos'
import { useSesionStore } from '@/compartido/sesion/sesionStore'

const sesion = useSesionStore()
const ruta = useRoute()
const router = useRouter()

// Registrar egresos no está en esta entrega: el menú solo tiene ingresos y movimientos
const opciones: { nombre: string; texto: string; permiso?: Permiso }[] = [
  { nombre: 'venta', texto: 'Venta', permiso: 'REGISTRAR_VENTA' },
  { nombre: 'ingreso-libre', texto: 'Ingreso libre', permiso: 'REGISTRAR_INGRESO_LIBRE' },
  { nombre: 'movimientos', texto: 'Movimientos' },
]

const textoRol: Record<Rol, string> = { ADMINISTRADOR: 'Administrador', CAJERO: 'Cajero' }

// El menú muestra solo lo que el rol puede hacer en la cafetería elegida
const menu = computed(() => opciones.filter((o) => !o.permiso || sesion.tienePermiso(o.permiso)))
const conMenu = computed(() => sesion.autenticado && sesion.cafeteria !== null)
const rol = computed(() => (sesion.usuario ? textoRol[sesion.usuario.rol] : ''))

// Si la sesión se cierra o vence (401), vuelve a iniciar sesión
watch(
  () => sesion.autenticado,
  (autenticado) => {
    if (!autenticado && !ruta.meta.publica) void router.push({ name: 'iniciar-sesion' })
  },
)

// Título de la pestaña: "JJSKaffee" o, con cafetería elegida, "<cafetería> · JJSKaffee"
watch(
  () => (conMenu.value ? sesion.cafeteria?.nombre : null),
  (nombre) => {
    document.title = nombre ? `${nombre} · JJSKaffee` : 'JJSKaffee'
  },
  { immediate: true },
)

async function cerrarSesion() {
  await sesion.cerrarSesion()
}
</script>

<template>
  <header v-if="conMenu" class="barra">
    <div class="barra__fila">
      <div class="barra__identidad">
        <MarcaJJSKaffee class="barra__marca" />
        <span class="barra__cafeteria">
          <span class="solo-lectores">Cafetería: </span>{{ sesion.cafeteria?.nombre }}
        </span>
      </div>
      <div class="barra__sesion">
        <span v-if="rol" class="barra__rol"><span class="solo-lectores">Rol: </span>{{ rol }}</span>
        <RouterLink :to="{ name: 'elegir-cafeteria' }">Cambiar cafetería</RouterLink>
        <button type="button" @click="cerrarSesion">Cerrar sesión</button>
      </div>
    </div>
    <nav class="barra__menu" aria-label="Menú principal">
      <RouterLink v-for="opcion in menu" :key="opcion.nombre" :to="{ name: opcion.nombre }">
        {{ opcion.texto }}
      </RouterLink>
    </nav>
  </header>

  <main class="contenido">
    <RouterView />
  </main>
</template>

<style scoped>
.barra {
  background: var(--color-espresso);
  color: var(--color-sobre-oscuro);
}

.barra :focus-visible {
  outline-color: var(--color-caramelo);
}

.barra__fila {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1.5rem;
  padding: 0.75rem 1.5rem;
}

.barra__identidad {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  min-width: 0;
}

.barra .barra__marca {
  color: var(--color-sobre-oscuro);
}

.barra__cafeteria {
  padding-left: 0.75rem;
  border-left: 2px solid var(--color-caramelo);
  font-size: 1.15rem;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.barra__sesion {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
  color: var(--color-sobre-oscuro-suave);
  font-size: 0.9rem;
}

.barra__rol {
  padding: 0.1rem 0.6rem;
  border: 1px solid var(--color-caramelo);
  border-radius: 999px;
}

.barra__sesion a,
.barra__sesion button {
  padding: 0.25rem 0;
  border: none;
  background: transparent;
  color: var(--color-sobre-oscuro);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.barra__menu {
  display: flex;
  gap: 0.25rem;
  padding: 0 1rem;
  overflow-x: auto;
  border-top: 1px solid var(--color-cafe);
}

.barra__menu a {
  padding: 0.65rem 0.75rem;
  border-bottom: 3px solid transparent;
  color: var(--color-sobre-oscuro-suave);
  text-decoration: none;
  white-space: nowrap;
}

/* El menú tiene scroll horizontal: el foco va por dentro para que no se recorte */
.barra__menu a:focus-visible {
  outline-offset: -3px;
}

.barra__menu a:hover {
  color: var(--color-sobre-oscuro);
  border-bottom-color: var(--color-cafe);
}

.barra__menu a.router-link-active {
  color: var(--color-sobre-oscuro);
  font-weight: 600;
  border-bottom-color: var(--color-caramelo);
}

@media (max-width: 480px) {
  .barra__fila {
    padding: 0.75rem 1rem;
  }

  .barra__menu {
    padding: 0 0.25rem;
  }
}
</style>
