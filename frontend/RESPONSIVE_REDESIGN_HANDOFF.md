# Handoff responsive: experiencia acumulada

Este documento resume lo aprendido durante el rediseno responsive de Backoffice, Asesor de Ventas, GTR y el inicio de ADMIN.

Su objetivo es que una nueva instancia pueda continuar sin repetir decisiones ya validadas.

Documentos relacionados:

- `RESPONSIVE_DATA_TABLES.md`
- `SIDEBAR_LAYOUT_CONTRACT.md`
- `ADMIN_RESPONSIVE_GUIDE.md`
- `DESIGN_SYSTEM.md`

---

## Objetivo real del rediseno

La meta no es solo "que no se rompa". La meta es que la web sea operable en escenarios castigados por poco espacio:

- Monitores pequenos HD: `1280x720`.
- Monitores de oficina: `1366x768`.
- Full HD: `1920x1080`, donde no se debe degradar una vista que ya funcionaba.
- Tablet horizontal, especialmente para ADMIN.
- Celular, cuando aplique con patron distinto.

Regla de oro:

> El scroll horizontal no debe ser la solucion principal para una vista operativa diaria.

Se permite solo como excepcion justificada. Si se puede resolver con jerarquia, compactacion, agrupacion o hover inteligente, se debe preferir eso.

---

## Breakpoints que ya demostraron valor

Usar estos rangos como referencia practica:

| Contexto | Rango guia | Criterio |
|---|---:|---|
| Full HD o superior | `>= 1440px` | Mantener informacion completa y anchos comodos. No compactar de mas. |
| Monitor 20 pulgadas | `1280px - 1439px` | Sidebar compacto, tablas sin scroll horizontal, acciones compactas. |
| Monitor 19 pulgadas HD | `901px - 1279px` | Densidad alta, formularios con scroll interno controlado, botones por icono. |
| Tablet horizontal ADMIN | `901px - 1180px` | Sidebar compacto, contenido en una columna si hace falta, controles legibles. |
| Tablet vertical / movil | `<= 900px` | Topbar + drawer, evaluar cards en vez de tablas. |

No cambiar el corte global de `900px` sin revisar todos los roles.

---

## Sidebar compacto

El sidebar vive en `PrivateLayout` y afecta a todos los roles.

### Lo que funciono

- Para `901px - 1439px`, usar sidebar compacto por defecto.
- Al hacer hover o focus, desplegarlo temporalmente.
- Al salir el mouse, volver a compactarlo.
- No mantenerlo abierto por clicks internos. El click no debe "romper" el comportamiento hover.
- En modo compacto:
  - ocultar textos, secciones, chevrons y subitems;
  - centrar iconos en una caja estable;
  - usar `width: 100%` en cada item para que anchors y botones se centren igual;
  - poner `gap: 0` para que los items con chevron no se descuadren.

### Bugs ya vistos

- Los grupos con desplegables (`Dashboard`, `Plataformas`, `Colaboradores`) se desalineaban porque el chevron invisible seguia dejando espacio.
- Algunos anchors se centraban sobre su propio contenido, no sobre la columna, porque no tenian `width: 100%`.
- El sidebar hacia un "flash" inicial: se veia ancho, pero con iconos sueltos. Se resolvio quitando la transicion de `width` y dejando solo la de `padding`.
- Los cues de scroll superior/inferior no deben usar margenes negativos: pueden tapar iconos o cortarse contra el bloque de usuario.

### Estado recomendado

- `sidebar` no debe animar `width`.
- `menu__item` debe tener `width: 100%`.
- En comprimido:
  - `gap: 0`;
  - `padding-inline: 0`;
  - textos/chevrons/subitems ocultos.
- En hover/focus:
  - restaurar `gap`;
  - restaurar `padding-inline`;
  - mostrar subitems y chevrons.

---

## Tablas operativas

### Patron general

Antes de tocar CSS, definir prioridad:

1. Identificador del lead/persona.
2. Estado operativo o tipificacion clave.
3. Responsable/equipo/asesor.
4. Fecha relevante.
5. Acciones.
6. Datos contextuales.

