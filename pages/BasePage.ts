import type { Locator, Page } from '@playwright/test';

/** Cabecera y menú, que son iguales en todas las vistas tras el login. */
export abstract class BasePage {
  protected readonly page: Page;

  /** «Products», «Your Cart», «Checkout: Overview»… */
  readonly title: Locator;
  readonly cartLink: Locator;
  /** No existe en el DOM si el carrito está vacío. */
  readonly cartBadge: Locator;
  readonly menuButton: Locator;
  readonly logoutLink: Locator;

  protected constructor(page: Page) {
    this.page = page;
    this.title = page.getByTestId('title');
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');

    // OJO: el data-test="open-menu" está en el <img>, y el <button> que lo
    // envuelve se come el clic. Por data-test el test se queda colgado.
    this.menuButton = page.getByRole('button', { name: 'Open Menu' });

    this.logoutLink = page.getByTestId('logout-sidebar-link');

    // «Reset App State» no se declara: no lo usa ningún caso. Ver el hueco
    // declarado en docs/02-matriz-de-casos.md.
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  /** Devuelve 0 si el contador no está: así representa la app el carrito vacío. */
  async cartCount(): Promise<number> {
    if ((await this.cartBadge.count()) === 0) {
      return 0;
    }
    return Number.parseInt((await this.cartBadge.innerText()).trim(), 10);
  }

  async logout(): Promise<void> {
    await this.menuButton.click();
    await this.logoutLink.click();
  }
}
