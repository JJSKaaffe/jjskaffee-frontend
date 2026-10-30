import { ref } from 'vue'
import { defineStore } from 'pinia'

import { ingresosApi } from '../api/ingresosApi'
import type {
  CatalogoDeVenta,
  IngresoLibre,
  IngresoLibreRequest,
  ItemPedido,
  Venta,
} from '../tipos/ingresos'

/**
 * Estado de registrar ingreso: el catálogo de la cafetería y lo último que se registró.
 * Cada registro lleva una Idempotency-Key nueva; si la red falla y se reintenta con la misma
 * clave, el backend devuelve el mismo registro en vez de duplicarlo.
 */
export const useVentaStore = defineStore('venta', () => {
  const catalogo = ref<CatalogoDeVenta | null>(null)
  const ultimaVenta = ref<Venta | null>(null)

  async function cargarCatalogo(): Promise<void> {
    catalogo.value = await ingresosApi.catalogo()
  }

  async function registrarVenta(
    items: ItemPedido[],
    clave: string = crypto.randomUUID(),
  ): Promise<Venta> {
    const venta = await ingresosApi.registrarVenta({ items }, clave)
    ultimaVenta.value = venta
    return venta
  }

  async function deshacerUltimaVenta(): Promise<void> {
    if (!ultimaVenta.value) return
    await ingresosApi.deshacerVenta(ultimaVenta.value.idVenta)
    ultimaVenta.value = { ...ultimaVenta.value, estado: 'ANULADA' }
  }

  async function registrarIngresoLibre(
    ingreso: IngresoLibreRequest,
    clave: string = crypto.randomUUID(),
  ): Promise<IngresoLibre> {
    return ingresosApi.registrarIngresoLibre(ingreso, clave)
  }

  return {
    catalogo,
    ultimaVenta,
    cargarCatalogo,
    registrarVenta,
    deshacerUltimaVenta,
    registrarIngresoLibre,
  }
})
