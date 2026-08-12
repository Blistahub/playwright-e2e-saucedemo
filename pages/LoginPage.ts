import type { Locator, Page } from '@playwright/test';

/**
 * Pantalla de acceso.
 *
 * No hereda de `BasePage` a propósito: es la única vista sin cabecera ni
 * carrito, y heredar localizadores que aquí nunca existen invitaría a
 * escribir esperas contra elementos imposibles.
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

  /**
   * Rellena el formulario y lo envía. No comprueba el resultado: eso es
   * responsabilidad del test, que unas veces espera entrar y otras espera
   * un error concreto.
   */
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