No resolver metiendo `min-width` grande.

### Lo que funciono

- Quitar prefijo `+51` cuando el contexto ya deja claro que es telefono peruano, especialmente en GTR.
- Compactar columnas con datos cortos:
  - proveedor;
  - documento;
  - estado simple;
  - fechas;
  - contador de acciones.
- Unificar `Lead + Documento` o apilar datos relacionados cuando ahorra una columna.
- Reducir columnas con etiquetas tipo tag cuando en baja resolucion sobra ancho interno.
- Botones de acciones:
  - en baja resolucion, iconos con tooltip;
  - mismos tamanos para acciones hermanas;
  - no permitir que el texto aparezca/desaparezca segun contenido.

### Evitar

- Encabezados que cambian ancho segun si hay datos o no.
- Columnas que colapsan cuando no hay filas.
- `nth-child` fragil si la tabla cambia por proveedor/equipo.
- Scroll horizontal dentro de tabla como "solucion final" si hay columnas compactables.

---

## Backoffice

### Bandeja

Problemas resueltos:

- Scroll horizontal global en `1280x720`.
- Sidebar compacto y hover.
- Columnas `Plan`, `Tipificacion` y `SEC/SOT` castigaban demasiado el ancho.

Decisiones utiles:

- `SEC/SOT` puede mostrarse apilado verticalmente en una columna compacta.
- `Plan` debe conservar legibilidad pero aceptar truncamiento controlado del nombre, manteniendo velocidad visible.
- `Tipificacion` puede reducir ancho en resoluciones menores a Full HD, pero en Full HD debe conservar ancho comodo.
- Tags de subtipificacion largas deben truncar con `...`, no forzar todo el texto ni aumentar la fila.

### Drawer de gestion

Lo que funciono:

- Mantener tabs internos integros.
- Bloque inferior de tipificacion comprimible en resoluciones bajas.
- Comprimir/desplegar el bloque por hover, preservando datos ingresados.
- Al seleccionar tipificacion/subtipificacion, mantener el bloque abierto hasta que el mouse salga realmente del area.

Bug importante:

- El bloque se cerraba porque al seleccionar en un dropdown el mouse quedaba fuera del area expandida tras el cambio de altura. La solucion fue no decidir el cierre por un evento intermedio de click/seleccion, sino por salida real del area operativa.

---

## Asesor de Ventas

### Bandeja

Funciono bien con sidebar compacto. Detalle corregido:

- Boton `Actualizar` del header no debe apilarse debajo del titulo en baja resolucion si puede quedarse en extremo derecho.

### Modal de gestion

Mejoras validadas:

- Boton `Minimizar` debe presentarse como `X` iconica, no como boton grande con texto.
- Cabecera debe mantener proveedor, estado y cerrar/minimizar en extremo derecho.
- Botones de contacto/tipificacion deben conservar agrupacion, pero pueden compactarse.
- Fila de tabs internos + chips de oportunidades + boton nueva oportunidad debe convivir en una sola fila cuando hay espacio.
- El bloque de campos debe ser el area que scrollea; los bloques superiores deben permanecer visibles cuando la altura es critica.
- El boton `Limpiar tab` puede ser flotante y discreto, no una fila sticky completa que tape inputs.
- Ocultar scrollbar visual del bloque scrolleable puede ser mas elegante si hay gradientes/cues o suficientes senales visuales.

### Comentario

- Boton `Comentario` al activarse debe cambiar a texto corto `Ocultar`, no a texto largo que se corte.
- El campo comentario debe ser input de una linea, no textarea redimensionable que rompa el modal.

### Leads solo con usermeta

Comportamiento correcto:

1. Click en `Agregar numero de contacto`.
2. Se infiere `51` como prefijo por ayuda operativa.
3. Si el asesor cancela con la `X`, se limpia internamente tambien el `51`.
4. Si vuelve a agregar, se vuelve a inferir `51`.
5. Si cancelo esa accion, puede minimizar/cerrar el modal sin error de "prefijo y numero incompleto".

### Formularios de Datos Preventa y Direccion

Decision importante:

- Mejor mostrar todos los campos para ambos equipos y deshabilitar los que no correspondan, en vez de ocultarlos. Esto mantiene un layout estandar y evita saltos entre Win/Claro.

Direccion quedo organizada con estas filas:

1. Departamento + Provincia + Distrito.
2. Tipo Domicilio + Tipo Via + Nombre Via.
3. Direccion en fila completa.
4. Latitud + Longitud + Pegar coordenadas.
5. Referencia en fila completa.
6. Urbanizacion + Numero + Manzana + Lote + Plano.
7. Edificio + Condominio + Piso + Interior.

---

## GTR

### Plataforma

Problemas principales:

- Incluso Full HD sufria por las tres columnas de tipificacion.
- La columna de seleccion multiple se podia volver una linea o mostrar puntos raros.
- Acciones tenian anchos inconsistentes.

Decisiones validadas:

- En Full HD o superior, no compactar agresivamente las tres tipificaciones. Deben leerse bien.
- En resoluciones menores, mostrar una sola tipificacion seleccionada y permitir hover para ver las tres.
- El selector de tipificacion visible debe ir antes de `Buscar Lead`, no quedar solapado.
- Se puede cambiar la columna visible desde un selector (`Inicial`, `Mayor`, `Ultima`) y conservar hover como ampliacion temporal.
- La cabecera puede mostrar `Tipificacion` arriba y `Inicial / Mayor / Ultima` abajo para preservar ordenamiento.
- Quitar prefijo del lead ahorra ancho.
- Proveedor/Base/Documento deben tener ancho moderado, no sobredimensionado.
- Estado no debe mostrar puntos suspensivos laterales: reservar ancho suficiente o ajustar el tag.
- Boton `Asignar` puede ser icono + contador, sin texto, con el mismo ancho que acciones secundarias apiladas.
- Acciones secundarias (`Gestionar`, `Historial`) deben tener tamanos iguales.
- `Gestionar` debe quedarse como icono, no alternar a texto por breakpoint.

### Agendados

Mejoras aplicadas o recomendadas:

- Quitar prefijo.
- Fecha/hora con formato apilado como en Plataforma.
- Reducir tipificacion unica moderadamente.
- Asesor: mostrar primeras dos palabras.
- Comentario: icono con tooltip, no columna con texto largo.
- El comentario correcto debe venir del evento en que se tipifico como `AGENDADO`.
- Boton de historial alineado a la derecha dentro de su columna.
- Boton asignar debe seguir el diseno nuevo de Plataforma.

### Historicos

Mejoras aplicadas o recomendadas:

- Quitar prefijo.
- Reducir columna tipificacion.
- Asignar con diseno de Plataforma.
- Selector de filas arriba, junto a Organizar.
- `Organizar` al extremo derecho.
- `Limpiar` y `Buscar` deben vivir en la fila de Tipificaciones/Subtipificaciones, con mismas dimensiones.
- Evitar que al no haber datos las columnas se peguen a la izquierda: usar anchos estables aunque la tabla este vacia.
- Selector de filas debe tener ancho suficiente para dos digitos.

### Ranking

Problema:

- En 1280 se activaba scroll horizontal por comprimir demasiado el resumen de tipificaciones.

Decision:

- Mover `Resumen de Tipificaciones` debajo de la tabla no solo en la menor resolucion, tambien en resoluciones tipo `1366x768`, porque queda mas legible que apretarlo a la derecha.
- En Full HD puede volver al layout lateral si se ve bien.

### Modales GTR

- Historial y buscador deben centrarse con respecto al viewport/contenido visible, no quedar compensados por sidebar o contenedor.
- Si un modal se abre desde Plataforma y Agendados, debe compartir la misma correccion.

---

## ADMIN

ADMIN debe optimizarse tambien para tablet.

### Sidebar ADMIN

Problemas vistos:

- Iconos de items con desplegables se descuadraban.
- Al entrar en baja resolucion habia un flash: sidebar ancho, pero solo con iconos.
- Cues de scroll tapaban o se cortaban.

Correcciones validadas:

