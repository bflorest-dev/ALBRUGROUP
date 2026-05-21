# Rol Monitor

Documento operativo del rol Monitor. No define pantallas ni componentes visuales. Separa responsabilidades y flujos para que luego puedan traducirse a vistas, paneles o tableros de supervision en tiempo real.

## Flujos comunes heredados

Monitor tambien es empleado. Por eso hereda los flujos comunes de:

- acceso: ver `/(docs)/01_empleado_base`, bloque `Flujo comun: acceso`;
- marcaciones de asistencia: ver `/(docs)/01_empleado_base`, bloque `Flujo comun: marcaciones de asistencia`.

El documento de Monitor no repite esos pasos porque no son propios del rol.

## Responsabilidad del rol

Monitor observa el estado operativo de uno o varios empleados en tiempo real o para una fecha puntual. No corrige asistencia ni horarios; consume el endpoint de revision para supervisar.

Responsabilidades principales:

- consultar estado operativo de empleados;
- detectar si un empleado tiene horario vigente;
- verificar si hoy era laborable;
- revisar si existe registro de asistencia;
- ver estado actual, tiempo en curso y exceso de servicios.

## Flujo 1: monitoreo de estados

Objetivo: obtener una vista operacional del estado actual de varios empleados.

Secuencia:

1. Construir la lista `empleadoIds`.
2. Enviar `SCH-20`.
3. Si se necesita una fecha puntual, enviar `fecha`; si no, dejar que backend use la fecha actual.
4. Mostrar el resultado por empleado.

Reglas operativas:

- `empleadoIds` es obligatorio y no puede venir vacio.
- La respuesta incluye contexto de horario y asistencia, no solo el estado actual.
- Campos utiles para UI operativa: `tieneHorarioVigente`, `laborableHoy`, `tieneRegistroHoy`, `estadoActual`, `desde`, `minutosServiciosAcumulados`, `excedioServicios`, `operativo`.
- Este endpoint es de lectura; no modifica asistencia ni horario.
- Si se usa realtime, debe tratarse como senal para reconsultar `SCH-20`, no como DTO final de la vista.

Documentacion tecnica:

- Ver `/(docs)/schedule-service`, endpoint `SCH-20`.
- Ver `/(docs)/schedule-service-realtime`.

## Orden operativo sugerido

1. Seleccionar empleados a monitorear.
2. Ejecutar `SCH-20`.
3. Si existe una suscripcion a `/topic/asistencia/monitor`, reconsultar `SCH-20` al recibir eventos cuya `fecha` coincida con el corte visible.
4. Mantener refresh periodico solo como respaldo si la vista lo necesita.

## Limites del rol

Monitor no registra asistencia, no asigna horarios y no corrige excepciones. Solo supervisa estados.

## Criterio para frontend futuro

Este documento debe permitir entender responsabilidades y flujos. No debe decidir si se implementa como wallboard, tabla en vivo o panel de celdas por empleado.
