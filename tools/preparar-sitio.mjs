#!/usr/bin/env node
/**
 * Ensambla lo que se publica en GitHub Pages.
 *
 * Antes, Pages servía directamente el informe HTML de Playwright: un listado
 * de resultados titulado «Playwright Test Report», en inglés y sin decir de
 * quién es ni qué prueba. Servía como constancia de que la suite existe, pero
 * quien abría el enlace no encontraba a nadie al otro lado.
 *
 * Ahora la raíz es una página que presenta el proyecto y el informe pasa a
 * `/informe/`, con las evidencias y las trazas colgando al lado:
 *
 *   _sitio/
 *   ├── index.html        presentación en español
 *   ├── evidencias/       capturas de los defectos y el GIF de la compra
 *   ├── informe/          el informe HTML de Playwright, sin tocar
 *   └── trazas/           una traza por defecto, para el visor oficial
 *
 *   node tools/preparar-sitio.mjs [carpeta-de-trazas]
 *
 * Las trazas ya vienen nombradas por `tools/nombrar-trazas.mjs`. Si no se pasa
 * la carpeta, el sitio se monta sin ellas: el informe y las evidencias siguen
 * publicándose, que es lo que interesa si algo falla al capturarlas.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = join(RAIZ, '_sitio');

/**
 * Copia recursiva a mano en lugar de `fs.cpSync(..., { recursive: true })`.
 *
 * No es una preferencia de estilo: sobre la carpeta de evidencias, `cpSync`
 * mata el proceso de Node en Windows con código 127, sin lanzar excepción y
 * sin escribir nada en la salida de error, de modo que ni un `try/catch`
 * alrededor lo captura. Doce líneas propias evitan depender de eso.
 */
function copiarCarpeta(origen, destino) {
  mkdirSync(destino, { recursive: true });
  for (const entrada of readdirSync(origen)) {
    const desde = join(origen, entrada);
    const hasta = join(destino, entrada);
    if (statSync(desde).isDirectory()) {
      copiarCarpeta(desde, hasta);
    } else {
      copyFileSync(desde, hasta);
    }
  }
}

const copiar = (origen, destino, etiqueta) => {
  if (!existsSync(origen)) {
    console.log(`  omitido  ${etiqueta} (no existe ${origen})`);
    return false;
  }
  if (statSync(origen).isDirectory()) {
    copiarCarpeta(origen, destino);
  } else {
    mkdirSync(dirname(destino), { recursive: true });
    copyFileSync(origen, destino);
  }
  console.log(`  copiado  ${etiqueta}`);
  return true;
};

/* ------------------------------------------------------------------ */

rmSync(DESTINO, { recursive: true, force: true });
mkdirSync(DESTINO, { recursive: true });

console.log('Ensamblando el sitio en _sitio/\n');

copiar(join(RAIZ, 'sitio', 'index.html'), join(DESTINO, 'index.html'), 'index.html');
copiar(join(RAIZ, 'evidencias'), join(DESTINO, 'evidencias'), 'evidencias/');
copiar(join(RAIZ, 'playwright-report'), join(DESTINO, 'informe'), 'informe/');

const carpetaTrazas = process.argv[2];
if (carpetaTrazas && existsSync(carpetaTrazas)) {
  copiar(carpetaTrazas, join(DESTINO, 'trazas'), `trazas/ (${readdirSync(carpetaTrazas).length})`);
} else {
  console.log('  omitido  trazas/ (no se ha indicado una carpeta con trazas)');
}

/* Sin esto, GitHub Pages pasa el sitio por Jekyll, que descarta cualquier
   fichero o carpeta que empiece por guion bajo. El informe de Playwright los
   usa, así que sin este fichero se publicaría incompleto. */
writeFileSync(join(DESTINO, '.nojekyll'), '');
console.log('  creado   .nojekyll');

console.log(`\nContenido de _sitio/: ${readdirSync(DESTINO).sort().join(', ')}`);
