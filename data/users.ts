/**
 * Usuarios de SauceDemo.
 *
 * El fabricante los publica en la propia pantalla de acceso. Cuatro de los seis
 * están rotos a propósito para que haya algo que encontrar: ese es el material
 * de `tests/findings.spec.ts` y de `docs/03-hallazgos.md`.
 */
export const PASSWORD = 'secret_sauce';

export const USERS = {
  /** Comportamiento nominal. Es el usuario de referencia de la suite. */
  standard: 'standard_user',
  /** Bloqueado: el acceso se rechaza con un mensaje específico. */
  lockedOut: 'locked_out_user',
  /** Interfaz defectuosa: imágenes y campos de formulario. */
  problem: 'problem_user',
  /** Latencia artificial en el acceso. */
  performanceGlitch: 'performance_glitch_user',
  /** Acciones que no surten efecto (eliminar del carrito, ordenar). */
  error: 'error_user',
  /** Desviaciones visuales respecto al usuario estándar. */
  visual: 'visual_user',
} as const;

export type UserName = (typeof USERS)[keyof typeof USERS];
