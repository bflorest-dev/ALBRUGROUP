# rrhh-service

Servicio responsable de empleados, empresas contratistas, contratos, pagos y eventos administrativos del empleado.

## Notas generales

- Los listados paginados usan la paginacion comun.
- `registrarContrato` es el punto mas sensible: activa empleado, sincroniza usuario en `auth-service` y puede confirmar contratacion en `recruitment-service`.
- El alta de empleado no equivale a contratacion activa; el empleado queda operativo cuando se registra contrato.

## RRHH-01 listarEmpresasContratistas

- Metodo/ruta: `GET /empresas-contratistas`
- Permiso: `READ_CONTRATISTAS`.
- Query params: `activo` opcional; si no se envia, el backend consulta activas.
- Response: lista de `EmpresaContratistaResponse`.
- Uso frontend: catalogo para datos financieros de empleados.

## RRHH-02 registrarEmpleado

- Metodo/ruta: `POST /empleados`
- Permiso: `CREATE_EMPLEADOS`.
- Body: datos personales, contacto, ubicacion y financieros.
- Campos obligatorios: `nombres`, `apellidos`, `tipoDocumento`, `numeroDocumento`, `nacionalidad`, `fechaNacimiento`, `estadoCivil`, `tieneHijos`, `celularPersonal`, `correoPersonal`, `origen`, `distrito`, `direccion`, `banco`, `cuentaBancaria`, `cuentaInterbancaria`, `cuentaPropia`.
- Campos condicionales o contextuales: `parentesco`, `celularTransferencia`, `idEmpresaContratista`.
- Uso frontend: crear empleado desde postulante o registro directo.
- Regla: no registra contrato ni activa automaticamente la contratacion.

## RRHH-03 actualizarDatosPersonales

- Metodo/ruta: `PATCH /empleados/{id}/datos-personales`
- Permiso: `UPDATE_EMPLEADOS`.
- Body: `nombres`, `apellidos`, `tipoDocumento`, `numeroDocumento`, `nacionalidad`, `fechaNacimiento`, `estadoCivil`, `tieneHijos`.
- Uso frontend: corregir informacion personal antes o despues de contratar.

## RRHH-04 actualizarDatosContactoUbicacion

- Metodo/ruta: `PATCH /empleados/{id}/datos-contacto-ubicacion`
- Permiso: `UPDATE_EMPLEADOS`.
- Body: `celularPersonal`, `correoPersonal`, `distrito`, `direccion`.
- Uso frontend: corregir contacto y domicilio.

## RRHH-05 actualizarDatosFinancieros

- Metodo/ruta: `PATCH /empleados/{id}/datos-financieros`
- Permiso: `UPDATE_EMPLEADOS`.
- Body: `banco`, `cuentaBancaria`, `cuentaInterbancaria`, `cuentaPropia`, `parentesco`, `celularTransferencia`, `idEmpresaContratista`.
- Uso frontend: completar datos de pago.
- Regla operativa: si `cuentaPropia=false`, `parentesco` y `celularTransferencia` deben tratarse como datos relevantes aunque no todos esten anotados como obligatorios.

## RRHH-06 actualizarDatosCorporativos

- Metodo/ruta: `PATCH /empleados/{id}/datos-corporativos`
- Permiso: `UPDATE_EMPLEADOS`.
- Body: `celularCorporativo`, `correoCorporativo`.
- Uso frontend: completar datos corporativos.
- Regla operativa: el correo corporativo puede ser usado como correo preferente al sincronizar usuario durante contratacion.

## RRHH-07 marcarListaNegra

- Metodo/ruta: `PATCH /empleados/{id}/lista-negra`
- Permiso: `BLACKLIST_EMPLEADO`.
- Uso frontend: accion sensible de estado.
- Regla: si el empleado ya esta en lista negra, responde entidad no procesable.

## RRHH-08 getEmpleados

- Metodo/ruta: `GET /empleados`
- Permiso: `READ_EMPLEADOS`.
- Query params: `q`, `dni`, `celular`, `distrito`, `banco`, `idEmpresaContratista`, `origen`, `estado` y paginacion comun.
- Uso frontend: tabla administrativa amplia de empleados.

## RRHH-09 obtenerEmpleadoFiltroUniversal

- Metodo/ruta: `GET /empleados/{dato}/universal`
- Permiso: `READ_EMPLEADOS`.
- Path params: `dato`.
- Query params: paginacion comun.
- Uso frontend: buscador por documento, nombres, apellidos, celular o correo.

