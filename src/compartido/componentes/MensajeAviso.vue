<script setup lang="ts">
/** Aviso para errores de la API, confirmaciones e información. */
withDefaults(defineProps<{ tipo?: 'error' | 'exito' | 'info' }>(), { tipo: 'info' })
</script>

<template>
  <p class="aviso" :class="`aviso--${tipo}`" :role="tipo === 'error' ? 'alert' : 'status'">
    <slot />
  </p>
</template>

<style scoped>
.aviso {
  margin: 0.75rem 0;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border: 1px solid;
}
.aviso--error {
  background: var(--color-error-fondo);
  border-color: var(--color-error-borde);
  color: var(--color-error-texto);
}
.aviso--exito {
  background: var(--color-ingreso-fondo);
  border-color: var(--color-ingreso-borde);
  color: var(--color-ingreso-texto);
}
.aviso--info {
  background: var(--color-info-fondo);
  border-color: var(--color-info-borde);
  color: var(--color-texto);
}
</style>
