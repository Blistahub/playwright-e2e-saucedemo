import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de la suite E2E sobre SauceDemo.
 *
 * Las decisiones que no son obvias van comentadas: en un framework de pruebas
 * la configuración es tan revisable como el código de los tests, y un valor
 * puesto "porque sí" acaba siendo la causa de un test inestable.
 */
export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',

  /* Cada fichero de test se ejecuta en paralelo con los demás. */
  fullyParallel: true,

  /* Un `test.only` olvidado deja pasar la suite en verde ocultando el resto:
     en CI se trata como error de configuración, no como conveniencia. */
  forbidOnly: !!process.env.CI,

  /* Reintentos solo en CI. En local un fallo debe verse a la primera; en CI
     absorben la variabilidad de red contra un sitio de terceros. El reintento
     no oculta nada: el reporte marca el test como inestable ("flaky"). */
  retries: process.env.CI ? 2 : 0,

  /* En CI se limita la concurrencia para no saturar el runner ni golpear
     SauceDemo más rápido de lo que lo haría una persona. */
  workers: process.env.CI ? 2 : undefined,

  timeout: 30_000,
  expect: { timeout: 7_000 },

  reporter: process.env.CI
    ? [
        ['list'],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
        /* Anota los fallos directamente sobre el diff del pull request. */
        ['github'],
      ]
    : [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],

  use: {
    baseURL: 'https://www.saucedemo.com',

    /* SauceDemo expone atributos `data-test`, pensados para automatizar y
       estables frente a rediseños. Se declaran aquí una sola vez para que
       todos los Page Objects usen `getByTestId` sin repetir el selector CSS. */
    testIdAttribute: 'data-test',

    /* Evidencia proporcionada al coste: la traza solo se graba cuando un test
       ya ha fallado una vez, no en cada ejecución verde. */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
