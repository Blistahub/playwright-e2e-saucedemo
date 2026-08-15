#!/usr/bin/env node
/**
 * Genera las evidencias visuales del repositorio.
 *
 * Las capturas de los reportes de defecto y el GIF del README no se hacen a
 * mano: se generan desde aquí, con la misma aplicación y los mismos usuarios
 * que usa la suite. Una captura suelta guardada en una carpeta envejece sin
 * que nadie se entere; una que se regenera con un comando se puede rehacer el
 * día que la aplicación cambie.
 *
 *   npm run evidencias
 *
 * Produce en `evidencias/`:
 *   HAL-01 … HAL-05 .png   una por defecto documentado
 *   compra-completa.gif    el caso CP-16 de extremo a extremo
 *
 * No corre en integración continua a propósito: el resultado se versiona y
 * solo hay que rehacerlo cuando cambia aquello que ilustra.
 *
 * Sobre el GIF: el ffmpeg que trae Playwright es una compilación mínima que
 * solo sabe escribir `webm` e `image2`, sin el muxer de GIF. En vez de exigir
 * un ffmpeg completo instalado en el sistema, se capturan los fotogramas de
 * los momentos que importan y se codifican aquí con dos librerías puras de
 * JavaScript y sin dependencias transitivas. Sale además un GIF más legible
 * que un vídeo a 10 fps: una secuencia de pasos, no una animación borrosa.
 */
import { chromium } from '@playwright/test';
/* gifenc se publica como CommonJS, así que no expone exportaciones con nombre
   a un módulo ESM: hay que desestructurar desde la exportación por defecto. */
import gifenc from 'gifenc';
import { PNG } from 'pngjs';
import { Buffer } from 'node:buffer';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const { GIFEncoder, quantize, applyPalette } = gifenc;

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SALIDA = join(RAIZ, 'evidencias');

const URL_BASE = 'https://www.saucedemo.com';
const PASSWORD = 'secret_sauce';

/** Tamaño de la ventana del GIF. Se captura ya al tamaño final: reescalar
    después emborronaría el texto de la interfaz, que es lo que hay que leer. */
const VENTANA = { width: 1000, height: 660 };

const acceder = async (page, usuario) => {
  await page.goto(URL_BASE);
  await page.fill('[data-test="username"]', usuario);
  await page.fill('[data-test="password"]', PASSWORD);
  await page.click('[data-test="login-button"]');
};

/* ------------------------------------------------------------------ */
/* Capturas de los defectos                                            */
/* ------------------------------------------------------------------ */

