# Hallazgos

Cinco defectos reproducibles encontrados por la suite en tres de los seis usuarios de SauceDemo.

Sauce Labs rompe algunos usuarios a propósito para que haya algo que encontrar. Eso no cambia el
trabajo: hay que dar con el fallo, acotarlo, comprobar que no es una impresión y describirlo de
forma que alguien pueda corregirlo sin volver a investigarlo.

Cada uno tiene su test en [`findings.spec.ts`](../tests/findings.spec.ts) o
[`findings-performance.spec.ts`](../tests/findings-performance.spec.ts), marcado con `test.fail()`.
El razonamiento de por qué se marcan así está en el
[plan](01-plan-de-automatizacion.md#6-tratamiento-de-los-defectos-conocidos).

| # | Defecto | Usuario | Severidad | Prioridad |
| :---: | --- | --- | :---: | :---: |
| [HAL-01](#hal-01) | Todas las tarjetas muestran la misma imagen | `problem_user` | Media | Media |
| [HAL-02](#hal-02) | El campo «Last Name» impide completar la compra | `problem_user` | **Alta** | **Alta** |
| [HAL-03](#hal-03) | «Remove» no retira el producto del carrito | `error_user` | **Alta** | **Alta** |
| [HAL-04](#hal-04) | La ordenación no reordena el catálogo | `error_user` | Media | Media |
| [HAL-05](#hal-05) | El acceso tarda unos 5 segundos | `performance_glitch_user` | Media | Baja |

**Severidad y prioridad se clasifican por separado.** La severidad mide el daño; la prioridad, la
urgencia de corregirlo. En HAL-05 divergen: cinco segundos de espera son molestos pero no impiden
nada, así que la severidad es Media y la prioridad Baja.

---

## HAL-01

**Todas las tarjetas del catálogo muestran la misma imagen**

- **Usuario:** `problem_user` · **Vista:** catálogo (`/inventory.html`)
- **Severidad:** Media · **Prioridad:** Media

### Reproducción

1. Acceder como `problem_user` / `secret_sauce`.
2. Observar las imágenes de los seis productos.

### Resultado esperado

Cada producto muestra su propia imagen: seis rutas distintas.

### Resultado obtenido

Las seis tarjetas cargan el mismo recurso, que además es una imagen de error:

```
/assets/sl-404-Cq1a9k9X.jpg     ← las 6 tarjetas
imágenes distintas: 1 de 6
```

### Impacto

En una tienda, la imagen es el principal criterio de selección. Seis productos con la misma imagen
de error no impiden comprar, pero hacen que el catálogo deje de cumplir su función. No se clasifica
como Alta porque el flujo de compra sigue siendo completable.

---

## HAL-02

**El campo «Last Name» del checkout no admite entrada, e impide completar la compra**

- **Usuario:** `problem_user` · **Vista:** checkout, paso 1 (`/checkout-step-one.html`)
- **Severidad:** Alta · **Prioridad:** Alta

### Reproducción

1. Acceder como `problem_user` / `secret_sauce`.
2. Añadir cualquier producto y pulsar «Checkout».
3. Escribir `David` en «First Name» y `Coya` en «Last Name».

### Resultado esperado

Cada campo conserva lo que se ha escrito en él.

### Resultado obtenido

Lo tecleado en «Last Name» se escribe en «First Name», y «Last Name» queda vacío:

```jsonc
// tras escribir "David" en First Name y "Coya" en Last Name
{ "first": "Coya", "last": "", "cp": "28001" }
```

Al pulsar «Continue», la aplicación no avanza:

```
URL   → /checkout-step-one.html   (no progresa al resumen)
Error → "Error: Last Name is required"
```

### Verificación

Antes de reportarlo se descartaron dos explicaciones alternativas, porque un defecto que el equipo
de desarrollo cierra como no reproducible cuesta más que no haberlo reportado:

| Hipótesis | Comprobación | Resultado |
| --- | --- | --- |
| «Es el orden de escritura: se pisan entre sí» | Rellenar primero «Last Name» y después «First Name» | `{ first: "David", last: "" }` — **sigue vacío** |
| «Es la automatización, que escribe de golpe» | Teclear `Coya` pulsación a pulsación, con 60 ms entre teclas | `{ first: "a", last: "" }` — **cada pulsación se redirige a First Name y sobrescribe** |

No hay orden ni forma de escritura que permita rellenar el apellido.

### Impacto

El flujo de compra queda **bloqueado** para este perfil: el formulario exige un campo que la propia
aplicación impide rellenar. Es el defecto más grave del ciclo. La severidad no es Crítica porque
afecta a un perfil de usuario y no a la totalidad, pero para quien lo sufre la compra es imposible.

---

## HAL-03

**El botón «Remove» no retira el producto del carrito**

- **Usuario:** `error_user` · **Vista:** catálogo (`/inventory.html`)
- **Severidad:** Alta · **Prioridad:** Alta

### Reproducción

1. Acceder como `error_user` / `secret_sauce`.
2. Añadir «Sauce Labs Backpack» y «Sauce Labs Onesie». El contador marca `2`.
3. Pulsar «Remove» en la mochila.

### Resultado esperado

El contador baja a `1` y el botón de la tarjeta vuelve a «Add to cart».

### Resultado obtenido

Nada cambia. El contador sigue en `2` y ambos botones siguen mostrando «Remove»:

```
contador tras pulsar Remove : 2      (esperado: 1)
botones Remove presentes    : remove-sauce-labs-backpack, remove-sauce-labs-onesie
```

El botón responde al clic —no está deshabilitado— pero la acción no surte efecto. Para el usuario,
la interfaz acepta la orden y la ignora.

### Impacto

El usuario no puede corregir el carrito, así que acaba pagando artículos que había decidido quitar.
Un defecto que produce cobros no deseados es Alta con independencia de lo sencillo que parezca.

---

## HAL-04

**Seleccionar un criterio de ordenación no reordena el catálogo**

- **Usuario:** `error_user` · **Vista:** catálogo (`/inventory.html`)
- **Severidad:** Media · **Prioridad:** Media

### Reproducción

1. Acceder como `error_user` / `secret_sauce`.
2. Elegir «Price (high to low)» en el desplegable de ordenación.

### Resultado esperado

El catálogo se reordena de mayor a menor precio: `49.99, 29.99, 15.99, 15.99, 9.99, 7.99`.

### Resultado obtenido

La lista se queda exactamente como estaba:

```
antes   : 29.99, 9.99, 15.99, 49.99, 7.99, 15.99
después : 29.99, 9.99, 15.99, 49.99, 7.99, 15.99   ← sin cambios
```

El desplegable acepta la selección y la muestra como opción activa, de modo que la interfaz da por
aplicado un criterio que no se ha aplicado.

### Impacto

No bloquea la compra, pero desinforma: quien ordena por precio para encontrar lo más barato se
queda mirando una lista que no responde a lo que ha pedido. Se agrava porque el control indica que
el criterio está activo.

---

## HAL-05

**El acceso tarda unos 5 segundos**

- **Usuario:** `performance_glitch_user` · **Vista:** acceso
- **Severidad:** Media · **Prioridad:** Baja

### Reproducción

1. Introducir `performance_glitch_user` / `secret_sauce`.
2. Cronometrar desde la pulsación de «Login» hasta que el catálogo es visible.

### Resultado esperado

El acceso se completa dentro del presupuesto establecido: **2.500 ms**.

### Resultado obtenido

```
performance_glitch_user : 5.117 ms     (presupuesto: 2.500 ms)
standard_user           :   ~700 ms     (referencia, misma máquina y misma sesión)
```

### Sobre el umbral

El presupuesto de 2.500 ms es absoluto y holgado a propósito. La demora es una espera fija de unos
cinco segundos introducida por la aplicación, así que 2.500 ms la separan con margen de cualquier
lentitud del entorno de integración continua. Un umbral ajustado convertiría la velocidad del
servidor de turno en la causa del resultado, y entonces el test no mediría la aplicación sino la
máquina.

El tiempo del usuario estándar se mide en la misma ejecución **como referencia, no como criterio**:
acompaña al fallo en el informe y despeja la duda de si lo lento era la aplicación o el entorno.

### Impacto

Cinco segundos sin respuesta tras pulsar «Login» es el umbral a partir del cual un usuario asume
que algo se ha roto y vuelve a pulsar. No impide nada, de ahí la prioridad Baja, pero es la clase
de latencia que se traduce en abandonos.
