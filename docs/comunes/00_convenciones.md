# Convenciones de documentacion backend

Este bloque define reglas comunes para no repetir la misma explicacion en cada endpoint.

## IDs de endpoints

Cada endpoint documentado tiene un ID estable:

- `AUTH-XX`: `auth-service`
- `REC-XX`: `recruitment-service`
- `RRHH-XX`: `rrhh-service`
- `SCH-XX`: `schedule-service`
- `LEAD-XX`: `lead-service`

Los documentos por rol deben referenciar estos IDs. No deben copiar el contrato completo del endpoint salvo que una regla del flujo lo necesite.

## Paginacion comun

Cuando una ficha diga `usa paginacion comun`, el endpoint acepta:

- `pageNumber`: integer, opcional, default `0`, minimo `0`.
- `pageSize`: integer, opcional, default `8`, minimo `1`, maximo `100`.
- `sortBy`: string, opcional. El default depende del microservicio o endpoint.
- `direction`: string, opcional. Normalmente `asc` o `desc`.

La respuesta paginada usa `PageResponse<T>`. Frontend debe tratarla como una pagina de datos, no como una lista plana.

Defaults conocidos:

- `recruitment-service`: `sortBy=createdAt`, `direction=asc`.
- `rrhh-service`: `sortBy=createdAt`, `direction=asc`.
- `schedule-service`: `sortBy=fechaInicio`, `direction=desc`.

Si un endpoint permite solo ciertos campos de orden, la ficha lo declara.

## Permisos

Cada ficha incluye `Permiso`. Sirve para detectar integraciones que podrian terminar en `403`.

El documento por rol no necesita repetir permisos si ya referencia el endpoint. Si un flujo depende de un permiso sensible, se puede mencionar como advertencia operativa.

## Cache

La cache no se repite por endpoint cuando no cambia el comportamiento observable para frontend.

Regla practica:

- Si la cache solo optimiza lectura, se documenta una vez en la nota del microservicio.
- Si la cache puede afectar frescura de datos, invalidacion o decisiones de UI, se menciona en la ficha del endpoint.

En `recruitment-service`, `listarOfertasActivas` y catalogos de tipificacion usan cache Redis. Para frontend, el contrato HTTP no cambia.

## Errores comunes

Estructura general esperada:

- `400`: request invalido, parametros invalidos o regla de negocio incumplida.
- `401`: token ausente, invalido o sesion no autenticada.
- `403`: usuario autenticado sin permiso requerido.
- `404`: recurso no encontrado.
- `409`: conflicto de negocio o integridad.
- `422`: entidad valida a nivel de formato, pero incompleta o no procesable para la operacion.

Los mensajes concretos pueden variar por microservicio. La ficha solo documenta errores relevantes para decisiones de frontend.

## Regla de mantenimiento

Cuando cambie backend y el cambio afecte contrato API, permisos, defaults, validaciones, efectos laterales o flujo operativo, se debe actualizar la documentacion afectada en el mismo trabajo.

No se debe duplicar informacion:

- contrato tecnico: documentos de `microservicios`;
- flujo comun de empleado: documentos de `comunes`;
- flujo especifico de rol: documentos de `roles`.
