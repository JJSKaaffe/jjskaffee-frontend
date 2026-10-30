<script setup lang="ts">
/**
 * Ingresos y egresos con filtros, paginación y totales del filtro completo (RF9, RF17, RF38).
 * El administrador ve todo lo de la cafetería; el cajero, solo lo que él registró.
 * No es en tiempo real: se actualiza al consultar.
 */
import { computed, onMounted, ref } from 'vue'

import MensajeAviso from '@/compartido/componentes/MensajeAviso.vue'
import MontoDinero from '@/compartido/componentes/MontoDinero.vue'
import { ErrorApi } from '@/compartido/api/clienteHttp'
import { useSesionStore } from '@/compartido/sesion/sesionStore'
import { formatoFechaHora, hoyEnColombia } from '@/compartido/utils/formato'
import { useMovimientosStore } from '../store/movimientosStore'
import type { TipoMovimiento } from '../tipos/movimientos'

const movimientos = useMovimientosStore()
const sesion = useSesionStore()

const desde = ref(movimientos.filtro.desde ?? hoyEnColombia())
const hasta = ref(movimientos.filtro.hasta ?? hoyEnColombia())
const tipo = ref<TipoMovimiento | ''>(movimientos.filtro.tipo ?? '')

const cargando = ref(false)
const error = ref<string | null>(null)

const veTodo = computed(() => sesion.tienePermiso('VER_TODOS_LOS_MOVIMIENTOS'))
const resultado = computed(() => movimientos.resultado)
const totalPaginas = computed(() => {
  const r = resultado.value
  return r ? Math.max(1, Math.ceil(r.totalMovimientos / r.tamano)) : 1
})
const rangoInvalido = computed(() =>
  Boolean(desde.value && hasta.value && desde.value > hasta.value),
)

async function consultar(pagina = 0) {
  if (rangoInvalido.value) return
  error.value = null
  cargando.value = true
  try {
    await movimientos.cargar({
      desde: desde.value || undefined,
      hasta: hasta.value || undefined,
      tipo: tipo.value || undefined,
      pagina,
    })
  } catch (e) {
    error.value = e instanceof ErrorApi ? e.detalle : 'No se pudieron cargar los movimientos.'
  } finally {
    cargando.value = false
  }
}

function rapido(dias: number) {
  const fin = new Date()
  const inicio = new Date(fin.getTime() - (dias - 1) * 24 * 60 * 60 * 1000)
  desde.value = hoyEnColombia(inicio)
  hasta.value = hoyEnColombia(fin)
  void consultar()
}

onMounted(() => void consultar(movimientos.filtro.pagina ?? 0))
</script>

