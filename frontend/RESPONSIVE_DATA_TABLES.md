# Guía de tablas responsivas y prioridad de columnas

Este documento define cómo deben diseñarse y corregirse las tablas de datos del frontend cuando el ancho disponible no alcanza para mostrar toda la información.

El objetivo no es “hacer que todo entre a la fuerza”. El objetivo es preservar la lectura, evitar filas rotas, evitar solapes y mantener visible lo que el usuario necesita para tomar decisiones.

## Principio central

Una tabla debe tener una jerarquía explícita de columnas.

Antes de implementar o modificar una tabla, clasifica cada columna en uno de estos niveles:

1. **Crítica:** necesaria para identificar el registro o ejecutar la acción principal.
2. **Operativa:** ayuda a decidir o trabajar en la vista actual.
3. **Contextual:** dato útil, pero disponible en un detalle, modal o vista secundaria.
4. **Técnica o secundaria:** dato de baja prioridad para la operación inmediata.

Si no es obvio qué columnas tienen menor prioridad, el agente debe preguntarlo antes de asumir.

## Regla obligatoria: no sacrificar integridad visual

Está prohibido resolver falta de espacio con:

- texto pisando otra columna;
- filas que cambian de altura de forma desordenada;
- columnas tan estrechas que el dato queda ilegible;
- botones que saltan de línea dentro de una fila;
- scroll horizontal como primera solución;
- anchos fijos gigantes que solo funcionan en monitores grandes.

Si un dato no entra de forma legible, se debe ocultar por prioridad, resumirlo o moverlo a un detalle. No se debe “aplastar”.

## Orden recomendado de soluciones

Cuando una tabla no cabe, aplicar este orden:

1. **Eliminar columnas redundantes** si ya existen en “Ver más”, detalle, historial o modal.
2. **Definir prioridad de columnas** y ocultar las menos importantes en pantallas medianas.
3. **Compactar columnas cortas** como documento, celular, estado simple, cantidades o fechas.
4. **Reservar más espacio a columnas variables** como nombre, estado operativo, tipificaciones o acciones.
5. **Usar cards en móvil** cuando la tabla ya no sea el patrón correcto.
6. **Usar scroll horizontal solo como última opción**, y únicamente cuando todas las columnas sean críticas y no exista una alternativa funcional.

## Cuándo pedir decisión al usuario

El agente debe consultar al usuario cuando:

- no se puede distinguir qué columnas son críticas;
- ocultar una columna podría cambiar el sentido operativo de la vista;
- una columna parece secundaria pero no existe en ningún detalle;
- la tabla pertenece a un flujo de auditoría, finanzas, ranking o gestión sensible;
- se está considerando scroll horizontal porque no hay forma clara de priorizar.

Ejemplo de pregunta válida:

> “Para evitar scroll horizontal, ¿qué columnas puedo ocultar primero en pantallas pequeñas: Documento, Celular o Campaña?”

## Patrón recomendado de prioridad

Para tablas administrativas de personas:

- Prioridad alta: **Empleado**, **Rol**, **Estado**, **Acciones**.
- Prioridad media: **Celular**, **Documento**.
- Prioridad baja: **Correo**, si ya está en el detalle.

Para tablas de leads:

- Prioridad alta: identificador del lead, estado/tipificación actual, responsable/equipo, historial/acciones.
- Prioridad media: campaña, fechas, agrupación.
- Prioridad baja: datos repetidos en historial o detalle.

Para tablas financieras:

- Prioridad alta: campaña/proveedor, gasto, leads, ventas, costo por resultado, acciones principales.
- Prioridad media: conversiones, último registro.
- Prioridad baja: columnas históricas o auxiliares si hay modal de detalle.

Estas prioridades son guías. Si el usuario define otro orden, prevalece el criterio del usuario.

## Implementación recomendada

### 1. Evitar mínimos enormes

No usar `min-width` gigantes para “ordenar” la tabla en pantallas grandes.

Evitar:

```html
[tableStyle]="{ 'min-width': '105rem', 'table-layout': 'fixed' }"
```

