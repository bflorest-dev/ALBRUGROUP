# Rol Reclutador

Documento operativo del rol Reclutador. No define pantallas ni componentes visuales. Separa responsabilidades y flujos para que luego puedan traducirse a vistas, tableros, modales o paneles de seguimiento.

## Flujos comunes heredados

Reclutador tambien es empleado. Por eso hereda los flujos comunes de:

- acceso: ver `/(docs)/01_empleado_base`, bloque `Flujo comun: acceso`;
- marcaciones de asistencia: ver `/(docs)/01_empleado_base`, bloque `Flujo comun: marcaciones de asistencia`.

El documento de Reclutador no repite esos pasos porque no son propios del rol.

## Responsabilidad del rol

Reclutador gestiona el seguimiento inicial de postulantes, los contacta, registra avances mediante tipificaciones y, cuando corresponde, los deriva a capacitacion con un grupo asignado.

Responsabilidades principales:

- consultar catalogos de tipificacion de reclutamiento;
- revisar la bandeja de postulantes en etapa de reclutamiento;
- mover postulantes entre estados de bandeja mediante tipificacion;
- asignar a grupo de capacitacion en la tipificacion que pasa a la siguiente etapa;
- crear y consultar grupos de capacitacion;
- actualizar el detalle de postulantes dentro de grupos cuando el seguimiento lo requiera.

## Flujo 1: seguimiento de postulantes

Objetivo: contactar postulantes, registrar su avance y decidir si continuan hacia capacitacion.

Secuencia:

1. Cargar catalogo de tipificaciones de `RECLUTAMIENTO` con `REC-10`.
2. Consultar bandeja de reclutamiento con `REC-11`.
3. Separar o agrupar visualmente postulantes por `estadoBandeja`.
4. Revisar detalle puntual con `REC-08` si se necesita informacion completa.
5. Consultar eventos con `REC-05` si se necesita historial.
6. Tipificar avances con `REC-09`.
7. En la tipificacion final que pasa a `CAPACITACION`, enviar tambien `idGrupoCapacitacion`.

Reglas operativas:

- La bandeja principal del Reclutador es `REC-11`, no el listado general `REC-04`.
- `estadoBandeja` es el campo natural para organizar el trabajo diario.
- `REC-10` debe cargarse antes de tipificar para evitar enviar combinaciones invalidas.
- La tipificacion define cambios de etapa, estado o bandeja segun catalogo; frontend no debe inventar transiciones.
- Si la postulacion `ASESOR_VENTAS` pasa de `RECLUTAMIENTO` a `CAPACITACION`, el backend exige `idGrupoCapacitacion`.

Documentacion tecnica:

- Ver `/(docs)/recruitment-service`.

## Flujo 2: grupos de capacitacion

Objetivo: crear grupos disponibles para recibir postulantes derivados desde reclutamiento.

Secuencia:

1. Cargar capacitadores con `RRHH-10`, filtrando `puestosTrabajo=CAPACITADOR`.
2. Crear grupo con `REC-13`.
3. Listar grupos con `REC-14`.
4. Abrir detalle de grupo con `REC-15`.
5. Usar el grupo como destino cuando `REC-09` derive una postulacion a capacitacion.

Reglas operativas:

- El capacitador es un empleado activo con contrato vigente; por eso se obtiene desde `RRHH-10`.
- El grupo nace `ABIERTO` y el backend calcula su fecha fin.
- `codigo` debe ser unico.
- `fechaInicio` no puede estar en el pasado.
- Los grupos abiertos son los candidatos naturales para asignacion desde tipificacion.

Documentacion tecnica:

- Ver `/(docs)/recruitment-service`.
- Ver `/(docs)/rrhh-service` para `RRHH-10`.

## Flujo 3: asignacion a capacitacion

Objetivo: mover una postulacion desde reclutamiento hacia capacitacion dejando asignado el grupo correcto.

Secuencia:

1. Seleccionar postulacion desde `REC-11`.
2. Cargar tipificaciones de `RECLUTAMIENTO` con `REC-10`.
3. Cargar grupos disponibles con `REC-14`.
4. Ejecutar `REC-09` con la tipificacion que cambia etapa a `CAPACITACION`.
5. Incluir `idGrupoCapacitacion` en el body de `REC-09`.
6. Confirmar el cambio revisando la bandeja o el detalle.

Reglas operativas:

- `REC-16` queda como endpoint deprecado para este flujo; la asignacion debe ocurrir dentro de `REC-09`.
- El grupo no debe asignarse en una accion separada si la tipificacion ya puede hacerlo.
- Si no hay grupo disponible, frontend debe impedir la tipificacion final o pedir crear grupo primero.
- El paso final debe ser una accion consciente, porque cambia la etapa del proceso.

Documentacion tecnica:

- Ver `/(docs)/recruitment-service`.

## Flujo 4: seguimiento dentro del grupo

Objetivo: revisar grupos y actualizar informacion de resultado cuando el proceso de capacitacion avanza.

Secuencia:

1. Listar grupos con `REC-14`.
2. Abrir grupo con `REC-15`.
3. Actualizar detalle de postulante con `REC-17` cuando corresponda.

Reglas operativas:

- `REC-17` actualiza datos del postulante dentro del grupo, no la ficha base de postulacion.
- Si se registra `fechaContratacion`, debe existir `idEmpleadoContratado`.
- Si se marca cumplimiento de tres meses, debe existir `idEmpleadoContratado`.
- Cambiar el estado a `APROBADO` o `DESAPROBADO` registra evento de capacitacion.

Documentacion tecnica:

- Ver `/(docs)/recruitment-service`.

## Orden operativo sugerido

Para trabajo diario de Reclutador:

1. Consultar `REC-10` para catalogo de tipificaciones.
2. Consultar `REC-11` para bandeja de reclutamiento.
3. Trabajar postulantes agrupados por `estadoBandeja`.
4. Usar `REC-09` para registrar cada avance.
5. Cuando el postulante pasa a capacitacion, elegir grupo con `REC-14` y enviar `idGrupoCapacitacion`.

Para preparar capacitacion:

1. Consultar capacitadores con `RRHH-10`.
2. Crear grupo con `REC-13`.
3. Validar disponibilidad con `REC-14`.
4. Usar ese grupo como destino de la tipificacion final.

## Limites del rol

Reclutador no cierra contratacion ni registra empleado, contrato, pagos u horarios. Esos pasos pertenecen a RRHH.

Reclutador puede dejar la postulacion lista para capacitacion y mantener seguimiento dentro del grupo, pero la contratacion final debe quedar fuera de este documento de rol.

## Criterio para frontend futuro

Este documento debe permitir entender responsabilidades y flujos. No debe decidir si se implementa como kanban, tabla, modal, drawer o wizard.
