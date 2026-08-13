import { loggedInTest as test, expect } from '../fixtures/test';
import { USERS } from '../data/users';
import { PRODUCTS, CATALOG_SIZE } from '../data/products';
import { VALID_CUSTOMER } from '../data/customer';
import { SORT_OPTIONS } from '../pages/InventoryPage';

/**
 * Defectos confirmados de SauceDemo.
 *
 * Estos tests afirman el comportamiento CORRECTO —el que debería tener la
 * aplicación— y se marcan con `test.fail()`, que en Playwright significa «se
 * espera que este test falle». Tiene tres consecuencias, y las tres son
 * deliberadas:
 *
 *  1. La suite sigue en verde: un defecto conocido y documentado no es una
 *     alarma nueva cada mañana, y una suite que grita todos los días acaba
 *     siendo una suite que nadie mira.
 *  2. El día que el fabricante lo corrija, el test pasará y Playwright lo
 *     marcará como fallo inesperado: la corrección avisa sola de que hay un
 *     defecto que cerrar y una aserción que devolver a la suite normal.
 *  3. La aserción documenta el comportamiento esperado en código ejecutable,
 *     no en una frase de un documento que nadie vuelve a abrir.
 *
 * La técnica tiene un coste que conviene tener presente al leer estos tests:
 * `test.fail()` da por esperado **cualquier** fallo, no solo el previsto. Si
 * se rompiera el acceso de `problem_user`, HAL-02 seguiría fallando y la suite
 * seguiría en verde, tapando una avería real. Qué acota ese riesgo y qué queda
 * como revisión manual está en `docs/01-plan-de-automatizacion.md`, § 6.1.
 *
 * El detalle de cada defecto —severidad, impacto y reproducción— está en
 * `docs/03-hallazgos.md`.
 */

test.describe('Defectos de problem_user', () => {
  test.use({ userName: USERS.problem });

  test('HAL-01 · cada producto debe mostrar su propia imagen @hallazgo', async ({
    inventoryPage,
  }) => {
    test.fail();
    test.info().annotations.push({
      type: 'defecto',
      description: 'HAL-01 · todas las tarjetas muestran la misma imagen de error (sl-404)',
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
      description: 'HAL-02 · lo tecleado en «Last Name» se escribe en «First Name» y el apellido queda vacío',
    });

    await inventoryPage.addToCart(PRODUCTS.backpack);
    await inventoryPage.openCart();
    await cartPage.checkout();

    await checkoutPage.firstNameInput.fill(VALID_CUSTOMER.firstName);
    await checkoutPage.lastNameInput.fill(VALID_CUSTOMER.lastName);

    /* Tiempo de espera corto: se sabe que la aserción va a fallar, y dejar que
       agote el de por defecto añadiría siete segundos por hallazgo a cada
       ejecución de la suite sin cambiar el resultado. */
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
      description: 'HAL-03 · «Remove» no descuenta la unidad: el contador se queda como estaba',
    });

    await inventoryPage.addToCart(PRODUCTS.backpack);
    await inventoryPage.addToCart(PRODUCTS.onesie);
    await expect(inventoryPage.cartBadge).toHaveText('2');

    await inventoryPage.removeFromCart(PRODUCTS.backpack);

    /* Tiempo de espera corto por el mismo motivo que en HAL-02. */
    await expect(inventoryPage.cartBadge).toHaveText('1', { timeout: 2_000 });
  });

  test('HAL-04 · seleccionar un criterio de orden debe reordenar el catálogo @hallazgo', async ({
    inventoryPage,
  }) => {
    test.fail();
    test.info().annotations.push({
      type: 'defecto',
      description: 'HAL-04 · el desplegable acepta el criterio pero la lista no se reordena',
    });

    const before = await inventoryPage.visiblePrices();
    await inventoryPage.sortBy(SORT_OPTIONS.priceDesc);
    const after = await inventoryPage.visiblePrices();

    /* Se comprueba lo que promete el desplegable: la lista queda de mayor a
       menor. Se registra también el orden previo para que el reporte muestre
       que la secuencia no ha cambiado en absoluto. */
    expect(after, `Orden antes: ${before.join(', ')} · después: ${after.join(', ')}`).toEqual(
      [...after].sort((a, b) => b - a),
    );
    expect(after).not.toEqual(before);
  });
});