Preferir:

```html
[tableStyle]="{ width: '100%', 'table-layout': 'fixed' }"
```

Si una tabla realmente necesita ancho mínimo, debe justificarse y mantenerse lo más bajo posible.

### 2. Asignar clases por columna

Cada columna con prioridad debe tener clase propia en `colgroup`, encabezado y celda.

```html
<ng-template #colgroup>
  <col class="col-main" />
  <col class="col-status" />
  <col class="col-secondary" />
  <col class="col-actions" />
</ng-template>

<th class="col-main">Empleado</th>
<th class="col-status">Estado</th>
<th class="col-secondary">Documento</th>
<th class="col-actions">Acciones</th>

<td class="col-main">...</td>
<td class="col-status">...</td>
<td class="col-secondary">...</td>
<td class="col-actions">...</td>
```

Esto permite ocultar o redistribuir columnas sin depender de `nth-child`, que se vuelve frágil cuando cambian columnas.

### 3. Usar container queries cuando el problema depende del ancho real del bloque

Las tablas dentro del layout privado no dependen solo del ancho del navegador. También influyen sidebar, padding, cards y contenedores.

Por eso, para tablas dentro de paneles, preferir `container-type: inline-size` en el bloque padre y reglas `@container`.

```scss
.table-section {
  container-type: inline-size;
}

@container (max-width: 82rem) {
  :host ::ng-deep .data-table .col-low-priority {
    display: none;
  }
}
```

Usar `@media` cuando el cambio sea realmente global de viewport, por ejemplo pasar de tabla a cards en móvil.

### 4. Preservar columnas críticas

Las columnas críticas no deben ocultarse por falta de espacio. En su lugar:

- truncar texto con `text-overflow: ellipsis`;
- mover datos secundarios a detalle;
- ajustar botones a iconos si el significado sigue siendo claro;
- compactar estados con `Tag`;
- usar una card móvil si el ancho ya es demasiado pequeño.

### 5. Acciones siempre estables

La columna de acciones debe tener ancho reservado suficiente.

Reglas:

- no permitir que los botones se solapen;
- no permitir que “Ver más” empuje otros botones;
- si hay demasiadas acciones, agrupar en menú o usar iconos con tooltip;
- las acciones no deben depender del largo del nombre o estado.

## Scroll horizontal

El scroll horizontal no está prohibido en todo el sistema, pero sí debe tratarse como excepción.

Se permite cuando:

- todas las columnas son críticas;
- la tabla es de auditoría o comparación técnica;
- ocultar columnas generaría decisiones incorrectas;
- el usuario aceptó explícitamente ese comportamiento.

No se debe usar cuando:

- hay columnas claramente secundarias;
- los datos ya están en un modal de detalle;
- la tabla es de operación diaria y debe leerse rápido;
- la vista está pensada para oficinas con pantallas 1080p.

## Validación mínima antes de entregar

Antes de dar por terminada una tabla:

1. Revisar la vista en ancho grande.
2. Revisar la vista en ancho equivalente a PC de oficina 1080p con sidebar.
3. Revisar la vista en tablet horizontal si aplica.
4. Revisar que no haya scroll horizontal salvo decisión explícita.
5. Revisar datos largos: nombres extensos, estados múltiples, correos largos, campañas largas.
6. Revisar acciones: todos los botones deben verse y poder usarse.
7. Revisar que las columnas ocultas sigan disponibles en detalle si son necesarias.

## Criterio para futuros agentes

Si el usuario reporta que una tabla “se rompe”, “no entra”, “se corta” o “se ve mal en pantallas pequeñas”, el agente debe:

1. Identificar columnas actuales y su propósito.
2. Revisar si hay anchos fijos, `min-width` exagerados o `scrollable`.
3. Proponer una jerarquía de columnas antes de ocultar información sensible.
4. Preguntar al usuario si la prioridad no es evidente.
5. Implementar la solución con clases por columna y reglas responsivas claras.

La solución correcta debe hacer que la tabla se adapte al espacio disponible sin perder la información crítica ni romper visualmente las filas.
