import type { Locator, Page } from '@playwright/test';

/**
 * Base común a todas las vistas posteriores al acceso.
 *
 * Concentra la cabecera y el menú lateral, que están presentes en todas ellas.
 * Sin esta clase, el localizador del carrito estaría repetido en cuatro Page
 * Objects y un rediseño obligaría a corregirlo cuatro veces.
 */
export abstract class BasePage {
  protected readonly page: Page;

  /** Título de la vista actual: «Products», «Your Cart», «Checkout: Overview»… */
  readonly title: Locator;
  readonly cartLink: Locator;
  /** Contador del carrito. No existe en el DOM cuando el carrito está vacío. */
  readonly cartBadge: Locator;
  readonly menuButton: Locator;
  readonly logoutLink: Locator;

  protected constructor(page: Page) {
    this.page = page;
    this.title = page.getByTestId('title');
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');

    /* El atributo `data-test="open-menu"` está sobre el <img>, no sobre el
       <button> que lo contiene, y el botón intercepta el clic: localizarlo por
       `data-test` deja el test colgado hasta agotar el tiempo de espera. Se
       localiza por rol accesible, que además es más estable ante rediseños. */
    this.menuButton = page.getByRole('button', { name: 'Open Menu' });

    this.logoutLink = page.getByTestId('logout-sidebar-link');

    /* El menú expone además «Reset App State». No se declara aquí porque
       ningún caso lo usa, y un localizador sin uso es deuda que se arrastra:
       parece cubierto lo que no lo está. Queda como hueco declarado en
       docs/02-matriz-de-casos.md. */
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  /**
   * Unidades que muestra el contador del carrito.
   * Devuelve 0 cuando el contador no está en el DOM, que es como la aplicación
   * representa el carrito vacío.
   */
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
