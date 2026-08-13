import { test, expect } from '../fixtures/test';
import { PASSWORD, USERS } from '../data/users';
import { INVALID_LOGINS } from '../data/invalid-credentials';
import { CATALOG_SIZE } from '../data/products';

/**
 * Acceso y cierre de sesión.
 *
 * Es el único fichero que usa `test` en lugar de `loggedInTest`: aquí la
 * sesión es el objeto de la prueba, no una precondición.
 */
test.describe('Acceso a la aplicación', () => {
  test('CP-01 · el usuario estándar accede y aterriza en el catálogo @humo', async ({
    page,
    loginPage,
    inventoryPage,
  }) => {
    await loginPage.goto();
    await loginPage.login(USERS.standard, PASSWORD);

    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(inventoryPage.title).toHaveText('Products');
    await expect(inventoryPage.items).toHaveCount(CATALOG_SIZE);
    /* El carrito arranca vacío: el contador no está en el DOM. */
    await expect(inventoryPage.cartBadge).toHaveCount(0);
  });

  /**
   * Test dirigido por datos: un caso por partición de acceso rechazado.
   *
   * El bucle genera cinco tests independientes, no uno con cinco
   * comprobaciones. La diferencia importa: si falla el usuario bloqueado, los
   * otros cuatro siguen ejecutándose y el reporte dice exactamente cuál se ha
   * roto, en lugar de detenerse en la primera aserción.
   */
  for (const scenario of INVALID_LOGINS) {
    test(`${scenario.id} · el acceso se rechaza con ${scenario.description}`, async ({
      page,
      loginPage,
    }) => {
      await loginPage.goto();
      await loginPage.login(scenario.username, scenario.password);

      await expect(loginPage.errorMessage).toHaveText(scenario.expectedError);
      /* No basta con que salga el error: hay que confirmar que no se ha
         entrado. Un mensaje de error sobre una sesión abierta sería peor
         defecto que el propio mensaje. */
      await expect(page).toHaveURL('/');
    });
  }

  test('CP-07 · el cierre de sesión invalida el acceso directo al catálogo @humo', async ({
    page,
    loginPage,
    inventoryPage,
  }) => {
    await loginPage.goto();
    await loginPage.login(USERS.standard, PASSWORD);
    await expect(page).toHaveURL(/\/inventory\.html$/);

    await inventoryPage.logout();
    await expect(page).toHaveURL('https://www.saucedemo.com/');
    await expect(loginPage.loginButton).toBeVisible();

    /* La comprobación que de verdad importa: que la sesión ha quedado
       invalidada en la aplicación, no solo que la interfaz ha vuelto al
       formulario. Se pide la ruta protegida directamente por URL. */
    await page.goto('/inventory.html');
    await expect(loginPage.errorMessage).toHaveText(
      "Epic sadface: You can only access '/inventory.html' when you are logged in.",
    );
  });
});
