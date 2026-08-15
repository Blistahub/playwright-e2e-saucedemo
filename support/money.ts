/**
 * Conversión de importes.
 *
 * La app los muestra como `$29.99` y las etiquetas del resumen como
 * `Item total: $37.98`. Se comparan como números, no como texto: así un cambio
 * de formato no rompe tests que no prueban el formato.
 *
 * Es la única lógica pura del repo y por eso la única con tests unitarios
 * (`tests/unit/money.unit.spec.ts`).
 */

/**
 * Saca el importe de un texto.
 *
 * Formato de EE. UU., que es el que usa la app: coma para millares, punto para
 * decimales. Lanza si no encuentra importe en vez de devolver NaN, que se
 * propagaría hasta fallar lejos de la causa.
 */
export function parsePrice(text: string | null): number {
  const match = text?.match(/\$\s*([\d.,]+)/);
  if (!match) {
    throw new Error(`No se ha encontrado un importe en el texto: "${text}"`);
  }
  // Global a propósito: con replace(',', '') solo cae la primera coma y
  // «$1,234,567.89» acaba siendo 1234. Lo fija U-04.
  return Number.parseFloat(match[1].replace(/,/g, ''));
}

/**
 * Redondea a dos decimales sin arrastrar el sobrante binario.
 *
 * `Math.round` sube el medio hacia arriba, que es lo que hace la app en los
 * importes comprobados. La salvedad, en `data/carts.ts`.
 */
export function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}
