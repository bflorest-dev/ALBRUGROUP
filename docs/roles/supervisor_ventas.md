# Rol Supervisor Ventas

Documento operativo del rol Supervisor Ventas. No define pantallas ni componentes visuales. Separa responsabilidades y flujos para que luego puedan traducirse a vistas, paneles, tableros o modales de supervision.

## Flujos comunes heredados

Supervisor Ventas tambien es empleado. Por eso hereda los flujos comunes de:

- acceso: ver `/(docs)/01_empleado_base`, bloque `Flujo comun: acceso`;
- presencia online: ver `/(docs)/01_empleado_base`, bloque `Flujo comun: presencia online y heartbeat`;
- marcaciones de asistencia: ver `/(docs)/01_empleado_base`, bloque `Flujo comun: marcaciones de asistencia`.

El documento de Supervisor Ventas no repite esos pasos porque no son propios del rol.

## Relacion con Asesor Ventas

Supervisor Ventas tambien puede gestionar leads como un `ASESOR_VENTAS`. Esto implica que, ademas de supervisar, debe poder ejecutar el flujo completo documentado en `/(docs)/asesor_ventas` cuando la operacion lo requiera.

Permisos funcionales heredados que debe tener:

- `READ_LEADS_ASESOR`;
- `CONTACT_LEADS`;
- `UPDATE_LEADS_ASESOR`;
- `TYPIFY_LEADS`;
- `READ_TIPIFICACIONES_PREVENTA`;
- permisos de catalogos de planes, promociones, zonas y ubigeo.

## Responsabilidad del rol

Supervisor Ventas controla el trabajo de los asesores en preventa. Su foco es ver resumenes, entrar a la bandeja de un asesor especifico y, si hace falta, gestionar directamente como asesor.

Responsabilidades principales:

- ver resumen operativo por asesor;
- ver asesores conectados y ausencias online esperadas;
- revisar la bandeja de un asesor determinado;
- detectar carga, pendientes o cuellos de botella;
- entrar al flujo de gestion individual cuando necesite reemplazar o apoyar a un asesor.

## Flujo 1: resumen de supervision

Objetivo: tener una vista agregada del estado comercial de preventa por asesor.

Secuencia:

1. Consultar `LEAD-44`.
2. Filtrar por `idsAsesor` si se quiere revisar solo un subconjunto.
3. Detectar asesores con sobrecarga, baja gestion o necesidades de apoyo.

Reglas operativas:

- `LEAD-44` es un endpoint de supervision, no de gestion individual.
- Cuando no se envian asesores, el backend resume todos los asesores considerados en el corte.
- Este endpoint sirve para decidir en que bandejas entrar, no para editar leads.
- Si el frontend implementa realtime, conviene suscribirse a `/topic/leads/etapa/PREVENTA` y tratar cada evento como senal para refrescar resumen y bandejas abiertas de supervision.

Documentacion tecnica:

- Ver `/(docs)/lead-service`.
- Ver `/(docs)/lead-service-realtime`.

## Flujo 2: bandeja por asesor

Objetivo: inspeccionar la bandeja de preventa de un asesor especifico.

Secuencia:

1. Seleccionar asesor desde el resumen o desde un catalogo operativo.
2. Consultar `LEAD-45`.
3. Revisar los leads pendientes del asesor.
4. Decidir si basta con supervision o si el supervisor debe gestionar directamente.

Reglas operativas:

- `LEAD-45` expone la misma base de leads pendientes del asesor, pero accesible desde supervisor.
- Es el puente entre supervision agregada y seguimiento caso por caso.
- Si el supervisor necesita modificar un lead, debe pasar al flujo de gestion directa como asesor.

Documentacion tecnica:

- Ver `/(docs)/lead-service`.

## Flujo 3: monitoreo de asesores conectados

Objetivo: conocer que asesores de ventas estan conectados y en que estado operativo se encuentran.

Secuencia:

1. Consultar `GATE-08`.
2. Revisar `disponibilidad`, `lastSeen`, `estadoSchedule`, `entradaProgramada`, `operativo` y datos de servicios.
3. Cruzar esta informacion con `LEAD-44` si se necesita comparar conexion, carga comercial y actividad.
4. Entrar a la bandeja de un asesor con `LEAD-45` cuando se detecte necesidad de seguimiento.

Reglas operativas:

- `GATE-08` no reemplaza el resumen comercial de `LEAD-44`; lo complementa con presencia y asistencia.
- `operativo=false` o `excedioServicios=true` son senales para revisar antes de asignar mas carga o exigir gestion.
- El resultado depende de que los asesores mantengan presencia activa con `GATE-01` y `GATE-02`.

Documentacion tecnica:

- Ver `/(docs)/gateway-service`.
- Ver `/(docs)/lead-service`.

## Flujo 4: asesores esperados no conectados

Objetivo: detectar asesores que deberian estar trabajando pero no aparecen conectados en Redis.

Secuencia:

1. Consultar `GATE-09`.
2. Revisar `entradaProgramada`, `tieneHorarioVigente`, `laborableHoy`, `esperadoHoy`, `tieneRegistroHoy` y `estadoSchedule`.
3. Decidir si corresponde seguimiento operativo, contacto interno o revision de marcacion.

Reglas operativas:

- `GATE-09` filtra asesores activos por rol que son esperados hoy y no estan conectados.
- No debe tratarse como baja definitiva: puede deberse a falta de heartbeat, cierre inesperado del frontend o ausencia real.
- Si `tieneRegistroHoy=true` pero `conectado=false`, el problema puede ser presencia online, no asistencia.

Documentacion tecnica:

- Ver `/(docs)/gateway-service`.
- Ver `/(docs)/schedule-service`.

## Flujo 5: gestion directa como asesor

Objetivo: permitir que Supervisor Ventas resuelva directamente un lead cuando haga falta.

Secuencia:

1. Entrar al flujo documentado en `/(docs)/asesor_ventas`.
2. Abrir la bandeja personal del supervisor como asesor con `LEAD-34`.
3. Gestionar detalle, contacto, datos, direccion, oferta y tipificacion.

Reglas operativas:

- El supervisor no deberia editar desde la bandeja de otro asesor usando endpoints de asesor, porque esos endpoints validan el empleado autenticado.
- Para gestionar como asesor, debe operar sobre leads que esten asignados a su propio `empleadoId`.
- En la practica, Supervisor Ventas hereda el flujo completo de `Asesor Ventas`.

Documentacion tecnica:

- Ver `/(docs)/asesor_ventas`.
- Ver `/(docs)/lead-service`.

## Orden operativo sugerido

1. `LEAD-44` para resumen por asesor.
2. `LEAD-45` para entrar a una bandeja especifica.
3. `GATE-08` para ver asesores conectados y estado operativo.
4. `GATE-09` para detectar asesores esperados no conectados.
5. `/(docs)/asesor_ventas` cuando el supervisor deba intervenir directamente.

## Limites del rol

Supervisor Ventas no reemplaza a GTR en ingreso o asignacion de leads. Su foco principal es supervision y apoyo operativo sobre el trabajo de preventa.

## Criterio para frontend futuro

Este documento debe permitir entender responsabilidades y flujos. No debe decidir si se implementa como dashboard ejecutivo, tabla operativa o bandeja de coaching.
