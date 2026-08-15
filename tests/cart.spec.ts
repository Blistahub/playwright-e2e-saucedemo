import { loggedInTest as test, expect } from '../fixtures/test';
import { PRODUCTS } from '../data/products';

/** Carrito: añadir, eliminar y que aguante la navegación. */
test.describe('Carrito de la compra', () => {
  test('CP-08 · añadir un producto actualiza el contador y el botón de la tarjeta @humo', async ({
    inventoryPage,
  }) => {
    await expect(inventoryPage.actionButton(PRODUCTS.backpack)).toHaveText('Add to cart');

    await inventoryPage.addToCart(PRODUCTS.backpack);

    await expect(inventoryPage.cartBadge).toHaveText('1');
    // El botón pasa a «Remove»: es la señal que ve el usuario sin salir del catálogo.
    await expect(inventoryPage.actionButton(PRODUCTS.backpack)).toHaveText('Remove');
  });

  test('CP-09 · el carrito recoge exactamente los productos añadidos', async ({
    inventoryPage,
    cartPage,
  }) => {
    await inventoryPage.addToCart(PRODUCTS.backpack);
    await inventoryPage.addToCart(PRODUCTS.onesie);
    await inventoryPage.openCart();

    await expect(cartPage.title).toHaveText('Your Cart');
    await expect(cartPage.items).toHaveCount(2);
    // El conjunto, no el orden: la app no promete ninguno y fijarlo convertiría
    // un cambio inocuo en un fallo.
    expect(await cartPage.visibleNames()).toEqual(
      expect.arrayContaining([PRODUCTS.backpack, PRODUCTS.onesie]),
    );
    // Una unidad por producto: SauceDemo no deja repetir artículo.
    await expect(cartPage.itemQuantities).toHaveText(['1', '1']);
  });

  test('CP-10 · eliminar el último producto deja el carrito vacío', async ({
    inventoryPage,
    cartPage,
  }) => {
    await inventoryPage.addToCart(PRODUCTS.bikeLight);
    await inventoryPage.openCart();
    await expect(cartPage.items).toHaveCount(1);

    await cartPage.removeItem(PRODUCTS.bikeLight);

    await expect(cartPage.items).toHaveCount(0);
    // El contador desaparece del DOM; no se queda a cero.
    await expect(cartPage.cartBadge).toHaveCount(0);
    expect(await cartPage.cartCount()).toBe(0);
  });

  test('CP-11 · el carrito se conserva al volver al catálogo', async ({
    inventoryPage,
    cartPage,
  }) => {
    await inventoryPage.addToCart(PRODUCTS.fleeceJacket);
    await inventoryPage.openCart();
    await cartPage.continueShopping();

    await expect(inventoryPage.title).toHaveText('Products');
    await expect(inventoryPage.cartBadge).toHaveText('1');
    // El estado del botón también tiene que sobrevivir: si volviera a «Add to
    // cart», el usuario duplicaría la línea sin enterarse.
    await expect(inventoryPage.actionButton(PRODUCTS.fleeceJacket)).toHaveText('Remove');
  });
});