<template>
  <section>
    <h1>Movimientos</h1>
    <p class="pantalla__descripcion">
      {{
        veTodo
          ? 'Todos los ingresos y egresos de la cafetería.'
          : 'Los ingresos que tú registraste.'
      }}
      Fechas en hora de Colombia.
    </p>

    <form class="filtros tarjeta" @submit.prevent="consultar()">
      <label class="campo">
        <span>Desde</span>
        <input v-model="desde" type="date" :max="hasta || undefined" />
      </label>
      <label class="campo">
        <span>Hasta</span>
        <input v-model="hasta" type="date" :min="desde || undefined" />
      </label>
      <label class="campo">
        <span>Tipo</span>
        <select v-model="tipo">
          <option value="">Todos</option>
          <option value="INGRESO">Ingresos</option>
          <option value="EGRESO">Egresos</option>
        </select>
      </label>
      <div class="filtros__acciones">
        <button type="submit" class="boton boton--principal" :disabled="cargando || rangoInvalido">
          {{ cargando ? 'Consultando…' : 'Consultar' }}
        </button>
        <button type="button" class="boton" :disabled="cargando" @click="rapido(1)">Hoy</button>
        <button type="button" class="boton" :disabled="cargando" @click="rapido(7)">7 días</button>
        <button type="button" class="boton" :disabled="cargando" @click="rapido(30)">
          30 días
        </button>
      </div>
    </form>

    <MensajeAviso v-if="rangoInvalido" tipo="error">
      La fecha “desde” no puede ser posterior a “hasta”.
    </MensajeAviso>
    <MensajeAviso v-if="error" tipo="error">{{ error }}</MensajeAviso>

    <template v-if="resultado">
      <div class="totales" aria-live="polite">
        <div class="total tarjeta">
          <span>Ingresos</span>
          <strong><MontoDinero :valor="resultado.totales.ingresos" signo="ingreso" /></strong>
        </div>
        <div class="total tarjeta">
          <span>Egresos</span>
          <strong><MontoDinero :valor="resultado.totales.egresos" signo="egreso" /></strong>
        </div>
        <div class="total tarjeta">
          <span>Balance</span>
          <strong>
            <MontoDinero
              :valor="resultado.totales.balance"
              :signo="resultado.totales.balance < 0 ? 'egreso' : 'ingreso'"
            />
          </strong>
        </div>
      </div>

      <MensajeAviso v-if="resultado.movimientos.length === 0" tipo="info">
        No hay movimientos con estos filtros.
      </MensajeAviso>

      <div v-else class="tabla-contenedor tarjeta">
        <table class="tabla">
          <caption class="solo-lectores">
            Movimientos del filtro, página
            {{
              resultado.pagina + 1
            }}
            de
            {{
              totalPaginas
            }}
          </caption>
          <thead>
            <tr>
              <th scope="col">Fecha y hora</th>
              <th scope="col">Tipo</th>
              <th scope="col">Descripción</th>
              <th scope="col">Categoría</th>
              <th v-if="veTodo" scope="col">Registró</th>
              <th scope="col" class="numero">Monto</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in resultado.movimientos" :key="m.idMovimiento">
              <td>{{ formatoFechaHora(m.fechaHora) }}</td>
              <td>
                <span class="etiqueta" :class="`etiqueta--${m.tipo.toLowerCase()}`">
                  {{ m.tipo === 'INGRESO' ? 'Ingreso' : 'Egreso' }}
                </span>
              </td>
              <td>{{ m.descripcion }}</td>
              <td>{{ m.categoria ?? 'Venta' }}</td>
              <td v-if="veTodo">{{ m.registradoPor }}</td>
              <td class="numero">
                <MontoDinero
                  :valor="m.tipo === 'EGRESO' ? -m.monto : m.monto"
                  :signo="m.tipo === 'EGRESO' ? 'egreso' : 'ingreso'"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <nav v-if="totalPaginas > 1" class="paginacion" aria-label="Paginación">
        <button
          type="button"
          class="boton"
          :disabled="cargando || resultado.pagina === 0"
          @click="consultar(resultado.pagina - 1)"
        >
          Anterior
        </button>
        <span>
          Página {{ resultado.pagina + 1 }} de {{ totalPaginas }} ·
          {{ resultado.totalMovimientos }} movimientos
        </span>
        <button
          type="button"
          class="boton"
          :disabled="cargando || resultado.pagina + 1 >= totalPaginas"
          @click="consultar(resultado.pagina + 1)"
        >
          Siguiente
        </button>
      </nav>
    </template>
    <p v-else-if="cargando" class="pantalla__descripcion" role="status">Cargando movimientos…</p>
  </section>
</template>

<style scoped>
h1 {
  margin: 0;
}
.filtros {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
  margin: 1rem 0;
}
.filtros .campo {
  min-width: 150px;
}
.filtros__acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.totales {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.total {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.total span {
  color: var(--color-suave);
  font-size: 0.9rem;
}
.total strong {
  font-size: 1.35rem;
}
.tabla-contenedor {
  padding: 0;
  overflow-x: auto;
}
.tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}
.tabla th,
.tabla td {
  padding: 0.6rem 0.9rem;
  text-align: left;
  border-bottom: 1px solid var(--color-borde);
}
.tabla th {
  color: var(--color-suave);
  font-weight: 600;
  font-size: 0.85rem;
}
.tabla tbody tr:last-child td {
  border-bottom: none;
}
.numero {
  text-align: right !important;
}
.etiqueta--ingreso {
  background: #e8f5e9;
  color: #1e5e22;
}
.etiqueta--egreso {
  background: #fdecea;
  color: #8a1c13;
}
.paginacion {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
  color: var(--color-suave);
}
</style>
