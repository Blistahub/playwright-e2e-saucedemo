# Matriz de casos

31 casos por navegador × 3 navegadores = **93 ejecuciones** por cada push, más 9 pruebas
unitarias que corren una sola vez porque no tocan la interfaz.

Los identificadores no se reutilizan. Si un caso se retira, su número se queda libre: reasignarlo
rompería la trazabilidad de cualquier conversación o informe que lo mencionara.

---

## Casos E2E funcionales

| # | Caso | Fichero | Técnica de diseño | Etiqueta |
| :---: | --- | --- | --- | :---: |
| CP-01 | El usuario estándar accede y aterriza en el catálogo | [`login.spec.ts`](../tests/login.spec.ts) | Camino principal | `@humo` |
| CP-02 | El acceso se rechaza con usuario bloqueado | [`login.spec.ts`](../tests/login.spec.ts) | Partición de equivalencia | |
| CP-03 | El acceso se rechaza con contraseña incorrecta | [`login.spec.ts`](../tests/login.spec.ts) | Partición de equivalencia | |
| CP-04 | El acceso se rechaza con usuario inexistente | [`login.spec.ts`](../tests/login.spec.ts) | Partición de equivalencia | |
| CP-05 | El acceso se rechaza con usuario vacío | [`login.spec.ts`](../tests/login.spec.ts) | Partición de equivalencia | |
| CP-06 | El acceso se rechaza con contraseña vacía | [`login.spec.ts`](../tests/login.spec.ts) | Partición de equivalencia | |
| CP-07 | El cierre de sesión invalida el acceso directo por URL | [`login.spec.ts`](../tests/login.spec.ts) | Transición de estados | `@humo` |
| CP-08 | Añadir un producto actualiza contador y botón | [`cart.spec.ts`](../tests/cart.spec.ts) | Transición de estados | `@humo` |
| CP-09 | El carrito recoge exactamente los productos añadidos | [`cart.spec.ts`](../tests/cart.spec.ts) | Camino principal | |
| CP-10 | Eliminar el último producto deja el carrito vacío | [`cart.spec.ts`](../tests/cart.spec.ts) | Transición de estados | |
| CP-11 | El carrito se conserva al volver al catálogo | [`cart.spec.ts`](../tests/cart.spec.ts) | Persistencia de estado | |
| CP-12 | Ordenar por nombre de la A a la Z | [`sorting.spec.ts`](../tests/sorting.spec.ts) | Dirigido por datos | |
| CP-13 | Ordenar por nombre de la Z a la A | [`sorting.spec.ts`](../tests/sorting.spec.ts) | Dirigido por datos | |
| CP-14 | Ordenar por precio de menor a mayor | [`sorting.spec.ts`](../tests/sorting.spec.ts) | Dirigido por datos | |
| CP-15 | Ordenar por precio de mayor a menor | [`sorting.spec.ts`](../tests/sorting.spec.ts) | Dirigido por datos | |
| CP-16 | Compra completa de extremo a extremo | [`checkout.spec.ts`](../tests/checkout.spec.ts) | Camino principal | `@humo` |
| CP-17 | El resumen calcula subtotal, impuesto y total — **3 juegos de datos** (`.1` tramo bajo · `.2` tramo alto · `.3` dos artículos) | [`checkout.spec.ts`](../tests/checkout.spec.ts) | Oráculo calculado · dirigido por datos | |
| CP-18 | El checkout rechaza los datos sin nombre | [`checkout.spec.ts`](../tests/checkout.spec.ts) | Tabla de decisión | |
| CP-19 | El checkout rechaza los datos sin apellido | [`checkout.spec.ts`](../tests/checkout.spec.ts) | Tabla de decisión | |
| CP-20 | El checkout rechaza los datos sin código postal | [`checkout.spec.ts`](../tests/checkout.spec.ts) | Tabla de decisión | |
| CP-21 | Cancelar en el paso de datos devuelve al **carrito** sin perderlo | [`checkout.spec.ts`](../tests/checkout.spec.ts) | Transición de estados | |
| CP-22 | Cancelar en el resumen devuelve al **catálogo** sin perder el carrito | [`checkout.spec.ts`](../tests/checkout.spec.ts) | Transición de estados | |
| CP-23 | La ficha muestra el producto y permite añadirlo al carrito | [`product-detail.spec.ts`](../tests/product-detail.spec.ts) | Camino principal | |
| CP-24 | Volver al catálogo desde la ficha conserva el carrito | [`product-detail.spec.ts`](../tests/product-detail.spec.ts) | Persistencia de estado | |

CP-21 y CP-22 no se unifican en un caso parametrizado a propósito: el mismo verbo —«Cancel»—
lleva a **destinos distintos** según el paso, y esa diferencia es justo lo que hay que fijar.

