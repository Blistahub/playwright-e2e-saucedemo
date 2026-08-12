# Política de tests inestables

Un test inestable —el que pasa y falla sin que cambie nada— hace más daño que un test que falta.
El que falta se nota; el inestable enseña al equipo a ignorar el rojo, y llegado el momento el
fallo real pasa por «otra vez ese test raro».

Por eso esta suite trata la inestabilidad como un defecto del test, no como una molestia que se
absorbe subiendo el número de reintentos.

---

## 1. Reintentos: qué son y qué no

| Entorno | Reintentos | Motivo |
| --- | :---: | --- |
| Local | **0** | Un fallo debe verse a la primera. Reintentar en local es esconderse el problema a uno mismo |
| Integración continua | **2** | Absorben la variabilidad de red contra un sitio de terceros, que no está bajo control de este repositorio |

Los reintentos en CI **no ocultan nada**: Playwright marca el test como inestable (*flaky*) en el
informe, y esa marca es la señal que abre la investigación. Un test que pasa al segundo intento
aparece como inestable, no como correcto.

La distinción importa porque es donde suele torcerse el criterio: subir los reintentos a 3 para que
deje de molestar convierte una señal en ruido. El número está en 2 y no se sube.

---

## 2. Qué hacer cuando aparece uno

1. **No se sube el número de reintentos.** Nunca es la solución; siempre es el aplazamiento.
2. **No se añade una espera fija.** `waitForTimeout` hace que el test pase hoy en esta máquina y
   falle el día que el runner vaya cargado. No hay ninguna en esta suite, y es un criterio de
   revisión de código.
3. **Se abre la traza.** El artefacto `playwright-report` de la ejecución de CI trae la traza del
   primer reintento: DOM, red y capturas en cada paso. Casi siempre el diagnóstico está ahí.
4. **Se corrige la causa**, que en la práctica es una de estas cuatro:

| Causa | Cómo se reconoce | Corrección |
| --- | --- | --- |
| Aserción sobre un elemento que aún no está | Falla más en CI que en local, y siempre en el mismo punto | Usar la aserción con reintento (`expect(locator).toHaveText(...)`) en lugar de leer el texto y compararlo a mano |
| Localizador que casa con más de un elemento | Falla al añadir contenido, no al cambiarlo | Acotar el localizador; en esta suite, filtrando la tarjeta por su nombre visible |
| Dependencia entre tests | Falla solo cuando se ejecutan en paralelo o en cierto orden | Cada test debe montar su propio estado. Aquí lo garantiza el contexto de navegador nuevo por test |
| Orden no garantizado por la aplicación | Falla de forma intermitente sin patrón | Aserción sobre el conjunto, no sobre la secuencia. Es lo que se hace en CP-09 y CP-14 |

5. **Si no se puede corregir en el momento**, el test se marca con `test.fixme()` y se abre la
   incidencia. Queda visible en el informe como pendiente, en lugar de borrado o comentado.

---

## 3. Lo que ya está hecho para no llegar aquí

Estas decisiones están tomadas en el código y son las que mantienen la suite estable:

- **Cero esperas fijas.** Toda la sincronización se apoya en las aserciones con reintento de
  Playwright, que esperan a que la condición se cumpla en lugar de a que pase un tiempo.
- **Aislamiento por contexto.** Cada test recibe un contexto de navegador nuevo. El estado de
  SauceDemo vive en una cookie, así que muere con él: no hay estado que arrastrar entre tests ni
  limpieza que se pueda olvidar.
- **Aserciones sobre conjuntos cuando el orden no es un requisito.** En CP-09 se comprueba qué
  productos hay en el carrito, no en qué orden. En CP-14 y CP-15 se comprueba que los precios no
  rompen la monotonía, no una secuencia exacta: dos artículos cuestan 15,99 € y la aplicación no
  promete cómo desempata. Exigir un orden que nadie ha prometido es fabricarse un test inestable.
- **Umbrales de tiempo holgados y absolutos.** El único test que mide tiempo (HAL-05) usa un
  presupuesto muy por debajo de la demora real, para que la velocidad del entorno no decida el
  resultado.
- **Paralelismo limitado en CI.** Dos procesos, no ocho: la suite corre contra un servicio ajeno y
  saturarlo produciría fallos que no son defectos.

---

## 4. Cómo se comprueba

Antes de dar por buena una corrección de inestabilidad, se repite el test aislado varias veces:

```bash
npx playwright test --grep "CP-09" --repeat-each=10
```

Diez pases seguidos no demuestran que el test sea estable, pero un solo fallo demuestra que no lo
es. Es la comprobación más barata que existe y evita cerrar el asunto en falso.
