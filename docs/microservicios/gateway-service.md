# gateway-service

Documento tecnico de endpoints propios del gateway. No repite rutas proxy hacia otros microservicios; solo documenta presencia online y monitoreo operativo construido en gateway.

## Notas generales

- Base funcional: endpoints propios bajo `/presence` y `/monitor`.
- Autenticacion: todos requieren `Authorization: Bearer <token>`, salvo rutas publicas de infraestructura o documentacion.
- Redis: presencia guarda claves temporales por empleado y por rol. El TTL configurado es `presence.ttl`; por default es `90s`.
- El patron heartbeat aplica a todos los empleados autenticados. Si el frontend no renueva heartbeat, el usuario desaparece de los listados conectados cuando vence el TTL.
- `GATE-07`, `GATE-08` y `GATE-09` enriquecen presencia Redis con estados de asistencia desde `schedule-service`.
- Los endpoints de monitoreo aceptan `fecha` opcional. Si no se envia, el calculo queda a criterio del backend integrado.
- El gateway tambien expone el WebSocket realtime de leads en `/leads/ws/leads`; el contrato funcional esta documentado en `lead-service-realtime.md`.

## GATE-01 registrarEmpleadosOnline

- Metodo/ruta: `POST /presence/online`
- Permiso: usuario autenticado.
- Uso frontend: registrar al empleado como conectado despues de un login exitoso o al reconstruir una sesion valida.
- Efecto: crea o renueva presencia del empleado autenticado en Redis, con `status=ONLINE`, `disponibilidad=DISPONIBLE`, roles actuales y `lastSeen`.
- Respuesta: `200 OK` sin body.

## GATE-02 heartbeat

- Metodo/ruta: `POST /presence/heartbeat`
- Permiso: usuario autenticado.
- Uso frontend: renovar periodicamente el TTL de presencia.
- Efecto: reutiliza el registro online, actualiza `lastSeen`, reescribe la presencia del empleado y renueva sus indices por rol.
- Cadencia sugerida frontend: cada `30s` o `45s`, siempre menor al TTL configurado.
- Regla: si no se llama antes de que venza el TTL, Redis expira la presencia y el empleado deja de aparecer conectado.
- Regla: si la presencia ya expiro, llamar este endpoint vuelve a registrar al empleado online porque usa la misma logica de `GATE-01`.
- Impacto: afecta directamente a `GATE-05`, `GATE-06`, `GATE-07`, `GATE-08` y `GATE-09`.
- Manejo de fallos: ante errores temporales de red, el frontend puede reintentar mientras el token siga valido; ante `401`, debe detener el heartbeat y volver al flujo de acceso.
- Respuesta: `200 OK` sin body.

## GATE-03 desconectarEmpleadoOffline

- Metodo/ruta: `POST /presence/offline`
- Permiso: usuario autenticado.
- Uso frontend: marcar offline al cerrar sesion o salir de la aplicacion de forma controlada.
- Efecto: elimina presencia del empleado y lo remueve de indices Redis globales y por rol.
- Respuesta: `204 No Content`.

## GATE-04 actualizarDisponibilidad

- Metodo/ruta: `PATCH /presence/disponibilidad/{disponibilidad}`
- Permiso: usuario autenticado.
- Path params: `disponibilidad`.
- Uso frontend: cambiar disponibilidad operativa del empleado conectado.
- Reglas: el empleado debe tener presencia activa en Redis; si no existe, responde `404`.
- Respuesta: `204 No Content`.

## GATE-05 listarUsuariosConectados

- Metodo/ruta: `GET /presence/connected-users`
- Permiso: usuario autenticado.
- Query params: `role` opcional, por ejemplo `ASESOR_VENTAS`.
- Uso frontend: listar empleados conectados, opcionalmente filtrados por rol.
- Respuesta: lista de `ConnectedUserResponse`.
- Campos principales: `empleadoId`, `nombreCompleto`, `roles`, `status`, `disponibilidad`, `lastSeen`.
- Regla: limpia indices huerfanos si encuentra IDs sin presencia activa.

