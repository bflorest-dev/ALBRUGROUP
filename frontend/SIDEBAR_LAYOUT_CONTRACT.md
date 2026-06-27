# Contrato visual del sidebar

Este documento define el comportamiento obligatorio del sidebar del layout privado.

Aplica a todos los roles que usan `PrivateLayout`, no solo a `ADMINISTRADOR`.

---

## Principio central

El sidebar tiene tres zonas funcionales y visuales:

1. Encabezado de marca.
2. Navegacion del rol.
3. Bloque de usuario conectado.

Estas zonas no deben competir por el espacio ni modificar su posicion segun el largo del contenido.

Regla:

- el encabezado siempre queda visible arriba;
- el bloque de usuario siempre queda visible abajo;
- solo la zona de navegacion puede hacer scroll vertical;
- los tabs no deben estirarse para llenar el alto disponible.

---

## Estructura obligatoria

```text
Sidebar
  Header fijo
    Logo
    Empresa
    Nombre del panel

  Nav flexible
    Section label
    Tabs

  User block fijo
    Avatar
    Nombre / rol
    Menu desplegable
```

### 1. Header fijo

Debe contener:

- logo o icono del sistema;
- nombre de empresa;
- nombre del panel o contexto.

Comportamiento:

- no se oculta en desktop ni tablet horizontal;
- no debe comprimirse por culpa de la lista de tabs;
- no debe crecer por contenido variable;
- textos largos se truncan o se controlan con ancho estable.

### 2. Navegacion flexible

Debe contener:

- etiqueta de seccion, por ejemplo `Workspace`;
- tabs del rol.

Comportamiento:

- ocupa el espacio disponible entre header y user block;
- si los tabs no entran, hace scroll vertical interno;
- el scroll debe ser discreto y preferiblemente sin barra visible;
- cada tab mantiene su alto normal;
- los tabs no se reparten todo el alto disponible;
- hover y active state deben ser consistentes entre roles.

### 3. Bloque de usuario fijo

Debe contener:

- avatar o icono del usuario;
- nombre visible;
- rol;
- indicador para abrir opciones;
- menu desplegable con acciones de sesion o configuracion.

Comportamiento:

- siempre visible en desktop y tablet horizontal;
- no debe irse al final de una pagina larga;
- no debe tapar tabs;
- si el menu desplegable abre, debe quedar por encima del contenido del sidebar;
- textos largos se truncan sin romper el layout.

---

## Medidas y comportamiento esperado

### Sidebar desktop / tablet horizontal

Reglas:

- altura: alto visible del viewport;
- posicion: sticky o fija segun layout;
- overflow del contenedor principal: oculto;
- overflow de la navegacion: vertical interno;
- header y user block: `flex: 0 0 auto`;
- nav: `flex: 1 1 auto` con `min-height: 0`;
- tabs: altura por contenido, nunca filas estiradas.

Patron CSS esperado:

```scss
.sidebar {
  height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sidebar__brand,
.sidebar__bottom {
  flex: 0 0 auto;
}

.menu {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  align-content: start;
  grid-auto-rows: max-content;
}
```

### Tablet vertical / celular

Reglas:

- se usa topbar y drawer lateral;
- al abrir el drawer, el mismo contrato interno se mantiene;
- header y user block siguen visibles dentro del drawer cuando el alto lo permita;
- si el alto no alcanza, la navegacion scrollea antes que expulsar el user block.

---

## Reglas de tabs

Cada tab debe tener:

- altura estable;
- icono en slot fijo;
- texto con truncamiento si hace falta;
- hover suave;
- active state reconocible;
- area tactil suficiente;
- borde o marca activa consistente.

Prohibido:

- distribuir tabs con `space-between` o filas estiradas para llenar alto;
- cambiar la posicion del icono segun el texto;
- permitir que un texto largo empuje el ancho del sidebar;
- usar margenes verticales a ojo para simular distribucion;
- depender de la cantidad actual de tabs para que el layout se vea bien.

---

## Scroll interno

La navegacion puede tener scroll solo cuando haga falta.

Reglas:

- el scroll pertenece a la zona de tabs;
- el header no scrollea;
- el user block no scrollea;
- preferir scrollbar invisible o discreta;
- mantener navegacion con teclado y rueda del mouse.

Patron recomendado:

```scss
.menu {
  scrollbar-width: none;
}

.menu::-webkit-scrollbar {
  display: none;
}
```

Usar scrollbar visible solo si el rol llega a tener muchas opciones y el usuario necesita señal clara de que hay mas contenido.

---

## Menu de usuario

El menu desplegable del usuario debe:

- abrir hacia arriba cuando esta en el bloque inferior;
- permanecer dentro del sidebar o como overlay por encima;
- no quedar tapado por el contenido principal;
- no empujar el bloque de usuario fuera del viewport;
- cerrar al hacer logout o cambiar de ruta si corresponde.

Acciones esperadas:

- cerrar sesion;
- toggles administrativos cuando apliquen;
- futuras opciones de perfil o configuracion.

---

## Tailwind en la segunda version

Si se reconstruye el sidebar con PrimeNG + Tailwind, el contrato no cambia.

Tailwind puede usarse para:

- tamaños y espaciados consistentes;
- estados hover/active;
- transiciones;
- grids/flex responsivos;
- truncamiento;
- overflow controlado.

Pero Tailwind no debe cambiar estas reglas:

- header siempre visible;
- user block siempre visible;
- tabs con altura por contenido;
- scroll solo en navegacion;
- active state estable;
- layout independiente de la cantidad de tabs.

Ejemplo conceptual con Tailwind:

```html
<aside class="flex h-dvh flex-col overflow-hidden">
  <header class="shrink-0">...</header>
  <nav class="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none]">...</nav>
  <footer class="shrink-0">...</footer>
</aside>
```

---

## Criterio de validacion

Antes de cerrar cambios en el sidebar:

1. Probar con pocos tabs.
2. Probar con muchos tabs.
3. Probar con nombre de usuario largo.
4. Probar con rol largo.
5. Probar con menu de usuario abierto.
6. Probar pagina corta.
7. Probar pagina larga.
8. Probar desktop 1440p.
9. Probar monitor 1080p.
10. Probar tablet horizontal.
11. Probar tablet vertical/celular con drawer.

El sidebar esta correcto solo si:

- header y user block siguen visibles;
- los tabs no se estiran;
- la navegacion scrollea si hace falta;
- no hay solapes;
- el comportamiento es igual entre roles.
