import { test, expect } from '../fixtures/test';
import { PASSWORD, USERS } from '../data/users';
import type { LoginPage } from '../pages/LoginPage';
import type { InventoryPage } from '../pages/InventoryPage';

/**
 * Latencia de acceso.
 *
 * Va en su propio fichero porque necesita el ciclo de acceso completo bajo
 * medición, y la fixture `loggedInTest` lo resolvería antes de que empiece
 * el test: no se puede cronometrar algo que ya ha ocurrido.
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

/** Umbral de aceptación del acceso, en milisegundos. */
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
      description: `HAL-05 · performance_glitch_user tarda ~5 s en acceder, muy por encima de los ${LOGIN_BUDGET_MS} ms de presupuesto`,
    });

    /* El usuario estándar se mide primero como referencia. No forma parte del
       criterio de aceptación —sería un oráculo dependiente de lo rápido que
       vaya el runner de turno—, pero acompaña al fallo en el reporte y evita
       la duda de si lo lento era la aplicación o la máquina. */
    const standardMs = await measureLogin(loginPage, inventoryPage, USERS.standard);
    await inventoryPage.logout();
    await expect(page).toHaveURL('/');

    const glitchMs = await measureLogin(loginPage, inventoryPage, USERS.performanceGlitch);

    /* El umbral es absoluto y holgado a propósito: la demora de este usuario
       es una espera fija de unos 5 s introducida por la aplicación, así que
       2,5 s la separan con margen de cualquier lentitud del entorno. Un umbral
       ajustado convertiría el propio umbral en la causa del resultado. */
    expect(
      glitchMs,
      `Acceso de ${USERS.performanceGlitch}: ${glitchMs} ms · referencia de ${USERS.standard}: ${standardMs} ms`,
    ).toBeLessThanOrEqual(LOGIN_BUDGET_MS);
  });
});
