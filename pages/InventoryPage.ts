import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { parsePrice } from '../support/money';

/** Criterios del desplegable, con el valor que espera el DOM. */
export const SORT_OPTIONS = {
  nameAsc: 'az',
  nameDesc: 'za',
  priceAsc: 'lohi',
  priceDesc: 'hilo',
} as const;

export type SortOption = (typeof SORT_OPTIONS)[keyof typeof SORT_OPTIONS];

/** Catálogo de productos (`/inventory.html`). */
export class InventoryPage extends BasePage {
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly itemImages: Locator;
  readonly sortDropdown: Locator;

  constructor(page: Page) {
    super(page);
    this.items = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');

    // Único selector por clase del repo. Las imágenes sí tienen data-test,
    // pero con el nombre del producto dentro (inventory-item-sauce-labs-
    // backpack-img), así que no hay uno común para cogerlas todas. Con `img`
    // a secas entraría también el logo. Solo lo usa HAL-01.
    this.itemImages = page.locator('.inventory_item_img img');

    this.sortDropdown = page.getByTestId('product-sort-container');
  }

  async goto(): Promise<void> {
    await this.page.goto('/inventory.html');
  }

  /**
   * Tarjeta localizada por el nombre visible.
   *
   * Componer el data-test del botón obligaría a repetir aquí la
   * transformación de la app (minúsculas, guiones, paréntesis) y a mantenerla.
   */
  itemCard(productName: string): Locator {
    return this.items.filter({ hasText: productName });
  }

  async addToCart(productName: string): Promise<void> {
    await this.itemCard(productName).getByRole('button', { name: 'Add to cart' }).click();
  }

  async removeFromCart(productName: string): Promise<void> {
    await this.itemCard(productName).getByRole('button', { name: 'Remove' }).click();
  }

  /** El botón de la tarjeta: «Add to cart» o «Remove». */
  actionButton(productName: string): Locator {
    return this.itemCard(productName).getByRole('button');
  }

  /** Abre la ficha pulsando el nombre, como haría un cliente. */
  async openProduct(productName: string): Promise<void> {
    await this.itemCard(productName).getByTestId('inventory-item-name').click();
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortDropdown.selectOption(option);
  }

  /** Nombres en el orden en que se muestran. */
  async visibleNames(): Promise<string[]> {
    return this.itemNames.allInnerTexts();
  }

  /** Precios en el orden en que se muestran, ya como números. */
  async visiblePrices(): Promise<number[]> {
    return (await this.itemPrices.allInnerTexts()).map(parsePrice);
  }

  /** Rutas de las imágenes, para detectar repetidas (HAL-01). */
  async imageSources(): Promise<string[]> {
    return this.itemImages.evaluateAll((images) =>
      images.map((image) => image.getAttribute('src') ?? ''),
    );
  }
}
