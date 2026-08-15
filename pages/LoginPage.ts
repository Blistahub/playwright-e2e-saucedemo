import type { Locator, Page } from '@playwright/test';

/**
 * Pantalla de acceso.
 *
 * No hereda de BasePage: es la única vista sin cabecera ni carrito, y heredar
 * localizadores que aquí no existen invita a esperar por elementos imposibles.
 */
export class LoginPage {
  private readonly page: Page;

  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByTestId('username');
    this.passwordInput = page.getByTestId('password');
    this.loginButton = page.getByTestId('login-button');
    this.errorMessage = page.getByTestId('error');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  /** Envía el formulario. No comprueba el resultado: eso lo decide el test. */
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
