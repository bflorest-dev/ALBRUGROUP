# Rol Asesor Ventas

Documento operativo del rol Asesor Ventas. No define pantallas ni componentes visuales. Separa responsabilidades y flujos para que luego puedan traducirse a vistas, formularios, modales o paneles de gestion.

## Flujos comunes heredados

Asesor Ventas tambien es empleado. Por eso hereda los flujos comunes de:

- acceso: ver `/(docs)/01_empleado_base`, bloque `Flujo comun: acceso`;
- marcaciones de asistencia: ver `/(docs)/01_empleado_base`, bloque `Flujo comun: marcaciones de asistencia`.

El documento de Asesor Ventas no repite esos pasos porque no son propios del rol.

## Responsabilidad del rol

Asesor Ventas gestiona individualmente leads asignados en etapa `PREVENTA`. Su trabajo es contactar, completar informacion, seleccionar oferta comercial y tipificar el resultado.

Responsabilidades principales:

- consultar leads asignados;
- revisar detalle del lead;
- registrar contacto;
- completar datos de preventa;
- completar direccion;
- seleccionar plan, promociones y adicionales;
- tipificar el lead segun catalogo de preventa.

## Flujo 1: bandeja personal

Objetivo: ver los leads asignados al asesor autenticado.

Secuencia:

1. Cargar bandeja personal con `LEAD-34`.
2. Abrir detalle de un lead con `LEAD-33`.
3. Consultar historial o datos del detalle si el frontend lo expone desde la respuesta.

Reglas operativas:

- `LEAD-34` devuelve leads del asesor autenticado, no de otros asesores.
- La bandeja se limita a leads pendientes de gestion en preventa.
- El detalle tambien valida pertenencia al asesor autenticado.
- Si el frontend implementa realtime, debe suscribirse al menos a `/topic/leads/asesor/{empleadoId}` para refrescar bandeja y detalle cuando el asesor recibe una asignacion o cambia uno de sus leads.

Documentacion tecnica:

- Ver `/(docs)/lead-service`.
- Ver `/(docs)/lead-service-realtime`.

## Flujo 2: catalogos para gestionar el lead

Objetivo: cargar datos auxiliares necesarios para completar la gestion.

Secuencia:

1. Cargar catalogo de tipificaciones de `PREVENTA` con `LEAD-26`.
2. Cargar planes con `LEAD-15`.
3. Cargar promociones con `LEAD-20`.
4. Cargar zonas con `LEAD-23` si se necesita contexto comercial por zona.
5. Cargar ubigeo con `LEAD-40`, `LEAD-41` y `LEAD-42`.

Reglas operativas:

- Para tipificar, frontend debe usar el catalogo de `PREVENTA`.
- Para oferta comercial, conviene usar planes vigentes y promociones activas.
- La promocion interna siempre depende de un plan seleccionado.

Documentacion tecnica:

- Ver `/(docs)/lead-service`.

## Flujo 3: contacto con el lead

Objetivo: registrar que el asesor realizo una llamada o contacto operativo.

Secuencia:

1. Abrir lead desde `LEAD-34`.
2. Ejecutar `LEAD-35` cuando se realiza el contacto.
3. Continuar completando datos o tipificar segun resultado.

Reglas operativas:

- Solo se puede registrar contacto si el lead esta `ASIGNADO` o `EN_GESTION`.
- Si el lead estaba `ASIGNADO`, el contacto lo pasa a `EN_GESTION`.
- Este endpoint registra evento; no reemplaza la tipificacion.

Documentacion tecnica:

- Ver `/(docs)/lead-service`.

## Flujo 4: completar informacion del lead

Objetivo: completar los datos necesarios para que el lead pueda avanzar.

Secuencia:

1. Completar datos de preventa con `LEAD-36`.
2. Completar direccion con `LEAD-37`.
3. Seleccionar oferta comercial con `LEAD-38`.
4. Revisar detalle con `LEAD-33` si se necesita confirmar informacion.

Reglas operativas:

- Los tres bloques pueden completarse progresivamente.
- Actualizar cualquiera de estos bloques puede mover el lead a `EN_GESTION`.
- Para avanzar a `VENTA`, el backend exige datos de preventa, direccion y plan.
- En preventa completa se vuelven obligatorios campos adicionales que pueden no estar anotados como obligatorios en el request inicial, como titular, celular, correo, via, referencia y tipo de domicilio.

Documentacion tecnica:

- Ver `/(docs)/lead-service`.

## Flujo 5: oferta comercial

Objetivo: asociar al lead una propuesta comercial valida.

Secuencia:

1. Listar planes con `LEAD-15`.
2. Listar promociones con `LEAD-20`.
3. Listar adicionales si se requiere con `LEAD-13`.
4. Guardar oferta con `LEAD-38`.

Reglas operativas:

- El plan debe estar activo y vigente.
- No se puede seleccionar promocion interna sin plan.
- La promocion debe aplicar al plan seleccionado y pertenecer al mismo proveedor.
- Los adicionales se envian como `idAdicional` y `cantidad`.

Documentacion tecnica:

- Ver `/(docs)/lead-service`.

## Flujo 6: tipificacion

Objetivo: registrar resultado de gestion y cerrar o mover el lead.

Secuencia:

1. Cargar catalogo con `LEAD-26`.
2. Elegir `codigoTipificacion` y `codigoSubtipificacion`.
3. Si la tipificacion es `AGENDADO`, enviar `horaProgramada`.
4. Ejecutar `LEAD-39`.
5. Si la subtipificacion mueve a `VENTA`, asegurarse antes de que el lead tenga preventa, direccion y oferta completas.

Reglas operativas:

- `horaProgramada` es obligatoria solo para `AGENDADO`.
- `horaProgramada` no debe enviarse para otras tipificaciones.
- Al tipificar, el backend registra evento.
- Si la tipificacion gestiona o mueve el lead, se limpia la asignacion al asesor.
- Frontend no debe inventar codigos de tipificacion ni subtipificacion.

Documentacion tecnica:

- Ver `/(docs)/lead-service`.

## Orden operativo sugerido

Para gestion diaria:

1. `LEAD-34` para bandeja personal.
2. `LEAD-33` para detalle.
3. `LEAD-35` para registrar contacto.
4. `LEAD-36`, `LEAD-37` y `LEAD-38` para completar informacion.
5. `LEAD-39` para tipificar resultado.

## Limites del rol

Asesor Ventas no crea leads nuevos, no asigna leads a otros asesores y no mantiene catalogos comerciales. Esos flujos pertenecen a GTR o Community.

## Criterio para frontend futuro

Este documento debe permitir entender responsabilidades y flujos. No debe decidir si se implementa como tablero, tabla, wizard, modal o vista de detalle.