## GATE-06 estaConectado

- Metodo/ruta: `GET /presence/connected-users/{empleadoId}`
- Permiso: usuario autenticado.
- Path params: `empleadoId`.
- Uso frontend: validar si un empleado puntual mantiene presencia activa.
- Respuesta: `empleadoId`, `conectado`.

## GATE-07 listarAsesoresConectadosGtr

- Metodo/ruta: `GET /monitor/gtr/asesores-ventas/conectados`
- Permiso: `READ_LEADS_GTR`.
- Query params: `fecha` opcional.
- Uso frontend: mostrar asesores de ventas conectados para apoyar decisiones de asignacion GTR.
- Respuesta: lista ordenada por `nombreCompleto`.
- Campos principales: `empleadoId`, `nombreCompleto`, `disponibilidad`, `lastSeen`, `estadoSchedule`, `desde`, `esperadoHoy`, `operativo`.
- Regla: solo considera conectados con rol `ASESOR_VENTAS` y enriquece con estado operativo de `schedule-service`.

## GATE-08 listarAsesoresConectadosSupervisor

- Metodo/ruta: `GET /monitor/supervisor-ventas/asesores-ventas/conectados`
- Permiso: `READ_LEADS_SUPERVISOR_VENTAS_RESUMEN`.
- Query params: `fecha` opcional.
- Uso frontend: monitorear asesores conectados con informacion operativa ampliada.
- Respuesta: lista ordenada por `nombreCompleto`.
- Campos principales: `empleadoId`, `nombreCompleto`, `roles`, `disponibilidad`, `lastSeen`, `estadoSchedule`, `desde`, `entradaProgramada`, `esperadoHoy`, `tieneRegistroHoy`, `operativo`, `minutosServiciosEnCurso`, `minutosServiciosAcumulados`, `minutosServiciosPermitidos`, `excedioServicios`.
- Regla: cruza presencia Redis de asesores conectados con estados de asistencia de `schedule-service`.

## GATE-09 listarAsesoresEsperadosNoConectados

- Metodo/ruta: `GET /monitor/supervisor-ventas/asesores-ventas/esperados-no-conectados`
- Permiso: `READ_LEADS_SUPERVISOR_VENTAS_RESUMEN`.
- Query params: `fecha` opcional.
- Uso frontend: detectar asesores que deberian estar operativos pero no aparecen conectados.
- Respuesta: lista ordenada por `nombreCompleto`.
- Campos principales: `empleadoId`, `nombreCompleto`, `roles`, `fecha`, `entradaProgramada`, `conectado`, `tieneHorarioVigente`, `laborableHoy`, `esperadoHoy`, `tieneRegistroHoy`, `estadoSchedule`.
- Regla: cruza asesores activos por rol desde `auth-service`, presencia Redis y estados de `schedule-service`; filtra solo `esperadoHoy=true` y `conectado=false`.

## GATE-10 leadRealtimeWebSocket

- Protocolo/ruta: `WebSocket STOMP /leads/ws/leads`.
- Permiso: handshake publico en gateway; autenticacion real en el frame STOMP `CONNECT` con `Authorization: Bearer <token>`.
- Destino interno: `/ws/leads` en `lead-service`.
- Variable de destino: `LEAD_SERVICE_WS_URI`, default `ws://lead-service:8083`.
- Uso frontend: escuchar cambios realtime de leads para refrescar bandejas y detalles sin polling manual.
- Topics principales: `/topic/leads`, `/topic/leads/etapa/{ETAPA}`, `/topic/leads/asesor/{idAsesor}`.
- Regla: el frontend debe usar el evento como senal de invalidacion y volver a consultar la bandeja o detalle afectado.
- Contrato completo: ver `lead-service-realtime.md`.
