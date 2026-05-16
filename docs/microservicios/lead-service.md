# lead-service

Servicio responsable del flujo comercial de leads y de los catalogos operativos que alimentan preventa, venta, postventa y community.

## Notas generales

- Los endpoints de catalogos usados por Community devuelven listas, no respuestas paginadas.
- Varios catalogos usan cache interna; el contrato HTTP no cambia.
- Las operaciones de alta, edicion o desactivacion invalidan la cache relacionada cuando aplica.
- Las desactivaciones son logicas: normalmente cambian `activo=false` en lugar de eliminar fisicamente.

## LEAD-01 registrarProveedor

- Metodo/ruta: `POST /proveedores`
- Permiso: `CREATE_PROVEEDORES`.
- Body: `nombre`, `cortesFacturacion`, `mesesPermanencia`.
- Uso frontend: crear proveedor comercial.
- Reglas: `nombre` obligatorio; `cortesFacturacion` acepta dias `1..31`; `mesesPermanencia` debe ser mayor o igual a `1` si se envia.
- Efecto: crea proveedor activo.

## LEAD-02 listarProveedores

- Metodo/ruta: `GET /proveedores`
- Permiso: `READ_PROVEEDORES`.
- Query params: `activo` opcional.
- Uso frontend: catalogo de proveedores para campanas, planes, adicionales y promociones.
- Cache: lectura cacheada por valor de `activo`.

## LEAD-03 alternarEstadoProveedor

- Metodo/ruta: `PATCH /proveedores/{idProveedor}/estado`
- Permiso: `UPDATE_PROVEEDORES`.
- Path params: `idProveedor`.
- Uso frontend: activar o desactivar proveedor desde mantenimiento.
- Efecto: invierte el estado `activo`.

## LEAD-04 registrarCuentaPublicitaria

- Metodo/ruta: `POST /cuentas-publicitarias`
- Permiso: `CREATE_CUENTA_PUBLICITARIA`.
- Body: `numeroCuenta`, `nombreCuenta`.
- Uso frontend: crear cuenta publicitaria para campanas.
- Efecto: crea cuenta activa.

## LEAD-05 listarCuentasPublicitarias

- Metodo/ruta: `GET /cuentas-publicitarias`
- Permiso: `READ_CUENTAS_PUBLICITARIAS`.
- Query params: `activo` opcional.
- Uso frontend: listado general de cuentas publicitarias.
- Cache: lectura cacheada por valor de `activo`.

## LEAD-06 listarCuentasPublicitariasActivas

- Metodo/ruta: `GET /cuentas-publicitarias/activas`
- Permiso: `READ_CUENTAS_PUBLICITARIAS`.
- Uso frontend: selector de cuentas disponibles al crear campana.
- Regla: equivale a listar cuentas con `activo=true`.

## LEAD-07 desactivarCuentaPublicitaria

- Metodo/ruta: `DELETE /cuentas-publicitarias/{idCuentaPublicitaria}`
- Permiso: `DELETE_CUENTA_PUBLICITARIA`.
- Path params: `idCuentaPublicitaria`.
- Uso frontend: desactivar cuenta publicitaria.
- Regla: solo opera sobre cuentas activas; si no existe activa, responde no encontrado.

## LEAD-08 registrarCampana

- Metodo/ruta: `POST /campanas`
- Permiso: `CREATE_CAMPANA`.
- Body: `nombre`, `numeroWhatsappEmpresa`, `idCuentaPublicitaria`, `idProveedor`.
- Uso frontend: crear campana asociada a proveedor y cuenta publicitaria.
- Reglas: la cuenta publicitaria y el proveedor deben existir y estar activos.

## LEAD-09 actualizarCampana

- Metodo/ruta: `PUT /campanas/{idCampana}`
- Permiso: `UPDATE_CAMPANA`.
- Path params: `idCampana`.
- Body: `numeroWhatsappEmpresa`.
- Uso frontend: actualizar el numero WhatsApp operativo de una campana activa.
- Regla: solo actualiza campanas activas.

## LEAD-10 desactivarCampana

- Metodo/ruta: `DELETE /campanas/{idCampana}`
- Permiso: `DELETE_CAMPANA`.
- Path params: `idCampana`.
- Uso frontend: desactivar campana.
- Regla: solo opera sobre campanas activas.

## LEAD-11 listarCampanas

- Metodo/ruta: `GET /campanas`
- Permiso: `READ_CAMPANA`.
- Query params: `activo` opcional.
- Uso frontend: listado de campanas para mantenimiento y seleccion operativa.
- Cache: lectura cacheada por valor de `activo`.

## LEAD-12 registrarAdicional

- Metodo/ruta: `POST /planes/adicionales`
- Permiso: `CREATE_ADICIONALES`.
- Body: `idProveedor`, `nombre`, `precioUnitario`.
- Uso frontend: crear adicional comercial asociado a proveedor.
- Reglas: el proveedor debe estar activo; no puede existir otro adicional activo con el mismo nombre para el proveedor.

## LEAD-13 listarAdicionales

