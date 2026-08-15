/**
 * Catálogo de SauceDemo: seis productos fijos, sin paginación.
 *
 * Centralizados aquí para que un cambio se corrija en un sitio y no en quince
 * ficheros de test.
 */
export const PRODUCTS = {
  backpack: 'Sauce Labs Backpack',
  bikeLight: 'Sauce Labs Bike Light',
  boltTShirt: 'Sauce Labs Bolt T-Shirt',
  fleeceJacket: 'Sauce Labs Fleece Jacket',
  onesie: 'Sauce Labs Onesie',
  redTShirt: 'Test.allTheThings() T-Shirt (Red)',
} as const;

export type ProductName = (typeof PRODUCTS)[keyof typeof PRODUCTS];

/** Artículos del catálogo. Lo comprueba la prueba de humo. */
export const CATALOG_SIZE = 6;

/**
 * Impuesto que aplica SauceDemo en el resumen.
 *
 * Comprobado en cuatro cestas (7,99 · 29,99 · 31,98 · 59,98 $), no deducido de
 * una sola. Lo que esos datos no permiten fijar es la regla de redondeo: está
 * explicado en `data/carts.ts`.
 */
export const TAX_RATE = 0.08;
