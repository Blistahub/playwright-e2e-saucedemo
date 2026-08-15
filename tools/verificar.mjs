#!/usr/bin/env node
/**
 * Comprueba que la documentación siga cuadrando con la suite.
 *
 * Una matriz de treinta casos se desincroniza sola: añades un caso y la cifra
 * del README se queda atrás, renombras un fichero y un enlace deja de
 * resolver. Nada de eso rompe un test, así que no se nota hasta que alguien lee
 * los documentos y ve que mienten.
 *
 * Comprueba contra la suite real, no contra lo que la documentación cree:
 *   1. Todo caso de la suite está en la matriz y al revés.
 *   2. Las cifras declaradas son las reales.
 *   3. Los enlaces internos resuelven.
 *   4. Los anclajes apuntan a encabezados que existen.
 *
 * Sale con 1 si algo no cuadra, para encadenarlo en CI.
 *
 *   node tools/verificar.mjs
 */
import { execSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errores = [];
const fallo = (mensaje) => errores.push(mensaje);

const leer = (rutaRelativa) => readFileSync(join(RAIZ, rutaRelativa), 'utf8');

/** El proyecto de Playwright que agrupa la capa baja de la pirámide. */
const PROYECTO_UNITARIO = 'unidad';

/* ------------------------------------------------------------------ */
/* Datos reales de la suite                                            */
/* ------------------------------------------------------------------ */

/**
 * Qué casos existen de verdad, según Playwright.
 *
 * `--list` no levanta navegadores ni toca la red, así que esto es barato.
 */
function leerSuite() {
  const bruto = execSync('npx playwright test --list --reporter=json', {
    cwd: RAIZ,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  const json = JSON.parse(bruto.slice(bruto.indexOf('{')));

  const ejecuciones = [];
  const recorrer = (suite) => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        ejecuciones.push({
          titulo: spec.title,
          fichero: spec.file,
          proyecto: test.projectName,
        });
      }
    }
    for (const hija of suite.suites ?? []) recorrer(hija);
  };
  for (const suite of json.suites ?? []) recorrer(suite);

  // Un «caso» es un título dentro de un fichero; las ejecuciones son ese caso
  // por cada navegador. Los unitarios van aparte: mezclarlos inflaría la
  // cobertura de interfaz con comprobaciones que no la tocan.
  const porCapa = (esUnitario) => {
    const seleccion = ejecuciones.filter(
      (e) => (e.proyecto === PROYECTO_UNITARIO) === esUnitario,
    );
    const casos = new Map();
    for (const ejecucion of seleccion) {
      casos.set(`${ejecucion.fichero}::${ejecucion.titulo}`, ejecucion);
    }
    return {
      casos: [...casos.values()],
      ejecuciones: seleccion,
      proyectos: [...new Set(seleccion.map((e) => e.proyecto))],
    };
  };

  return { e2e: porCapa(false), unidad: porCapa(true) };
}

/** `CP-17.1` y `CP-17.3` son juegos de datos del mismo caso: CP-17. */
const normalizar = (id) => id.replace(/\.\d+$/, '');

const extraerId = (titulo) => titulo.match(/^(CP|HAL|U)-\d+(\.\d+)?/)?.[0] ?? null;

/* ------------------------------------------------------------------ */
/* 1 · Casos de la suite frente a la matriz                            */
/* ------------------------------------------------------------------ */

function comprobarCasos(suite) {
  const enSuite = new Set();
  for (const caso of [...suite.e2e.casos, ...suite.unidad.casos]) {
    const id = extraerId(caso.titulo);
    if (!id) {
      fallo(
        `El caso «${caso.titulo}» (${caso.fichero}) no empieza por un identificador CP-nn, HAL-nn o U-nn.`,
      );
      continue;
    }
    enSuite.add(normalizar(id));
  }

  const matriz = leer('docs/02-matriz-de-casos.md');
  const enMatriz = new Set(
    [...matriz.matchAll(/^\| (CP|HAL|U)-\d+/gm)].map((m) => m[0].replace('| ', '')),
  );

  for (const id of [...enSuite].sort()) {
    if (!enMatriz.has(id)) {
      fallo(`${id} existe en la suite pero no está en docs/02-matriz-de-casos.md.`);
    }
  }
  for (const id of [...enMatriz].sort()) {
    if (!enSuite.has(id)) {
      fallo(`${id} está en la matriz pero no existe ningún test con ese identificador.`);
    }
  }

  return enSuite;
}

/* ------------------------------------------------------------------ */
/* 2 · Cifras declaradas frente a las reales                           */
/* ------------------------------------------------------------------ */

/**
 * Cada patrón captura una cifra de la prosa y con qué magnitud debe cuadrar.
 * Las expresiones son deliberadamente concretas: contar cualquier «N casos»
 * daría falsos positivos con las tablas de cobertura, que hablan de una
 * funcionalidad y no del total.
 */
