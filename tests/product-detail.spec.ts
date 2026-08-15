import { loggedInTest as test, expect } from '../fixtures/test';
import { PRODUCTS } from '../data/products';

/**
 * Ficha de producto.
 *
 * Era un hueco declarado en la matriz. Se cubre porque abrir la ficha y añadir
 * desde ahí es una de las dos vías para llenar el carrito, o sea, camino de
 * compra.
 */
test.describe('Ficha de producto', () => {
  test('CP-23 · la ficha muestra el producto y permite añadirlo al carrito', async ({
    page,
    inventoryPage,
    productDetailPage,
  }) => {
    // El precio se lee en el catálogo ANTES de navegar: comparar la ficha
    // consigo misma no demostraría nada.
    const catalogPrice = (await inventoryPage.visiblePrices())[0];
    const catalogName = (await inventoryPage.visibleNames())[0];

    await inventoryPage.openProduct(catalogName);

    await expect(page).toHaveURL(/\/inventory-item\.html\?id=\d+$/);
    await expect(productDetailPage.name).toHaveText(catalogName);
    await expect(productDetailPage.description).not.toBeEmpty();
    expect(await productDetailPage.priceValue()).toBeCloseTo(catalogPrice, 2);

    await productDetailPage.addToCart();
    await expect(productDetailPage.cartBadge).toHaveText('1');
    await expect(productDetailPage.actionButton()).toHaveText('Remove');
  });

  test('CP-24 · volver al catálogo desde la ficha conserva el carrito', async ({
    inventoryPage,
    productDetailPage,
  }) => {
    await inventoryPage.openProduct(PRODUCTS.fleeceJacket);
    await productDetailPage.addToCart();
    await expect(productDetailPage.cartBadge).toHaveText('1');

    await productDetailPage.backToProducts();

    await expect(inventoryPage.title).toHaveText('Products');
    await expect(inventoryPage.cartBadge).toHaveText('1');
    // El estado del botón tiene que volver también, o el usuario duplicaría la
    // línea sin enterarse.
    await expect(inventoryPage.actionButton(PRODUCTS.fleeceJacket)).toHaveText('Remove');
  });
});
