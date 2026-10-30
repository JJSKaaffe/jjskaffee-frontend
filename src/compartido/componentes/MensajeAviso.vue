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
  background: #fdecea;
  border-color: #f5c2bc;
  color: #8a1c13;
}
.aviso--exito {
  background: #e8f5e9;
  border-color: #b7dfb9;
  color: #1e5e22;
}
.aviso--info {
  background: #eef4fb;
  border-color: #c5d9f0;
  color: #1f3a5f;
}
</style>
