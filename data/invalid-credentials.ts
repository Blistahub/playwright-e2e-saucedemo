import { PASSWORD, USERS } from './users';

/** Un intento de acceso que debe ser rechazado, y el mensaje exacto esperado. */
export interface InvalidLoginCase {
  /** Identificador del caso en la matriz de pruebas. */
  id: string;
  /** Qué se prueba, tal y como aparece en el título del test. */
  description: string;
  username: string;
  password: string;
  expectedError: string;
}

/**
 * Juegos de datos del test parametrizado de acceso.
 *
 * Cada caso sale de una partición de equivalencia distinta —credenciales que
 * no casan, cuenta bloqueada, campo obligatorio vacío—, no de repetir la misma
 * clase con valores diferentes. Añadir un caso aquí añade un test; no hay que
 * tocar el fichero de pruebas.
 *
 * Los mensajes esperados están copiados literalmente de la aplicación, no
 * escritos de memoria.
 */
export const INVALID_LOGINS: InvalidLoginCase[] = [
  {
    id: 'CP-02',
    description: 'usuario bloqueado por el administrador',
    username: USERS.lockedOut,
    password: PASSWORD,
    expectedError: 'Epic sadface: Sorry, this user has been locked out.',
  },
  {
    id: 'CP-03',
    description: 'contraseña incorrecta para un usuario válido',
    username: USERS.standard,
    password: 'contraseña-incorrecta',
    expectedError: 'Epic sadface: Username and password do not match any user in this service',
  },
  {
    id: 'CP-04',
    description: 'usuario inexistente',
    username: 'usuario_que_no_existe',
    password: PASSWORD,
    expectedError: 'Epic sadface: Username and password do not match any user in this service',
  },
  {
    id: 'CP-05',
    description: 'usuario vacío',
    username: '',
    password: PASSWORD,
    expectedError: 'Epic sadface: Username is required',
  },
  {
    id: 'CP-06',
    description: 'contraseña vacía',
    username: USERS.standard,
    password: '',
    expectedError: 'Epic sadface: Password is required',
  },
];