function comprobarCifras(suite) {
  const hallazgos = suite.e2e.casos.filter((c) => c.titulo.includes('@hallazgo')).length;

  const real = {
    casos: suite.e2e.casos.length,
    ejecuciones: suite.e2e.ejecuciones.length,
    funcionales: suite.e2e.casos.length - hallazgos,
    hallazgos,
    humo: suite.e2e.casos.filter((c) => c.titulo.includes('@humo')).length,
    navegadores: suite.e2e.proyectos.length,
    unitarios: suite.unidad.casos.length,
  };

  const patrones = [
    [/(\d+) casos por navegador/g, 'casos'],
    [/(\d+) casos E2E · (\d+) ejecuciones/g, 'casos', 'ejecuciones'],
    [/casos_e2e-(\d+)-/g, 'casos'],
    [/ejecuciones_por_push-(\d+)-/g, 'ejecuciones'],
    [/unitarios-(\d+)-/g, 'unitarios'],
    [/los (\d+) casos en los tres navegadores/g, 'casos'],
    [/los (\d+) casos E2E con su técnica/g, 'casos'],
    [/los (\d+) resultados/g, 'ejecuciones'],
    [/\*\*(\d+)\*\* — los (\d+) casos en Chromium/g, 'ejecuciones', 'casos'],
    [/(\d+) casos funcionales/g, 'funcionales'],
    [/(\d+) funcionales \+ (\d+) de/g, 'funcionales', 'hallazgos'],
    [/(\d+) casos: el mínimo/g, 'humo'],
    [/(\d+) casos: los defectos conocidos/g, 'hallazgos'],
    [/= \*\*(\d+) ejecuciones\*\*/g, 'ejecuciones'],
    [/(\d+) pruebas unitarias/g, 'unitarios'],
    [/(\d+) unitarios/g, 'unitarios'],
  ];

  for (const ruta of documentos()) {
    const texto = leer(ruta);
    for (const [patron, ...magnitudes] of patrones) {
      for (const coincidencia of texto.matchAll(patron)) {
        magnitudes.forEach((magnitud, indice) => {
          const declarado = Number(coincidencia[indice + 1]);
          if (declarado !== real[magnitud]) {
            fallo(
              `${ruta}: declara ${declarado} para «${magnitud}» y la suite tiene ${real[magnitud]} · «${coincidencia[0].trim()}»`,
            );
          }
        });
      }
    }
  }

  return real;
}

/* ------------------------------------------------------------------ */
/* 3 y 4 · Enlaces internos y anclajes                                 */
/* ------------------------------------------------------------------ */

/**
 * Igual que hace GitHub: minúsculas, fuera la puntuación, cada espacio a guion.
 *
 * CADA espacio, no cada racha. Al quitar la raya de «automatiza — y por qué»
 * quedan dos espacios seguidos y GitHub pone dos guiones. Colapsarlos daba por
 * roto un enlace que funcionaba.
 */
function anclar(encabezado) {
  return encabezado
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s/g, '-');
}

function anclajesDe(rutaAbsoluta) {
  const texto = readFileSync(rutaAbsoluta, 'utf8');
  return new Set([...texto.matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) => anclar(m[1])));
}

function comprobarEnlaces() {
  for (const ruta of documentos()) {
    const texto = leer(ruta);
    const carpeta = dirname(join(RAIZ, ruta));

    for (const enlace of texto.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
      const destino = enlace[1];
      if (/^(https?:|mailto:)/.test(destino)) continue;

      const [rutaDestino, anclaje] = destino.split('#');
      const absoluto = rutaDestino ? resolve(carpeta, rutaDestino) : join(RAIZ, ruta);

      if (!existsSync(absoluto)) {
        fallo(`${ruta}: el enlace «${destino}» apunta a un fichero que no existe.`);
        continue;
      }
      if (anclaje && absoluto.endsWith('.md')) {
        if (!anclajesDe(absoluto).has(anclaje)) {
          fallo(
            `${ruta}: el anclaje «#${anclaje}» no corresponde a ningún encabezado de ${relative(RAIZ, absoluto).replace(/\\/g, '/')}.`,
          );
        }
      }
    }
  }
}

/** README y todos los documentos de `docs/`. */
function documentos() {
  return [
    'README.md',
    ...readdirSync(join(RAIZ, 'docs'))
      .filter((f) => f.endsWith('.md'))
      .map((f) => `docs/${f}`),
  ];
}

/* ------------------------------------------------------------------ */

const suite = leerSuite();
const ids = comprobarCasos(suite);
const real = comprobarCifras(suite);
comprobarEnlaces();

console.log(
  `E2E: ${real.casos} casos (${real.funcionales} funcionales · ${real.hallazgos} hallazgos) ` +
    `× ${real.navegadores} navegadores = ${real.ejecuciones} ejecuciones | ` +
    `Unitarios: ${real.unitarios} | Etiquetados @humo: ${real.humo} | Identificadores: ${ids.size}`,
);

if (errores.length > 0) {
  console.error(`\n${errores.length} incoherencia(s):\n`);
  for (const error of errores) console.error(`  - ${error}`);
  process.exit(1);
}

console.log('\nDocumentacion consistente con la suite.');
