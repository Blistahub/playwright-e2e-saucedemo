import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** Confirmación del pedido (`/checkout-complete.html`). */
export class CheckoutCompletePage extends BasePage {
  readonly header: Locator;
  readonly text: Locator;
  readonly backToProductsButton: Locator;

  constructor(page: Page) {
    super(page);
    this.header = page.getByTestId('complete-header');
    this.text = page.getByTestId('complete-text');
    this.backToProductsButton = page.getByTestId('back-to-products');
  }

  async backToProducts(): Promise<void> {
    await this.backToProductsButton.click();
  }
}
