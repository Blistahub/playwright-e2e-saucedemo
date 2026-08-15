import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { parsePrice } from '../support/money';

/**
 * Ficha de producto (`/inventory-item.html?id=N`).
 *
 * Comparte cabecera y carrito con el resto, pero NO tiene el elemento `title`
 * que declara BasePage: usa una cabecera secundaria. `this.title` no resuelve
 * aquí, así que no esperes por él.
 */
export class ProductDetailPage extends BasePage {
  readonly name: Locator;
  readonly price: Locator;
  readonly description: Locator;
  readonly backToProductsButton: Locator;

  constructor(page: Page) {
    super(page);
    this.name = page.getByTestId('inventory-item-name');
    this.price = page.getByTestId('inventory-item-price');
    this.description = page.getByTestId('inventory-item-desc');
    this.backToProductsButton = page.getByTestId('back-to-products');
  }

  /**
   * Botón de acción de la ficha.
   *
   * Aquí el data-test es `add-to-cart` a secas, sin el nombre del producto que
   * lleva en el catálogo. Por rol vale para los dos estados del botón.
   */
  actionButton(): Locator {
    return this.page.getByRole('button', { name: /Add to cart|Remove/ });
  }

  async addToCart(): Promise<void> {
    await this.page.getByRole('button', { name: 'Add to cart' }).click();
  }

  async backToProducts(): Promise<void> {
    await this.backToProductsButton.click();
  }

  async priceValue(): Promise<number> {
    return parsePrice(await this.price.innerText());
  }
}
