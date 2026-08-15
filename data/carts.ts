import { PRODUCTS, type ProductName } from './products';

/** Cesta con la que ejercitar el cálculo de importes del resumen. */
export interface CartScenario {
  /** Identificador en la matriz de pruebas. */
  id: string;
  /** Qué cesta es, tal cual aparece en el título del test. */
  description: string;
  products: ProductName[];
}

/**
 * Juegos de datos de CP-17 (subtotal, impuesto y total).
 *
 * Con un solo juego el cálculo se comprueba en un punto, donde es fácil que un
 * redondeo mal hecho coincida por casualidad. Estos tres recorren el rango:
 * el artículo más barato, el más caro y una cesta de dos.
 *
 * LIMITACIÓN: los seis productos acaban en ,99, así que cualquier subtotal cae
 * entre ,94 y ,99 y el 8 % siempre queda por encima del medio céntimo:
 *
 *    7,99 $ → 0,6392 → 0,64
 *   49,99 $ → 3,9992 → 4,00
 *   37,98 $ → 3,0384 → 3,04
 *
 * Los tres suben. No hay cesta en este catálogo que baje, así que la suite no
 * distingue el redondeo al más cercano del redondeo siempre al alza. Se deja
 * dicho en vez de dar por verificada una regla que los datos no permiten.
 *
 * Comparten identificador porque son el mismo caso con datos distintos; el
 * sufijo solo los separa en el informe.
 */
export const TAX_SCENARIOS: CartScenario[] = [
  {
    id: 'CP-17.1',
    description: 'un artículo del tramo bajo',
    products: [PRODUCTS.onesie],
  },
  {
    id: 'CP-17.2',
    description: 'un artículo del tramo alto',
    products: [PRODUCTS.fleeceJacket],
  },
  {
    id: 'CP-17.3',
    description: 'dos artículos',
    products: [PRODUCTS.backpack, PRODUCTS.onesie],
  },
];
