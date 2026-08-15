import { test, expect } from '@playwright/test';
import { parsePrice, roundToCents } from '../../support/money';

/**
 * Pruebas unitarias de la conversión de importes.
 *
 * Son la única capa baja de la pirámide en este repositorio, y existen porque
 * `support/money.ts` es la única lógica pura que hay: comprobar un redondeo
 * levantando tres navegadores sería pagar el precio más alto por la
 * comprobación más barata.
 *
 * No usan `page` ni fixtures, así que corren en su propio proyecto de
 * Playwright —`unidad`— sin navegador. Eso las hace instantáneas y permite
 * ejecutarlas en el job de calidad, antes de que la matriz llegue siquiera a
 * descargar un navegador.
 */

test.describe('parsePrice', () => {
  test('U-01 · extrae el importe de un precio suelto', () => {
    expect(parsePrice('$29.99')).toBeCloseTo(29.99, 2);
  });

  test('U-02 · extrae el importe de una etiqueta con texto delante', () => {
    expect(parsePrice('Item total: $37.98')).toBeCloseTo(37.98, 2);
    expect(parsePrice('Tax: $3.04')).toBeCloseTo(3.04, 2);
    expect(parsePrice('Total: $41.02')).toBeCloseTo(41.02, 2);
  });

  test('U-03 · tolera el espacio entre el símbolo y la cifra', () => {
    expect(parsePrice('$ 29.99')).toBeCloseTo(29.99, 2);
  });

  /**
   * El caso que motivó la corrección.
   *
   * La versión anterior usaba `replace(',', '')`, que solo sustituye la
   * primera coincidencia: «$1,234,567.89» se convertía en 1234. No se
   * manifestaba con los importes de dos cifras del catálogo actual, así que
   * habría esperado callado a la primera cesta que pasara de mil.
   */
  test('U-04 · descarta todos los separadores de millares, no solo el primero', () => {
    expect(parsePrice('$1,234.56')).toBeCloseTo(1234.56, 2);
    expect(parsePrice('$1,234,567.89')).toBeCloseTo(1234567.89, 2);
  });

  /**
   * Lanzar es deliberado. Devolver `NaN` propagaría el problema hasta una
   * comparación que fallaría lejos de la causa, y el mensaje diría que un
   * importe no coincide en lugar de que no había importe.
   */
  test('U-05 · lanza un error con mensaje si el texto no contiene un importe', () => {
    expect(() => parsePrice('Sin importe')).toThrow(/No se ha encontrado un importe/);
    expect(() => parsePrice('')).toThrow(/No se ha encontrado un importe/);
    expect(() => parsePrice(null)).toThrow(/No se ha encontrado un importe/);
  });

  test('U-06 · el mensaje del error incluye el texto recibido', () => {
    expect(() => parsePrice('Precio no disponible')).toThrow(/"Precio no disponible"/);
  });
});

test.describe('roundToCents', () => {
  /** Los tres importes reales que usa CP-17, calculados a mano. */
  test('U-07 · redondea a dos decimales los impuestos del catálogo', () => {
    expect(roundToCents(7.99 * 0.08)).toBe(0.64); // 0,6392
    expect(roundToCents(37.98 * 0.08)).toBe(3.04); // 3,0384
    expect(roundToCents(49.99 * 0.08)).toBe(4.0); // 3,9992
  });

  /**
   * El motivo de que esta función exista. Sin ella, el subtotal calculado
   * sumando líneas arrastra el sobrante binario y deja de comparar limpio con
   * lo que muestra la aplicación.
   */
  test('U-08 · absorbe el sobrante de la coma flotante', () => {
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(roundToCents(0.1 + 0.2)).toBe(0.3);
    expect(roundToCents(29.99 + 7.99)).toBe(37.98);
  });

  test('U-09 · redondea el medio hacia arriba', () => {
    expect(roundToCents(2.675)).toBe(2.68);
    expect(roundToCents(2.674)).toBe(2.67);
  });
});