## Casos de hallazgo

Afirman el comportamiento **correcto**, marcados con `test.fail()`. El detalle de cada defecto está
en [`03-hallazgos.md`](03-hallazgos.md).

| # | Caso | Usuario | Fichero | Etiqueta |
| :---: | --- | --- | --- | :---: |
| HAL-01 | Cada producto debe mostrar su propia imagen | `problem_user` | [`findings.spec.ts`](../tests/findings.spec.ts) | `@hallazgo` |
| HAL-02 | El campo «Last Name» debe aceptar lo que se escribe | `problem_user` | [`findings.spec.ts`](../tests/findings.spec.ts) | `@hallazgo` |
| HAL-03 | «Remove» debe retirar el producto del carrito | `error_user` | [`findings.spec.ts`](../tests/findings.spec.ts) | `@hallazgo` |
| HAL-04 | El criterio de orden debe reordenar el catálogo | `error_user` | [`findings.spec.ts`](../tests/findings.spec.ts) | `@hallazgo` |
| HAL-05 | El acceso debe completarse dentro del presupuesto de tiempo | `performance_glitch_user` | [`findings-performance.spec.ts`](../tests/findings-performance.spec.ts) | `@hallazgo` |

## Casos unitarios

La capa baja de la pirámide. `support/money.ts` es la única lógica pura del repositorio, y
comprobar un redondeo levantando tres navegadores sería pagar el precio más alto por la
comprobación más barata. Corren en el job de calidad, en menos de un segundo y sin navegador.

| # | Caso | Función |
| :---: | --- | --- |
| U-01 | Extrae el importe de un precio suelto | `parsePrice` |
| U-02 | Extrae el importe de una etiqueta con texto delante | `parsePrice` |
| U-03 | Tolera el espacio entre el símbolo y la cifra | `parsePrice` |
| U-04 | Descarta **todos** los separadores de millares, no solo el primero | `parsePrice` |
| U-05 | Lanza un error con mensaje si el texto no contiene un importe | `parsePrice` |
| U-06 | El mensaje del error incluye el texto recibido | `parsePrice` |
| U-07 | Redondea a dos decimales los impuestos del catálogo | `roundToCents` |
| U-08 | Absorbe el sobrante de la coma flotante | `roundToCents` |
| U-09 | Redondea el medio hacia arriba | `roundToCents` |

**U-04 no es un caso de laboratorio:** fija un defecto real que tenía `parsePrice`. La versión
anterior usaba `replace(',', '')`, que sustituye solo la primera coincidencia, así que
`$1,234,567.89` se convertía en `1234`. No se manifestaba con los importes de dos cifras del
catálogo actual y habría esperado callado a la primera cesta que pasara de mil.

---

## Cobertura por funcionalidad

| Funcionalidad | Casos | Cubierto |
| --- | :---: | --- |
| Autenticación | 7 | Acceso válido, cinco clases de rechazo y cierre de sesión con verificación de ruta protegida |
| Catálogo | 4 | Los cuatro criterios de ordenación |
| Ficha de producto | 2 | Coherencia con el catálogo, alta desde la ficha y persistencia al volver |
| Carrito | 4 | Alta, baja, contador y persistencia |
| Checkout | 9 | Compra completa, cálculo de importes con 3 cestas, tres campos obligatorios y las dos cancelaciones |
| Defectos conocidos | 5 | Los cinco reproducibles encontrados en tres de los seis usuarios |
| Conversión de importes | 9 | Unitarios: extracción, separadores de millares, errores y redondeo |

### Hueco declarado

Queda **uno**, y se declara en lugar de darlo por cubierto:

- **«Reset App State»** (menú lateral). No está en ningún camino que lleve a completar una compra
  —que es el criterio de selección del [plan](01-plan-de-automatizacion.md#1-objetivo)—, y su
  efecto, vaciar el carrito, ya queda verificado por CP-10 a través de la vía que sí usa un
  cliente. Automatizarlo añadiría un caso que comprueba dos veces lo mismo por dos caminos.

El localizador de ese enlace **no está declarado** en `pages/BasePage.ts`. Un localizador sin uso
es deuda: da la impresión de que algo está cubierto cuando no lo está.

---

## Etiquetas

```bash
npm run test:humo        # 4 casos: el mínimo para decir que la aplicación está en pie
npm run test:hallazgos   # 5 casos: los defectos conocidos
```

`@humo` marca el subconjunto que se ejecutaría antes de un despliegue, cuando no hay tiempo para
la suite entera: acceso, cierre de sesión, añadir al carrito y compra completa. Si esos cuatro
pasan, la aplicación es utilizable.
