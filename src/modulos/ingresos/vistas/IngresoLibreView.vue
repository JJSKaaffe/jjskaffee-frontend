<script setup lang="ts">
/**
 * Ingreso libre: dinero que entra al negocio y no es una venta del menú (solo administrador).
 * Monto > 0, máximo 10 dígitos enteros y 2 decimales, sin redondear (las mismas reglas del backend).
 */
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import MensajeAviso from '@/compartido/componentes/MensajeAviso.vue'
import { ErrorApi } from '@/compartido/api/clienteHttp'
import { formatoPesos } from '@/compartido/utils/formato'
import { useVentaStore } from '../store/ventaStore'

const MONTO_VALIDO = /^\d{1,10}([.,]\d{1,2})?$/

const venta = useVentaStore()

const idCategoria = ref('')
const montoTexto = ref('')
const descripcion = ref('')
const comprobante = ref('')

const cargando = ref(false)
const enviando = ref(false)
const tocado = ref(false)
const error = ref<string | null>(null)
const erroresCampo = ref<Record<string, string>>({})
const exito = ref<string | null>(null)
let claveIdempotencia: string | null = null

const categorias = computed(() => venta.catalogo?.categoriasIngreso ?? [])

const monto = computed(() => Number(montoTexto.value.trim().replace(',', '.')))

const erroresLocales = computed(() => {
  const errores: Record<string, string> = {}
  if (!idCategoria.value) errores.idCategoria = 'Elige una categoría'
  const texto = montoTexto.value.trim()
  if (!texto) errores.monto = 'El monto es obligatorio'
  else if (!MONTO_VALIDO.test(texto)) errores.monto = 'Máximo 10 dígitos enteros y 2 decimales'
  else if (monto.value <= 0) errores.monto = 'Debe ser mayor que 0'
  if (!descripcion.value.trim()) errores.descripcion = 'Escribe una descripción'
  return errores
})

function errorDe(campo: string): string | undefined {
  return erroresCampo.value[campo] ?? (tocado.value ? erroresLocales.value[campo] : undefined)
}

// Si cambia cualquier dato, ya es otro ingreso: otra clave de idempotencia
watch([idCategoria, montoTexto, descripcion, comprobante], () => {
  claveIdempotencia = null
  erroresCampo.value = {}
})

async function cargarCategorias() {
  error.value = null
  cargando.value = true
  try {
    await venta.cargarCatalogo()
  } catch (e) {
    error.value = e instanceof ErrorApi ? e.detalle : 'No se pudieron cargar las categorías.'
  } finally {
    cargando.value = false
  }
}

async function registrar() {
  tocado.value = true
  exito.value = null
  error.value = null
  if (Object.keys(erroresLocales.value).length > 0 || enviando.value) return

  enviando.value = true
  claveIdempotencia ??= crypto.randomUUID()
  try {
    const ingreso = await venta.registrarIngresoLibre(
      {
        idCategoria: idCategoria.value,
        monto: monto.value,
        descripcion: descripcion.value.trim(),
        comprobante: comprobante.value.trim() || undefined,
      },
      claveIdempotencia,
    )
    exito.value = `Ingreso de ${formatoPesos(ingreso.monto)} registrado en “${ingreso.categoria}”.`
    montoTexto.value = ''
    descripcion.value = ''
    comprobante.value = ''
    tocado.value = false
    claveIdempotencia = null
  } catch (e) {
    if (e instanceof ErrorApi) {
      erroresCampo.value = e.errores
      error.value = e.detalle
      if (e.estado !== 0 && e.estado < 500) claveIdempotencia = null
    } else {
      error.value = 'Ocurrió un error inesperado. Intenta de nuevo.'
    }
  } finally {
    enviando.value = false
  }
}

onMounted(() => {
  if (!venta.catalogo) void cargarCategorias()
})
</script>

<template>
  <section class="tarjeta tarjeta--media">
    <h1>Registrar ingreso libre</h1>
    <p class="pantalla__descripcion">
      Para dinero que entra al negocio y no es una venta del menú (por ejemplo, un aporte o un
      arriendo). Las ventas se registran en <RouterLink :to="{ name: 'venta' }">Venta</RouterLink>.
    </p>

    <p v-if="cargando" class="pantalla__descripcion" role="status">Cargando categorías…</p>
    <MensajeAviso v-else-if="venta.catalogo && categorias.length === 0" tipo="info">
      No hay categorías de ingreso activas en esta cafetería.
    </MensajeAviso>

    <form class="formulario" novalidate @submit.prevent="registrar">
      <label class="campo">
        <span>Categoría</span>
        <select
          v-model="idCategoria"
          required
          :aria-invalid="Boolean(errorDe('idCategoria'))"
          aria-describedby="error-categoria"
        >
          <option value="" disabled>Elige una categoría</option>
          <option v-for="c in categorias" :key="c.idCategoria" :value="c.idCategoria">
            {{ c.nombre }}
          </option>
        </select>
        <small id="error-categoria" class="campo__error">{{ errorDe('idCategoria') }}</small>
      </label>

      <label class="campo">
        <span>Monto (COP)</span>
        <input
          v-model="montoTexto"
          type="text"
          inputmode="decimal"
          placeholder="0"
          required
          :aria-invalid="Boolean(errorDe('monto'))"
          aria-describedby="error-monto"
        />
        <small id="error-monto" class="campo__error">{{ errorDe('monto') }}</small>
      </label>

      <label class="campo">
        <span>Descripción</span>
        <input
          v-model="descripcion"
          type="text"
          maxlength="200"
          required
          :aria-invalid="Boolean(errorDe('descripcion'))"
          aria-describedby="error-descripcion"
        />
        <small id="error-descripcion" class="campo__error">{{ errorDe('descripcion') }}</small>
      </label>

      <label class="campo">
        <span>Comprobante <em>(opcional)</em></span>
        <input
          v-model="comprobante"
          type="text"
          maxlength="50"
          placeholder="N.º de recibo o factura"
          :aria-invalid="Boolean(errorDe('comprobante'))"
          aria-describedby="error-comprobante"
        />
        <small id="error-comprobante" class="campo__error">{{ errorDe('comprobante') }}</small>
      </label>

      <MensajeAviso v-if="error" tipo="error">{{ error }}</MensajeAviso>
      <MensajeAviso v-if="exito" tipo="exito">
        {{ exito }}
        <RouterLink :to="{ name: 'movimientos' }">Ver movimientos</RouterLink>
      </MensajeAviso>

      <button
        type="submit"
        class="boton boton--principal"
        :disabled="enviando || categorias.length === 0"
      >
        {{ enviando ? 'Registrando…' : 'Registrar ingreso' }}
      </button>
    </form>
  </section>
</template>

<style scoped>
h1 {
  margin-top: 0;
}
em {
  color: var(--color-suave);
  font-style: normal;
  font-weight: 400;
}
</style>
