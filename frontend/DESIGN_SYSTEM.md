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

## Cómo agregar una regla nueva

1. Tomar la decisión de diseño con el usuario y validarla visualmente.
2. Implementarla como componente `shared` o utilidad global reutilizable (no suelta en una tab).
3. Documentarla aquí con: qué es, dónde vive, API/uso, qué prohíbe y qué reemplaza.
4. Migrar las vistas existentes al patrón cuando se toquen.
