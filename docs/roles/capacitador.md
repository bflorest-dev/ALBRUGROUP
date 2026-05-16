# Rol Capacitador

Documento operativo del rol Capacitador. No define pantallas ni componentes visuales. Separa responsabilidades y flujos para que luego puedan traducirse a vistas, tableros, modales o paneles de seguimiento.

## Flujos comunes heredados

Capacitador tambien es empleado. Por eso hereda los flujos comunes de:

- acceso: ver `/(docs)/01_empleado_base`, bloque `Flujo comun: acceso`;
- marcaciones de asistencia: ver `/(docs)/01_empleado_base`, bloque `Flujo comun: marcaciones de asistencia`.

El documento de Capacitador no repite esos pasos porque no son propios del rol.

## Responsabilidad del rol

Capacitador gestiona postulantes que ya llegaron a la etapa de capacitacion. Su foco no es captar postulantes ni contratar empleados, sino revisar grupos asignados, seguir el avance de cada postulante y registrar resultados de capacitacion.

Responsabilidades principales:

- consultar catalogos de tipificacion de capacitacion;
- revisar postulantes en etapa `CAPACITACION`;
- consultar grupos de capacitacion abiertos;
- identificar grupos asignados al capacitador autenticado;
- revisar detalle del grupo y sus postulantes;
- tipificar postulantes para dejarlos en curso, aprobados, desaprobados o retirados;
- dejar postulantes aprobados listos para el flujo de contratacion de RRHH.

## Flujo 1: bandeja de capacitacion

Objetivo: visualizar los postulantes que estan en etapa de capacitacion y ubicarlos dentro de sus grupos.

Secuencia:

1. Cargar catalogo de tipificaciones de `CAPACITACION` con `REC-10`.
2. Consultar bandeja de capacitacion con `REC-12`.
3. Separar postulantes por `idGrupoCapacitacion`.
4. Para ver detalle de un grupo, consultar `REC-15`.
5. Para ver historial de un postulante, consultar `REC-05`.

Reglas operativas:

- La bandeja principal del Capacitador es `REC-12`.
- `REC-12` lista postulaciones en etapa `CAPACITACION`.
- Si una postulacion no tiene `idGrupoCapacitacion`, todavia no esta correctamente asignada a un grupo para trabajo normal del capacitador.
- `REC-10` debe cargarse antes de tipificar para usar codigos validos de capacitacion.
- Frontend no debe inventar estados finales; debe usar el catalogo.

Documentacion tecnica:

- Ver `/(docs)/recruitment-service`.

## Flujo 2: mis grupos de capacitacion

Objetivo: permitir que el capacitador vea los grupos que le corresponden.

Secuencia:

1. Obtener `empleadoId` desde la sesion iniciada con `AUTH-02`.
2. Listar grupos abiertos con `REC-14`, usando `estado=ABIERTO`.
3. Filtrar en frontend los grupos donde `idCapacitador` sea igual al `empleadoId` de sesion.
4. Abrir el detalle del grupo con `REC-15`.

Reglas operativas:

- El backend no expone un filtro directo por capacitador en `REC-14`.
- "Mis grupos" es una vista derivada: `estado=ABIERTO` + `idCapacitador=empleadoId`.
- El detalle del grupo es la fuente practica para ver postulantes asignados y su `estadoCapacitacion`.
- Si se quieren mostrar grupos de semanas anteriores, usar `REC-14` con filtros de paginacion y estado segun necesidad operativa.

Documentacion tecnica:

- Ver `/(docs)/recruitment-service`.
- Ver `/(docs)/auth-service` para `AUTH-02`.

## Flujo 3: seguimiento del postulante en capacitacion

Objetivo: registrar el avance del postulante durante capacitacion.

Secuencia:

1. Abrir grupo con `REC-15`.
2. Seleccionar postulante dentro del detalle del grupo.
3. Consultar historial con `REC-05` si se necesita contexto.
4. Tipificar avance con `REC-09`.
5. Verificar que el detalle del grupo refleje el nuevo `estadoCapacitacion`.

Reglas operativas:

- En capacitacion, `REC-09` no solo mueve la postulacion; tambien sincroniza el detalle del grupo.
- Tipificaciones esperadas de capacitacion pueden producir estados como `EN_CAPACITACION`, `APROBADO`, `DESAPROBADO` o `RETIRADO`.
- Cuando el estado pasa a `APROBADO`, `DESAPROBADO` o `RETIRADO`, el backend registra `fechaResultado`.
- Si el detalle ya esta en estado final, no admite nuevas tipificaciones de capacitacion.
- La observacion de `REC-09` debe usarse para dejar contexto del resultado o avance.

Documentacion tecnica:

- Ver `/(docs)/recruitment-service`.

## Flujo 4: aprobacion para contratacion

Objetivo: dejar postulantes aprobados listos para que RRHH continue con contratacion.

Secuencia:

1. Desde el grupo, identificar postulante evaluado.
2. Cargar tipificaciones de `CAPACITACION` con `REC-10`.
3. Ejecutar `REC-09` con la tipificacion que representa aprobacion.
4. Confirmar que la postulacion avance segun catalogo hacia `CONTRATACION` o quede con `estadoCapacitacion=APROBADO`.
5. RRHH continuara desde su bandeja de contratacion con `REC-06`.

Reglas operativas:

- Capacitador no registra empleado ni contrato.
- La aprobacion de capacitacion no crea empleado.
- Para que RRHH pueda confirmar contratacion, la postulacion debe estar en etapa `CONTRATACION` y el detalle de capacitacion debe estar `APROBADO`.
- Si una tipificacion aprueba pero no mueve a contratacion, revisar el catalogo de tipificaciones; frontend no debe compensarlo manualmente.

Documentacion tecnica:

- Ver `/(docs)/recruitment-service`.
- Ver `/(docs)/rrhh` para el flujo posterior de RRHH.

## Orden operativo sugerido

Para trabajo diario de Capacitador:

1. Consultar `AUTH-02` ya realizado por login para conocer `empleadoId`.
2. Consultar `REC-10` para catalogo de tipificaciones de `CAPACITACION`.
3. Consultar `REC-14` con `estado=ABIERTO`.
4. Filtrar grupos por `idCapacitador=empleadoId`.
5. Abrir grupo con `REC-15`.
6. Tipificar avances o resultados con `REC-09`.
7. Consultar eventos con `REC-05` si se necesita trazabilidad.

## Limites del rol

Capacitador no crea postulantes, no crea grupos, no asigna postulantes a grupo y no cierra contratacion.

Su responsabilidad termina cuando el resultado de capacitacion queda registrado. La contratacion final pertenece a RRHH.

## Criterio para frontend futuro

Este documento debe permitir entender responsabilidades y flujos. No debe decidir si se implementa como tablero por grupos, tabla, detalle lateral, modal o vista calendario.
