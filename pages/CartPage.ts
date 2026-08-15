import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { parsePrice } from '../support/money';

/** Carrito (`/cart.html`). */
export class CartPage extends BasePage {
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly itemQuantities: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    super(page);
    this.items = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.itemQuantities = page.getByTestId('item-quantity');
    this.checkoutButton = page.getByTestId('checkout');
    this.continueShoppingButton = page.getByTestId('continue-shopping');
  }

  async goto(): Promise<void> {
    await this.page.goto('/cart.html');
  }

  itemRow(productName: string): Locator {
    return this.items.filter({ hasText: productName });
  }

  async removeItem(productName: string): Promise<void> {
    await this.itemRow(productName).getByRole('button', { name: 'Remove' }).click();
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }

  async visibleNames(): Promise<string[]> {
    return this.itemNames.allInnerTexts();
  }

  async visiblePrices(): Promise<number[]> {
    return (await this.itemPrices.allInnerTexts()).map(parsePrice);
  }

  /**
   * Suma de las líneas.
   *
   * No multiplica por cantidad porque SauceDemo no deja repetir artículo: el
   * botón pasa a «Remove» y la línea siempre marca 1. Lo comprueba CP-09.
   */
  async subtotal(): Promise<number> {
    return (await this.visiblePrices()).reduce((total, price) => total + price, 0);
  }
}
