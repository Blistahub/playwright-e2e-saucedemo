/** Datos del comprador que exige el primer paso del checkout. */
export interface Customer {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export const VALID_CUSTOMER: Customer = {
  firstName: 'David',
  lastName: 'Coya',
  postalCode: '28001',
};

/** Un caso de datos incompletos y el error que debe devolver la aplicación. */
export interface IncompleteCustomerCase {
  /** Identificador del caso en la matriz de pruebas. */
  id: string;
  /** Qué se omite, tal y como aparece en el título del test. */
  description: string;
  customer: Customer;
  expectedError: string;
}

/**
 * Un caso por campo obligatorio. La aplicación valida en orden —nombre,
 * apellido, código postal— así que cada caso deja vacío únicamente el campo
 * bajo prueba y rellena los anteriores: de otro modo el primer error taparía
 * a los demás y tres casos comprobarían lo mismo.
 */
export const INCOMPLETE_CUSTOMERS: IncompleteCustomerCase[] = [
  {
    id: 'CP-18',
    description: 'sin nombre',
    customer: { firstName: '', lastName: 'Coya', postalCode: '28001' },
    expectedError: 'Error: First Name is required',
  },
  {
    id: 'CP-19',
    description: 'sin apellido',
    customer: { firstName: 'David', lastName: '', postalCode: '28001' },
    expectedError: 'Error: Last Name is required',
  },
  {
    id: 'CP-20',
    description: 'sin código postal',
    customer: { firstName: 'David', lastName: 'Coya', postalCode: '' },
    expectedError: 'Error: Postal Code is required',
  },
];