## RRHH-10 listarEmpleadosLight

- Metodo/ruta: `GET /empleados/light`
- Permiso: `READ_EMPLEADOS`.
- Query params: `puestosTrabajo` opcional.
- Uso frontend: selects, autocompletes o pickers.
- Regla: devuelve empleados activos con contrato vigente a la fecha actual.

## RRHH-11 getEmpleadoNumeroDocumento

- Metodo/ruta: `GET /empleados/{documento}/numero-documento`
- Permiso: `READ_EMPLEADOS`.
- Uso frontend: busqueda exacta por numero de documento.

## RRHH-12 registrarContrato

- Metodo/ruta: `POST /contratos/{id}/registrar`
- Permiso: `CREATE_CONTRATOS`.
- Path params: `id` corresponde al empleado.
- Header: `Authorization` funcionalmente necesario para sincronizaciones posteriores.
- Body: `idPostulacion`, `puestoTrabajo`, `regimen`, `modalidad`, `seguroSalud`, `sistemaPensiones`, `sueldoBase`, `fechaInicio`, `fechaFin`.
- Efectos: activa empleado, registra contrato, cierra contrato anterior si corresponde, sincroniza usuario en `auth-service`, confirma contratacion en `recruitment-service` si llega `idPostulacion`.
- Reglas: el empleado debe tener datos minimos completos; `sueldoBase` debe ser mayor a cero; no puede generar solapamientos; si hay contratos futuros y no se envia `fechaFin`, responde conflicto.

## RRHH-13 listarContratosEmpleado

- Metodo/ruta: `GET /contratos/{id}/historico`
- Permiso: `READ_CONTRATOS`.
- Path params: `id` corresponde al empleado.
- Query params: paginacion comun.
- Orden permitido: `id`, `createdAt`, `updatedAt`, `fechaInicio`, `fechaFin`, `sueldoBase`.
- Uso frontend: historial contractual del empleado.

## RRHH-14 getContratoVigenteEmpleado

- Metodo/ruta: `GET /contratos/{id}/vigente`
- Permiso: `READ_CONTRATOS`.
- Path params: `id` corresponde al empleado.
- Uso frontend: contexto contractual actual.
- Regla: si no existe contrato vigente para hoy, responde no encontrado.

## RRHH-15 finalizarContrato

- Metodo/ruta: `PATCH /contratos/{id}/cesar-contrato`
- Permiso: `CANCEL_CONTRATOS`.
- Path params: `id` corresponde al empleado.
- Header: `Authorization` funcionalmente necesario.
- Body: `fechaFin`.
- Efectos: cierra contrato vigente para esa fecha, cambia empleado a `INACTIVO` y deshabilita usuario en `auth-service`.

## RRHH-16 registrarPago

- Metodo/ruta: `POST /pagos/{id}/pagar-contrato`
- Permiso: `CREATE_PAGOS`.
- Path params: `id` corresponde al contrato.
- Body: `fechaInicio`, `fechaFin`, `asignacionFamiliar`, `bonoPuntualidad`, `comisionSemanal`, `comisionMensual`, `bonoExtra`.
- Reglas: `asignacionFamiliar` es obligatoria y mayor a cero; los bonos/comisiones enviados deben ser mayores a cero; el periodo no puede quedar fuera del contrato; `fechaFin` no puede ser anterior a `fechaInicio`.
- Defaults de periodo: si no se envian fechas, usa el mes actual; si solo llega inicio, fin es ultimo dia de ese mes; si solo llega fin, inicio es primer dia de ese mes.

## RRHH-17 getPagos

- Metodo/ruta: `GET /pagos`
- Permiso: `CREATE_PAGOS`.
- Query params: `contrato`, `empleado`, `desde`, `hasta` y paginacion comun.
- Uso frontend: listado de pagos por contrato, empleado o rango.
- Orden permitido: `id`, `createdAt`, `updatedAt`, `fechaInicio`, `fechaFin`, `montoTotal`.

## RRHH-18 listarEventosEmpleado

- Metodo/ruta: `GET /eventos/{idEmpleado}/empleados`
- Permiso: `READ_EVENTOS`.
- Path params: `idEmpleado`.
- Query params: paginacion comun.
- Uso frontend: historial administrativo del empleado.
