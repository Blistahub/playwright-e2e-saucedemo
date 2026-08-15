import { defineConfig, devices } from '@playwright/test';

/**
 * Los unitarios se reparten con este patrón: el proyecto `unidad` los recoge y
 * los de navegador los excluyen. Sin la exclusión correrían cuatro veces
 * comprobando lo mismo, porque no tocan la aplicación.
 */
const UNITARIOS = /.*\.unit\.spec\.ts$/;

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',

  fullyParallel: true,

  // Un `test.only` olvidado deja la suite en verde ocultando el resto.
  forbidOnly: !!process.env.CI,

  // Reintentos solo en CI, para absorber la variabilidad de red contra un sitio
  // ajeno. No ocultan nada: el informe marca el test como inestable.
  retries: process.env.CI ? 2 : 0,

  // Concurrencia limitada en los dos entornos para no golpear SauceDemo más
  // rápido que una persona. En local, 4 en vez de 8: medido, 53,4 s frente a
  // 53,8 s, porque el cuello de botella es la red y no la CPU.
  workers: process.env.CI ? 2 : 4,

  timeout: 30_000,
  expect: { timeout: 7_000 },

  // En CI el workflow pasa `--reporter=blob,github`, que sustituye a esto.
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],

  use: {
    baseURL: 'https://www.saucedemo.com',

    // SauceDemo expone atributos `data-test`. Se declara una vez y todos los
    // Page Objects usan getByTestId.
    testIdAttribute: 'data-test',

    // En CI, traza al primer reintento: la ejecución verde no paga nada.
    // En local hay que invertirlo, y costó aprenderlo: con retries a 0,
    // `on-first-retry` no salta nunca y un fallo intermitente se queda sin
    // diagnóstico. Pasó con CP-18 en Firefox.
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      // Capa baja: la lógica pura de support/money.ts. Sin navegador, corre en
      // el job de calidad.
      name: 'unidad',
      testMatch: UNITARIOS,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: UNITARIOS,
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: UNITARIOS,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: UNITARIOS,
    },
  ],
});
