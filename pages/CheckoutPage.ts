import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import type { Customer } from '../data/customer';

/** Checkout, paso 1: datos del comprador (`/checkout-step-one.html`). */
export class CheckoutPage extends BasePage {
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.getByTestId('firstName');
    this.lastNameInput = page.getByTestId('lastName');
    this.postalCodeInput = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.cancelButton = page.getByTestId('cancel');
    this.errorMessage = page.getByTestId('error');
  }

  async goto(): Promise<void> {
    await this.page.goto('/checkout-step-one.html');
  }

  /**
   * Rellena los tres campos sin enviar.
   *
   * Hace `fill('')` en los vacíos en vez de saltárselos: los casos de datos
   * incompletos necesitan el campo vacío a propósito, no sin tocar.
   */
  async fillCustomer(customer: Customer): Promise<void> {
    await this.firstNameInput.fill(customer.firstName);
    await this.lastNameInput.fill(customer.lastName);
    await this.postalCodeInput.fill(customer.postalCode);
  }

  async continue(): Promise<void> {
    await this.continueButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /** Atajo para los tests que no prueban este paso. */
  async submitCustomer(customer: Customer): Promise<void> {
    await this.fillCustomer(customer);
    await this.continue();
  }
}
