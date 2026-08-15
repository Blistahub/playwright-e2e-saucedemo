import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { CheckoutOverviewPage } from '../pages/CheckoutOverviewPage';
import { CheckoutCompletePage } from '../pages/CheckoutCompletePage';
import { PASSWORD, USERS, type UserName } from '../data/users';

interface PageObjects {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  productDetailPage: ProductDetailPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  overviewPage: CheckoutOverviewPage;
  completePage: CheckoutCompletePage;
}

/**
 * `test` — sin sesión.
 *
 * Solo inyecta los Page Objects. Lo usan las pruebas del propio acceso: si la
 * sesión ya estuviera abierta no habría nada que probar.
 */
export const test = base.extend<PageObjects>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  productDetailPage: async ({ page }, use) => {
    await use(new ProductDetailPage(page));
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
   * Usuario con el que se abre la sesión. Es una opción de Playwright, así que
   * un bloque puede cambiarla con `loggedInTest.use({ userName })`.
   *
   * Tipado a `UserName` y no a `string`: un usuario mal escrito así es error de
   * compilación, no un test que falla en el login por algo que no prueba.
   */
  userName: UserName;
}

/**
 * `loggedInTest` — con sesión ya abierta.
 *
 * La fixture `session` es automática, así que el login desaparece de los 23
 * casos que no lo están probando y cada título describe solo lo suyo.
 *
 * Se entra por la interfaz y no inyectando la cookie de sesión, que también
 * funciona y es más rápido. El porqué, en docs/01-plan-de-automatizacion.md
 * § 3.3.
 */
export const loggedInTest = test.extend<SessionOptions & { session: void }>({
  userName: [USERS.standard, { option: true }],

  session: [
    async ({ page, loginPage, userName }, use) => {
      await loginPage.goto();
      await loginPage.login(userName, PASSWORD);
      await expect(page).toHaveURL(/inventory\.html/);

      await use();

      // Sin limpieza: cada test recibe un contexto nuevo y el estado de
      // SauceDemo vive en una cookie que muere con él.
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
