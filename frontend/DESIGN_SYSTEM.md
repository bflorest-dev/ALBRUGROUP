# Sistema de diseño

Lista de reglas de diseño **puntuales y reutilizables** del frontend. El objetivo es
que un mismo elemento se resuelva **siempre igual** en todas las tabs de todos los roles,
en vez de reinventarlo cada vez. Cada regla nace de una decisión tomada y validada; al
fijarla aquí deja de ser "criterio del momento" y pasa a ser el patrón oficial.

Complementa `AGENTS.md`, `FRONTEND_ARCHITECTURE.md`, `ADMIN_RESPONSIVE_GUIDE.md`,
`RESPONSIVE_DATA_TABLES.md` y `SIDEBAR_LAYOUT_CONTRACT.md`.

Toda regla usa las variables de tema por rol (`--role-*`) y de app (`--app-*`) definidas
en `src/styles.scss`, de modo que un solo patrón toma el color de cada rol automáticamente.

---

## Regla 1 — Encabezado de página (`app-page-header`)

**Qué es:** el bloque superior de toda tab (título del tab + contexto + acciones de la página).

**Componente:** `src/app/shared/components/page-header/` (`<app-page-header>`).
Presentacional puro, `OnPush`, sin facade ni HTTP.

**Estructura fija (de arriba a abajo):**

1. **Eyebrow** — contexto o rol, en mayúsculas, color `--role-accent`, con una pequeña
   barra de acento delante. Reemplaza la vieja píldora `<p-tag>`. Opcional pero recomendado.
2. **Título** — grande (`clamp(1.9rem, 3vw, 2.5rem)`, peso 700) con **degradado tonal**
   `--role-primary → --role-secondary` recortado al texto. Es el realce principal.
   Lleva color sólido de respaldo (`--role-primary`) vía `@supports`, y en modo oscuro se
   aclara conservando el tinte del rol (para no quedar navy sobre fondo navy).
3. **Descripción** — **opcional**. Usarla solo cuando el título no basta para entender la tab.
   Dejó de ser el default: el título carga el énfasis.
4. **Acciones** — slot `<ng-content>` a la derecha, en zona fija (independiente del largo
   del título). En pantallas angostas baja debajo del título ocupando el ancho.

**API:**

```html
<app-page-header
  eyebrow="Administrador"
  title="Dashboard"
  description="Métricas del día por equipo."
  [variant]="'glass'"
>
  <!-- opcional: botones/acciones de la página -->
  <button pButton icon="pi pi-refresh" label="Actualizar"></button>
</app-page-header>
```

- `title` (obligatorio), `eyebrow`, `description` (ambos opcionales).
- `variant`: `'glass'` (default, ver Regla 2) · `'solid'` (tarjeta opaca, para tabs con
  tablas densas debajo) · `'plain'` (suelto sobre el fondo, sin superficie).

**Prohibido:**

- Volver a maquetar un encabezado a mano (`.hero`, `<h1>` suelto, `<p-tag>` de rol) en una tab.
- Poner una descripción "por defecto" bajo cada título.
- Anclar las acciones a algo cuyo ancho dependa del texto del título.

**Reemplaza:** los tres encabezados divergentes que existían (píldora `<p-tag>` en Dashboard,
`p-card` + eyebrow en Ranking, `p-card` + fila de acciones en Backoffice).

---

## Regla 2 — Superficie de vidrio esmerilado (`.app-glass`)

**Qué es:** superficie translúcida con desenfoque del fondo, para que el contenido tenga una
base estable y legible mientras el fondo de la app se asoma difuso. Es la superficie por
defecto del encabezado y la base para futuras cards "hero".

**Clase global:** `.app-glass` (definida en `src/styles.scss`, reutilizable en cualquier
componente porque la hoja es global).

**Tokens (light + dark en `styles.scss`):**

- `--app-glass-bg`, `--app-glass-border`, `--app-glass-blur`, `--app-glass-shadow`.

**Comportamiento resuelto:**

- **Contraste:** la superficie translúcida siempre queda lo bastante clara para el texto,
  sin importar el fondo. Resuelve el problema de contraste de poner contenido suelto sobre
  el fondo tintado de la app.
- **Modo oscuro:** el cristal se vuelve translúcido oscuro automáticamente.
- **Fallback:** sin soporte de `backdrop-filter` cae a `--app-surface-raised` (casi opaca);
  nunca se rompe.

**Cuándo usarlo / cuándo no:**

- ✅ Encabezados y cards de nivel "hero".
- ❌ **Nunca detrás de tablas densas de datos.** Ahí la legibilidad manda: usar superficie
  sólida (`--app-surface`). El blur también tiene costo de rendimiento; reservarlo.

**Cuidado — `backdrop-filter` crea contexto de apilamiento** y además vuelve al elemento
bloque contenedor de descendientes `position: fixed`. No envolver en `.app-glass` un
contenedor que tenga dentro diálogos, drawers o desplegables: quedarían atrapados.

