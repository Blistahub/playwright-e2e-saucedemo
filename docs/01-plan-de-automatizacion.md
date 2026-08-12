# Plan de automatización

Aplicación bajo prueba: **SauceDemo** (`https://www.saucedemo.com`), tienda de demostración
publicada por Sauce Labs para practicar automatización.

---

## 1. Objetivo

Disponer de una suite de regresión que responda en menos de un minuto a una pregunta concreta:
**¿siguen funcionando los caminos por los que un cliente llega a completar una compra?**

No se persigue cobertura máxima. Se persigue que un fallo en esos caminos se detecte en el mismo
push que lo introduce, y que el resultado sea legible sin abrir el código.

---

## 2. Alcance

### 2.1 Qué se automatiza

| Flujo | Casos | Motivo |
| --- | :---: | --- |
| Acceso y cierre de sesión | CP-01 … CP-07 | Es la puerta de entrada: si falla, ningún otro flujo es alcanzable |
| Carrito | CP-08 … CP-11 | Es donde se acumula el estado, y el estado es donde aparecen los fallos de persistencia |
| Ordenación del catálogo | CP-12 … CP-15 | Lógica de presentación con cuatro variantes: coste bajo por caso, buen detector de regresiones |
| Proceso de compra | CP-16 … CP-21 | Es el flujo que genera ingreso. Un fallo aquí es un fallo de negocio, no de interfaz |
| Defectos conocidos | HAL-01 … HAL-05 | Fijan en código el comportamiento correcto que hoy no se cumple (ver §6) |

### 2.2 Qué NO se automatiza — y por qué

Delimitar es la mitad del trabajo. Cada exclusión lleva su motivo:

| Excluido | Motivo |
| --- | --- |
| Comprobación visual (capturas comparadas píxel a píxel) | SauceDemo incluye un usuario `visual_user` con desviaciones deliberadas, así que habría material. Se descarta porque una suite de regresión visual sobre tres navegadores necesita una línea base por navegador y sistema operativo, y en CI sobre Ubuntu esas líneas base no coinciden con las de un Windows local. Automatizarla sin resolver eso antes produce fallos que no son defectos |
| Pruebas de carga y rendimiento medido | Lanzar carga contra un servicio ajeno es abuso, aunque sea un entorno de demostración. La única medida de tiempo que se toma es la del acceso de un usuario, a ritmo de usuario (HAL-05) |
| Pruebas de seguridad ofensiva | No hay autorización escrita del propietario del sistema. Sin permiso explícito no se ejecutan |
| Capa de API | SauceDemo no expone una API pública: el estado vive en una cookie del navegador. No hay contrato que verificar |
| Accesibilidad | Requiere criterio propio y una norma de referencia (WCAG). Merece un ciclo entero, no un test de propina dentro de una suite funcional |
| Navegadores móviles y dispositivos reales | La matriz actual ya cubre los tres motores de renderizado que existen: Blink, Gecko y WebKit. Añadir perfiles móviles multiplicaría el tiempo de CI sin añadir un motor nuevo |
| Ejecución programada (nocturna o semanal) | Se ha valorado y descartado. La suite corre contra un sitio de terceros: una caída suya dejaría la insignia en rojo sin que haya nada que corregir en este repositorio. La insignia debe informar del estado del código, no de la disponibilidad de un servicio ajeno. La ejecución manual queda habilitada (`workflow_dispatch`) |

---

## 3. Estrategia

### 3.1 Dónde encaja esta suite

Es la capa alta de la pirámide: pocos tests, caros, que ejercitan el sistema completo por la
interfaz. Con 26 casos por navegador la suite tarda unos 30 segundos en local. Ese presupuesto es
la restricción de diseño principal, y de ahí salen dos reglas:

- **Un test comprueba un comportamiento.** No se encadenan diez verificaciones en un caso porque
  la primera que falle oculta las nueve siguientes.
