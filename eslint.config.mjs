import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

/**
 * Reglas de la suite.
 *
 * Criterio para incluir una regla: que impida un fallo real, no que uniforme
 * el estilo. Varias sostienen cosas que el README afirma (cero esperas fijas,
 * ningún test.only), y una afirmación que solo vive en un README envejece mal.
 */
export default tseslint.config(
  {
    ignores: ['node_modules/', 'playwright-report/', 'test-results/', 'blob-report/'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    // Las reglas con información de tipos solo valen para lo que el tsconfig
    // incluye, y el tsconfig solo incluye TypeScript.
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Una promesa sin await hace que el test pase SIEMPRE: la aserción se
      // evalúa cuando ya ha terminado. La regla más útil del conjunto.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // `any` desactiva justo lo que se buscaba al elegir TypeScript.
      '@typescript-eslint/no-explicit-any': 'error',

      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
    },
  },

  {
    files: ['tests/**/*.spec.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,

      // Cero esperas fijas. `waitForTimeout` hace que el test pase hoy aquí y
      // falle el día que el runner vaya cargado.
      'playwright/no-wait-for-timeout': 'error',

      // Complementa a `forbidOnly`: allí se detecta al ejecutar, aquí antes.
      'playwright/no-focused-test': 'error',

      // Un `expect` sin await no espera nada y no comprueba nada.
      'playwright/missing-playwright-await': 'error',

      // Un assert dentro de un `if` puede no ejecutarse y el test pasa igual.
      'playwright/no-conditional-expect': 'error',
      'playwright/no-conditional-in-test': 'error',

      // Un test que solo navega comprueba únicamente que no hay excepción.
      'playwright/expect-expect': 'error',

      // `{ force: true }` se salta visibilidad y accionabilidad: oculta justo
      // el defecto que se busca.
      'playwright/no-force-option': 'error',

      // Restos de depuración.
      'playwright/no-page-pause': 'error',
      'playwright/no-skipped-test': 'warn',
    },
  },

  {
    // Scripts de Node sueltos, fuera del tsconfig: sin reglas de tipos.
    files: ['**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        URL: 'readonly',
      },
    },
  },
);
