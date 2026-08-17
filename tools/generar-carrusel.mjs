#!/usr/bin/env node
/**
 * Genera los materiales de difusión: el carrusel de LinkedIn y la miniatura.
 *
 *   npm run carrusel
 *
 * Salida en `marketing/` (no se versiona):
 *   carrusel-playwright-saucedemo.pdf   8 diapositivas 1080x1350, para subir como documento
 *   carrusel-01..08.png                 las mismas sueltas, por si hace falta una imagen
 *   miniatura-playwright-saucedemo.png  2400x1256, para el perfil y la vista previa del repo
 *
 * Las capturas del producto no se pegan a mano: la del resumen de compra se
 * toma en el momento contra la aplicación, y la del defecto se reutiliza de
 * `evidencias/`, que genera `npm run evidencias`.
 */
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SALIDA = join(RAIZ, 'marketing');
const EVIDENCIAS = join(RAIZ, 'evidencias');

const ANCHO = 1080;
const ALTO = 1350;

const dataUri = (ruta) => `data:image/png;base64,${readFileSync(ruta).toString('base64')}`;

/* ------------------------------------------------------------------ */
/* Captura fresca del resumen de compra                                */
/* ------------------------------------------------------------------ */

async function capturarResumen(browser) {
  const contexto = await browser.newContext({ viewport: { width: 1000, height: 700 } });
  const page = await contexto.newPage();
  await page.goto('https://www.saucedemo.com/');
  await page.fill('[data-test="username"]', 'standard_user');
  await page.fill('[data-test="password"]', 'secret_sauce');
  await page.click('[data-test="login-button"]');
  await page.waitForURL('**/inventory.html');
  await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
  await page.click('[data-test="add-to-cart-sauce-labs-onesie"]');
  await page.click('[data-test="shopping-cart-link"]');
  await page.click('[data-test="checkout"]');
  await page.fill('[data-test="firstName"]', 'David');
  await page.fill('[data-test="lastName"]', 'Coya');
  await page.fill('[data-test="postalCode"]', '28001');
  await page.click('[data-test="continue"]');
  await page.waitForURL('**/checkout-step-two.html');
  const png = await page.locator('[data-test="checkout-summary-container"]').screenshot();
  await contexto.close();
  return `data:image/png;base64,${png.toString('base64')}`;
}

/* ------------------------------------------------------------------ */
/* Estilos                                                             */
/* ------------------------------------------------------------------ */

