/**
 * Conversión de los importes que muestra la aplicación.
 *
 * SauceDemo los presenta como `$29.99` y las etiquetas del resumen como
 * `Item total: $37.98`. Las comparaciones se hacen sobre números, no sobre
 * cadenas: comparar textos haría que un cambio de formato —una coma decimal,
 * un símbolo distinto— rompiera tests que no prueban el formato.
 *
 * Estas dos funciones son la única lógica pura del repositorio, y por eso son
 * las únicas que se prueban por debajo de la interfaz: comprobar un redondeo
 * levantando tres navegadores sería pagar el precio más alto de la pirámide
 * por la comprobación más barata. Sus casos están en
 * `tests/unit/money.unit.spec.ts`.
 */

/**
 * Extrae el importe de un texto y lo devuelve como número.
 *
 * Asume el formato estadounidense que usa la aplicación: la coma separa
 * millares y el punto, los decimales. Lanza si no encuentra un importe, en
 * lugar de devolver `NaN`: un `NaN` se propagaría silenciosamente hasta una
 * comparación que fallaría lejos de la causa.
 */
export function parsePrice(text: string | null): number {
  const match = text?.match(/\$\s*([\d.,]+)/);
  if (!match) {
    throw new Error(`No se ha encontrado un importe en el texto: "${text}"`);
  }
  /* La sustitución es global a propósito. Con `replace(',', '')` solo caería
     la primera coma, y «$1,234,567.89» se convertiría en 1234: un error que
     no aparece con los importes de dos cifras del catálogo actual, pero que
     esperaría callado a la primera cesta que pasara de mil. Lo fija U-04. */
  return Number.parseFloat(match[1].replace(/,/g, ''));
}

/**
 * Redondea a dos decimales evitando los sobrantes de la coma flotante.
 *
 * `Math.round` redondea el medio hacia arriba, que es la regla que usa la
 * aplicación en los importes comprobados. La salvedad está documentada en
 * `data/carts.ts`: con este catálogo no hay ninguna cesta que caiga por
 * debajo del medio céntimo, así que la suite no puede distinguir esta regla
 * del redondeo sistemático al alza.
 */
export function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}