**Sobre fondo plano el vidrio casi no se percibe** (se ve como una tarjeta blanca). Es una
limitación aceptada: se probó darle un fondo ambiental al layout y **causó una regresión
grave** (ver abajo). No reintentarlo por esa vía.

### ⚠️ No agregar un fondo ambiental con `z-index` en los hijos de `.content`

Se intentó pintar halos de color tras el contenido (`main.content::before`) apoyándose en
`main.content > * { position: relative; z-index: 1 }`. Eso crea **un contexto de apilamiento
por cada hijo directo** de `.content` y rompió los overlays de todo el layout:

- el desplegable de asistencia (dentro del banner superior) quedaba **detrás** del contenido
  de la página, porque ambos eran hermanos con el mismo `z-index`;
- la máscara del drawer (montada a nivel de `body`) quedaba **por encima** del propio drawer:
  todo se veía oscurecido, los botones no recibían clic y cualquier clic cerraba el panel.

Afectó a GTR y a cualquier rol. Está **revertido**. Si alguna vez se retoma la idea, la capa
decorativa no debe tocar el apilamiento de los hijos de `.content`.

---

## Regla 3 — Encabezado de sección / subtítulo (`app-section-header`)

**Qué es:** el subtítulo de un bloque **dentro** de una tab (una sección de la página, no el
título del tab). Es el patrón hermano de la Regla 1, un nivel abajo.

**Componente:** `src/app/shared/components/section-header/` (`<app-section-header>`).
Presentacional puro, `OnPush`.

**Estructura fija:**

1. **Subtítulo** — mismo degradado tonal por rol que el título (`--role-primary → --role-secondary`),
   peso 700, pero más chico (`clamp(1.15rem, 1.6vw, 1.4rem)`). Mismo fallback sólido y versión
   clara en oscuro. Es `<h2>` (bajo el `<h1>` del `app-page-header`).
2. **Ícono de info** — `pi pi-info-circle` (el mismo del banner), en `--role-accent`, a la
   derecha del subtítulo. Es un `<button>` accesible (`aria-label` = descripción, `cursor: help`).
3. **Descripción → tooltip** — la ayuda **no va como texto plano en el flujo**. Se pasa por
   `description` y aparece en un `pTooltip` (PrimeNG) al hacer hover o foco sobre el ícono.
   Si no hay descripción, no se muestra el ícono.
4. **Acciones** — slot `<ng-content>` opcional a la derecha (se oculta si va vacío).

**API:**

```html
<app-section-header title="Gestión por campaña" [description]="facade.campoAyuda()" />
```

**Regla de copy:** las descripciones/ayudas de sección van **siempre** dentro del tooltip del
ícono, nunca como párrafo bajo el subtítulo. El subtítulo carga el énfasis; la ayuda es
secundaria y bajo demanda.

**Prohibido:**

- Subtítulos con `<h3>`/`<h4>` sueltos y una `<p>` de ayuda debajo.
- Texto explicativo permanente ocupando espacio junto al subtítulo.

---

## Regla 4 — Controles de un bloque de métricas

**Set estándar, en este orden:** `Equipo · Modo · Tipificación · Período` y, debajo, el selector
de `Campañas`. Todos son controles segmentados (`p-selectButton`), en **fila propia bajo el
subtítulo, alineada a la derecha**, cerrando con el botón de refrescar **solo ícono**.

**Antes de poner estos controles en un bloque hay que verificar que el endpoint los soporte.**
No se agregan selectores que el backend no pueda separar: un toggle que no cambia nada, o que
cambia números sin respaldo, es peor que no tenerlo.

**Modo no es cosmético — cambia la cohorte, y con ella el significado de cada indicador:**

- `INGRESADOS`: qué pasó con los leads que **entraron** en el período (cohorte de ingesta).
- `GESTIONADOS`: qué se **hizo** en el período, sin importar cuándo entró el lead.

Al cambiar de cohorte, numerador y denominador de cada medidor cambian. Resolverlo en el view
model (no ramificando el template) y **actualizar también las etiquetas**: si el denominador pasa
de "únicos" a "gestionados", el texto tiene que decirlo o la vista miente. Los indicadores que
solo tienen lectura en una cohorte (p. ej. calidad de la base, que mide duplicados de la ingesta)
se mantienen fijos en esa cohorte en vez de mostrar un número inventado.

### Período (`app-period-selector`)

`src/app/shared/components/period-selector/`. Segmentado `[Hoy | Semanal | Mensual]` que además
concentra la elección del día:

- **Sin ícono de calendario** (rompería la estética del segmentado). Se abre haciendo **clic en el
  primer segmento**, incluso si ya estaba activo.
- Elegido un día distinto de hoy, el segmento **muestra esa fecha** (`15 jul`) en lugar de "Hoy":
  el control nunca miente sobre lo que se está viendo. Al pasar a Semanal/Mensual vuelve a "Hoy".
