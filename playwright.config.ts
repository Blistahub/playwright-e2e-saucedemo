import { defineConfig, devices } from '@playwright/test';

/**
 * Los tests unitarios se reparten entre proyectos con este patrón: el
 * proyecto `unidad` los recoge y los de navegador los excluyen. Sin la
 * exclusión se ejecutarían cuatro veces —una por proyecto— comprobando cada
 * vez exactamente lo mismo, porque no tocan la aplicación.
 */
const UNITARIOS = /.*\.unit\.spec\.ts$/;

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

  /* La concurrencia se limita en los dos entornos para no golpear SauceDemo
     más rápido de lo que lo haría una persona. En CI, 2 procesos; en local,
     4 en vez de los 8 que Playwright tomaría por defecto en esta máquina.
     El límite local sale gratis, y está medido: 4 procesos tardan 53,4 s y 8
     tardan 53,8 s, porque el cuello de botella es la latencia del sitio y no
     la CPU. Duplicar los navegadores simultáneos no acelera nada y solo carga
     un servicio ajeno. */
  workers: process.env.CI ? 2 : 4,

  timeout: 30_000,
  expect: { timeout: 7_000 },

  /* Reporters de la ejecución local. En CI no se usan estos: el workflow pasa
     `--reporter=blob,github`, que los sustituye por completo. El formato blob
     es el que permite unir después los tres navegadores en un solo informe, y
     el reporter `github` es el que anota los fallos sobre el diff del pull
     request. Declararlos aquí además de allí daría la falsa impresión de que
     esta rama de la configuración interviene en CI, y no interviene. */
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],

  use: {
    baseURL: 'https://www.saucedemo.com',

    /* SauceDemo expone atributos `data-test`, pensados para automatizar y
       estables frente a rediseños. Se declaran aquí una sola vez para que
       todos los Page Objects usen `getByTestId` sin repetir el selector CSS. */
    testIdAttribute: 'data-test',

    /* Evidencia proporcionada al coste, pero sin dejar huecos.
       En CI la traza se graba en el primer reintento: la ejecución verde no
       paga nada y el fallo llega con su diagnóstico.
       En local hay que invertir la regla, y esto costó aprenderlo: con
       `retries: 0`, un `on-first-retry` no se dispara nunca, así que un fallo
       intermitente se llevaba por delante la única prueba de por qué falló.
       Pasó de verdad con CP-18 en Firefox y no hubo forma de diagnosticarlo. */
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      /* La capa baja de la pirámide: la lógica pura de `support/money.ts`.
         No abre navegador, así que corre en el job de calidad —en
         milisegundos— en lugar de repetirse tres veces en la matriz. */
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
