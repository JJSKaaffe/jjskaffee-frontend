<script setup lang="ts">
/**
 * Registrar una venta (RF24–RF27). El cajero toca productos, les marca adiciones y cobra.
 * El total que se ve aquí es un estimado: el que vale lo calcula el servidor con el catálogo.
 * Teclado: Tab para moverse, Enter para agregar o cobrar, Esc para vaciar el pedido.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import MensajeAviso from '@/compartido/componentes/MensajeAviso.vue'
import MontoDinero from '@/compartido/componentes/MontoDinero.vue'
import { ErrorApi } from '@/compartido/api/clienteHttp'
import { formatoPesos } from '@/compartido/utils/formato'
import { useVentaStore } from '../store/ventaStore'
import type { ItemPedido, ProductoDelMenu } from '../tipos/ingresos'

const SEGUNDOS_PARA_DESHACER = 60

interface LineaPedido {
  clave: number
  producto: ProductoDelMenu
  cantidad: number
  /** Adiciones marcadas; se cobra una por cada unidad del producto. */
  adiciones: Set<string>
}

const venta = useVentaStore()

const cargando = ref(false)
const errorCatalogo = ref<string | null>(null)
const busqueda = ref('')
const pedido = ref<LineaPedido[]>([])
let siguienteClave = 1

const cobrando = ref(false)
const error = ref<string | null>(null)
const exito = ref<string | null>(null)
/** Se reutiliza si el cobro falla por red: el reintento no duplica la venta. */
let claveIdempotencia: string | null = null

const segundosRestantes = ref(0)
const deshaciendo = ref(false)
let temporizador: ReturnType<typeof setInterval> | null = null

const productosFiltrados = computed(() => {
  const texto = busqueda.value.trim().toLocaleLowerCase('es')
  const productos = venta.catalogo?.productos ?? []
  return texto
    ? productos.filter((p) => p.nombre.toLocaleLowerCase('es').includes(texto))
    : productos
})

function precioLinea(linea: LineaPedido): number {
  const adiciones = linea.producto.adiciones
    .filter((a) => linea.adiciones.has(a.idProducto))
    .reduce((suma, a) => suma + a.precio, 0)
  return linea.cantidad * (linea.producto.precio + adiciones)
}

const totalEstimado = computed(() => pedido.value.reduce((suma, l) => suma + precioLinea(l), 0))
const unidades = computed(() => pedido.value.reduce((suma, l) => suma + l.cantidad, 0))

// Si el pedido cambia, ya es otra venta: necesita otra clave de idempotencia
watch(pedido, () => (claveIdempotencia = null), { deep: true })

