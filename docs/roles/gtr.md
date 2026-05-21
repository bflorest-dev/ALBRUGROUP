# Rol GTR

Documento operativo del rol GTR. No define pantallas ni componentes visuales. Separa responsabilidades y flujos para que luego puedan traducirse a vistas, formularios, modales o paneles de asignacion.

## Flujos comunes heredados

GTR tambien es empleado. Por eso hereda los flujos comunes de:

- acceso: ver `/(docs)/01_empleado_base`, bloque `Flujo comun: acceso`;
- presencia online: ver `/(docs)/01_empleado_base`, bloque `Flujo comun: presencia online y heartbeat`;
- marcaciones de asistencia: ver `/(docs)/01_empleado_base`, bloque `Flujo comun: marcaciones de asistencia`.

El documento de GTR no repite esos pasos porque no son propios del rol.

## Relacion con Asesor Ventas

GTR debe tener todos los permisos funcionales de Asesor Ventas. Esto es un requerimiento operativo: si hay mucha demanda, GTR puede gestionar directamente un lead como lo haria un asesor.

En terminos de frontend y backend, GTR debe poder ejecutar tambien los flujos de `/(docs)/asesor_ventas`:

- bandeja personal;
- detalle de lead;
- registro de contacto;
- actualizacion de datos de preventa;
- actualizacion de direccion;
- actualizacion de oferta comercial;
- tipificacion de preventa.

Permisos minimos heredados del rol Asesor Ventas:

- `READ_LEADS_ASESOR`;
- `CONTACT_LEADS`;
- `UPDATE_LEADS_ASESOR`;
- `TYPIFY_LEADS`;
- `READ_TIPIFICACIONES_PREVENTA`;
- permisos de catalogos usados durante gestion, como planes, promociones, zonas y ubigeo.

## Responsabilidad del rol

GTR controla el ingreso y distribucion de leads en preventa. Puede registrar leads, enriquecer datos iniciales, revisar bandejas operativas, asignar leads a asesores y tomar gestion directa cuando sea necesario.

Responsabilidades principales:

- registrar leads entrantes;
- completar snapshots iniciales;
- revisar bandeja GTR;
- revisar leads agendados;
- revisar asesores conectados y operativos;
- asignar leads individual o masivamente;
- consultar detalle de lead asignado;
- gestionar leads directamente usando las capacidades de Asesor Ventas.

## Flujo 1: preparacion de catalogos

Objetivo: tener datos listos para registrar, clasificar y asignar leads.

Secuencia:

1. Listar campanas con `LEAD-11`.
2. Cargar catalogo de tipificaciones de `PREVENTA` con `LEAD-26`.
3. Listar proveedores con `LEAD-02`.
4. Listar asesores disponibles para asignacion con `AUTH-09`, usando puesto `ASESOR_VENTAS`.

Reglas operativas:

- `LEAD-11` permite elegir campana al registrar lead.
- `LEAD-26` permite entender estados operativos como `AGENDADO`.
- `AUTH-09` es la fuente recomendada para seleccionar asesores activos por rol.
- `GATE-07` es la fuente recomendada para saber que asesores estan conectados y operativos en tiempo real.
- Si existe una vista abierta de asesores conectados, conviene invalidarla con `/topic/asistencia/monitor` y reconstruirla via `GATE-07`.
- Si el frontend usa otro catalogo de empleados activos, debe garantizar que solo se asignen asesores validos.
- Conectado no reemplaza activo: para asignar con confianza, el asesor debe existir como usuario activo y tambien aparecer operativo si la decision depende de disponibilidad inmediata.

Documentacion tecnica:

- Ver `/(docs)/lead-service`.
- Ver `/(docs)/auth-service`.
- Ver `/(docs)/gateway-service`.
- Ver `/(docs)/schedule-service-realtime`.

## Flujo 2: asesores conectados para asignacion

Objetivo: priorizar asesores disponibles antes de distribuir leads.

Secuencia:

1. Consultar `GATE-07`.
2. Revisar `disponibilidad`, `lastSeen`, `estadoSchedule`, `esperadoHoy` y `operativo`.
3. Seleccionar un asesor conectado y operativo cuando la asignacion requiera atencion inmediata.
4. Ejecutar la asignacion con `LEAD-31` o `LEAD-32`.

Reglas operativas:

- `GATE-07` no asigna leads; solo ayuda a decidir a quien asignar.
- Si un asesor no aparece conectado, puede seguir siendo usuario activo, pero no conviene priorizarlo para demanda inmediata.
- Si `operativo=false`, revisar el estado de asistencia antes de asignarle carga urgente.
- El resultado depende de que el asesor tenga presencia online activa mediante `GATE-01` y `GATE-02`.
- Un cambio realtime de asistencia debe invalidar el listado y forzar nueva lectura de `GATE-07` si la vista sigue abierta.

Documentacion tecnica:

- Ver `/(docs)/gateway-service`.
- Ver `/(docs)/lead-service`.
- Ver `/(docs)/schedule-service-realtime`.

## Flujo 3: crear o reingresar lead

Objetivo: registrar un lead nuevo o reingresar uno existente.

Secuencia:

1. Seleccionar campana activa.
2. Ejecutar `LEAD-27` con `prefijo`, `lead`, `idCampana` y `base`.
3. Si se detectan datos utiles iniciales, ejecutar `LEAD-28`.
4. Revisar bandeja con `LEAD-29`.

Reglas operativas:

- `LEAD-27` no falla por duplicidad normal: si el lead ya existe, lo reingresa.
- Si el lead existente esta en `PREVENTA`, el backend limpia asignacion y tipificacion y lo deja `NUEVO`.
- `LEAD-28` solo permite snapshots si todavia no existen las entidades completas de preventa o direccion.
- Los snapshots no reemplazan los datos completos que luego gestiona el asesor.

Documentacion tecnica:

- Ver `/(docs)/lead-service`.

## Flujo 4: bandeja GTR

Objetivo: revisar leads registrados y gestionables del dia.

Secuencia:

1. Consultar `LEAD-29`.
2. Enviar `fecha` si se necesita revisar otro dia.
3. Ordenar o filtrar usando campos permitidos.
4. Abrir detalle con `LEAD-33` solo cuando GTR gestione como asesor y el lead este asignado a GTR.

Reglas operativas:

- Si `fecha` no se envia, backend usa fecha actual.
- La bandeja GTR es para control y asignacion, no necesariamente para editar datos completos.
- Para gestionar como asesor, GTR debe tener el lead asignado a su propio `empleadoId`.
- Si el frontend implementa realtime, conviene suscribirse a `/topic/leads/etapa/PREVENTA` y usar cada evento como senal para refrescar la bandeja GTR o los agendados visibles.

Documentacion tecnica:

- Ver `/(docs)/lead-service`.
- Ver `/(docs)/lead-service-realtime`.

## Flujo 5: leads agendados

Objetivo: recuperar leads tipificados como `AGENDADO` para reasignacion o nueva gestion.

Secuencia:

1. Consultar `LEAD-30`.
2. Revisar `horaProgramada`.
3. Asignar nuevamente con `LEAD-31` o `LEAD-32`.

Reglas operativas:

- Los agendados vienen de tipificaciones previas de preventa.
- `horaProgramada` solo existe para tipificacion `AGENDADO`.
- Reasignar limpia tipificacion/subtipificacion y vuelve el lead a `ASIGNADO`.
- Si la vista de agendados esta abierta, un evento realtime de `PREVENTA` debe invalidar el listado actual para detectar reasignaciones o salidas de la bandeja.

Documentacion tecnica:

- Ver `/(docs)/lead-service`.
- Ver `/(docs)/lead-service-realtime`.

## Flujo 6: asignacion de leads

Objetivo: distribuir leads a asesores de ventas.

Secuencia individual:

1. Seleccionar asesor desde `AUTH-09` y, si importa disponibilidad inmediata, confirmar presencia con `GATE-07`.
2. Ejecutar `LEAD-31`.
3. Refrescar `LEAD-29` o `LEAD-30`.

Secuencia masiva:

1. Seleccionar varios leads.
2. Seleccionar asesor desde `AUTH-09` y, si importa disponibilidad inmediata, confirmar presencia con `GATE-07`.
3. Ejecutar `LEAD-32`.
4. Revisar resultados por lead.

Reglas operativas:

- No se debe asignar un lead a un asesor que ya lo gestiono antes.
- La asignacion masiva puede tener resultados parciales.
- Frontend debe mostrar fallidos y asignados por separado cuando usa `LEAD-32`.
- Al asignar, el backend deja el lead `ASIGNADO` y limpia tipificacion/subtipificacion previa.

Documentacion tecnica:

- Ver `/(docs)/lead-service`.
- Ver `/(docs)/auth-service`.
- Ver `/(docs)/gateway-service`.

## Flujo 7: gestion directa como asesor

Objetivo: permitir que GTR gestione leads cuando la demanda lo requiera.

Secuencia:

1. Asignar el lead al propio GTR con `LEAD-31` o `LEAD-32`.
2. Continuar con el flujo de `/(docs)/asesor_ventas`.
3. Registrar contacto con `LEAD-35`.
4. Completar datos con `LEAD-36`, `LEAD-37` y `LEAD-38`.
5. Tipificar con `LEAD-39`.

Reglas operativas:

- GTR no debe saltarse la asignacion si va a usar endpoints de asesor; esos endpoints validan el empleado autenticado.
- Para que esto funcione, GTR debe tener todos los permisos de Asesor Ventas.
- La gestion directa de GTR debe producir los mismos eventos que la gestion de un asesor.

Documentacion tecnica:

- Ver `/(docs)/asesor_ventas`.
- Ver `/(docs)/lead-service`.

## Orden operativo sugerido

Para operacion normal:

1. `LEAD-11`, `LEAD-26`, `LEAD-02` y `AUTH-09` para catalogos.
2. `GATE-07` para revisar asesores conectados si la asignacion depende de disponibilidad real.
3. `LEAD-27` para registrar o reingresar lead.
4. `LEAD-28` para snapshots iniciales si aplica.
5. `LEAD-29` para bandeja diaria.
6. `LEAD-31` o `LEAD-32` para asignar.
7. `LEAD-30` para recuperar agendados.

Para alta demanda:

1. Asignar lead al propio GTR.
2. Ejecutar flujo completo de `/(docs)/asesor_ventas`.

## Limites del rol

GTR no mantiene catalogos comerciales de Community. Puede usar campanas, proveedores, planes, promociones y zonas como soporte de gestion, pero su responsabilidad principal es ingreso, control y asignacion de leads.

## Criterio para frontend futuro

Este documento debe permitir entender responsabilidades y flujos. No debe decidir si se implementa como cola diaria, bandeja, tablero, modal de asignacion o vista de detalle.
