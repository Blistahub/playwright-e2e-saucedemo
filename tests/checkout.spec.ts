import { loggedInTest as test, expect } from '../fixtures/test';
import { PRODUCTS, TAX_RATE } from '../data/products';
import { TAX_SCENARIOS } from '../data/carts';
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
    // Los artículos tienen que llegar enteros al resumen: es donde un carrito
    // mal propagado se convierte en un pedido equivocado.
    await expect(overviewPage.items).toHaveCount(2);
    expect(await overviewPage.visibleNames()).toEqual(
      expect.arrayContaining([PRODUCTS.backpack, PRODUCTS.onesie]),
    );
    // Pago y envío son lo último que ve el cliente antes de confirmar.
    await expect(overviewPage.paymentInfo).not.toBeEmpty();
    await expect(overviewPage.shippingInfo).not.toBeEmpty();

    await overviewPage.finish();

    await expect(page).toHaveURL(/\/checkout-complete\.html$/);
    await expect(completePage.header).toHaveText('Thank you for your order!');
    await expect(completePage.text).not.toBeEmpty();
    // Si el contador sobreviviera, el siguiente pedido arrastraría estos artículos.
    await expect(completePage.cartBadge).toHaveCount(0);

    // Se cierra el ciclo volviendo al catálogo, que es donde empezaría la
    // siguiente compra.
    await completePage.backToProducts();
    await expect(inventoryPage.title).toHaveText('Products');
    await expect(inventoryPage.cartBadge).toHaveCount(0);
  });

  /**
   * Cálculo de importes con tres cestas.
   *
   * El oráculo se calcula en el test a partir de las líneas del carrito: si
   * comparase el total del resumen con el subtotal del resumen, pasaría aunque
   * los dos estuvieran mal.
   */
  for (const scenario of TAX_SCENARIOS) {
    test(`${scenario.id} · el resumen calcula los importes de ${scenario.description}`, async ({
      inventoryPage,
      cartPage,
      checkoutPage,
      overviewPage,
    }) => {
      for (const product of scenario.products) {
        await inventoryPage.addToCart(product);
      }
      await inventoryPage.openCart();

      const cartSubtotal = await cartPage.subtotal();
      await cartPage.checkout();
      await checkoutPage.submitCustomer(VALID_CUSTOMER);

      const expectedTax = roundToCents(cartSubtotal * TAX_RATE);

      expect(await overviewPage.subtotal()).toBeCloseTo(cartSubtotal, 2);
      expect(await overviewPage.tax()).toBeCloseTo(expectedTax, 2);
      expect(await overviewPage.total()).toBeCloseTo(
        roundToCents(cartSubtotal + expectedTax),
        2,
      );
    });
  }

  // Un caso por campo obligatorio. Los datos, en `data/customer.ts`.
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
      // Y sobre todo: que no ha avanzado al resumen.
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
    // Cancelar el checkout no es vaciar el carrito: quien se arrepiente de los
    // datos de envío no ha renunciado a comprar.
    await expect(cartPage.items).toHaveCount(1);
    expect(await cartPage.visibleNames()).toEqual([PRODUCTS.bikeLight]);
  });

  test('CP-22 · cancelar en el resumen devuelve al catálogo sin perder el carrito', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
    overviewPage,
  }) => {
    await inventoryPage.addToCart(PRODUCTS.bikeLight);
    await inventoryPage.openCart();
    await cartPage.checkout();
    await checkoutPage.submitCustomer(VALID_CUSTOMER);
    await expect(overviewPage.title).toHaveText('Checkout: Overview');

    await overviewPage.cancel();

    // Aquí «Cancel» lleva al catálogo, no al carrito como en CP-21. Mismo
    // verbo, destino distinto: por eso son dos casos y no uno parametrizado.
    await expect(inventoryPage.title).toHaveText('Products');
    await expect(inventoryPage.cartBadge).toHaveText('1');
  });
});
