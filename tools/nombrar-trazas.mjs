#!/usr/bin/env node
/**
 * Recoge las trazas de una ejecución y las nombra por su identificador.
 *
 * Playwright las deja en carpetas con el título del test recortado y un hash
 * —`findings-Defectos-de-probl-4be1d--lo-que-se-escribe-hallazgo-chromium`—,
 * que no sirve para enlazar desde la documentación ni desde el visor. El
 * informe JSON sí trae el título completo junto a la ruta del adjunto, así
 * que el identificador sale de ahí y el fichero acaba llamándose `HAL-02.zip`.
 *
 *   node tools/nombrar-trazas.mjs <informe.json> <carpeta-destino>
 *
 * Va en su propio paso, y no dentro del ensamblado del sitio, porque en
 * integración continua las trazas se generan en el job del navegador y el
 * sitio se monta en otro: las rutas del JSON solo existen donde se ejecutó.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const [rutaJson, destino] = process.argv.slice(2);

if (!rutaJson || !destino) {
  console.error('Uso: node tools/nombrar-trazas.mjs <informe.json> <carpeta-destino>');
  process.exit(1);
}
if (!existsSync(rutaJson)) {
  console.error(`No existe el informe JSON: ${rutaJson}`);
  process.exit(1);
}

const informe = JSON.parse(readFileSync(rutaJson, 'utf8'));
mkdirSync(destino, { recursive: true });

let publicadas = 0;
const recorrer = (suite) => {
  for (const spec of suite.specs ?? []) {
    const id = spec.title.match(/^(HAL|CP)-\d+/)?.[0];
    if (!id) continue;
    for (const test of spec.tests ?? []) {
      for (const resultado of test.results ?? []) {
        for (const adjunto of resultado.attachments ?? []) {
          if (adjunto.name !== 'trace' || !adjunto.path || !existsSync(adjunto.path)) continue;
          copyFileSync(adjunto.path, join(destino, `${id}.zip`));
          publicadas += 1;
        }
      }
    }
  }
  for (const hija of suite.suites ?? []) recorrer(hija);
};
for (const suite of informe.suites ?? []) recorrer(suite);

if (publicadas === 0) {
  console.error(
    'No se ha recogido ninguna traza. ¿Se ejecutó la suite con --trace=on y con --output propio?',
  );
  process.exit(1);
}

console.log(`${publicadas} trazas en ${destino}: ${readdirSync(destino).sort().join(', ')}`);
