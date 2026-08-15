import { test, expect } from '../fixtures/test';
import { PASSWORD, USERS } from '../data/users';
import type { LoginPage } from '../pages/LoginPage';
import type { InventoryPage } from '../pages/InventoryPage';

/**
 * Latencia de acceso.
 *
 * Va aparte porque hay que cronometrar el login entero, y la fixture
 * `loggedInTest` lo resolvería antes de empezar el test.
 */

/** Milisegundos entre pulsar «Login» y ver el catálogo. */
async function measureLogin(
  loginPage: LoginPage,
  inventoryPage: InventoryPage,
  username: string,
): Promise<number> {
  await loginPage.goto();
  await loginPage.usernameInput.fill(username);
  await loginPage.passwordInput.fill(PASSWORD);

  const start = Date.now();
  await loginPage.loginButton.click();
  await expect(inventoryPage.items.first()).toBeVisible();
  return Date.now() - start;
}

/** Presupuesto de tiempo del acceso, en ms. */
const LOGIN_BUDGET_MS = 2_500;

test.describe('Rendimiento del acceso', () => {
  test('HAL-05 · el acceso debe completarse dentro del presupuesto de tiempo @hallazgo', async ({
    loginPage,
    inventoryPage,
    page,
  }) => {
    test.fail();
    test.info().annotations.push({
      type: 'defecto',
      description: `HAL-05 · performance_glitch_user tarda ~5 s, muy por encima de ${LOGIN_BUDGET_MS} ms`,
    });

    // El usuario estándar se mide como referencia, no como criterio: eso
    // dependería de lo rápido que vaya el runner. Acompaña al fallo en el
    // informe y despeja la duda de si lo lento era la app o la máquina.
    const standardMs = await measureLogin(loginPage, inventoryPage, USERS.standard);
    await inventoryPage.logout();
    await expect(page).toHaveURL('/');

    const glitchMs = await measureLogin(loginPage, inventoryPage, USERS.performanceGlitch);

    // Umbral absoluto y holgado: la demora es una espera fija de unos 5 s que
    // mete la app, así que 2,5 s la separan de cualquier lentitud del entorno.
    expect(
      glitchMs,
      `Acceso de ${USERS.performanceGlitch}: ${glitchMs} ms · referencia de ${USERS.standard}: ${standardMs} ms`,
    ).toBeLessThanOrEqual(LOGIN_BUDGET_MS);
  });
});
