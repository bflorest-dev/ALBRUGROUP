# recruitment-service

Servicio responsable de ofertas laborales, postulaciones, tipificaciones, grupos de capacitacion y eventos del proceso de reclutamiento.

## Notas generales

- Los listados paginados usan la paginacion comun.
- `listarOfertasActivas` y catalogos de tipificacion usan cache Redis; esto no cambia el contrato HTTP.
- Para roles operativos, este microservicio cubre el seguimiento desde reclutamiento hasta contratacion.

## REC-01 listarOfertasActivas

- Metodo/ruta: `GET /ofertas-laborales/activas`
- Permiso: `READ_OFERTAS_LABORALES_ACTIVAS`.
- Proposito: obtener ofertas activas disponibles para registrar postulaciones.
- Params: no recibe.
- Response: lista de `OfertaLaboralResponse`.
- Uso frontend: selector de oferta al crear postulacion.
- Cache: lectura cacheada; cambios de oferta invalidan cache.

## REC-02 registrarPostulacion

- Metodo/ruta: `POST /postulaciones`
- Permiso: `CREATE_POSTULACIONES`.
- Body: `idOfertaLaboral`, `origen`, `postulante`.
- `postulante`: `nombres`, `apellidos`, `tipoDocumento`, `documento`, `celular`, `fechaNacimiento`.
- Response: `PostulacionResponse`.
- Efecto: crea o actualiza postulante y crea postulacion en `RECLUTAMIENTO`, `EN_PROCESO`, `POSTULANTE`.
- Regla: la oferta debe estar activa.

## REC-03 editarPostulacion

- Metodo/ruta: `PUT /postulaciones/{idPostulacion}`
- Permiso: `UPDATE_POSTULACIONES`.
- Path params: `idPostulacion`.
- Body: igual que `REC-02`.
- Uso frontend: corregir datos de postulante, oferta u origen.
- Regla: la nueva oferta tambien debe estar activa.

## REC-04 listarPostulaciones

- Metodo/ruta: `GET /postulaciones`
- Permiso: `READ_POSTULACIONES`.
- Query params: `etapa`, `estado`, `estadoBandeja` y paginacion comun.
- Orden permitido: `id`, `createdAt`, `updatedAt`, `etapa`, `estado`, `estadoBandeja`, `origen`.
- Uso frontend: listado amplio con filtros operativos.

## REC-05 listarEventosPorPostulacion

- Metodo/ruta: `GET /postulaciones/{idPostulacion}/eventos`
- Permiso: `READ_EVENTOS_RECRUITMENT`.
- Path params: `idPostulacion`.
- Query params: paginacion comun.
- Uso frontend: historial o timeline de una postulacion.

## REC-06 listarBandejaContratacion

- Metodo/ruta: `GET /postulaciones/bandeja/contratacion`
- Permiso: `READ_POSTULACIONES`.
- Query params: paginacion comun.
- Uso frontend: bandeja de postulaciones listas para el bloque RRHH.
- Regla: devuelve postulaciones en etapa `CONTRATACION` y con condicion interna de listo para contratar.

## REC-07 confirmarContratacion

- Metodo/ruta: `POST /postulaciones/{idPostulacion}/confirmar-contratacion`
- Permiso: `CONFIRM_CONTRATACION_POSTULACIONES`.
- Body: `idEmpleadoContratado`, `fechaContratacion`.
- Uso pensado: cerrar la postulacion cuando la contratacion queda confirmada.
- Nota: normalmente se ejecuta indirectamente desde `RRHH-12` si se envia `idPostulacion`.
- Reglas: la postulacion debe estar en `CONTRATACION` y aprobada en capacitacion; si ya fue confirmada con los mismos datos, responde de forma idempotente; si fue confirmada con datos distintos, responde conflicto.

## REC-08 obtenerPostulacion

- Metodo/ruta: `GET /postulaciones/{idPostulacion}`
- Permiso: `READ_POSTULACION`.
- Uso frontend: detalle puntual de una postulacion.

## REC-09 tipificarPostulacion

- Metodo/ruta: `POST /postulaciones/{idPostulacion}/tipificacion`
- Permiso: `TYPIFY_POSTULACIONES`.
- Body: `idTipificacion`, `idSubtipificacion`, `idGrupoCapacitacion`, `modalidadContacto`, `observacion`.
- Uso pensado: mover estado, etapa o bandeja segun catalogo de tipificacion.
- Regla relevante: si una postulacion `ASESOR_VENTAS` pasa de `RECLUTAMIENTO` a `CAPACITACION`, debe enviarse `idGrupoCapacitacion`.
- Regla en capacitacion: si la tipificacion pertenece a etapa `CAPACITACION`, el backend sincroniza el detalle del grupo con estados como `EN_CAPACITACION`, `APROBADO`, `DESAPROBADO` o `RETIRADO`; en estados finales registra `fechaResultado`.