async function capturarHallazgos(browser) {
  const nuevaPagina = async () => {
    const contexto = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    return contexto.newPage();
  };

  /* HAL-01 · problem_user: las seis tarjetas cargan la misma imagen de error. */
  {
    const page = await nuevaPagina();
    await acceder(page, 'problem_user');
    await page.waitForURL('**/inventory.html');
    await page.locator('[data-test="inventory-list"]').screenshot({
      path: join(SALIDA, 'HAL-01-imagenes-repetidas.png'),
    });
    await page.context().close();
    console.log('  HAL-01  imágenes repetidas');
  }

  /* HAL-02 · problem_user: el apellido acaba en el campo del nombre y el
     formulario se niega a avanzar. Se captura ya con el error visible, que es
     la consecuencia y no solo el síntoma. */
  {
    const page = await nuevaPagina();
    await acceder(page, 'problem_user');
    await page.waitForURL('**/inventory.html');
    await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await page.click('[data-test="shopping-cart-link"]');
    await page.click('[data-test="checkout"]');
    await page.fill('[data-test="firstName"]', 'David');
    await page.fill('[data-test="lastName"]', 'Coya');
    await page.click('[data-test="continue"]');
    await page.locator('[data-test="checkout-info-container"]').screenshot({
      path: join(SALIDA, 'HAL-02-apellido-bloquea-compra.png'),
    });
    await page.context().close();
    console.log('  HAL-02  el apellido bloquea la compra');
  }

  /* HAL-03 · error_user: tras pulsar «Remove» el contador sigue en 2 y los dos
     botones siguen diciendo «Remove». */
  {
    const page = await nuevaPagina();
    await acceder(page, 'error_user');
    await page.waitForURL('**/inventory.html');
    await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await page.click('[data-test="add-to-cart-sauce-labs-bike-light"]');
    await page.click('[data-test="remove-sauce-labs-backpack"]');
    await page.waitForTimeout(400);
    await page.screenshot({
      path: join(SALIDA, 'HAL-03-remove-no-elimina.png'),
      clip: { x: 0, y: 0, width: 1280, height: 620 },
    });
    await page.context().close();
    console.log('  HAL-03  «Remove» no elimina');
  }

  /* HAL-04 · error_user: el desplegable muestra «Price (high to low)» como
     criterio activo y la lista sigue en el orden original. */
  {
    const page = await nuevaPagina();
    await acceder(page, 'error_user');
    await page.waitForURL('**/inventory.html');
    await page.selectOption('[data-test="product-sort-container"]', 'hilo');
    await page.waitForTimeout(400);
    await page.screenshot({
      path: join(SALIDA, 'HAL-04-orden-no-se-aplica.png'),
      clip: { x: 0, y: 0, width: 1280, height: 620 },
    });
    await page.context().close();
    console.log('  HAL-04  la ordenación no se aplica');
  }

  /* HAL-05 · performance_glitch_user: dos segundos después de pulsar «Login»
     la aplicación sigue en el formulario. */
  {
    const page = await nuevaPagina();
    await page.goto(URL_BASE);
    await page.fill('[data-test="username"]', 'performance_glitch_user');
    await page.fill('[data-test="password"]', PASSWORD);
    const inicio = Date.now();
    await page.click('[data-test="login-button"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(SALIDA, 'HAL-05-acceso-lento.png') });
    await page.waitForURL('**/inventory.html');
    console.log(`  HAL-05  acceso lento (${Date.now() - inicio} ms hasta el catálogo)`);
    await page.context().close();
  }
}

/* ------------------------------------------------------------------ */
/* GIF del caso CP-16                                                  */
/* ------------------------------------------------------------------ */

/**
 * Recorre la compra completa capturando un fotograma en cada hito.
 *
 * Es una grabación de demostración, no la ejecución del test: el caso que de
 * verdad comprueba esto es CP-16, y corre sin pausas ni capturas.
 */
async function grabarCompra(browser) {
  const contexto = await browser.newContext({ viewport: VENTANA });
  const page = await contexto.newPage();
  const fotogramas = [];

  /* Un hito dura lo que se tarda en leerlo. La confirmación aguanta más
     porque es el desenlace y es donde se detiene la vista. */
  const hito = async (milisegundos = 1400) => {
    fotogramas.push({ png: await page.screenshot(), delay: milisegundos });
  };

  await page.goto(URL_BASE);
  await page.fill('[data-test="username"]', 'standard_user');
  await page.fill('[data-test="password"]', PASSWORD);
  await hito(); // credenciales listas
  await page.click('[data-test="login-button"]');
  await page.waitForURL('**/inventory.html');
  await hito(); // catálogo

  await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
  await page.click('[data-test="add-to-cart-sauce-labs-onesie"]');
  await hito(); // dos artículos, contador a 2

  await page.click('[data-test="shopping-cart-link"]');
  await page.waitForURL('**/cart.html');
  await hito(); // carrito

  await page.click('[data-test="checkout"]');
  await page.fill('[data-test="firstName"]', 'David');
  await page.fill('[data-test="lastName"]', 'Coya');
  await page.fill('[data-test="postalCode"]', '28001');
  await hito(); // datos del comprador

  await page.click('[data-test="continue"]');
  await page.waitForURL('**/checkout-step-two.html');
  await hito(1800); // resumen con subtotal, impuesto y total

  await page.click('[data-test="finish"]');
  await page.waitForURL('**/checkout-complete.html');
  await hito(2600); // confirmación

  await contexto.close();
  return fotogramas;
}

/** Codifica los fotogramas como GIF animado. */
function codificarGif(fotogramas, destino) {
  const gif = GIFEncoder();
  for (const fotograma of fotogramas) {
    const { width, height, data } = PNG.sync.read(fotograma.png);
    /* 128 colores bastan para una interfaz plana y recortan bastante el peso.
       Sin difuminado: en texto sobre fondo liso, el difuminado añade ruido
       que se nota más que la propia reducción de color. */
    const paleta = quantize(data, 128);
    const indexado = applyPalette(data, paleta);
    gif.writeFrame(indexado, width, height, { palette: paleta, delay: fotograma.delay });
  }
  gif.finish();
  writeFileSync(destino, Buffer.from(gif.bytes()));
}

/* ------------------------------------------------------------------ */

mkdirSync(SALIDA, { recursive: true });
console.log('Generando evidencias contra https://www.saucedemo.com\n');

const browser = await chromium.launch();
await capturarHallazgos(browser);
const fotogramas = await grabarCompra(browser);
await browser.close();

codificarGif(fotogramas, join(SALIDA, 'compra-completa.gif'));
console.log(`  CP-16   compra-completa.gif (${fotogramas.length} fotogramas)`);

const generadas = readdirSync(SALIDA).filter((f) => !f.startsWith('.'));
console.log(`\n${generadas.length} evidencias en evidencias/`);
