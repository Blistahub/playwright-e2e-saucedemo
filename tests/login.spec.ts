import { test, expect } from '../fixtures/test';
import { PASSWORD, USERS } from '../data/users';
import { INVALID_LOGINS } from '../data/invalid-credentials';
import { CATALOG_SIZE } from '../data/products';

/**
 * Acceso y cierre de sesión.
 *
 * Usa `test` y no `loggedInTest` porque aquí la sesión es lo que se prueba.
 * El otro fichero que lo hace es findings-performance, que la cronometra.
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
    // Carrito vacío: el contador ni siquiera está en el DOM.
    await expect(inventoryPage.cartBadge).toHaveCount(0);
  });

  /**
   * Un caso por partición de acceso rechazado.
   *
   * El bucle genera cinco tests independientes, no uno con cinco asserts: si
   * falla el bloqueado, los otros cuatro siguen y el informe dice cuál se rompió.
   */
  for (const scenario of INVALID_LOGINS) {
    test(`${scenario.id} · el acceso se rechaza con ${scenario.description}`, async ({
      page,
      loginPage,
    }) => {
      await loginPage.goto();
      await loginPage.login(scenario.username, scenario.password);

      await expect(loginPage.errorMessage).toHaveText(scenario.expectedError);
      // Que salga el error no basta: hay que confirmar que no se ha entrado.
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
    await expect(page).toHaveURL('/');
    await expect(loginPage.loginButton).toBeVisible();

    // Lo que importa: que la sesión esté invalidada en la app, no solo que la
    // interfaz haya vuelto al formulario. Se pide la ruta protegida por URL.
    await page.goto('/inventory.html');
    await expect(loginPage.errorMessage).toHaveText(
      "Epic sadface: You can only access '/inventory.html' when you are logged in.",
    );
  });
});
