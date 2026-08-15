# Automatización E2E con Playwright — SauceDemo

**Suite de regresión de extremo a extremo sobre una tienda en línea: del Page Object Model
a la integración continua en tres motores de navegador.**

31 casos E2E · 93 ejecuciones por push · **5 defectos reales encontrados y documentados** ·
Page Object Model, *fixtures* y pruebas dirigidas por datos en TypeScript.

[![Tests](https://github.com/Blistahub/playwright-e2e-saucedemo/actions/workflows/tests.yml/badge.svg)](https://github.com/Blistahub/playwright-e2e-saucedemo/actions/workflows/tests.yml)
![Casos E2E](https://img.shields.io/badge/casos_e2e-31-1F3A5F)
![Ejecuciones](https://img.shields.io/badge/ejecuciones_por_push-93-1F3A5F)
![Unitarios](https://img.shields.io/badge/unitarios-9-1F3A5F)
![Navegadores](https://img.shields.io/badge/navegadores-Chromium_·_Firefox_·_WebKit-2d6a4f)
![Defectos](https://img.shields.io/badge/defectos_documentados-5-c0392b)
![Playwright](https://img.shields.io/badge/Playwright-TypeScript-45ba4b)

**🌐 [Ver el proyecto en web](https://blistahub.github.io/playwright-e2e-saucedemo/)** — los 93
resultados, las evidencias y las trazas interactivas, sin clonar el repositorio.

<sub>David Coya Moreno — QA Tester · [LinkedIn](https://linkedin.com/in/david-coya-moreno) ·
davidcoyamoreno@gmail.com</sub>

---

![Recorrido completo de una compra: acceso, catálogo, carrito, datos del comprador, resumen de importes y confirmación del pedido](evidencias/compra-completa.gif)

<sub>**CP-16**, la compra de extremo a extremo, que la suite ejecuta en los tres navegadores en
cada `push`. Grabación con pausas para poder leerla: el caso real tarda menos de dos segundos.</sub>

---

## El resultado en una tabla

| | |
| --- | --- |
| **Aplicación** | SauceDemo — tienda de demostración de Sauce Labs |
| **Casos E2E** | 26 funcionales + 5 de defecto conocido = **31** |
| **Ejecuciones por push** | **93** — los 31 casos en Chromium, Firefox y WebKit |
| **Pruebas unitarias** | **9** sobre la única lógica pura del repositorio, en menos de un segundo |
| **Duración** | **en torno a 1 min** los tres navegadores en paralelo. Medido entre 35 s y 65 s: la horquilla es la latencia de un sitio de terceros, no el código |
| **Tests inestables** | **0** — ni esperas fijas ni dependencias entre tests |
| **Defectos encontrados** | **5**, uno de ellos bloquea el flujo de compra |
| **Cobertura** | Acceso, catálogo, ficha, carrito y compra completa. Queda [un hueco, declarado](docs/02-matriz-de-casos.md#hueco-declarado) en lugar de darlo por cubierto |

---

## Ejecutarlo

```bash
npm ci
npx playwright install --with-deps
npm test                  # los 31 casos en los tres navegadores, más los unitarios
```

| Comando | Qué hace |
| --- | --- |
| `npm test` | Suite completa: los 3 navegadores y los unitarios, en torno a 1 min |
| `npm run test:chromium` | Solo Chromium — el ciclo rápido mientras se escribe |
| `npm run test:humo` | Los 4 casos `@humo`: el mínimo para decir que la aplicación está en pie |
| `npm run test:hallazgos` | Los 5 casos de defecto conocido |
| `npm run test:ui` | Modo interactivo, para depurar paso a paso |
| `npm run report` | Abre el último informe HTML |
| `npm run calidad` | Tipos, reglas de la suite y consistencia de la documentación, sin levantar navegadores |

---

## Qué demuestra este repositorio

### 1. La suite encuentra defectos, no solo confirma que todo va bien

SauceDemo tiene usuarios rotos a propósito. La suite ha encontrado **cinco defectos
reproducibles**, y el más grave no estaba a la vista:

> **[HAL-02](docs/03-hallazgos.md#hal-02)** — el campo «Last Name» del checkout no admite entrada.
> Lo que se teclea en él se escribe en «First Name»:
>
> ```jsonc
> // tras escribir "David" en First Name y "Coya" en Last Name
> { "first": "Coya", "last": "", "cp": "28001" }
>
> // al pulsar Continue:
> // URL   → /checkout-step-one.html   (no avanza)
> // Error → "Error: Last Name is required"
> ```
>
> El formulario exige un campo que la propia aplicación impide rellenar: **la compra es
> imposible.**

![Formulario de checkout con «Coya» escrito en el campo del nombre, el campo del apellido vacío y el mensaje «Error: Last Name is required»](evidencias/HAL-02-apellido-bloquea-compra.png)

<sub>Se escribió «David» en el nombre y «Coya» en el apellido. El resultado: «Coya» en el primer
campo, el segundo vacío y la compra detenida. ·
**[Recorrer la traza paso a paso](https://trace.playwright.dev/?trace=https://blistahub.github.io/playwright-e2e-saucedemo/trazas/HAL-02.zip)**</sub>

Antes de reportarlo se descartaron las dos explicaciones alternativas, porque un defecto que el
equipo cierra como «no reproducible» cuesta más que no haberlo reportado:

| Hipótesis | Comprobación | Resultado |
| --- | --- | --- |
| «Es el orden de escritura» | Rellenar primero el apellido y después el nombre | `{ first: "David", last: "" }` — sigue vacío |
| «Es la automatización, que escribe de golpe» | Teclear pulsación a pulsación con 60 ms de retardo | `{ first: "a", last: "" }` — cada pulsación se redirige y sobrescribe |

No hay orden ni forma de escritura que permita rellenar el apellido. **Eso es lo que separa un
reporte accionable de una impresión.**

### 2. Los defectos conocidos mantienen la suite en verde… y avisan si se corrigen

Los cinco tests de hallazgo **afirman el comportamiento correcto** y se marcan con `test.fail()`:
«se espera que este test falle».

```ts
test('HAL-03 · el botón «Remove» debe retirar el producto del carrito @hallazgo', async ({ inventoryPage }) => {
  test.fail();
  ...
  await expect(inventoryPage.cartBadge).toHaveText('1', { timeout: 2_000 });
});
```

Tiene tres consecuencias, y las tres son deliberadas:

- **La suite sigue en verde.** Un defecto ya documentado no tiene que ser una alarma nueva cada
  mañana; si grita todos los días, nadie la mira.
- **Si el fabricante lo corrige, el test pasa y Playwright lo marca como fallo inesperado.** La
  corrección avisa sola de que hay un defecto que cerrar.
- **El comportamiento esperado queda en código ejecutable**, no en una frase de un documento que
  nadie vuelve a abrir.

La alternativa habitual —comentar el test, o afirmar el comportamiento defectuoso para que pase—
consagra el defecto como si fuera el requisito, y el día que se arregle la suite se pone en rojo
por haberlo arreglado.

**Lo que no cubre, dicho también:** `test.fail()` da por esperado *cualquier* fallo, no solo el
previsto. Si se rompiera el login de `problem_user`, HAL-02 seguiría fallando y la suite en verde,
tapando una avería real. Qué acota ese riesgo, en
[el plan, §6.1](docs/01-plan-de-automatizacion.md#61-lo-que-esta-técnica-no-cubre).

### 3. Ningún selector fuera de `pages/`

El Page Object Model no es una carpeta con ese nombre: son tres reglas que se sostienen.

1. **Ningún selector fuera de `pages/`** — un cambio en el DOM se corrige en un fichero.
2. **Ninguna aserción dentro de `pages/`** — el objeto describe la pantalla; decidir si está bien
   o mal es del test.
3. **Ningún dato literal dentro de `tests/`** — usuarios, productos y mensajes viven en `data/`.

Un ejemplo de que los selectores se eligen, no se copian:

```ts
/* El atributo `data-test="open-menu"` está sobre el <img>, no sobre el <button>
   que lo contiene, y el botón intercepta el clic: localizarlo por `data-test`
   deja el test colgado hasta agotar el tiempo de espera. Se localiza por rol
   accesible, que además es más estable ante rediseños. */
this.menuButton = page.getByRole('button', { name: 'Open Menu' });
```

Está comentado en el código para que nadie lo «arregle» de vuelta dentro de seis meses.

### 4. Dirigido por datos: añadir un caso es añadir una línea

Los cinco casos de acceso rechazado son un solo test parametrizado. Los juegos de datos viven en
[`data/invalid-credentials.ts`](data/invalid-credentials.ts):

```ts
for (const scenario of INVALID_LOGINS) {
  test(`${scenario.id} · el acceso se rechaza con ${scenario.description}`, async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.login(scenario.username, scenario.password);
    await expect(loginPage.errorMessage).toHaveText(scenario.expectedError);
    await expect(page).toHaveURL('https://www.saucedemo.com/');
  });
}
```

Genera **cinco tests independientes**, no uno con cinco comprobaciones. Si falla el usuario
bloqueado, los otros cuatro siguen ejecutándose y el informe dice cuál se ha roto.

Y cada caso sale de una partición de equivalencia distinta —bloqueado, contraseña errónea, usuario
inexistente, campo vacío—, no de repetir la misma clase con valores diferentes.

### 5. Los oráculos no se preguntan a sí mismos

En CP-17 el total se **recalcula en el test** a partir de las líneas del carrito, sobre tres cestas
que recorren el rango de precios:

```ts
const cartSubtotal = await cartPage.subtotal();   // suma de las líneas
// ...
expect(await overviewPage.subtotal()).toBeCloseTo(cartSubtotal, 2);
expect(await overviewPage.tax()).toBeCloseTo(roundToCents(cartSubtotal * TAX_RATE), 2);
```

Si comparase el total de la pantalla con el subtotal de la pantalla, pasaría aunque los dos
estuvieran mal.

Y hasta dónde llega ese oráculo también está escrito: los seis productos terminan en `,99`, así que
**no existe cesta en este catálogo cuyo impuesto redondee a la baja**. La suite no puede distinguir
el redondeo al más cercano del redondeo sistemático al céntimo superior, y
[así se declara](data/carts.ts) en lugar de dar por verificada una regla que los datos no permiten
verificar.

Por lo mismo, en la ordenación por precio no se exige una secuencia exacta: dos artículos cuestan
igual y la app no promete cómo desempata. Se comprueba la monotonía y que no falte ningún artículo.
Exigir un orden que nadie ha prometido es fabricarse un test inestable.

### 6. Lo que este README afirma, la CI lo comprueba

Un documento que promete algo sobre el código envejece mal. Las promesas de este repositorio que
se pueden comprobar con una máquina, se comprueban con una máquina — todo ello en un job que tarda
segundos y no levanta un solo navegador:

```bash
npm run calidad     # tipos + reglas de la suite + consistencia de la documentación
```

**Las reglas convierten los criterios en errores.** [`eslint.config.mjs`](eslint.config.mjs) solo
incluye reglas que impidan un fallo real, no que uniformen el estilo:

| Regla | Qué impide |
| --- | --- |
| `no-floating-promises` · `missing-playwright-await` | Un `expect` sin `await` **pasa siempre**: la aserción se evalúa cuando el test ya terminó. Es el peor fallo posible en una suite |
| `no-wait-for-timeout` | La espera fija que hace pasar el test hoy en esta máquina y fallar el día que el runner vaya cargado |
| `no-focused-test` | El `test.only` olvidado que deja la suite en verde ocultando el resto |
| `expect-expect` | El test que solo navega y comprueba únicamente que la aplicación no lanza una excepción |
| `no-conditional-expect` | La aserción dentro de un `if` que puede no ejecutarse nunca |

**El verificador comprueba que la documentación no mienta.** Una matriz de treinta casos con
referencias cruzadas se desincroniza sola a la tercera modificación: se añade un caso y la cifra
del README se queda atrás, se renombra un fichero y un enlace del plan deja de resolver. **Nada de
eso rompe un test**, así que no se detecta hasta que alguien lee la documentación y descubre que
miente.

[`tools/verificar.mjs`](tools/verificar.mjs) le pregunta a Playwright qué casos existen **de
verdad** —`--list`, que no levanta navegadores ni toca la red— y comprueba contra esa respuesta que
todo caso de la suite está en la matriz y al revés, que las cifras declaradas son las reales, que
los enlaces internos resuelven y que los anclajes apuntan a encabezados que existen.

Las dos se probaron **al revés**, rompiendo cosas a propósito para confirmar que avisan. Y la
primera incoherencia que encontró el verificador fue **suya**: daba por roto un anclaje correcto
porque colapsaba los espacios consecutivos, y GitHub no lo hace.

### 7. Cada comprobación, en la capa que le corresponde

La suite es la capa alta de la pirámide y así se declara. Pero `support/money.ts` —la conversión
de importes— es lógica pura, y **comprobar un redondeo levantando tres navegadores es pagar el
precio más alto por la comprobación más barata**. Sus 9 casos corren en un proyecto de Playwright
sin navegador, dentro del job de calidad: menos de un segundo frente a los treinta y ocho de la
matriz.

No es un adorno para poder decir «pirámide». Uno de esos casos fija **un defecto real** que tenía
el código:

```ts
// antes:  replace(',', '')  sustituye solo la PRIMERA coincidencia
parsePrice('$1,234,567.89')   // → 1234
```

Invisible con los importes de dos cifras del catálogo actual, y esperando callado a la primera
cesta que pasara de mil. Es la clase de fallo que un test de interfaz no encuentra, porque nunca
le presenta a la función una entrada que lo provoque.

### 8. El criterio se ve en lo que se deja fuera

- **[Exclusiones justificadas una a una](docs/01-plan-de-automatizacion.md#22-qué-no-se-automatiza--y-por-qué):**
  regresión visual, carga, seguridad ofensiva, accesibilidad. Cada una con su motivo, no omitidas.
- **El acceso va por la interfaz, pudiendo ir por atajo.** Se comprobó que inyectar la cookie
  `session-username` funciona y sería más rápido. Se descartó: con veintitrés casos el ahorro es de
  segundos, y a cambio la suite dejaría de recorrer cada día el camino por el que entran todos los
  usuarios reales. [La decisión está razonada](docs/01-plan-de-automatizacion.md#33-por-qué-el-acceso-va-por-la-interfaz)
  en el plan, no solo en el código, porque es el tipo de decisión que alguien deshace por error.
- **Sin ejecución programada, a propósito.** La suite corre contra un sitio de terceros: una caída
  suya dejaría la insignia en rojo sin que haya nada que corregir aquí. La insignia informa del
  estado del código, no de la disponibilidad de un servicio ajeno.
- **Cero esperas fijas, y comprobado por una regla.** No hay un solo `waitForTimeout` en la suite.
  No es un criterio de revisión que alguien pueda olvidar: `playwright/no-wait-for-timeout` corta
  la integración continua (ver §6).
- **Los reintentos son 2 y no se suben.** Están para absorber la variabilidad de red en CI, y
  Playwright marca como inestable el test que los usa. Subirlos a 3 para que deje de molestar
  convierte una señal en ruido: la [política](docs/04-politica-de-tests-inestables.md) lo dice
  explícitamente.

---

## Los 5 defectos encontrados

| # | Defecto | Usuario | Severidad | Prioridad |
| :---: | --- | --- | :---: | :---: |
| [HAL-01](docs/03-hallazgos.md#hal-01) | Todas las tarjetas muestran la misma imagen de error | `problem_user` | Media | Media |
| [HAL-02](docs/03-hallazgos.md#hal-02) | «Last Name» impide completar la compra | `problem_user` | **Alta** | **Alta** |
| [HAL-03](docs/03-hallazgos.md#hal-03) | «Remove» no retira el producto del carrito | `error_user` | **Alta** | **Alta** |
| [HAL-04](docs/03-hallazgos.md#hal-04) | La ordenación no reordena el catálogo | `error_user` | Media | Media |
| [HAL-05](docs/03-hallazgos.md#hal-05) | El acceso tarda ~5 s frente a un presupuesto de 2,5 s | `performance_glitch_user` | Media | Baja |

**Severidad y prioridad se clasifican por separado**, y en HAL-05 divergen: cinco segundos de
espera molestan, pero no impiden nada.

Cada uno tiene su **captura y su traza interactiva** en
[`docs/03-hallazgos.md`](docs/03-hallazgos.md). La traza abre el DOM, la red y una captura por
acción: es la diferencia entre leer que algo falla y verlo fallar.

---

## Documentación

| # | Documento | Qué contiene |
| :---: | --- | --- |
| 01 | [Plan de automatización](docs/01-plan-de-automatizacion.md) | Alcance, **exclusiones justificadas**, estrategia, arquitectura, criterios de salida y 5 riesgos |
| 02 | [Matriz de casos](docs/02-matriz-de-casos.md) | Los 31 casos E2E con su técnica de diseño y su fichero, los 9 unitarios · cobertura y el hueco declarado |
| 03 | [Hallazgos](docs/03-hallazgos.md) | Los 5 defectos con reproducción, evidencia e hipótesis descartadas |
| 04 | [Política de tests inestables](docs/04-politica-de-tests-inestables.md) | Qué se hace cuando aparece uno, y qué no se hace nunca |

---

## Arquitectura

```
playwright-e2e-saucedemo/
├── pages/           Page Object Model — un objeto por vista, sin aserciones
│   ├── BasePage.ts          Cabecera y menú, comunes a todas las vistas
│   ├── LoginPage.ts
│   ├── InventoryPage.ts
│   ├── ProductDetailPage.ts
│   ├── CartPage.ts
│   ├── CheckoutPage.ts             paso 1 · datos del comprador
│   ├── CheckoutOverviewPage.ts     paso 2 · resumen e importes
│   └── CheckoutCompletePage.ts     paso 3 · confirmación
├── fixtures/        Inyección de los Page Objects y apertura de sesión
├── data/            Usuarios, productos, cestas y juegos de datos
├── support/         Utilidades sin estado (conversión de importes)
├── tests/           Los casos, que solo describen comportamiento
│   └── unit/            La capa baja: lógica pura, sin navegador
├── docs/            Plan, matriz, hallazgos y política de inestabilidad
├── evidencias/      Capturas de los defectos y el GIF, generados por script
├── sitio/           La página que se publica en la raíz de GitHub Pages
├── tools/           Verificador, generador de evidencias y ensamblado del sitio
├── eslint.config.mjs   Reglas que impiden fallos, no que uniformen el estilo
└── .github/workflows/tests.yml
```

### La fixture de sesión

El acceso no se repite en veintitrés tests: es una *fixture* automática que se ejecuta antes de
cada uno, con el usuario como opción de Playwright y tipado a los seis usuarios que existen, de
modo que un nombre mal escrito es un error de compilación y no un test que falla en el acceso.

```ts
export const loggedInTest = test.extend<SessionOptions & { session: void }>({
  userName: [USERS.standard, { option: true }],
  session: [async ({ page, loginPage, userName }, use) => {
    await loginPage.goto();
    await loginPage.login(userName, PASSWORD);
    await expect(page).toHaveURL(/inventory\.html/);
    await use();
  }, { auto: true }],
});
```

Así el título de cada test describe solo lo que comprueba, y un bloque puede cambiar de usuario sin
tocar los tests:

```ts
test.use({ userName: USERS.problem });   // los hallazgos de problem_user
```

---

## Integración continua

[`tests.yml`](.github/workflows/tests.yml) se ejecuta en cada push y cada pull request:

| Job | Qué hace |
| --- | --- |
| **Calidad** | Tipos, reglas de la suite, las 9 pruebas unitarias y la consistencia de la documentación, en segundos y sin levantar un navegador. Va en su propio job para que el fallo diga «es de código» o «la documentación se ha quedado atrás», no «ha fallado la suite» |
| **Caché del navegador** | Descargar el navegador costaba más que ejecutar la suite. Se cachea por versión de Playwright, con la clave derivada del `package-lock` para que una actualización la invalide sola. El ahorro está [medido, no supuesto](#la-optimización-que-salió-a-medias) |
| **E2E ×3** | Matriz de Chromium, Firefox y WebKit en paralelo, con `fail-fast: false`: si Firefox falla, WebKit se ejecuta igual. Cada fallo se anota sobre el diff del pull request |
| **Reporte unificado** | Une los tres reportes parciales en un único informe HTML, también —sobre todo— cuando algo ha fallado |
| **Publicación** | Despliega el informe en [GitHub Pages](https://blistahub.github.io/playwright-e2e-saucedemo/). Va con `continue-on-error` a propósito: si Pages no está habilitado, la insignia debe seguir reflejando si los tests pasan, no si está configurado el alojamiento |

Al fallar un test se conservan **captura, vídeo y traza**. La traza abre el DOM, la red y el estado
en cada paso: es la diferencia entre «falla en CI y en mi máquina no» y un diagnóstico.

### La optimización que salió a medias

Instalar el navegador era el paso más caro de cada job —más que ejecutar la suite—, así que se
cacheó. El resultado, medido antes y después sobre ejecuciones reales:

| Navegador | Instalación (antes) | Caché + dependencias (después) | Ahorro |
| --- | :---: | :---: | :---: |
| Chromium | 29 s | 22 s | **7 s** |
| Firefox | 23 s | 15 s | **8 s** |
| WebKit | 39 s | 24 s | **15 s** |

Menos de lo esperado, y el motivo es interesante: **el cuello de botella se movió**. Los binarios
del navegador ya no se descargan, pero las bibliotecas del sistema viven fuera de la caché y hay
que instalarlas igual con `install-deps`, que pasa a costar entre 15 y 23 s. El techo de esta
optimización lo pone `apt`, no la descarga.

Se queda porque 30 s menos son 30 s menos, y porque el siguiente paso —la imagen Docker oficial de
Playwright, que trae binarios y dependencias— cambia bastante más de lo que mejora. La cifra que
aparece aquí es la medida, no la que quedaba mejor.

---

## Entorno

| | |
| --- | --- |
| **URL** | `https://www.saucedemo.com` |
| **Credenciales** | Publicadas por el fabricante en su propia pantalla de acceso |
| **Desarrollo** | Windows 11 Pro 24H2 · Node 22 |
| **Integración continua** | `ubuntu-latest` · Node 20 (fijado en [`.nvmrc`](.nvmrc) y en `engines`) |
| **Herramientas** | Playwright · TypeScript · ESLint · GitHub Actions |

### Nota ética

Las pruebas se ejecutan contra la instancia que **Sauce Labs publica expresamente para practicar
automatización**, a un ritmo equivalente al de un usuario real. No se ejecutan pruebas de carga,
escáneres ni pruebas de seguridad ofensiva, y no se crean datos persistentes: el estado de SauceDemo
vive en el navegador y desaparece al cerrar el contexto.

---

## El otro proyecto del portfolio

Este repositorio cubre la **automatización**. El ciclo de pruebas manuales —plan, casos derivados
con técnicas formales, reportes de defecto y recomendación de release— está en
**[qa-portfolio-orangehrm](https://github.com/Blistahub/qa-portfolio-orangehrm)**: 38 casos sobre
el módulo PIM de un ERP de RRHH, 6 defectos confirmados y 6 hipótesis descartadas.

Los dos se complementan a propósito: uno demuestra criterio de prueba, el otro demuestra que ese
criterio se sostiene en código que se ejecuta solo.

---

## Sobre el autor

**David Coya Moreno** — QA Tester. Testing manual funcional, de regresión, smoke y cross-browser;
automatización E2E con Selenium y Playwright; verificación de API REST con Postman; gestión del
defecto en Jira. Técnico Superior en Desarrollo de Aplicaciones Web, lo que explica que la
arquitectura de esta suite se trate como código de producción: leer y escribir el código de lo que
se prueba acorta el ciclo entre reportar y corregir.

Madrid · [LinkedIn](https://linkedin.com/in/david-coya-moreno) ·
[GitHub](https://github.com/Blistahub) · davidcoyamoreno@gmail.com

<sub>Código y documentación bajo [licencia MIT](LICENSE). SauceDemo y Sauce Labs son marcas de
Sauce Labs Inc.; este repositorio no está afiliado al fabricante y su único fin es formativo y de
portfolio.</sub>
