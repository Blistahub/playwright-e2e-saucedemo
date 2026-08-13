import { PRODUCTS, type ProductName } from './products';

/** Una cesta con la que ejercitar el cálculo de importes del resumen. */
export interface CartScenario {
  /** Identificador del caso en la matriz de pruebas. */
  id: string;
  /** Qué cesta se prueba, tal y como aparece en el título del test. */
  description: string;
  products: ProductName[];
}

/**
 * Juegos de datos de CP-17, el cálculo de subtotal, impuesto y total.
 *
 * Un único juego comprobaría el cálculo en un solo punto, y ahí es fácil que
 * un redondeo equivocado coincida por casualidad con el correcto. Estos tres
 * recorren el rango del catálogo: el artículo más barato, el más caro y una
 * cesta de dos.
 *
 * **Limitación declarada.** Los seis productos terminan en `,99`, así que
 * cualquier subtotal alcanzable acaba entre `,94` y `,99`, y el impuesto del
 * 8 % cae siempre por encima del medio céntimo:
 *
 *    7,99 $ → 0,6392 $ → 0,64 $
 *   49,99 $ → 3,9992 $ → 4,00 $
 *   37,98 $ → 3,0384 $ → 3,04 $
 *
 * Los tres redondean al alza, y no existe combinación en este catálogo que
 * redondee a la baja. Eso significa que la suite **no puede distinguir** el
 * redondeo al más cercano del redondeo sistemático al céntimo superior: ambos
 * darían el mismo resultado en los 63 carritos posibles. Se deja dicho en vez
 * de dar por verificada una regla que los datos no permiten verificar.
 *
 * Los tres comparten identificador porque son el mismo caso de prueba con
 * datos distintos, no tres casos: el sufijo solo los distingue en el informe.
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
