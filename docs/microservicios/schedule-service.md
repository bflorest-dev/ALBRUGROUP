# schedule-service

Servicio responsable de asistencia, horarios, excepciones y cumplimiento.

## Notas generales

- Las marcaciones operan sobre el empleado autenticado.
- La gestion de horarios y cumplimiento es administrativa.
- Los endpoints de historico paginado usan la paginacion comun.
- Los endpoints de asistencia `SCH-01` a `SCH-07` responden `DetalleAsistenciaResponse` e incluyen `estadoActual`.
- Valores de `estadoActual`: `OFFLINE`, `ONLINE`, `ALMUERZO`, `SERVICIOS`, `CAPACITACION`.

## SCH-01 registrarIngreso

- Metodo/ruta: `POST /asistencia/ingreso`
- Permiso: `UPDATE_ASISTENCIAS`.
- Body: `fechaHora`.
- Uso frontend: abrir jornada del dia.
- Reglas: no permite doble ingreso; requiere horario vigente; la fecha debe ser laborable.
- Efecto: crea asistencia del dia si no existia y deja estado `ONLINE`.

## SCH-02 registrarSalida

- Metodo/ruta: `POST /asistencia/salida`
- Permiso: `UPDATE_ASISTENCIAS`.
- Body: `fechaHora`.
- Uso frontend: cerrar jornada.
- Reglas: requiere ingreso previo; no permite doble salida; no permite cerrar con almuerzo o servicios activos.
- Efecto: calcula minutos trabajados y balance del dia; deja estado `OFFLINE`.

## SCH-03 iniciarAlmuerzo

- Metodo/ruta: `POST /asistencia/almuerzo/inicio`
- Permiso: `UPDATE_ASISTENCIAS`.
- Body: `fechaHora`.
- Uso frontend: iniciar pausa de almuerzo.
- Reglas: empleado debe estar `ONLINE`; no puede existir almuerzo iniciado previamente.
- Efecto: deja estado `ALMUERZO`.

## SCH-04 finalizarAlmuerzo

- Metodo/ruta: `POST /asistencia/almuerzo/fin`
- Permiso: `UPDATE_ASISTENCIAS`.
- Body: `fechaHora`.
- Uso frontend: cerrar pausa de almuerzo.
- Reglas: debe existir almuerzo activo.
- Efecto: calcula minutos de almuerzo y vuelve a `ONLINE`.

## SCH-05 iniciarServicios

- Metodo/ruta: `POST /asistencia/servicios/inicio`
- Permiso: `UPDATE_ASISTENCIAS`.
- Body: `fechaHora`.
- Uso frontend: iniciar pausa de servicios.
- Reglas: empleado debe estar `ONLINE`; no puede existir otro bloque de servicios en curso.
- Efecto: deja estado `SERVICIOS`.

## SCH-06 finalizarServicios

- Metodo/ruta: `POST /asistencia/servicios/fin`
- Permiso: `UPDATE_ASISTENCIAS`.
- Body: `fechaHora`.
- Uso frontend: cerrar pausa de servicios.
- Reglas: debe existir bloque de servicios activo.
- Efecto: acumula minutos de servicios y vuelve a `ONLINE`.

## SCH-07 getAsistenciaDia

- Metodo/ruta: `GET /asistencia/dia`
- Permiso: `READ_ASISTENCIAS_SELF`.
- Query params: `fecha` opcional; default fecha actual.
- Uso frontend: consultar estado operativo de un dia.
- Regla: no crea asistencia; si no existe registro, responde no encontrado.
- Response: `DetalleAsistenciaResponse` con `estadoActual` actual del registro.

## SCH-08 getAsistenciaMes

- Metodo/ruta: `GET /asistencia/mes`
- Permiso: `READ_ASISTENCIAS_SELF`.
- Query params: `anio`, `mes`.
- Uso frontend: calendario mensual de asistencia propia.
- Reglas: si se envia `anio`, tambien debe enviarse `mes`; si no se envia ninguno, usa mes actual; meses futuros devuelven calendario sin registros futuros.

## SCH-09 registrarHorario

- Metodo/ruta: `POST /horarios`
- Permiso: `CREATE_HORARIOS`.
- Body: `idEmpleado`, `idContrato`, `modalidad`, `fechaInicio`, `compensable`, `detalles`.
- `detalles`: lista de `dia`, `horaEntrada`, `horaSalida`, `inicioAlmuerzo`, `finAlmuerzo`, `laborable`.
- Uso frontend: asignar horario inicial a un empleado contratado.
- Reglas: no repetir dias; no solapar vigencias de horario; `detalles` no puede estar vacio.

