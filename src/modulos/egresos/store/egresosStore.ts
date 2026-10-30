import { ref } from 'vue'
import { defineStore } from 'pinia'

import { egresosApi } from '../api/egresosApi'
import type { Egreso, EgresoRequest } from '../tipos/egresos'

export const useEgresosStore = defineStore('egresos', () => {
  const ultimoEgreso = ref<Egreso | null>(null)

  async function registrar(egreso: EgresoRequest): Promise<Egreso> {
    ultimoEgreso.value = await egresosApi.registrar(egreso)
    return ultimoEgreso.value
  }

  return { ultimoEgreso, registrar }
})