## REC-10 getCatalogoTipificaciones

- Metodo/ruta: `GET /tipificaciones/{etapa}/catalogo`
- Permiso: evaluador por etapa.
- Query params: `puestoObjetivo` opcional.
- Uso frontend: obtener opciones validas de tipificacion por etapa y puesto.
- Cache: lectura cacheada por etapa y puesto.

## REC-11 listarBandejaReclutamiento

- Metodo/ruta: `GET /postulaciones/bandeja/reclutamiento`
- Permiso: `READ_POSTULACIONES_RECLUTAMIENTO`.
- Query params: `estadoBandeja` y paginacion comun.
- Uso pensado: bandeja especifica de reclutamiento.

## REC-12 listarBandejaCapacitacion

- Metodo/ruta: `GET /postulaciones/bandeja/capacitacion`
- Permiso: `READ_POSTULACIONES_CAPACITACION`.
- Query params: `sinGrupo` y paginacion comun.
- Uso pensado: bandeja especifica de capacitacion.
- Nota frontend: la respuesta incluye `idGrupoCapacitacion` cuando la postulacion ya tiene grupo asignado; para detalle del grupo usar `REC-15`.

## REC-13 crearGrupoCapacitacion

- Metodo/ruta: `POST /grupos-capacitacion`
- Permiso: `CREATE_GRUPOS_CAPACITACION`.
- Body: `codigo`, `idCapacitador`, `turno`, `sala`, `fechaInicio`.
- Uso frontend: crear un grupo de capacitacion asignado a un capacitador.
- Reglas: `codigo` debe ser unico; `fechaInicio` no puede estar en el pasado; el backend calcula `fechaFin` como una semana despues de `fechaInicio`; el grupo nace en estado `ABIERTO`.
- Dependencia operativa: para elegir `idCapacitador`, usar `RRHH-10` filtrando por `CAPACITADOR`.

## REC-14 listarGruposCapacitacion

- Metodo/ruta: `GET /grupos-capacitacion`
- Permiso: `READ_GRUPOS_CAPACITACION`.
- Query params: `estado` y paginacion comun.
- Orden permitido: `id`, `codigo`, `turno`, `sala`, `fechaInicio`, `fechaFin`, `estado`, `createdAt`.
- Uso frontend: listar grupos para seguimiento, seleccion o asignacion por tipificacion.
- Nota frontend: el endpoint no filtra por capacitador; la respuesta incluye `idCapacitador`, por lo que "mis grupos" se obtiene comparando contra el `empleadoId` de sesion.

## REC-15 obtenerGrupoCapacitacion

- Metodo/ruta: `GET /grupos-capacitacion/{idGrupoCapacitacion}`
- Permiso: `READ_GRUPOS_CAPACITACION`.
- Path params: `idGrupoCapacitacion`.
- Uso frontend: ver detalle del grupo y sus postulaciones asociadas.

## REC-16 agregarPostulacionGrupoCapacitacion

- Metodo/ruta: `POST /grupos-capacitacion/{idGrupoCapacitacion}/postulaciones`
- Permiso: `ASSIGN_GRUPOS_CAPACITACION`.
- Body: `idPostulacion`.
- Estado: deprecado para el flujo principal de Reclutador.
- Uso historico: asignar una postulacion a un grupo despues de moverla a capacitacion.
- Regla actual recomendada: usar `REC-09` y enviar `idGrupoCapacitacion` durante la tipificacion que pasa la postulacion a capacitacion.
- Reglas del backend: el grupo debe estar disponible; la postulacion debe estar en etapa `CAPACITACION`, ser de puesto objetivo `ASESOR_VENTAS` y no tener grupo previo.

## REC-17 actualizarDetalleGrupoCapacitacion

- Metodo/ruta: `PATCH /grupos-capacitacion/{idGrupoCapacitacion}/postulaciones/{idPostulacion}`
- Permiso: `UPDATE_GRUPOS_CAPACITACION`.
- Path params: `idGrupoCapacitacion`, `idPostulacion`.
- Body: `estadoCapacitacion`, `fechaResultado`, `idEmpleadoContratado`, `fechaContratacion`, `cumplioTresMeses`, `fechaCumplioTresMeses`.
- Uso frontend: actualizar el resultado o datos de seguimiento de una postulacion dentro de un grupo.
- Reglas: no se puede registrar `fechaContratacion` sin `idEmpleadoContratado`; no se puede marcar `cumplioTresMeses=true` sin `idEmpleadoContratado`; si el estado pasa a `APROBADO` o `DESAPROBADO`, se registra evento de resultado de capacitacion.
