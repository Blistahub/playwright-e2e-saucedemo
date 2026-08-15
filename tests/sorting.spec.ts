import { loggedInTest as test, expect } from '../fixtures/test';
import { SORT_OPTIONS, type SortOption } from '../pages/InventoryPage';
import { PRODUCTS } from '../data/products';

/** Orden alfabético del catálogo, que es fijo y conocido. */
const NAMES_A_TO_Z = [
  PRODUCTS.backpack,
  PRODUCTS.bikeLight,
  PRODUCTS.boltTShirt,
  PRODUCTS.fleeceJacket,
  PRODUCTS.onesie,
  PRODUCTS.redTShirt,
];

interface NameScenario {
  id: string;
  description: string;
  option: SortOption;
  expected: string[];
}

const NAME_SCENARIOS: NameScenario[] = [
  {
    id: 'CP-12',
    description: 'de la A a la Z',
    option: SORT_OPTIONS.nameAsc,
    expected: NAMES_A_TO_Z,
  },
  {
    id: 'CP-13',
    description: 'de la Z a la A',
    option: SORT_OPTIONS.nameDesc,
    expected: [...NAMES_A_TO_Z].reverse(),
  },
];

interface PriceScenario {
  id: string;
  description: string;
  option: SortOption;
  direction: 'asc' | 'desc';
}

const PRICE_SCENARIOS: PriceScenario[] = [
  {
    id: 'CP-14',
    description: 'de menor a mayor',
    option: SORT_OPTIONS.priceAsc,
    direction: 'asc',
  },
  {
    id: 'CP-15',
    description: 'de mayor a menor',
    option: SORT_OPTIONS.priceDesc,
    direction: 'desc',
  },
];

/** ¿La serie mantiene la monotonía en el sentido indicado? */
function isOrdered(values: number[], direction: 'asc' | 'desc'): boolean {
  return values.every(
    (value, index) =>
      index === 0 ||
      (direction === 'asc' ? values[index - 1] <= value : values[index - 1] >= value),
  );
}

test.describe('Ordenación del catálogo', () => {
  // Los nombres son únicos, así que se puede exigir el orden exacto.
  for (const scenario of NAME_SCENARIOS) {
    test(`${scenario.id} · ordenar por nombre ${scenario.description}`, async ({
      inventoryPage,
    }) => {
      await inventoryPage.sortBy(scenario.option);

      expect(await inventoryPage.visibleNames()).toEqual(scenario.expected);
    });
  }

  /**
   * Con los precios no se puede: dos artículos cuestan 15,99 $ y la app no
   * promete cómo desempata. Exigir una secuencia concreta convertiría un
   * empate legítimo en un fallo, así que se comprueba la monotonía y, aparte,
   * que no se ha perdido ni duplicado nada.
   */
  for (const scenario of PRICE_SCENARIOS) {
    test(`${scenario.id} · ordenar por precio ${scenario.description}`, async ({
      inventoryPage,
    }) => {
      await inventoryPage.sortBy(scenario.option);

      const prices = await inventoryPage.visiblePrices();
      expect(
        isOrdered(prices, scenario.direction),
        `Los precios no están ordenados ${scenario.description}: ${prices.join(', ')}`,
      ).toBe(true);

      // Ordenados alfabéticamente para que la comparación no dependa del
      // criterio que se acaba de aplicar.
      const names = await inventoryPage.visibleNames();
      expect(names.sort()).toEqual([...NAMES_A_TO_Z].sort());
    });
  }
});
