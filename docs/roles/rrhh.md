# Rol RRHH

Documento operativo del rol RRHH. No define pantallas, layout ni componentes visuales. Su objetivo es separar responsabilidades y flujos para que luego puedan traducirse a vistas, modales, tablas o acciones de frontend.

## Flujos comunes heredados

RRHH tambien es empleado. Por eso hereda los flujos comunes de:

- acceso: ver `/(docs)/01_empleado_base`, bloque `Flujo comun: acceso`;
- marcaciones de asistencia: ver `/(docs)/01_empleado_base`, bloque `Flujo comun: marcaciones de asistencia`.

El documento de RRHH no repite esos pasos porque no son propios del rol.

## Responsabilidad del rol

RRHH opera el tramo administrativo que convierte postulaciones listas en empleados contratados, mantiene datos del empleado, gestiona contratos, horarios, pagos y eventos.

Responsabilidades principales:

- registrar postulantes y revisar su avance hacia contratacion;
- registrar o completar empleados;
- registrar contratos y ceses;
- asignar horarios y excepciones;
- revisar cumplimiento de asistencia;
- registrar y consultar pagos;
- consultar historial administrativo del empleado.

## Flujo 1: postulantes hacia contratacion

Objetivo: registrar postulantes y llevar el caso hasta la bandeja de contratacion.

Secuencia:

1. Cargar ofertas activas con `REC-01`.
2. Registrar postulacion con `REC-02`.
3. Corregir postulacion con `REC-03` si se detectan errores.
4. Consultar postulaciones con `REC-04` cuando se necesite una bandeja amplia.
5. Revisar eventos de postulacion con `REC-05` cuando se necesite contexto.
6. Consultar casos listos para RRHH con `REC-06`.

Reglas operativas:

- El registro de postulacion siempre debe asociarse a una oferta activa.
- `REC-06` es la entrada natural al bloque de empleado y contrato.
- RRHH no deberia confirmar manualmente la contratacion desde recruitment si el caso continuara con `RRHH-12`; ese endpoint puede confirmar la postulacion usando `idPostulacion`.

Documentacion tecnica:

- Ver `/(docs)/recruitment-service`.

## Flujo 2: registro y mantenimiento de empleados

Objetivo: crear el empleado y mantener sus datos completos para permitir contratacion.

Secuencia:

1. Cargar empresas contratistas con `RRHH-01` si el formulario financiero las necesita.
2. Registrar empleado con `RRHH-02`.
3. Corregir datos personales con `RRHH-03`.
4. Corregir contacto y ubicacion con `RRHH-04`.
5. Corregir datos financieros con `RRHH-05`.
6. Completar datos corporativos con `RRHH-06`.
7. Marcar lista negra con `RRHH-07` solo como accion sensible.

Consultas de apoyo:

- `RRHH-08` para tabla administrativa con filtros.
- `RRHH-09` para busqueda universal.
- `RRHH-10` para selects o asignaciones ligeras.
- `RRHH-11` para busqueda exacta por documento.

Reglas operativas:

- Registrar empleado no equivale a contratar.
- Antes de contratar, frontend debe procurar que los datos minimos del empleado esten completos.
- Si el empleado viene de postulacion, conservar `idPostulacion` para enviarlo luego en `RRHH-12`.
- Lista negra no debe tratarse como edicion comun; es cambio de estado sensible.

Documentacion tecnica:

- Ver `/(docs)/rrhh-service`.

## Flujo 3: contratos

Objetivo: registrar la relacion laboral activa y gestionar su vigencia.

Secuencia de alta:

1. Partir de un empleado existente y completo.
2. Registrar contrato con `RRHH-12`.
3. Si el caso viene de recruitment, enviar `idPostulacion` en el body.
4. Consultar contrato vigente con `RRHH-14` si se necesita confirmar contexto actual.
5. Pasar a horario con `SCH-09` cuando la empresa ya defina programacion.

Consultas y cierre:

- `RRHH-13` para historico de contratos.
- `RRHH-14` para contrato vigente.
- `RRHH-15` para finalizar contrato.

Reglas operativas:

- `RRHH-12` es el paso que activa operativamente al empleado.
- El header `Authorization` es necesario porque el backend sincroniza con otros servicios despues del registro.
- No ejecutar contratacion si el empleado esta incompleto; el backend lo rechazara.
- Si se envia `idPostulacion`, la contratacion se confirma tambien en recruitment.
- `RRHH-15` cambia al empleado a inactivo y deshabilita su usuario.

Documentacion tecnica:

- Ver `/(docs)/rrhh-service`.

## Flujo 4: horarios y cumplimiento

Objetivo: definir vigencias de horario y revisar cumplimiento de asistencia.

Secuencia recomendada:

1. Registrar horario inicial con `SCH-09` despues de tener contrato.
2. Reemplazar horario con `SCH-10` cuando cambie la vigencia.
3. Registrar excepciones puntuales con `SCH-12`.
4. Actualizar o eliminar excepciones con `SCH-13` y `SCH-14`.
5. Finalizar horario con `SCH-11` si se cierra sin reemplazo.
6. Consultar horario vigente con `SCH-16`.
7. Consultar historico con `SCH-17`.

Cumplimiento:

- `SCH-18` para resumen agregado por empleado y rango.
- `SCH-19` para detalle diario.

Reglas operativas:

- Lo ideal es registrar horario despues del contrato, pero no tiene que ocurrir obligatoriamente en el mismo paso.
- Sin horario vigente, las marcaciones y revisiones pueden quedar bloqueadas o incompletas.
- Las excepciones solo aplican dentro de la vigencia del horario.
- No se deben repetir dias en los detalles del horario.

Documentacion tecnica:

- Ver `/(docs)/schedule-service`.

## Flujo 5: pagos

Objetivo: registrar pagos asociados a contratos y consultar historial.

Secuencia:

1. Identificar contrato del empleado con `RRHH-14` o historico con `RRHH-13`.
2. Registrar pago sobre el contrato con `RRHH-16`.
3. Consultar pagos con `RRHH-17`.

Reglas operativas:

- El pago se registra sobre contrato, no sobre empleado aislado.
- Si se filtra desde una ficha de empleado, enviar `empleado`.
- Si se filtra desde una ficha de contrato, enviar `contrato`.
- Si no se envian fechas al registrar pago, backend usa el mes actual.

Documentacion tecnica:

- Ver `/(docs)/rrhh-service`.

## Flujo 6: eventos del empleado

Objetivo: revisar historial administrativo desde cualquier contexto donde ya se conoce el empleado.

Uso:

- Ejecutar `RRHH-18` desde listados, detalle de empleado, contrato, pago o auditoria.

Reglas operativas:

- Es un flujo transversal, no un paso obligatorio.
- Sirve para explicar acciones relevantes como contratacion, pagos, cambios administrativos o lista negra.

Documentacion tecnica:

- Ver `/(docs)/rrhh-service`.

## Orden operativo completo sugerido

Para una contratacion que nace en postulacion:

1. `REC-06` ubicar postulacion lista.
2. `RRHH-02` registrar empleado.
3. `RRHH-03` a `RRHH-06` completar o corregir datos si aplica.
4. `RRHH-12` registrar contrato con `idPostulacion`.
5. `SCH-09` registrar horario cuando corresponda.
6. `RRHH-16` registrar pagos cuando exista periodo pagable.
7. `RRHH-18` consultar eventos si se necesita trazabilidad.

Para un empleado registrado directamente:

1. `RRHH-02` registrar empleado.
2. `RRHH-03` a `RRHH-06` completar datos.
3. `RRHH-12` registrar contrato sin `idPostulacion`.
4. `SCH-09` registrar horario cuando corresponda.

## Criterio para frontend futuro

Este documento debe permitir decidir responsabilidades y flujos. No debe indicar si se implementa como tabla, modal, drawer, wizard o pagina. Esa decision pertenece al diseno de frontend.