- Cierra al salir el mouse (con margen de ~320 ms para poder cruzar hacia el calendario), al elegir
  un día, y por clic fuera / `Escape` — esto último es **obligatorio**: en táctil no existe
  `mouseleave` y el calendario quedaría atrapado.
- El popover usa `appendTo="body"` para no quedar recortado por el `overflow` del panel.

**Semana operativa:** de **sábado a viernes** (desde el sábado más reciente ≤ hoy). Mensual, desde
el día 01. Se calculan en el frontend con fecha local (nunca `toISOString`).

---

## Regla 5 — Gráficos

Antes de tocar colores, cargar la skill `dataviz`. Lo que sigue es lo ya decidido en este proyecto.

**Contenedor.** Sin marcos pesados: nada de bordes gruesos de color ni bandas con degradado detrás
del título. Los rellenos saturados son para **marcas pequeñas**, no para bloques grandes: la
identidad del equipo entra como un **punto de color** junto al nombre, con un separador hairline y
el total a la derecha. Un marco ruidoso compite con los datos y envejece mal.

**Leyenda.** Alineada con el área de datos, no con el borde de la tarjeta. Si las barras arrancan
después de una columna de nombres, la leyenda arranca ahí también (misma grilla, vía una variable
CSS compartida). Una leyenda pegada al borde se ve flotando.

**Color: se valida, no se estima.** Correr `dataviz/scripts/validate_palette.js` antes de shippear
cualquier paleta, en claro **y** en oscuro. Hallazgos concretos de este proyecto:

- Una rampa que "se veía bien" tenía **1.11:1** de contraste en su tono más claro — invisible.
- Una rampa de un solo tono **no da más de ~6 pasos** distinguibles: entre el piso de contraste y el
  tono más oscuro no hay recorrido de luminosidad suficiente. Lo que exceda va a gris neutro.
- El modo oscuro **es su propia rampa validada**, no un volteo de la clara.
- Derivar la rampa del color del equipo **no es automático**: el rojo pasó, el naranja falló por
  1.99:1. Si se retoma, hay que oscurecer el extremo claro hasta cumplir (luminancia relativa
  ≤ 0.475 contra fondo claro). Mejor aún: **restringir los colores elegibles para equipos** a tonos
  que funcionen como escala.

**Tipificaciones = escala ordenada**, no categorías sueltas: se colorean con rampa ordinal según su
`orden` (más oscuro = desenlace más avanzado), nunca con colores arbitrarios.

**Relleno de marca ≠ fondo de celda. Son dos escalas y no deben unificarse.** Un relleno de barra
tiene que destacar *contra la superficie*, así que es saturado. Un fondo de celda va *detrás de una
cifra*, así que tiene que ser pálido. Reutilizar la rampa de barras en la matriz dejó los números a
**2.5:1** de contraste — ilegibles. Con la escala de celdas propia quedaron en 6.2:1 o mejor.
Regla práctica: si hay texto encima, el fondo se elige por la legibilidad del texto, y se **mide**
(luminancia relativa), no se estima.

**Dos colores no pueden competir en la misma celda.** Al teñir por magnitud, un resaltado de fila
(p. ej. pintar la fila de cierre de verde) pelea con la escala y ninguno se lee. El énfasis se
mueve a la etiqueta de la fila (negrita y color en el texto), y el fondo queda para el dato.

**Volumen bajo.** Las campañas por debajo de un mínimo se agrupan en "Otras campañas (N)": con 1
lead cualquier desenlace es "100%" y pesa visualmente igual que una campaña de 30. Solo agrupar si
quedan al menos dos barras individuales.

**Etiquetas directas, con detección de colisión.** No se etiqueta cada punto: se eligen los pocos
que importan y, aun así, una etiqueta solo se coloca si no pisa a otra ya puesta. Dos campañas con
volumen y tasa parecidos caen casi encima y sus nombres se superponen. Lo que no se etiqueta sigue
siendo legible por tooltip.

**Comparar tasas exige mostrar el volumen.** Ordenar campañas por tasa de conversión miente: una de
1 lead con 1 preventa da 100%. Por eso la vista de efectividad usa el volumen como eje y atenúa —
sin ocultar — las campañas de bajo volumen, con la tasa global del equipo como línea de referencia.

**La tabla no se reemplaza.** Todo gráfico convive con su vista de tabla (accesible y auditable);
el selector de vista alterna la **forma**, no los datos — por eso va más discreto que los controles
de filtro y nunca se confunde con ellos.

---

## Cómo agregar una regla nueva

1. Tomar la decisión de diseño con el usuario y validarla visualmente.
2. Implementarla como componente `shared` o utilidad global reutilizable (no suelta en una tab).
3. Documentarla aquí con: qué es, dónde vive, API/uso, qué prohíbe y qué reemplaza.
4. Migrar las vistas existentes al patrón cuando se toquen.
