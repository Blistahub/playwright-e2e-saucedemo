import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { parsePrice } from '../support/money';

/** Criterios de ordenación del desplegable, con los valores que espera el DOM. */
export const SORT_OPTIONS = {
  nameAsc: 'az',
  nameDesc: 'za',
  priceAsc: 'lohi',
  priceDesc: 'hilo',
} as const;

export type SortOption = (typeof SORT_OPTIONS)[keyof typeof SORT_OPTIONS];

/** Catálogo de productos, la vista a la que se llega tras acceder. */
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

    /* El único selector por clase CSS de todo el repositorio, y va razonado
       porque es la excepción a la regla.
       Las imágenes sí llevan `data-test`, pero con el nombre del producto
       incrustado —`inventory-item-sauce-labs-backpack-img`—, así que no hay
       un identificador común con el que recogerlas todas. Las alternativas
       eran componer seis localizadores a partir de los nombres, replicando la
       transformación que hace la aplicación, o usar `img` a secas, que
       atraparía también el logotipo de la cabecera. La clase del contenedor
       es lo más estable de las tres. Solo la usa HAL-01, para comprobar que
       las seis imágenes son distintas. */
    this.itemImages = page.locator('.inventory_item_img img');

    this.sortDropdown = page.getByTestId('product-sort-container');
  }

  async goto(): Promise<void> {
    await this.page.goto('/inventory.html');
  }

  /**
   * Tarjeta de un producto localizada por su nombre visible.
   *
   * La alternativa sería componer el `data-test` del botón a partir del nombre
   * (`add-to-cart-sauce-labs-backpack`), pero eso obliga a replicar en el test
   * la transformación que hace la aplicación —minúsculas, espacios por
   * guiones, paréntesis conservados— y a mantenerla si cambia.
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

  /** Texto del botón de una tarjeta: «Add to cart» o «Remove». */
  actionButton(productName: string): Locator {
    return this.itemCard(productName).getByRole('button');
  }

  /** Abre la ficha del producto pulsando su nombre, como haría un cliente. */
  async openProduct(productName: string): Promise<void> {
    await this.itemCard(productName).getByTestId('inventory-item-name').click();
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortDropdown.selectOption(option);
  }

  /** Nombres de los productos en el orden en que se muestran. */
  async visibleNames(): Promise<string[]> {
    return this.itemNames.allInnerTexts();
  }

  /** Precios en el orden en que se muestran, ya convertidos a número. */
  async visiblePrices(): Promise<number[]> {
    return (await this.itemPrices.allInnerTexts()).map(parsePrice);
  }

  /** Rutas de las imágenes de producto. Sirve para detectar imágenes repetidas. */
  async imageSources(): Promise<string[]> {
    return this.itemImages.evaluateAll((images) =>
      images.map((image) => image.getAttribute('src') ?? ''),
    );
  }
}
