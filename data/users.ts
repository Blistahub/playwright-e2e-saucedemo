/**
 * Usuarios de SauceDemo, publicados por el fabricante en la propia pantalla de
 * acceso. Cuatro de los seis están rotos a propósito: son el material de
 * `tests/findings.spec.ts` y de `docs/03-hallazgos.md`.
 */
export const PASSWORD = 'secret_sauce';

export const USERS = {
  /** Comportamiento nominal. El de referencia de la suite. */
  standard: 'standard_user',
  /** Bloqueado: el acceso se rechaza con un mensaje propio. */
  lockedOut: 'locked_out_user',
  /** Interfaz defectuosa: imágenes y campos del formulario. */
  problem: 'problem_user',
  /** Latencia artificial en el acceso. */
  performanceGlitch: 'performance_glitch_user',
  /** Acciones que no hacen nada: eliminar del carrito, ordenar. */
  error: 'error_user',
  /** Desviaciones visuales. Fuera de alcance, ver el plan § 2.2. */
  visual: 'visual_user',
} as const;

export type UserName = (typeof USERS)[keyof typeof USERS];