- **Nada se prueba dos veces por la interfaz.** El acceso se verifica en CP-01; los otros veinte
  casos lo dan por hecho a través de la *fixture* de sesión.

### 3.2 Técnicas de diseño aplicadas

Los casos se derivan; no se improvisan:

| Técnica | Casos | Ejemplo |
| --- | :---: | --- |
| Particiones de equivalencia | CP-02 … CP-06 | Cinco clases distintas de acceso rechazado —bloqueado, contraseña errónea, usuario inexistente, campo vacío—, no cinco contraseñas malas |
| Transición de estados | CP-08, CP-10, CP-11, CP-21 | Ciclo de vida del carrito: vacío → con artículos → vacío, y su persistencia al navegar |
| Tabla de decisión | CP-18 … CP-20 | Un caso por campo obligatorio del checkout, dejando vacío solo el campo bajo prueba |
| Comparación con oráculo calculado | CP-17 | El total se recalcula en el test a partir de las líneas del carrito, en lugar de leerlo de la propia pantalla |
| Conjetura de errores | HAL-01 … HAL-05 | Los usuarios que el fabricante rompió a propósito |

### 3.3 Por qué el acceso va por la interfaz

Se comprobó que basta con inyectar la cookie `session-username` para entrar directamente al
catálogo, sin pasar por el formulario. Sería más rápido y es el patrón que recomienda Playwright
para suites grandes. **Aquí se ha descartado**, por dos motivos:

1. Con veinte casos que necesitan sesión, el ahorro total es de unos segundos: no compensa perder
   la ejecución diaria del camino por el que entran todos los usuarios reales.
2. El atajo depende de un detalle interno —el nombre de la cookie— que la aplicación puede cambiar
   sin avisar. Ese día la suite entera dejaría de entrar, y el diagnóstico sería mucho menos obvio
   que un fallo en CP-01.

La decisión se revisaría si la suite creciera hasta el punto de que el acceso pesara de verdad.
Está anotada aquí, y no solo en el código, porque es el tipo de decisión que alguien deshace por
error seis meses después.

---

## 4. Arquitectura

```
pages/       Page Object Model: un objeto por vista, sin aserciones dentro
fixtures/    Inyección de los Page Objects y apertura de sesión
data/        Juegos de datos y mensajes esperados, fuera de los tests
support/     Utilidades sin estado (conversión de importes)
tests/       Los casos, que solo describen comportamiento
```

Tres reglas sostienen esta separación:

1. **Ningún selector fuera de `pages/`.** Un cambio en el DOM se corrige en un fichero.
2. **Ninguna aserción dentro de `pages/`.** Un Page Object describe qué hay en la pantalla y qué se
   puede hacer con ella; decidir si eso está bien o mal es del test. Mezclarlo produce objetos que
   solo sirven para el test que los motivó.
3. **Ningún dato literal dentro de `tests/`.** Los usuarios, los productos y los mensajes de error
   viven en `data/`. Añadir un caso al test parametrizado de acceso es añadir una entrada a un
   array, sin tocar el fichero de pruebas.

### 4.1 Localizadores

Por orden de preferencia: `getByTestId` sobre los atributos `data-test` que la aplicación expone,
y `getByRole` cuando el `data-test` no sirve.

Un ejemplo real de por qué hace falta el segundo: el botón del menú lateral lleva el
`data-test="open-menu"` sobre la etiqueta `<img>`, mientras que el `<button>` que la contiene
intercepta el clic. Localizarlo por `data-test` deja el test esperando hasta agotar el tiempo
límite. Se localiza por rol accesible —`getByRole('button', { name: 'Open Menu' })`—, que además es
la forma en que lo encuentra un lector de pantalla. Está comentado en `pages/BasePage.ts` para que
nadie lo "arregle" de vuelta.

---

## 5. Ejecución