- `menu__item` con `width: 100%`.
- En compacto: `gap: 0`.
- Al hover: restaurar gap y padding.
- Ocultar chevrons en compacto.
- Quitar transicion de `width` del sidebar, mantener solo `padding`.
- Cues de scroll sin margenes negativos.

### Siguiente foco ADMIN

Revisar dashboards administrativos con criterio tablet:

- Headers no deben consumir demasiado alto.
- Controles segmentados deben reorganizarse sin perder legibilidad.
- Cards de metricas pueden apilar o pasar a grid menor.
- Tablas deben seguir `RESPONSIVE_DATA_TABLES.md`.
- Modales/dialogs deben usar ancho responsive y footer accesible.

---

## Patrones de solucion que funcionaron

### 1. Compactar por comportamiento, no solo por CSS

Ejemplos:

- Sidebar compacto con hover.
- Bloque de tipificacion del drawer comprimible.
- Tipificaciones GTR: una visible + hover para tres.

### 2. Mantener Full HD comodo

No aplicar compactacion agresiva global. Muchas correcciones deben activarse solo debajo de Full HD.

### 3. Usar iconos cuando el texto no aporta

Ejemplos:

- Minimizar modal como `X`.
- Gestionar/Historial como iconos.
- Comentario como icono con tooltip.
- Asignar como icono + contador.

### 4. Unificar layouts entre equipos y deshabilitar campos

Para Win/Claro, mejor mismo formulario y campos deshabilitados que formularios distintos con saltos visuales.

### 5. Scroll interno solo donde aporta

En modales:

- Mantener cabecera y controles operativos visibles.
- Scrollear solo bloque de campos.
- Evitar sticky footers grandes que tapen inputs.

---

## Checklist antes de entregar una correccion responsive

1. Revisar `1920x1080`: no degradar lo que ya funcionaba.
2. Revisar `1366x768`.
3. Revisar `1280x720`.
4. Para ADMIN, revisar tablet horizontal cercana a `1122x701`.
5. Confirmar que no hay scroll horizontal salvo decision explicita.
6. Confirmar datos largos:
   - nombres;
   - subtipificaciones;
   - correos;
   - direcciones;
   - comentarios.
7. Confirmar estados vacios: tabla sin datos no debe cambiar columnas.
8. Confirmar acciones:
   - mismas dimensiones;
   - no se cortan;
   - no aparecen textos inesperados.
9. Confirmar hover/focus:
   - sidebar se despliega y se comprime;
   - bloques comprimibles no se cierran en plena gestion.
10. Ejecutar `npm run build`.

---

## Notas tecnicas

- El SCSS de `PrivateLayout` esta cerca del budget duro de Angular. Cualquier cambio grande puede romper build por pocos bytes.
- Preferir cambios compactos en ese archivo:
  - `padding-inline` en vez de `padding-left` + `padding-right`;
  - evitar reglas duplicadas;
  - no agregar bloques largos si se puede editar reglas existentes.
- El navegador interno puede servir para validar visualmente, pero si el canal de texto falla, se puede guardar una captura temporal y revisarla localmente. No dejar PNGs temporales en el repo.
- Si el dev server esta levantado en Visual Studio, los cambios de SCSS se reflejan rapido; aun asi, la build final sigue siendo obligatoria.

---

## Criterio para la siguiente instancia

Si el usuario dice "se ve fatal", "hay scroll horizontal", "se corta", "queda raro en HD/tablet", no empezar por retocar margenes a ciegas.

Orden correcto:

1. Identificar si el problema es:
   - sidebar/layout global;
   - tabla;
   - modal/drawer;
   - formulario;
   - acciones/botones;
   - datos largos.
2. Revisar si ya existe un patron validado arriba.
3. Proteger Full HD.
4. Corregir el comportamiento base antes de maquillar la visual.
5. Validar con captura o navegador interno.
6. Compilar.

La mejor solucion en este proyecto casi siempre fue una mezcla de:

- prioridad de informacion;
- compactacion inteligente;
- hover/focus controlado;
- iconos con tooltip;
- scroll interno bien delimitado;
- campos visibles pero deshabilitados cuando el rol/equipo no los edita.
