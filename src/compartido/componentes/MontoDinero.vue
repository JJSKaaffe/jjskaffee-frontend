<script setup lang="ts">
import { computed } from 'vue'

import { formatoPesos } from '@/compartido/utils/formato'

/** Muestra un valor en pesos. Con "signo", los ingresos salen en verde y los egresos en rojo (ADR-0008). */
const props = defineProps<{ valor: number; signo?: 'ingreso' | 'egreso' }>()

const texto = computed(() => formatoPesos(props.valor))
</script>

<template>
  <span class="monto" :class="signo ? `monto--${signo}` : ''">{{ texto }}</span>
</template>

<style scoped>
.monto {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.monto--ingreso {
  color: var(--color-ingreso);
}
.monto--egreso {
  color: var(--color-error);
}
</style>
