<script setup lang="ts">
/**
 * Marca de JJSKaffee: taza de café + nombre. Es la misma en todas las cafeterías.
 * La taza y el texto toman el color del texto (currentColor); el vapor va en caramelo.
 * "grande" para iniciar sesión y elegir cafetería, "pequena" para la barra superior.
 */
withDefaults(defineProps<{ tamano?: 'grande' | 'pequena' }>(), { tamano: 'pequena' })
</script>

<template>
  <span class="marca" :class="`marca--${tamano}`">
    <!-- La misma taza de public/favicon.svg -->
    <svg class="marca__taza" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path class="marca__vapor" d="M11.5 3.5c-1.6 1.4 1.6 2.6 0 4M17.5 3.5c-1.6 1.4 1.6 2.6 0 4" />
      <path class="marca__cuerpo" d="M5 11.5h19v5.5a7.5 7.5 0 0 1-7.5 7.5h-4A7.5 7.5 0 0 1 5 17z" />
      <path class="marca__trazo" d="M24 13.5h1.5a3.25 3.25 0 0 1 0 6.5H23M3 28h23" />
    </svg>
    <span class="marca__nombre">JJSKaffee</span>
  </span>
</template>

<style scoped>
.marca {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  color: var(--color-marca);
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1;
  white-space: nowrap;
}
.marca--grande {
  font-size: 2rem;
}
.marca--pequena {
  font-size: 1.1rem;
}
.marca__taza {
  width: 1.5em;
  height: 1.5em;
  flex-shrink: 0;
}
.marca__cuerpo {
  fill: currentColor;
}
.marca__trazo,
.marca__vapor {
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.marca__vapor {
  stroke: var(--color-caramelo);
}
</style>
