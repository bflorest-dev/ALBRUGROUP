# Empleado base

Este documento agrupa flujos que aplican a cualquier usuario empleado, sin importar su rol operativo.

Los documentos por rol deben referenciar este bloque en lugar de repetirlo completo.

## Flujo comun: acceso

Objetivo: permitir que el usuario entre al sistema respetando el estado real de su cuenta.

Secuencia:

1. Pedir solo `username`.
2. Consultar `AUTH-01`.
3. Si `activo=false`, bloquear acceso operativo.
4. Si `passwordInicializada=false`, enviar al flujo de inicializacion o recuperacion con `AUTH-03`.
5. Si `passwordInicializada=true`, pedir `password` y ejecutar `AUTH-02`.
6. Usar `token`, `empleadoId`, `nombreCompleto` y `roles` para contexto de sesion y enrutamiento.

Endpoints:

- `AUTH-01` consultar estado de acceso.
- `AUTH-02` login.
- `AUTH-03` inicializar o recuperar password.

Reglas para frontend:

- No tratar `AUTH-01` como autenticacion.
- No pedir password antes de conocer `passwordInicializada`.
- La password devuelta por `AUTH-03` es sensible y debe mostrarse de forma controlada.
- El token de `AUTH-02` debe enviarse como `Authorization: Bearer <token>` en los endpoints protegidos.

## Flujo comun: presencia online y heartbeat

Objetivo: mantener la presencia operativa del empleado en Redis para que otros roles puedan ver si esta conectado y disponible.

Este patron aplica a todos los empleados autenticados. No pertenece solo a asesores, GTR o Supervisor Ventas; esos roles consumen la presencia, pero cualquier empleado puede registrarse online y sostener su estado con heartbeat.

Secuencia operativa:

1. Despues de login exitoso con `AUTH-02`, registrar presencia con `GATE-01`.
2. Iniciar un intervalo de heartbeat con `GATE-02`.
3. Mantener el heartbeat mientras la sesion del frontend siga activa.
4. Si el empleado cambia su disponibilidad operativa, actualizarla con `GATE-04`.
5. Al cerrar sesion o salir de la aplicacion de forma controlada, marcar offline con `GATE-03`.

Endpoints:

- `GATE-01` registrar empleado online.
- `GATE-02` renovar heartbeat.
- `GATE-03` desconectar empleado offline.
- `GATE-04` actualizar disponibilidad.

Reglas para frontend:

- La presencia online no reemplaza el login ni la asistencia; es un estado operativo temporal.
- El heartbeat sostiene el TTL de Redis. Si no se renueva, el empleado dejara de aparecer como conectado.
- El TTL actual de presencia es `90s` por default. El frontend debe ejecutar `GATE-02` antes de que expire; una cadencia practica es cada `30s` o `45s`.
- Si un heartbeat falla por red o latencia, el frontend puede reintentar mientras el token siga siendo valido.
- Si la presencia ya expiro, llamar `GATE-02` vuelve a registrar al empleado online porque el backend reutiliza la logica de `GATE-01`.
- Si el token expira o el usuario pierde autenticacion, se debe detener el intervalo de heartbeat y volver al flujo de acceso.
- `GATE-04` requiere que el empleado ya tenga presencia activa.
- Los listados de conectados, incluidos paneles de GTR y Supervisor Ventas, dependen de esta presencia.
- `GATE-03` es cierre controlado; si no se ejecuta, Redis limpiara la presencia cuando expire el TTL.

## Flujo comun: marcaciones de asistencia

Objetivo: permitir que el empleado controle su jornada diaria.

Secuencia operativa:

1. Consultar estado del dia con `SCH-07` si se quiere reconstruir UI inicial.
2. Registrar ingreso con `SCH-01`.
3. Iniciar o finalizar almuerzo con `SCH-03` y `SCH-04`.
4. Iniciar o finalizar servicios con `SCH-05` y `SCH-06`.
5. Registrar salida con `SCH-02`.
6. Consultar calendario mensual con `SCH-08` cuando se necesite vista historica.

Endpoints:

- `SCH-01` registrar ingreso.
- `SCH-02` registrar salida.
- `SCH-03` iniciar almuerzo.
- `SCH-04` finalizar almuerzo.
- `SCH-05` iniciar servicios.
- `SCH-06` finalizar servicios.
- `SCH-07` consultar asistencia del dia.
- `SCH-08` consultar asistencia del mes.
- `SCH-15` consultar horario mensual propio.

Reglas para frontend:

- No se puede cerrar jornada si existe una pausa activa.
- Almuerzo y servicios requieren que el empleado este `ONLINE`.
- El ingreso crea la asistencia del dia si existe horario vigente y el dia es laborable.
- `SCH-07` no crea asistencia; solo consulta una asistencia existente.
- Para `SCH-08`, `anio` y `mes` se envian juntos o no se envian.

Responsabilidad del rol:

Este bloque no define funciones propias de RRHH, Reclutador u otro rol. Solo define comportamiento comun de empleado autenticado.
