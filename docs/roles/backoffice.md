# Rol Backoffice

Documento operativo del rol Backoffice. No define pantallas ni componentes visuales. Separa responsabilidades y flujos para que luego puedan traducirse a vistas, tableros, modales o paneles de seguimiento.

## Flujos comunes heredados

Backoffice tambien es empleado. Por eso hereda los flujos comunes de:

- acceso: ver `/(docs)/01_empleado_base`, bloque `Flujo comun: acceso`;
- marcaciones de asistencia: ver `/(docs)/01_empleado_base`, bloque `Flujo comun: marcaciones de asistencia`.

El documento de Backoffice no repite esos pasos porque no son propios del rol.

## Responsabilidad del rol

Backoffice trabaja la etapa `VENTA`. Toma leads disponibles, registra contacto, corrige datos, ajusta la oferta comercial y tipifica el paso a `POSTVENTA` cuando corresponde.

Responsabilidades principales:

- revisar la bandeja general de venta;
- asignarse leads disponibles;
- revisar sus leads tomados;
- registrar contacto con el cliente;
- corregir datos personales y direccion;
- ajustar la oferta comercial una sola vez por ciclo de venta;
- tipificar el resultado de venta.

## Flujo 1: bandeja de venta

Objetivo: revisar los leads disponibles en etapa `VENTA`.

Secuencia:

1. Consultar `LEAD-46`.
2. Seleccionar un lead disponible.
3. Tomarlo para si mismo con `LEAD-48`.
4. Refrescar la bandeja o pasar a `LEAD-47`.

Reglas operativas:

- `LEAD-46` es la vista general de leads en `VENTA`.
- `LEAD-48` asigna el lead al backoffice autenticado.
- Una vez tomado, otro backoffice ya no puede apropiarse del mismo lead en ese ciclo.
- Si el frontend implementa realtime, conviene suscribirse a `/topic/leads/etapa/VENTA` para invalidar la bandeja general cuando cambia la disponibilidad de un lead.
- La bandeja general debe refrescar cuando un lead entra a `VENTA`, reingresa a `VENTA`, es tomado por un backoffice o sale de `VENTA`.
- La bandeja general no necesita refrescar por contacto o ediciones sobre un lead ya tomado, porque ese lead ya no forma parte de esta vista.

Documentacion tecnica:

- Ver `/(docs)/lead-service`.
- Ver `/(docs)/lead-service-realtime`.

## Flujo 2: mis leads de venta

Objetivo: trabajar solo los leads de venta ya asignados al backoffice autenticado.

Secuencia:

1. Consultar `LEAD-47`.
2. Abrir detalle con `LEAD-50`.
3. Consultar historial con `LEAD-51`.

Reglas operativas:

- El backend valida `idAsesorAsignado` contra el usuario autenticado para detalle e historial.
- Si el lead no esta asignado al backoffice actual, el detalle o eventos no deben abrirse.
- El frontend puede suscribirse tambien a `/topic/leads/asesor/{empleadoId}` para refrescar la bandeja propia, el detalle y el historial cuando cambia un lead asignado al backoffice autenticado.
- La bandeja propia debe refrescar cuando el lead entra por toma/asignacion, cambia por contacto o edicion, se tipifica o sale de `VENTA`.

Documentacion tecnica:

- Ver `/(docs)/lead-service`.
- Ver `/(docs)/lead-service-realtime`.

## Flujo 3: contacto y correcciones

Objetivo: continuar la gestion operativa del lead ya tomado.

Secuencia:

1. Registrar contacto con `LEAD-49`.
2. Corregir datos personales con `LEAD-52`.
3. Corregir direccion con `LEAD-53`.
4. Revisar detalle con `LEAD-50`.

Reglas operativas:

- El contacto solo se permite en estados `ASIGNADO` o `EN_GESTION`.
- Corregir datos y direccion registra eventos de actualizacion.
- El backend siempre valida que el lead este asignado al backoffice autenticado.
- Si el detalle o historial del lead estan abiertos, conviene refrescarlos ante `CONTACTO`, `DATOS_PREVENTA_ACTUALIZADOS` y `DIRECCION_ACTUALIZADA`.

Documentacion tecnica:

- Ver `/(docs)/lead-service`.

## Flujo 4: ajuste de oferta comercial

Objetivo: permitir una unica correccion comercial dentro del ciclo actual de venta.

Secuencia:

1. Cargar planes vigentes con `LEAD-15`.
2. Cargar promociones activas con `LEAD-20`.
3. Actualizar oferta con `LEAD-54`.
4. Confirmar en detalle o historial.

Reglas operativas:

- En el ciclo actual de `VENTA`, la oferta comercial solo puede actualizarse una vez.
- Un segundo intento responde conflicto.
- La promocion interna requiere plan y debe cumplir su alcance: plan si tiene planes asociados, proveedor si tiene proveedor asociado y zona si tiene zona asociada.
- Si el detalle o historial del lead estan abiertos, conviene refrescarlos tambien ante `OFERTA_COMERCIAL_ACTUALIZADA`.

Documentacion tecnica:

- Ver `/(docs)/lead-service`.

## Flujo 5: tipificacion de venta

Objetivo: registrar el resultado final de la etapa `VENTA`.

Secuencia:

1. Cargar catalogo de tipificaciones de `VENTA` con `LEAD-26`.
2. Elegir tipificacion y subtipificacion.
3. Si la subtipificacion pasa a `POSTVENTA`, enviar `fechaInstalacion`.
4. Ejecutar `LEAD-55`.

Reglas operativas:

- `LEAD-55` usa el catalogo de `VENTA`.
- Para pasar a `POSTVENTA`, el backend exige `fechaInstalacion`, plan seleccionado y proveedor con cortes de facturacion configurados.
- Si cambia de etapa, se limpia la asignacion del backoffice.
- El evento de tipificacion guarda tambien la `fechaInstalacion` cuando aplica.
- Si el lead sale de `VENTA`, debe desaparecer de la bandeja propia y dejar de estar visible en la bandeja general de venta.

Documentacion tecnica:

- Ver `/(docs)/lead-service`.

## Orden operativo sugerido

1. `LEAD-46` para bandeja general.
2. `LEAD-48` para tomar lead.
3. `LEAD-47` para bandeja propia.
4. `LEAD-50` y `LEAD-51` para detalle e historial.
5. `LEAD-49`, `LEAD-52`, `LEAD-53` y `LEAD-54` para gestion.
6. `LEAD-55` para cierre de etapa.

## Limites del rol

Backoffice no crea leads, no asigna asesores de preventa y no mantiene catalogos comerciales. Su foco empieza cuando el lead ya llego a `VENTA`.

## Criterio para frontend futuro

Este documento debe permitir entender responsabilidades y flujos. No debe decidir si se implementa como tablero de toma, cola de trabajo o vista detallada de cierre comercial.