## SCH-10 reemplazarHorario

- Metodo/ruta: `PUT /horarios/{idHorario}`
- Permiso: `UPDATE_HORARIOS`.
- Path params: `idHorario`.
- Body: `modalidad`, `fechaInicio`, `compensable`, `detalles`.
- Uso frontend: reemplazar una vigencia por otra.
- Reglas: nueva `fechaInicio` debe ser posterior a la actual; cierra el horario anterior en `fechaInicio - 1 dia`; no repetir dias ni solapar vigencias.

## SCH-11 finalizarHorario

- Metodo/ruta: `PATCH /horarios/{idHorario}/finalizar`
- Permiso: `UPDATE_HORARIOS`.
- Body: `fechaFin`.
- Uso frontend: cerrar una vigencia sin crear reemplazo inmediato.
- Regla: `fechaFin` no puede ser anterior a `fechaInicio`.

## SCH-12 registrarExcepcion

- Metodo/ruta: `POST /horarios/{idHorario}/excepciones`
- Permiso: `UPDATE_HORARIOS`.
- Body: `fecha`, `tipo`, `horaEntrada`, `horaSalida`, `inicioAlmuerzo`, `finAlmuerzo`, `laborable`, `motivo`.
- Uso frontend: registrar modificacion puntual de un dia.
- Reglas: fecha dentro de vigencia; no puede existir otra excepcion para la misma fecha.

## SCH-13 actualizarExcepcion

- Metodo/ruta: `PUT /horarios/{idHorario}/excepciones/{idExcepcion}`
- Permiso: `UPDATE_HORARIOS`.
- Body: igual que `SCH-12`.
- Uso frontend: corregir una excepcion existente.
- Reglas: mantiene validaciones de fecha y duplicidad.

## SCH-14 eliminarExcepcion

- Metodo/ruta: `DELETE /horarios/{idHorario}/excepciones/{idExcepcion}`
- Permiso: `UPDATE_HORARIOS`.
- Uso frontend: eliminar una excepcion puntual.
- Response: `204 No Content`.

## SCH-15 getHorarioMes

- Metodo/ruta: `GET /horarios/mes`
- Permiso: `READ_HORARIOS_SELF`.
- Query params: `anio`, `mes`.
- Uso frontend: consultar calendario mensual de horario propio.
- Reglas: `anio` y `mes` se envian juntos o no se envian; incluye vigencias y excepciones del rango.

## SCH-16 getHorarioVigente

- Metodo/ruta: `GET /horarios/empleados/{idEmpleado}/vigente`
- Permiso: `READ_HORARIOS`.
- Query params: `fecha` opcional; default fecha actual.
- Uso frontend: ver horario vigente de un empleado.

## SCH-17 listarHistorico

- Metodo/ruta: `GET /horarios/empleados/{idEmpleado}/historico`
- Permiso: `READ_HORARIOS`.
- Query params: paginacion comun.
- Orden permitido: `fechaInicio`, `fechaFin`, `createdAt`.
- Uso frontend: historial completo de horarios de un empleado.

## SCH-18 getCumplimientoResumen

- Metodo/ruta: `POST /revision/asistencia/cumplimiento/resumen`
- Permiso: `READ_ASISTENCIAS_CUMPLIMIENTO`.
- Body: `empleadoIds`, `desde`, `hasta`.
- Uso frontend: metricas agregadas de cumplimiento.
- Reglas: `empleadoIds` obligatorio y no vacio; `desde` no puede ser posterior a `hasta`.

## SCH-19 getCumplimientoDetalle

- Metodo/ruta: `POST /revision/asistencia/cumplimiento/detalle`
- Permiso: `READ_ASISTENCIAS_CUMPLIMIENTO`.
- Body: igual que `SCH-18`.
- Uso frontend: auditoria diaria por empleado dentro del rango.

## SCH-20 getEstadosMonitor

- Metodo/ruta: `POST /revision/asistencia/monitor/estados`
- Permiso: `READ_ASISTENCIAS_MONITOR`.
- Body: `empleadoIds`, `fecha`.
- Uso frontend: monitoreo operativo de estados de asistencia.
