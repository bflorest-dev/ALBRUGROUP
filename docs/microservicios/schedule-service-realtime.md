# schedule-service realtime

Este documento describe la capa WebSocket/STOMP agregada a `schedule-service` para propagar cambios de asistencia y cambios de horario que afectan el monitoreo operativo.

## Resumen tecnico

- `schedule-service` expone WebSocket/STOMP en `/ws/asistencia`.
- La conexion STOMP exige JWT en el header nativo `Authorization`.
- El backend publica eventos solo despues de commit exitoso.
- El evento realtime no reemplaza los endpoints REST de monitoreo; funciona como senal de invalidacion.
- `gateway-service` expone la ruta `/schedule/ws/asistencia` y reenvia el trafico WebSocket a `schedule-service`.

## Conexion

Conexion recomendada por `gateway-service`:

```text
ws(s)://<gateway-host>/schedule/ws/asistencia
```

Header STOMP `CONNECT` requerido:

```text
Authorization: Bearer <token>
```

Conexion directa a `schedule-service` solo para pruebas aisladas:

```text
ws://<schedule-host>:8085/ws/asistencia
```

Regla importante:

- En navegador, `Authorization` viaja dentro del frame STOMP `CONNECT`, no como header HTTP del handshake WebSocket.
- Por eso `gateway-service` permite el handshake `/schedule/ws/**` y `schedule-service` valida el JWT al recibir el `CONNECT`.

## Topics

- `/topic/asistencia/monitor`: recibe todos los cambios de asistencia y horario que afectan monitoreo.
- `/topic/asistencia/empleado/{idEmpleado}`: recibe cambios que afectan a un empleado especifico.

## Contrato del evento

Payload publicado:

- `tipo`
- `origen`
- `idEmpleado`
- `fecha`
- `estadoActual`
- `estadoAnterior`
- `desde`
- `tieneHorarioVigente`
- `laborableHoy`
- `esperadoHoy`
- `operativo`
- `occurredAt`

Semantica:

- `tipo` indica la clase de cambio publicada por backend.
- `origen` identifica el flujo que produjo el cambio.
- `fecha` representa la fecha operativa impactada.
- `estadoActual` y `estadoAnterior` sirven para razonamiento rapido, pero no reemplazan una reconsulta REST.
- `tieneHorarioVigente`, `laborableHoy`, `esperadoHoy` y `operativo` reflejan el estado monitor resultante al momento de publicar.

## Tipos publicados

Tipos principales:

- `ASISTENCIA_REGISTRO_CREADO`
- `ASISTENCIA_ESTADO_CAMBIADO`
- `HORARIO_AFECTADO`
- `EXCEPCION_HORARIO_AFECTADA`

Origenes principales:

- `INGRESO`
- `SALIDA`
- `ALMUERZO_INICIO`
- `ALMUERZO_FIN`
- `SERVICIOS_INICIO`
- `SERVICIOS_FIN`
- `HORARIO`
- `EXCEPCION`

## Flujos que publican

Flujos de asistencia:

- `SCH-01` registra ingreso y publica `ASISTENCIA_REGISTRO_CREADO`.
- `SCH-02` registra salida y publica `ASISTENCIA_ESTADO_CAMBIADO`.
- `SCH-03` inicia almuerzo y publica `ASISTENCIA_ESTADO_CAMBIADO`.
- `SCH-04` finaliza almuerzo y publica `ASISTENCIA_ESTADO_CAMBIADO`.
- `SCH-05` inicia servicios y publica `ASISTENCIA_ESTADO_CAMBIADO`.
- `SCH-06` finaliza servicios y publica `ASISTENCIA_ESTADO_CAMBIADO`.

Flujos de horario:

- `SCH-09` publica `HORARIO_AFECTADO`.
- `SCH-10` publica `HORARIO_AFECTADO`.
- `SCH-11` publica `HORARIO_AFECTADO`.
- `SCH-12` publica `EXCEPCION_HORARIO_AFECTADA`.
- `SCH-13` publica `EXCEPCION_HORARIO_AFECTADA`.
- `SCH-14` publica `EXCEPCION_HORARIO_AFECTADA`.

## Relacion con monitoreo REST

El backend mantiene este criterio:

- realtime invalida;
- REST reconstruye;
- `SCH-20` sigue siendo la fuente de lectura de estados monitor;
- `GATE-07`, `GATE-08` y `GATE-09` siguen enriqueciendose por REST desde `schedule-service`.

Esto evita duplicar DTOs enriquecidos dentro del broker y mantiene una sola logica de calculo para el monitor.

## Casos de uso esperados

- Un cambio de `ONLINE` a `ALMUERZO` debe invalidar paneles de monitoreo y listados enriquecidos.
- Un cambio de `SERVICIOS` a `ONLINE` debe invalidar estados operativos y tiempos en curso.
- Registrar o eliminar una excepcion del dia debe invalidar vistas donde `esperadoHoy` o `laborableHoy` dependan de esa programacion.
- Reemplazar o finalizar un horario debe invalidar el monitor del empleado en la fecha operativa afectada.

## Regla de consumo

El evento realtime debe usarse como senal de invalidacion:

- no se debe reconstruir una vista critica solo con el payload del broker;
- al recibir el evento, el consumidor debe volver a consultar el endpoint REST que ya representa su vista;
- si la vista observa una fecha distinta, puede ignorar eventos cuya `fecha` no coincida con el filtro activo.
