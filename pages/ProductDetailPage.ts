import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { parsePrice } from '../support/money';

/**
 * Ficha de un producto (`/inventory-item.html?id=N`).
 *
 * Hereda de `BasePage` porque comparte cabecera, carrito y menú con el resto
 * de vistas. Una salvedad: esta pantalla **no tiene** el elemento `title` que
 * declara la base —usa una cabecera secundaria con el botón de volver—, así
 * que `this.title` nunca resolverá aquí. Se deja constancia para que nadie
 * escriba una espera contra él y se pregunte por qué agota el tiempo.
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
   * Aquí el `data-test` es `add-to-cart` a secas, sin el nombre del producto
   * que sí lleva en el catálogo: en una ficha solo hay un producto. Se localiza
   * por rol y nombre accesible para no depender de esa diferencia y para que
   * el mismo método sirva en los dos estados del botón.
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