function mensaje(e: unknown): string {
  if (e instanceof ErrorApi) {
    const detalles = Object.values(e.errores)
    return detalles.length ? `${e.detalle} ${detalles.join('. ')}` : e.detalle
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.'
}

async function cargarCatalogo() {
  errorCatalogo.value = null
  cargando.value = true
  try {
    await venta.cargarCatalogo()
  } catch (e) {
    errorCatalogo.value = mensaje(e)
  } finally {
    cargando.value = false
  }
}

function agregar(producto: ProductoDelMenu) {
  exito.value = null
  error.value = null
  // Un toque más sobre el mismo producto sin adiciones suma una unidad a esa línea
  const existente = pedido.value.find(
    (l) => l.producto.idProducto === producto.idProducto && l.adiciones.size === 0,
  )
  if (existente && existente.cantidad < 99) existente.cantidad++
  else pedido.value.push({ clave: siguienteClave++, producto, cantidad: 1, adiciones: new Set() })
}

function cambiarCantidad(linea: LineaPedido, delta: number) {
  const nueva = linea.cantidad + delta
  if (nueva < 1) quitar(linea)
  else if (nueva <= 99) linea.cantidad = nueva
}

function quitar(linea: LineaPedido) {
  pedido.value = pedido.value.filter((l) => l.clave !== linea.clave)
}

function alternarAdicion(linea: LineaPedido, idAdicion: string) {
  if (linea.adiciones.has(idAdicion)) linea.adiciones.delete(idAdicion)
  else linea.adiciones.add(idAdicion)
}

function vaciar() {
  pedido.value = []
  error.value = null
}

function aItems(): ItemPedido[] {
  return pedido.value.map((l) => ({
    idProducto: l.producto.idProducto,
    cantidad: l.cantidad,
    adiciones: [...l.adiciones].map((idProducto) => ({ idProducto, cantidad: l.cantidad })),
  }))
}

async function cobrar() {
  if (cobrando.value || pedido.value.length === 0) return
  error.value = null
  exito.value = null
  cobrando.value = true
  claveIdempotencia ??= crypto.randomUUID()
  try {
    const registrada = await venta.registrarVenta(aItems(), claveIdempotencia)
    pedido.value = []
    claveIdempotencia = null
    exito.value = `Venta registrada por ${formatoPesos(registrada.total)}.`
    iniciarCuentaRegresiva()
  } catch (e) {
    // Sin conexión o error del servidor: se conserva la clave para reintentar sin duplicar
    if (!(e instanceof ErrorApi) || (e.estado !== 0 && e.estado < 500)) claveIdempotencia = null
    error.value = mensaje(e)
  } finally {
    cobrando.value = false
  }
}

function iniciarCuentaRegresiva() {
  detenerCuentaRegresiva()
  segundosRestantes.value = SEGUNDOS_PARA_DESHACER
  temporizador = setInterval(() => {
    segundosRestantes.value--
    if (segundosRestantes.value <= 0) detenerCuentaRegresiva()
  }, 1000)
}

function detenerCuentaRegresiva() {
  if (temporizador) clearInterval(temporizador)
  temporizador = null
  if (segundosRestantes.value < 0) segundosRestantes.value = 0
}

async function deshacer() {
  if (deshaciendo.value) return
  deshaciendo.value = true
  error.value = null
  try {
    await venta.deshacerUltimaVenta()
    exito.value = 'Venta anulada.'
    segundosRestantes.value = 0
    detenerCuentaRegresiva()
  } catch (e) {
    error.value = mensaje(e)
  } finally {
    deshaciendo.value = false
  }
}

function alPresionarTecla(evento: KeyboardEvent) {
  if (evento.key === 'Escape' && pedido.value.length > 0 && !cobrando.value) vaciar()
}

onMounted(() => {
  window.addEventListener('keydown', alPresionarTecla)
  void cargarCatalogo()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', alPresionarTecla)
  detenerCuentaRegresiva()
})
</script>

<template>
  <section class="venta">
    <div class="venta__catalogo">
      <div class="encabezado">
        <h1>Registrar venta</h1>
        <label class="campo campo--en-linea">
          <span class="solo-lectores">Buscar producto</span>
          <input v-model="busqueda" type="search" placeholder="Buscar producto…" />
        </label>
      </div>

      <MensajeAviso v-if="errorCatalogo" tipo="error">
        {{ errorCatalogo }}
        <button type="button" class="boton boton--texto" @click="cargarCatalogo">Reintentar</button>
      </MensajeAviso>
      <p v-else-if="cargando" class="pantalla__descripcion" role="status">Cargando el menú…</p>
      <MensajeAviso v-else-if="venta.catalogo && venta.catalogo.productos.length === 0">
        La cafetería todavía no tiene productos disponibles en el menú.
      </MensajeAviso>
      <p v-else-if="productosFiltrados.length === 0" class="pantalla__descripcion">
        Ningún producto coincide con “{{ busqueda }}”.
      </p>

      <ul v-else class="productos" aria-label="Productos del menú">
        <li v-for="producto in productosFiltrados" :key="producto.idProducto">
          <button type="button" class="producto" @click="agregar(producto)">
            <span class="producto__nombre">{{ producto.nombre }}</span>
            <MontoDinero :valor="producto.precio" />
            <span v-if="producto.adiciones.length" class="producto__nota">
              {{ producto.adiciones.length }}
              {{ producto.adiciones.length === 1 ? 'adición' : 'adiciones' }}
            </span>
          </button>
        </li>
      </ul>
    </div>

    <aside class="venta__pedido tarjeta" aria-labelledby="titulo-pedido">
      <h2 id="titulo-pedido">Pedido</h2>

      <p v-if="pedido.length === 0" class="pantalla__descripcion">
        Toca un producto para agregarlo.
      </p>

      <ul v-else class="lineas">
        <li v-for="linea in pedido" :key="linea.clave" class="linea">
          <div class="linea__fila">
            <span class="linea__nombre">{{ linea.producto.nombre }}</span>
            <MontoDinero :valor="precioLinea(linea)" />
          </div>
          <div class="linea__fila">
            <div class="cantidad" role="group" :aria-label="`Cantidad de ${linea.producto.nombre}`">
              <button
                type="button"
                class="boton boton--icono"
                :aria-label="linea.cantidad === 1 ? 'Quitar' : 'Restar uno'"
                @click="cambiarCantidad(linea, -1)"
              >
                −
              </button>
              <span aria-live="polite">{{ linea.cantidad }}</span>
              <button
                type="button"
                class="boton boton--icono"
                aria-label="Sumar uno"
                :disabled="linea.cantidad >= 99"
                @click="cambiarCantidad(linea, 1)"
              >
                +
              </button>
            </div>
            <button type="button" class="boton boton--texto" @click="quitar(linea)">Quitar</button>
          </div>
          <div v-if="linea.producto.adiciones.length" class="adiciones">
            <button
              v-for="adicion in linea.producto.adiciones"
              :key="adicion.idProducto"
              type="button"
              class="chip"
              :aria-pressed="linea.adiciones.has(adicion.idProducto)"
              @click="alternarAdicion(linea, adicion.idProducto)"
            >
              + {{ adicion.nombre }} <MontoDinero :valor="adicion.precio" />
            </button>
          </div>
        </li>
      </ul>

      <div class="total">
        <span>Total estimado ({{ unidades }} {{ unidades === 1 ? 'unidad' : 'unidades' }})</span>
        <strong><MontoDinero :valor="totalEstimado" /></strong>
      </div>

      <MensajeAviso v-if="error" tipo="error">{{ error }}</MensajeAviso>
      <MensajeAviso v-if="exito" tipo="exito">
        {{ exito }}
        <button
          v-if="segundosRestantes > 0 && venta.ultimaVenta?.estado === 'CONFIRMADA'"
          type="button"
          class="boton boton--texto"
          :disabled="deshaciendo"
          @click="deshacer"
        >
          {{ deshaciendo ? 'Deshaciendo…' : `Deshacer (${segundosRestantes} s)` }}
        </button>
      </MensajeAviso>

      <div class="acciones">
        <button
          type="button"
          class="boton"
          :disabled="pedido.length === 0 || cobrando"
          @click="vaciar"
        >
          Vaciar <kbd>Esc</kbd>
        </button>
        <button
          type="button"
          class="boton boton--principal boton--grande"
          :disabled="pedido.length === 0 || cobrando"
          @click="cobrar"
        >
          {{ cobrando ? 'Cobrando…' : 'Cobrar' }}
        </button>
      </div>
    </aside>
  </section>
</template>

<style scoped>
.venta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 1.5rem;
  align-items: start;
}
@media (max-width: 800px) {
  .venta {
    grid-template-columns: 1fr;
  }
}
.encabezado {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
}
h1 {
  margin: 0;
}
h2 {
  margin: 0 0 0.75rem;
  font-size: 1.15rem;
}
.productos {
  list-style: none;
  margin: 1rem 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
  max-height: 70vh;
  overflow-y: auto;
}
.producto {
  width: 100%;
  min-height: 92px;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-start;
  padding: 0.8rem;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background: #ffffff;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.producto:hover {
  border-color: var(--color-marca);
}
.producto__nombre {
  font-weight: 600;
}
.producto__nota {
  color: var(--color-suave);
  font-size: 0.8rem;
}
.venta__pedido {
  position: sticky;
  top: 1rem;
}
.lineas {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 45vh;
  overflow-y: auto;
}
.linea {
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--color-borde);
}
.linea__fila {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}
.linea__nombre {
  font-weight: 600;
}
.cantidad {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.35rem;
}
.cantidad span {
  min-width: 1.5rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.adiciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.5rem;
}
.chip {
  padding: 0.25rem 0.6rem;
  border: 1px solid var(--color-borde);
  border-radius: 999px;
  background: #ffffff;
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}
.chip[aria-pressed='true'] {
  background: var(--color-marca);
  border-color: var(--color-marca);
  color: #ffffff;
}
.chip[aria-pressed='true'] :deep(.monto) {
  color: inherit;
}
.total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: 1rem 0 0.5rem;
  font-size: 1.05rem;
}
kbd {
  font: inherit;
  font-size: 0.75rem;
  padding: 0 0.3rem;
  border: 1px solid var(--color-borde);
  border-radius: 4px;
  color: var(--color-suave);
}
</style>
