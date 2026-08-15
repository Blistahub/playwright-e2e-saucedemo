import { PASSWORD, USERS } from './users';

/** Intento de acceso que debe rechazarse, con el mensaje exacto esperado. */
export interface InvalidLoginCase {
  /** Identificador en la matriz de pruebas. */
  id: string;
  /** Qué se prueba, tal cual aparece en el título del test. */
  description: string;
  username: string;
  password: string;
  expectedError: string;
}

/**
 * Juegos de datos del test parametrizado de acceso.
 *
 * Cada caso es una partición distinta —credenciales que no casan, cuenta
 * bloqueada, campo vacío—, no la misma clase con valores diferentes. Añadir un
 * caso es añadir una entrada aquí, sin tocar el fichero de tests.
 *
 * Los mensajes están copiados de la app, no escritos de memoria.
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
