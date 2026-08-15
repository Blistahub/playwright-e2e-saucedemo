import { loggedInTest as test, expect } from '../fixtures/test';
import { USERS } from '../data/users';
import { PRODUCTS, CATALOG_SIZE } from '../data/products';
import { VALID_CUSTOMER } from '../data/customer';
import { SORT_OPTIONS } from '../pages/InventoryPage';

/**
 * Defectos confirmados de SauceDemo.
 *
 * Estos tests afirman el comportamiento CORRECTO y llevan `test.fail()`, que en
 * Playwright significa «se espera que falle». Así:
 *
 *  - la suite sigue en verde, y un defecto ya documentado no vuelve a ser una
 *    alarma nueva cada mañana;
 *  - si lo corrigen, el test pasa y Playwright lo marca como fallo inesperado,
 *    o sea, la corrección avisa sola;
 *  - lo esperado queda en código y no en un documento que nadie reabre.
 *
 * Contra: `test.fail()` da por esperado CUALQUIER fallo, no solo el previsto.
 * Si se rompiera el login de problem_user, HAL-02 seguiría fallando y la suite
 * en verde. Qué acota eso, en el plan § 6.1.
 *
 * Detalle de cada defecto en docs/03-hallazgos.md.
 */

test.describe('Defectos de problem_user', () => {
  test.use({ userName: USERS.problem });

  test('HAL-01 · cada producto debe mostrar su propia imagen @hallazgo', async ({
    inventoryPage,
  }) => {
    test.fail();
    test.info().annotations.push({
      type: 'defecto',
      description: 'HAL-01 · las 6 tarjetas cargan la misma imagen (sl-404)',
    });

    const sources = await inventoryPage.imageSources();

    expect(sources).toHaveLength(CATALOG_SIZE);
    expect(
      new Set(sources).size,
      `Se esperaban ${CATALOG_SIZE} imágenes distintas y hay ${new Set(sources).size}`,
    ).toBe(CATALOG_SIZE);
  });

  test('HAL-02 · el campo «Last Name» del checkout debe aceptar lo que se escribe @hallazgo', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    test.fail();
    test.info().annotations.push({
      type: 'defecto',
      description: 'HAL-02 · lo tecleado en «Last Name» se escribe en «First Name»',
    });

    await inventoryPage.addToCart(PRODUCTS.backpack);
    await inventoryPage.openCart();
    await cartPage.checkout();

    await checkoutPage.firstNameInput.fill(VALID_CUSTOMER.firstName);
    await checkoutPage.lastNameInput.fill(VALID_CUSTOMER.lastName);

    // Espera corta: sabemos que falla, y agotar los 7 s por defecto añadiría
    // siete segundos por hallazgo a cada ejecución sin cambiar nada.
    await expect(checkoutPage.lastNameInput).toHaveValue(VALID_CUSTOMER.lastName, {
      timeout: 2_000,
    });
    await expect(checkoutPage.firstNameInput).toHaveValue(VALID_CUSTOMER.firstName, {
      timeout: 2_000,
    });
  });
});

test.describe('Defectos de error_user', () => {
  test.use({ userName: USERS.error });

  test('HAL-03 · el botón «Remove» debe retirar el producto del carrito @hallazgo', async ({
    inventoryPage,
  }) => {
    test.fail();
    test.info().annotations.push({
      type: 'defecto',
      description: 'HAL-03 · «Remove» no descuenta la unidad',
    });

    await inventoryPage.addToCart(PRODUCTS.backpack);
    await inventoryPage.addToCart(PRODUCTS.onesie);
    await expect(inventoryPage.cartBadge).toHaveText('2');

    await inventoryPage.removeFromCart(PRODUCTS.backpack);

    await expect(inventoryPage.cartBadge).toHaveText('1', { timeout: 2_000 });
  });

  test('HAL-04 · seleccionar un criterio de orden debe reordenar el catálogo @hallazgo', async ({
    inventoryPage,
  }) => {
    test.fail();
    test.info().annotations.push({
      type: 'defecto',
      description: 'HAL-04 · el desplegable acepta el criterio pero la lista no cambia',
    });

    const before = await inventoryPage.visiblePrices();
    await inventoryPage.sortBy(SORT_OPTIONS.priceDesc);
    const after = await inventoryPage.visiblePrices();

    // Se guarda el orden previo para que el informe enseñe que no cambió nada.
    expect(after, `Orden antes: ${before.join(', ')} · después: ${after.join(', ')}`).toEqual(
      [...after].sort((a, b) => b - a),
    );
    expect(after).not.toEqual(before);
  });
});
