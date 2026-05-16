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