const ESTILOS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0B1220; }
  .slide {
    width: ${ANCHO}px; height: ${ALTO}px;
    background: #0B1220;
    color: #E8EDF5;
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    padding: 78px 76px 68px;
    display: flex; flex-direction: column;
    position: relative;
    overflow: hidden;
    page-break-after: always;
  }
  .slide::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(1200px 620px at 82% -8%, rgba(78,161,255,.16), transparent 62%);
    pointer-events: none;
  }
  .rail {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 20px; letter-spacing: .13em; text-transform: uppercase;
    color: #7C8AA3; font-weight: 600; margin-bottom: 54px;
    position: relative; z-index: 1;
  }
  .rail .num { color: #4EA1FF; }
  .body { flex: 1; display: flex; flex-direction: column; justify-content: flex-start;
          position: relative; z-index: 1; }
  .body.centro { justify-content: center; }
  /* La portada ancla el titular al tercio inferior, con una regla de acento
     encima. Centrado quedaba hundido y parecia un descuido. */
  .body.portada { justify-content: flex-end; padding-bottom: 40px; }
  .regla { width: 96px; height: 5px; background: #4EA1FF; border-radius: 3px; margin-bottom: 40px; }
  h1 { font-size: 74px; line-height: 1.1; letter-spacing: -.025em; font-weight: 700; }
  h2 { font-size: 50px; line-height: 1.16; letter-spacing: -.02em; font-weight: 700; margin-bottom: 26px; }
  h3 { font-size: 30px; line-height: 1.3; font-weight: 700; margin-bottom: 14px; color: #4EA1FF; }
  p  { font-size: 27px; line-height: 1.56; color: #B9C4D6; }
  p + p { margin-top: 20px; }
  strong { color: #E8EDF5; font-weight: 700; }
  .kicker { font-size: 26px; color: #4EA1FF; font-weight: 700; margin-bottom: 22px;
            letter-spacing: .04em; text-transform: uppercase; }
  .foot { font-size: 21px; color: #6F7D95; position: relative; z-index: 1; }
  figure { margin: 8px 0 0; }
  figure img { width: 100%; border-radius: 14px; border: 1px solid #22304A; display: block; }
  figcaption { font-size: 21px; color: #8A97AC; margin-top: 18px; line-height: 1.45; }
  .cifras { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .cifra { background: #131C2E; border: 1px solid #22304A; border-radius: 16px; padding: 30px 32px; }
  .cifra b { display: block; font-size: 62px; line-height: 1; letter-spacing: -.03em; color: #E8EDF5; }
  .cifra span { display: block; font-size: 22px; color: #8A97AC; margin-top: 12px; line-height: 1.35; }
  .cifra.wide { grid-column: 1 / -1; }
  .fila { display: flex; gap: 20px; align-items: flex-start; margin-bottom: 26px; }
  .fila .marca { flex: 0 0 auto; width: 42px; height: 42px; border-radius: 11px;
                 background: #1B2942; color: #4EA1FF; font-weight: 700; font-size: 22px;
                 display: flex; align-items: center; justify-content: center; margin-top: 4px; }
  .fila div p { font-size: 26px; }
  code, .mono { font-family: Consolas, 'SF Mono', Menlo, monospace; }
  pre { background: #131C2E; border: 1px solid #22304A; border-radius: 14px;
        padding: 28px 30px; font-size: 23px; line-height: 1.6; color: #C9D4E5; overflow: hidden; }
  pre .c { color: #6F7D95; }
  pre .k { color: #4EA1FF; }
  pre .s { color: #7EE787; }
  .cierre { display: flex; flex-direction: column; gap: 16px; }
  .cierre .nombre { font-size: 58px; font-weight: 700; letter-spacing: -.02em; }
  .cierre .rol { font-size: 30px; color: #4EA1FF; font-weight: 600; }
  .enlaces { margin-top: 34px; display: flex; flex-direction: column; gap: 14px; }
  .enlaces div { font-size: 24px; color: #B9C4D6; }
  .enlaces .mono { color: #E8EDF5; }
  .cta { margin-top: 40px; background: #131C2E; border: 1px solid #2B4670;
         border-left: 4px solid #4EA1FF; border-radius: 14px; padding: 26px 30px;
         font-size: 26px; color: #D6E0EF; line-height: 1.5; }
`;

/* ------------------------------------------------------------------ */
/* Diapositivas                                                        */
/* ------------------------------------------------------------------ */

function diapositivas({ hal02, resumen }) {
  const rail = (n) =>
    `<div class="rail"><span>Suite E2E · Playwright</span><span class="num">${String(n).padStart(2, '0')} / 08</span></div>`;

  return [
    `${rail(1)}
     <div class="body portada">
       <div class="regla"></div>
       <h1>Un formulario que te exige un campo que él mismo te impide rellenar.</h1>
     </div>
     <div class="foot">Un defecto encontrado automatizando una tienda en línea</div>`,

    `${rail(2)}
     <div class="body centro">
       <h2>Escribes el apellido y el campo se queda vacío</h2>
       <figure>
         <img src="${hal02}" alt="Formulario de checkout con el apellido vacío y un error" />
         <figcaption>Se escribió «David» en el nombre y «Coya» en el apellido. «Coya» acabó en el
         primer campo, el segundo quedó vacío y la compra se detuvo.</figcaption>
       </figure>
     </div>`,

    `${rail(3)}
     <div class="body">
       <div class="kicker">Antes de reportar, descartar</div>
       <h2>Dos explicaciones alternativas, las dos comprobadas</h2>
       <div class="fila">
         <div class="marca">1</div>
         <div><p><strong>«Es el orden de escritura.»</strong> Relleno primero el apellido y después
         el nombre. El apellido sigue vacío.</p></div>
       </div>
       <div class="fila">
         <div class="marca">2</div>
         <div><p><strong>«Es la automatización, que escribe de golpe.»</strong> Tecleo letra a letra
         con 60&nbsp;ms entre pulsaciones. Cada tecla se escribe en el campo del nombre y sobrescribe
         la anterior.</p></div>
       </div>
       <p style="margin-top:14px">No hay forma de rellenar el apellido, y el formulario lo exige
       para continuar. <strong>La compra es imposible.</strong></p>
     </div>
     <div class="foot">Un defecto que el equipo cierra como «no reproducible» cuesta más que no
     haberlo reportado</div>`,

    `${rail(4)}
     <div class="body centro">
       <h2>La suite</h2>
       <div class="cifras">
         <div class="cifra"><b>31</b><span>casos E2E</span></div>
         <div class="cifra"><b>93</b><span>ejecuciones en cada push</span></div>
         <div class="cifra"><b>9</b><span>pruebas unitarias</span></div>
         <div class="cifra"><b>5</b><span>defectos documentados</span></div>
         <div class="cifra wide"><b>0</b><span>esperas fijas, y no por confianza: lo impone una
         regla que corta la integración continua</span></div>
       </div>
     </div>
     <div class="foot">Chromium, Firefox y WebKit · Page Object Model · TypeScript · GitHub Actions</div>`,

    `${rail(5)}
     <div class="body">
       <h2>El flujo que genera ingreso, comprobado entero</h2>
       <figure>
         <img src="${resumen}" alt="Resumen de compra con subtotal, impuesto y total" />
         <figcaption>El total no se lee de la pantalla: se recalcula en el test desde las líneas del
         carrito. Comparar el total con el subtotal de la misma pantalla pasaría aunque los dos
         estuvieran mal.</figcaption>
       </figure>
     </div>`,

    `${rail(6)}
     <div class="body">
       <div class="kicker">Defectos conocidos</div>
       <h2>El defecto documentado no ensucia la suite</h2>
       <pre><span class="c">// afirma el comportamiento CORRECTO</span>
test(<span class="s">'HAL-03 · «Remove» debe retirar el producto'</span>, <span class="k">async</span> ({ inventoryPage }) => {
  test.<span class="k">fail</span>();
  ...
});</pre>
       <p style="margin-top:26px">La suite se queda en verde: un defecto ya documentado no tiene que
       ser una alarma nueva cada mañana.</p>
       <p>Pero el día que alguien lo corrija, el test pasará y la integración continua lo marcará
       como <strong>fallo inesperado</strong>. La corrección avisa sola.</p>
     </div>`,

    `${rail(7)}
     <div class="body">
       <div class="kicker">Lo que no resolví</div>
       <h2>Un test inestable abierto, y sin diagnóstico</h2>
       <p>CP-18 falló una vez en Firefox. No se reprodujo en cinco intentos posteriores. No tengo la
       causa, y así está anotado en la documentación.</p>
       <p>Lo instructivo es <strong>por qué se perdió el diagnóstico</strong>: la traza estaba
       configurada como <span class="mono">on-first-retry</span> y en local los reintentos son 0, así
       que la condición no se cumplía nunca.</p>
       <p>Eso sí lo arreglé. Un fallo local ya no se pierde. El otro sigue abierto.</p>
       <pre style="margin-top:30px"><span class="c">// playwright.config.ts</span>
trace: process.env.CI ? <span class="s">'on-first-retry'</span> : <span class="s">'retain-on-failure'</span>,</pre>
     </div>
     <div class="foot">Tapar un síntoma que no se ha entendido es más barato hoy y más caro después</div>`,

    `${rail(8)}
     <div class="body centro cierre">
       <div class="nombre">David Coya Moreno</div>
       <div class="rol">QA Tester · Madrid</div>
       <div class="enlaces">
         <div>Web del proyecto<br /><span class="mono">blistahub.github.io/playwright-e2e-saucedemo</span></div>
         <div>Código y documentación<br /><span class="mono">github.com/Blistahub/playwright-e2e-saucedemo</span></div>
         <div>Ciclo de pruebas manuales<br /><span class="mono">github.com/Blistahub/qa-portfolio-orangehrm</span></div>
       </div>
       <div class="cta">Abierto a oportunidades como QA Tester, en Madrid o en remoto.
       Si estáis buscando, escribidme.</div>
     </div>`,
  ].map((contenido) => `<div class="slide">${contenido}</div>`);
}

/* ------------------------------------------------------------------ */
/* Miniatura                                                           */
/* ------------------------------------------------------------------ */

const miniatura = () => `
  <div class="mini">
    <div class="mini-izq">
      <div class="mini-kicker">Portfolio QA · Automatización</div>
      <div class="mini-titulo">Suite de regresión E2E<br />con Playwright</div>
      <div class="mini-sub">31 casos en Chromium, Firefox y WebKit. 5 defectos reales encontrados,
      con su traza publicada.</div>
      <div class="mini-autor">David Coya Moreno · QA Tester</div>
    </div>
    <div class="mini-der">
      <div class="mini-cifra"><b>93</b><span>ejecuciones<br />por push</span></div>
      <div class="mini-cifra"><b>5</b><span>defectos<br />documentados</span></div>
      <div class="mini-cifra"><b>0</b><span>tests<br />inestables</span></div>
    </div>
  </div>`;

const ESTILOS_MINI = `
  .mini {
    width: 1200px; height: 628px; background: #0B1220; color: #E8EDF5;
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    padding: 64px 68px; display: flex; gap: 54px; align-items: center;
    position: relative; overflow: hidden;
  }
  .mini::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(760px 460px at 88% -12%, rgba(78,161,255,.20), transparent 62%);
  }
  .mini::after {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 6px; background: #4EA1FF;
  }
  .mini-izq { flex: 1; position: relative; z-index: 1; }
  .mini-kicker { font-size: 19px; letter-spacing: .16em; text-transform: uppercase;
                 color: #4EA1FF; font-weight: 700; margin-bottom: 22px; }
  .mini-titulo { font-size: 62px; line-height: 1.08; letter-spacing: -.03em; font-weight: 700; }
  .mini-sub { font-size: 23px; line-height: 1.5; color: #B9C4D6; margin-top: 24px; max-width: 30ch; }
  .mini-autor { font-size: 21px; color: #7C8AA3; margin-top: 34px; font-weight: 600; }
  .mini-der { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 16px; }
  .mini-cifra { background: #131C2E; border: 1px solid #22304A; border-radius: 16px;
                padding: 22px 28px; min-width: 268px; display: flex; align-items: center; gap: 20px; }
  .mini-cifra b { font-size: 54px; line-height: 1; letter-spacing: -.03em; }
  .mini-cifra span { font-size: 19px; color: #8A97AC; line-height: 1.35; }
`;

/* ------------------------------------------------------------------ */

mkdirSync(SALIDA, { recursive: true });
const browser = await chromium.launch();

console.log('Capturando el resumen de compra contra la aplicación…');
const resumen = await capturarResumen(browser);
const hal02 = dataUri(join(EVIDENCIAS, 'HAL-02-apellido-bloquea-compra.png'));

const slides = diapositivas({ hal02, resumen });
const html = `<!doctype html><meta charset="utf-8"><style>${ESTILOS}</style>${slides.join('')}`;

const contexto = await browser.newContext({
  viewport: { width: ANCHO, height: ALTO },
  deviceScaleFactor: 2,
});
const page = await contexto.newPage();
await page.setContent(html, { waitUntil: 'load' });

for (let i = 0; i < slides.length; i += 1) {
  const nombre = `carrusel-${String(i + 1).padStart(2, '0')}.png`;
  await page.locator('.slide').nth(i).screenshot({ path: join(SALIDA, nombre) });
  console.log(`  ${nombre}`);
}

const pdf = await page.pdf({
  width: `${ANCHO}px`,
  height: `${ALTO}px`,
  printBackground: true,
  pageRanges: `1-${slides.length}`,
});
writeFileSync(join(SALIDA, 'carrusel-playwright-saucedemo.pdf'), pdf);
console.log(`  carrusel-playwright-saucedemo.pdf (${slides.length} diapositivas)`);
await contexto.close();

const ctxMini = await browser.newContext({
  viewport: { width: 1200, height: 628 },
  deviceScaleFactor: 2,
});
const pageMini = await ctxMini.newPage();
await pageMini.setContent(
  `<!doctype html><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}${ESTILOS_MINI}</style>${miniatura()}`,
  { waitUntil: 'load' },
);
await pageMini.locator('.mini').screenshot({
  path: join(SALIDA, 'miniatura-playwright-saucedemo.png'),
});
console.log('  miniatura-playwright-saucedemo.png (2400x1256)');
await ctxMini.close();

await browser.close();
console.log(`\nListo en marketing/`);
