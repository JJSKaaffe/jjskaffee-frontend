import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'
import type { Linter } from 'eslint'

// Registrar egresos no está en esta entrega: no hay módulo egresos
const MODULOS = ['acceso', 'ingresos', 'movimientos']

function prohibirImports(group: string[], message: string): Linter.RulesRecord {
  return { 'no-restricted-imports': ['error', { patterns: [{ group, message }] }] }
}

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  // Reglas del diagrama de paquetes: las mismas que verifica ArchUnit en el backend.
  // Entre carpetas se importa siempre con "@/" para que estas reglas lo detecten.
  ...MODULOS.map((modulo) => ({
    name: `app/modulo-${modulo}`,
    files: [`src/modulos/${modulo}/**/*.{ts,vue}`],
    rules: prohibirImports(
      MODULOS.filter((otro) => otro !== modulo).map((otro) => `@/modulos/${otro}/**`),
      'Un módulo no importa otro módulo: lo común va en compartido.',
    ),
  })),
  {
    name: 'app/compartido',
    files: ['src/compartido/**/*.{ts,vue}'],
    rules: prohibirImports(['@/modulos/**'], 'compartido no depende de ningún módulo.'),
  },
  {
    name: 'app/solo-cliente-http',
    files: ['src/**/*.{ts,vue}'],
    ignores: ['src/compartido/api/clienteHttp.ts', 'src/**/__tests__/**'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'Las peticiones van por clienteHttp (compartido/api).' },
      ],
    } satisfies Linter.RulesRecord,
  },

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  skipFormatting,
)
