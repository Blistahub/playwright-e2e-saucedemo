import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import type { Customer } from '../data/customer';

/** Primer paso del checkout: datos del comprador (`/checkout-step-one.html`). */
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
   * Rellena los tres campos sin enviar el formulario.
   *
   * Usa `fill('')` también para los campos vacíos —en lugar de saltárselos—
   * porque los casos de datos incompletos necesitan que el campo quede
   * explícitamente vacío, no simplemente sin tocar.
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

  /** Rellena los datos y avanza al resumen. Atajo para los tests que no prueban este paso. */
  async submitCustomer(customer: Customer): Promise<void> {
    await this.fillCustomer(customer);
    await this.continue();
  }
}
