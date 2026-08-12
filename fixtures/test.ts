import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { CheckoutOverviewPage } from '../pages/CheckoutOverviewPage';
import { CheckoutCompletePage } from '../pages/CheckoutCompletePage';
import { PASSWORD, USERS } from '../data/users';

/** Page Objects que se inyectan en los tests ya construidos sobre la página. */
interface PageObjects {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  overviewPage: CheckoutOverviewPage;
  completePage: CheckoutCompletePage;
}

/**
 * `test` — sin sesión iniciada.
 *
 * Inyecta los Page Objects y nada más. Lo usan las pruebas que prueban el
 * propio acceso: si la sesión ya estuviera abierta no habría nada que probar.
 */
export const test = base.extend<PageObjects>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  overviewPage: async ({ page }, use) => {
    await use(new CheckoutOverviewPage(page));
  },
  completePage: async ({ page }, use) => {
    await use(new CheckoutCompletePage(page));
  },
});

interface SessionOptions {
  /**
   * Usuario con el que se abre la sesión. Se declara como opción de Playwright,
   * así que un bloque de tests puede cambiarlo con
   * `loggedInTest.use({ userName: USERS.problem })` sin tocar los tests.
   */
  userName: string;
}

/**
 * `loggedInTest` — con la sesión ya iniciada.
 *
 * La fixture `session` es automática: se ejecuta antes de cada test sin que
 * este tenga que pedirla. Así el acceso deja de aparecer en veinte tests que
 * no lo están probando, y el título del test describe solo lo que comprueba.
 *
 * El acceso se hace por la interfaz y no inyectando la cookie de sesión, que
 * también funcionaría y sería más rápido. El motivo está razonado en
 * `docs/01-plan-de-automatizacion.md` (§ «Por qué el acceso va por la
 * interfaz»): con seis tests de carrito el ahorro es de segundos, y a cambio
 * la suite dejaría de recorrer cada día el camino por el que entran todos los
 * usuarios reales.
 */
export const loggedInTest = test.extend<SessionOptions & { session: void }>({
  userName: [USERS.standard, { option: true }],

  session: [
    async ({ page, loginPage, userName }, use) => {
      await loginPage.goto();
      await loginPage.login(userName, PASSWORD);
      await expect(page).toHaveURL(/inventory\.html/);

      await use();

      /* No hace falta limpiar el carrito ni cerrar la sesión: cada test recibe
         un contexto de navegador nuevo, y el estado de SauceDemo vive en una
         cookie que muere con él. Un `reset app state` aquí daría una falsa
         sensación de aislamiento sobre algo que ya está aislado. */
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
