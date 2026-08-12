/**
 * Catálogo de SauceDemo. Es fijo: seis productos, sin paginación.
 *
 * Los nombres se centralizan aquí para que un cambio en el catálogo se corrija
 * en un único punto y no en quince ficheros de test.
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

/** Número de artículos del catálogo. Se comprueba en la prueba de humo. */
export const CATALOG_SIZE = 6;

/**
 * Tipo impositivo aplicado por SauceDemo en el resumen de compra.
 * Verificado contra la aplicación: 37,98 $ → 3,04 $ de impuesto.
 */
export const TAX_RATE = 0.08;
