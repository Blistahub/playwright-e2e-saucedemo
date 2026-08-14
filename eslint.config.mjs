import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

/**
 * Reglas de la suite.
 *
 * El criterio para incluir una regla es que **impida un fallo real**, no que
 * uniforme el estilo. La documentación de este repositorio afirma varias cosas
 * sobre cómo está escrita la suite —que no hay esperas fijas, que no queda
 * ningún test enfocado— y una afirmación que solo vive en un README envejece
 * mal. Las que se pueden comprobar con una regla se comprueban con una regla.
 */
export default tseslint.config(
  {
    ignores: ['node_modules/', 'playwright-report/', 'test-results/', 'blob-report/'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    /* Las reglas que necesitan información de tipos solo pueden aplicarse a lo
       que el tsconfig incluye, y el tsconfig solo incluye TypeScript. */
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      /* Una promesa sin await en un test produce el peor resultado posible:
         pasa siempre, porque la aserción se evalúa cuando el test ya terminó.
         Es la regla más valiosa del conjunto. */
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      /* `any` desactiva justo lo que se buscaba al elegir TypeScript. */
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

      /* La regla que sostiene una afirmación del README: cero esperas fijas.
         `waitForTimeout` hace que el test pase hoy en esta máquina y falle el
         día que el runner vaya cargado. Deja de ser un criterio de revisión
         que alguien puede olvidar y pasa a ser un error que corta la CI. */
      'playwright/no-wait-for-timeout': 'error',

      /* Complementa a `forbidOnly` de la configuración: allí se detecta al
         ejecutar en CI, aquí antes de llegar a abrir el pull request. */
      'playwright/no-focused-test': 'error',

      /* Un `expect` sin await no espera nada y no comprueba nada. */
      'playwright/missing-playwright-await': 'error',

      /* Una aserción dentro de un `if` puede no ejecutarse nunca, y el test
         pasaría igual sin haber comprobado nada. */
      'playwright/no-conditional-expect': 'error',
      'playwright/no-conditional-in-test': 'error',

      /* Todo test tiene que afirmar algo. Uno que solo navega comprueba
         únicamente que la aplicación no lanza una excepción. */
      'playwright/expect-expect': 'error',

      /* `{ force: true }` salta las comprobaciones de visibilidad y de que el
         elemento sea accionable: oculta justo el defecto que se busca. */
      'playwright/no-force-option': 'error',

      /* Restos de depuración que no deben llegar al repositorio. */
      'playwright/no-page-pause': 'error',
      'playwright/no-skipped-test': 'warn',
    },
  },

  {
    /* El verificador y esta propia configuración son scripts de Node sueltos,
       fuera del tsconfig: se les desactivan las reglas que exigen tipos. */
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