| | |
| --- | --- |
| **Navegadores** | Chromium, Firefox y WebKit: los tres motores de renderizado existentes |
| **Paralelismo** | Ficheros en paralelo. En CI se limita a 2 procesos para no golpear el sitio más rápido de lo que lo haría una persona |
| **Reintentos** | 2 en CI, 0 en local. El razonamiento está en [`04-politica-de-tests-inestables.md`](04-politica-de-tests-inestables.md) |
| **Evidencia** | Captura y vídeo solo al fallar; traza solo en el primer reintento |
| **Aislamiento** | Contexto de navegador nuevo por test. La sesión y el carrito de SauceDemo viven en una cookie, así que mueren con el contexto: no hace falta limpiar estado |

### 5.1 Criterios de salida

La ejecución se considera correcta cuando:

- Los 21 casos funcionales pasan en los tres navegadores.
- Los 5 casos de hallazgo fallan **exactamente como está previsto**. Si alguno pasa, la ejecución
  se marca en rojo: significa que el defecto se ha corregido y hay que actualizar la suite.
- No hay tests marcados como inestables. Uno solo abre la investigación descrita en la política.

---

## 6. Tratamiento de los defectos conocidos

SauceDemo incluye usuarios rotos a propósito. Se han encontrado cinco defectos reproducibles
(ver [`03-hallazgos.md`](03-hallazgos.md)) y cada uno tiene su test.

Esos tests **afirman el comportamiento correcto** y se marcan con `test.fail()`, que en Playwright
significa «se espera que este test falle». Con eso:

- La suite se queda en verde: un defecto conocido y documentado no vuelve a ser una alarma nueva
  cada mañana. Una suite que grita todos los días es una suite que nadie mira.
- Si el fabricante lo corrige, el test pasará y Playwright lo marcará como **fallo inesperado**. La
  corrección avisa sola.
- El comportamiento esperado queda escrito en código ejecutable, no en una frase de un documento
  que nadie vuelve a abrir.

La alternativa habitual —comentar el test, o afirmar el comportamiento defectuoso para que pase—
tiene el problema opuesto: consagra el defecto como si fuera el requisito, y el día que se corrija,
la suite se pone en rojo por haberlo arreglado.

---

## 7. Riesgos

| # | Riesgo | Mitigación |
| :---: | --- | --- |
| R-01 | La aplicación es de un tercero y puede cambiar o caer sin aviso | Sin ejecución programada (§2.2). Los selectores se concentran en `pages/`, así que un rediseño se absorbe en un punto |
| R-02 | Un test inestable erosiona la confianza en toda la suite | Política explícita en [`04-politica-de-tests-inestables.md`](04-politica-de-tests-inestables.md): investigar, no reintentar |
| R-03 | Los defectos conocidos podrían corregirse y romper la suite | Es el comportamiento buscado: `test.fail()` convierte la corrección en una señal, no en un fallo silencioso (§6) |
| R-04 | Esperas fijas introducidas al depurar | No hay ni un `waitForTimeout` en la suite. Toda la sincronización se apoya en las aserciones con reintento de Playwright |
| R-05 | Los datos de prueba se dispersan por los tests | `data/` es la única fuente. Es revisable de un vistazo en la revisión de código |

---

## 8. Entorno

| | |
| --- | --- |
| **URL** | `https://www.saucedemo.com` |
| **Credenciales** | Publicadas por el fabricante en su propia pantalla de acceso |
| **Sistema de desarrollo** | Windows 11 Pro 24H2 · Node 22 |
| **Sistema de integración continua** | `ubuntu-latest` · Node 20 |
| **Herramientas** | Playwright · TypeScript · GitHub Actions |

### Nota ética

Las pruebas se ejecutan contra la instancia que **Sauce Labs publica expresamente para practicar
automatización**, a un ritmo equivalente al de un usuario real y sin crear datos persistentes: el
estado de SauceDemo vive en el navegador y desaparece al cerrar el contexto.