- Metodo/ruta: `GET /planes/adicionales`
- Permiso: `READ_ADICIONALES`.
- Query params: `idProveedor` obligatorio.
- Uso frontend: catalogo de adicionales activos de un proveedor.
- Cache: lectura cacheada por proveedor.

## LEAD-14 registrarPlan

- Metodo/ruta: `POST /planes`
- Permiso: `CREATE_PLANES`.
- Body: `idProveedor`, `nombre`, `precio`, `precioPromocional`, `mesesPromocionPrecio`, `vigenciaDesde`, `vigenciaHasta`, `internet`, `television`, `telefono`, `velocidadPromocional`, `mesesPromocionVelocidad`, `idZona`, `adicionales`.
- Uso frontend: crear plan comercial.
- Reglas: proveedor activo; si `vigenciaDesde` no se envia, usa fecha actual; `vigenciaHasta` no puede ser anterior a `vigenciaDesde`; la promocion de precio requiere precio y meses; la promocion de velocidad requiere internet, velocidad y meses; no se puede repetir adicional dentro del plan; los adicionales deben pertenecer al mismo proveedor del plan.

## LEAD-15 listarPlanes

- Metodo/ruta: `GET /planes`
- Permiso: `READ_PLANES`.
- Query params: `idProveedor` opcional, `soloVigentes` default `false`.
- Uso frontend: catalogo de planes para mantenimiento, promociones y seleccion comercial.
- Cache: lectura cacheada por proveedor y flag de vigencia.

## LEAD-16 listarServiciosProveedor

- Metodo/ruta: `GET /planes/servicios`
- Permiso: `READ_PLANES`.
- Query params: `idProveedor` obligatorio.
- Uso frontend: consultar servicios de internet, television y telefono activos del proveedor.
- Cache: lectura cacheada por proveedor.

## LEAD-17 actualizarPlan

- Metodo/ruta: `PUT /planes/{idPlan}`
- Permiso: `UPDATE_PLANES`.
- Path params: `idPlan`.
- Body: `nombre`, `precio`, `precioPromocional`, `mesesPromocionPrecio`, `vigenciaDesde`, `vigenciaHasta`, `velocidadPromocional`, `mesesPromocionVelocidad`, `idZona`.
- Uso frontend: actualizar datos comerciales y vigencia del plan.
- Reglas: mantiene validaciones de vigencia y promociones.

## LEAD-18 desactivarPlan

- Metodo/ruta: `DELETE /planes/{idPlan}`
- Permiso: `DELETE_PLANES`.
- Path params: `idPlan`.
- Uso frontend: desactivar plan.
- Efecto: marca `activo=false`.

## LEAD-19 registrarPromocion

- Metodo/ruta: `POST /promociones`
- Permiso: `CREATE_PROMOCIONES`.
- Body: `reglaComercial`, `idProveedor`, `idZona`, `idsPlanes`.
- Uso frontend: crear promocion comercial interna.
- Reglas: `idZona` obligatorio; `idProveedor` obligatorio; `idsPlanes` no puede estar vacio ni repetir planes; todos los planes deben existir, estar activos y pertenecer al mismo proveedor; no puede existir otra promocion activa con la misma regla para proveedor y zona.

## LEAD-20 listarPromociones

- Metodo/ruta: `GET /promociones`
- Permiso: `READ_PROMOCIONES`.
- Query params: `idProveedor`, `idZona`, `idPlan` opcionales.
- Uso frontend: consultar promociones activas filtrables.
- Cache: lectura cacheada por combinacion de filtros.

## LEAD-21 desactivarPromocion

- Metodo/ruta: `DELETE /promociones/{idPromocion}`
- Permiso: `DELETE_PROMOCIONES`.
- Path params: `idPromocion`.
- Uso frontend: desactivar promocion.
- Efecto: marca `activo=false`.

## LEAD-22 registrarZona

- Metodo/ruta: `POST /zonas`
- Permiso: `CREATE_ZONAS`.
- Body: `nombre`, `reglas`.
- `reglas`: lista de `nivelGeografico`, `geoId`, `criterio`.
- Uso frontend: crear zona comercial basada en reglas geograficas.
- Reglas: debe tener al menos una regla; no puede repetir la misma combinacion `nivelGeografico + geoId + criterio`; el `geoId` debe existir para el nivel enviado.

## LEAD-23 listarZonas

- Metodo/ruta: `GET /zonas`
- Permiso: `READ_ZONAS`.
- Query params: `activo` opcional.
- Uso frontend: catalogo de zonas para planes y promociones.
- Cache: lectura cacheada por valor de `activo`.

## LEAD-24 alternarEstadoZona

- Metodo/ruta: `PATCH /zonas/{idZona}/estado`
- Permiso: `UPDATE_ZONAS`.
- Path params: `idZona`.
- Uso frontend: activar o desactivar zona.
- Efecto: invierte el estado `activo`.

## LEAD-25 actualizarZona

- Metodo/ruta: `PUT /zonas/{idZona}`
- Permiso: `UPDATE_ZONAS`.
- Path params: `idZona`.
- Body: `nombre`, `reglas`.
- Uso frontend: reemplazar datos y reglas de una zona.
- Reglas: elimina reglas anteriores y registra las nuevas; mantiene validaciones de duplicados y existencia geografica.
