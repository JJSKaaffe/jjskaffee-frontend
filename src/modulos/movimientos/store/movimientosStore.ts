import { ref } from 'vue'
import { defineStore } from 'pinia'

import { hoyEnColombia } from '@/compartido/utils/formato'
import { movimientosApi } from '../api/movimientosApi'
import type { FiltroMovimientos, Movimientos } from '../tipos/movimientos'

/** Listado de ingresos y egresos con filtros, paginación y totales. Por defecto, los de hoy. */
export const useMovimientosStore = defineStore('movimientos', () => {
  const filtro = ref<FiltroMovimientos>({
    desde: hoyEnColombia(),
    hasta: hoyEnColombia(),
    pagina: 0,
  })
  const resultado = ref<Movimientos | null>(null)

  async function cargar(cambios: Partial<FiltroMovimientos> = {}): Promise<void> {
    filtro.value = { ...filtro.value, ...cambios }
    resultado.value = await movimientosApi.consultar(filtro.value)
  }

  return { filtro, resultado, cargar }
})
