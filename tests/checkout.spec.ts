import { loggedInTest as test, expect } from '../fixtures/test';
import { PRODUCTS, TAX_RATE } from '../data/products';
import { INCOMPLETE_CUSTOMERS, VALID_CUSTOMER } from '../data/customer';
import { roundToCents } from '../support/money';

test.describe('Proceso de compra', () => {
  test('CP-16 · compra completa de extremo a extremo @humo', async ({
    page,
    inventoryPage,
    cartPage,
    checkoutPage,
    overviewPage,
    completePage,
  }) => {
    await inventoryPage.addToCart(PRODUCTS.backpack);
    await inventoryPage.addToCart(PRODUCTS.onesie);
    await inventoryPage.openCart();

    await expect(cartPage.items).toHaveCount(2);
    await cartPage.checkout();

    await expect(checkoutPage.title).toHaveText('Checkout: Your Information');
    await checkoutPage.submitCustomer(VALID_CUSTOMER);

    await expect(overviewPage.title).toHaveText('Checkout: Overview');
    /* Los artículos deben llegar íntegros hasta el resumen: es el punto donde
       un carrito mal propagado se convierte en un pedido incorrecto. */
    expect(await overviewPage.visibleNames()).toEqual(
      expect.arrayContaining([PRODUCTS.backpack, PRODUCTS.onesie]),
    );
    await overviewPage.finish();

    await expect(page).toHaveURL(/\/checkout-complete\.html$/);
    await expect(completePage.header).toHaveText('Thank you for your order!');
    /* Cerrado el pedido, el carrito queda vacío: si el contador sobreviviera,
       el siguiente pedido arrastraría los artículos del anterior. */
    await expect(completePage.cartBadge).toHaveCount(0);
  });

  test('CP-17 · el resumen calcula subtotal, impuesto y total', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
    overviewPage,
  }) => {
    await inventoryPage.addToCart(PRODUCTS.backpack);
    await inventoryPage.addToCart(PRODUCTS.onesie);
    await inventoryPage.openCart();

    const cartSubtotal = await cartPage.subtotal();
    await cartPage.checkout();
    await checkoutPage.submitCustomer(VALID_CUSTOMER);

    /* El subtotal del resumen tiene que coincidir con la suma de las líneas
       del carrito, calculada por el test y no leída de la propia aplicación:
       un oráculo que se limitara a comparar la pantalla consigo misma pasaría
       aunque el importe fuese erróneo. */
    expect(await overviewPage.subtotal()).toBeCloseTo(cartSubtotal, 2);
    expect(await overviewPage.tax()).toBeCloseTo(roundToCents(cartSubtotal * TAX_RATE), 2);
    expect(await overviewPage.total()).toBeCloseTo(
      roundToCents(cartSubtotal + roundToCents(cartSubtotal * TAX_RATE)),
      2,
    );
  });

  /**
   * Test dirigido por datos: un caso por campo obligatorio del formulario.
   * Los juegos de datos y los mensajes esperados viven en `data/customer.ts`.
   */
  for (const scenario of INCOMPLETE_CUSTOMERS) {
    test(`${scenario.id} · el checkout rechaza los datos ${scenario.description}`, async ({
      page,
      inventoryPage,
      cartPage,
      checkoutPage,
    }) => {
      await inventoryPage.addToCart(PRODUCTS.backpack);
      await inventoryPage.openCart();
      await cartPage.checkout();

      await checkoutPage.fillCustomer(scenario.customer);
      await checkoutPage.continue();

      await expect(checkoutPage.errorMessage).toHaveText(scenario.expectedError);
      /* Y, sobre todo, que no ha avanzado al resumen. */
      await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
    });
  }

  test('CP-21 · cancelar en el paso de datos devuelve al carrito sin perderlo', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await inventoryPage.addToCart(PRODUCTS.bikeLight);
    await inventoryPage.openCart();
    await cartPage.checkout();

    await checkoutPage.cancel();

    await expect(cartPage.title).toHaveText('Your Cart');
    /* Cancelar el checkout no es vaciar el carrito: el usuario que se arrepiente
       de los datos de envío no ha renunciado a la compra. */
    await expect(cartPage.items).toHaveCount(1);
    expect(await cartPage.visibleNames()).toEqual([PRODUCTS.bikeLight]);
  });
});
