/**
 * SauceDemo muestra los importes como `$29.99` y las etiquetas del resumen
 * como `Item total: $37.98`. Las comparaciones se hacen sobre números, no
 * sobre cadenas: comparar textos haría que un cambio de formato —una coma
 * decimal, un símbolo distinto— rompiera tests que no prueban el formato.
 */
export function parsePrice(text: string | null): number {
  const match = text?.match(/\$\s*([\d.,]+)/);
  if (!match) {
    throw new Error(`No se ha encontrado un importe en el texto: "${text}"`);
  }
  return Number.parseFloat(match[1].replace(',', ''));
}

/** Redondea a dos decimales evitando los sobrantes de la coma flotante. */
export function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}
