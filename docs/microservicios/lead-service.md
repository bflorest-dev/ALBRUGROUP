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

## LEAD-10 alternarEstadoCampana

- Metodo/ruta: `PATCH /campanas/{idCampana}/estado`
- Permiso: `UPDATE_CAMPANA`.
- Path params: `idCampana`.
- Uso frontend: activar o desactivar campana desde mantenimiento.
- Reglas: si la campana esta activa la desactiva; si esta inactiva la activa solo cuando el proveedor y la cuenta publicitaria asociados siguen activos.

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

## LEAD-26 getCatalogoTipificaciones

- Metodo/ruta: `GET /tipificaciones/{etapa}/catalogo`
- Permiso: evaluador por etapa. Para `PREVENTA` requiere `READ_TIPIFICACIONES_PREVENTA`.
- Path params: `etapa`.
- Uso frontend: obtener tipificaciones y subtipificaciones validas para la etapa del lead.
- Regla: frontend debe usar el catalogo para tipificar; no debe inventar codigos.

## LEAD-27 registrarIngresoLead

- Metodo/ruta: `POST /preventa/intake`
- Permiso: `CREATE_LEADS`.
- Body: `prefijo`, `lead`, `idCampana`, `base`.
- Uso frontend: registrar ingreso de lead, sea nuevo o ya existente.
- Reglas: `prefijo` debe tener formato como `+51`; `lead` debe contener solo digitos y longitud `6..15`; la campana debe estar activa.
- Efecto: si el lead es nuevo, lo crea; si ya existe y esta en `PREVENTA`, actualiza campana/base, limpia asignacion y tipificacion, y lo deja como `NUEVO`.

## LEAD-28 actualizarSnapshotsLead

- Metodo/ruta: `PATCH /preventa/{idLead}/snapshots`
- Permiso: `CREATE_LEADS`.
- Body: `numeroDocumentoTitularServicio`, `direccion`.
- Uso frontend: enriquecer un lead con datos minimos detectados antes de asignarlo o gestionarlo.
- Reglas: debe enviarse al menos uno de los dos campos; solo actualiza snapshot si la entidad completa correspondiente todavia no existe.

## LEAD-29 listarBandejaGtr

- Metodo/ruta: `GET /preventa/gtr`
- Permiso: `READ_LEADS_GTR`.
- Query params: `fecha` opcional y paginacion comun.
- Orden permitido: `lastEntryAt`, `createdAt`, `lead`, `nombreAsesorAsignado`, `estado`.
- Uso frontend: bandeja de GTR para leads registrados y gestionables del dia.
- Defaults: si `fecha` no se envia, usa la fecha actual.

## LEAD-30 listarAgendadosGtr

- Metodo/ruta: `GET /preventa/gtr/agendados`
- Permiso: `READ_LEADS_GTR`.
- Query params: paginacion comun.
- Orden permitido: `horaProgramada`, `createdAt`, `lead`, `nombreAsesorAsignado`, `estado`.
- Uso frontend: listar leads tipificados como `AGENDADO` para reasignacion o nueva gestion.

## LEAD-31 asignarLead

- Metodo/ruta: `PATCH /preventa/{idLead}/asignacion`
- Permiso: `ASSIGN_LEADS`.
- Body: `idAsesorAsignado`, `nombreAsesorAsignado`.
- Uso frontend: asignar un lead individual a un asesor de ventas.
- Reglas: no asignar a un asesor que ya gestiono el lead; al asignar se limpian tipificacion/subtipificacion y el lead queda `ASIGNADO`.

## LEAD-32 asignarLeads

- Metodo/ruta: `PATCH /preventa/asignacion-masiva`
- Permiso: `ASSIGN_LEADS`.
- Body: `idsLead`, `idAsesorAsignado`, `nombreAsesorAsignado`.
- Uso frontend: asignar multiples leads a un asesor de ventas.
- Response: totales de solicitados, procesados, asignados, fallidos y resultado por lead.
- Regla: cada lead se procesa de forma independiente; algunos pueden asignarse y otros fallar.

## LEAD-33 obtenerDetalleAsesor

- Metodo/ruta: `GET /preventa/{idLead}/detalle-asesor`
- Permiso: `READ_LEADS_ASESOR`.
- Uso frontend: ver detalle de un lead asignado en etapa `PREVENTA`.
- Regla: busca el lead para el empleado autenticado; si el lead no pertenece al asesor autenticado, responde no encontrado.

## LEAD-34 listarBandejaAsesorVentas

- Metodo/ruta: `GET /preventa/asesor-ventas`
- Permiso: `READ_LEADS_ASESOR`.
- Query params: paginacion comun.
- Orden permitido: `lastEntryAt`, `createdAt`, `lead`, `estado`.
- Uso frontend: listar leads asignados al asesor autenticado en preventa.
- Regla: solo devuelve leads en estados operativos pendientes, como `ASIGNADO` o `EN_GESTION`; excluye leads agendados para gestion GTR.

## LEAD-35 registrarContactoLead

- Metodo/ruta: `POST /preventa/{idLead}/contacto`
- Permiso: `CONTACT_LEADS`.
- Uso frontend: registrar evento de llamada/contacto con el lead.
- Reglas: solo permite leads en `ASIGNADO` o `EN_GESTION`; si estaba `ASIGNADO`, pasa a `EN_GESTION`.

## LEAD-36 actualizarDatosPreventa

- Metodo/ruta: `PATCH /preventa/{idLead}/datos-preventa`
- Permiso: `UPDATE_LEADS_ASESOR`.
- Body: `tipoDocumento`, `numeroDocumentoTitularServicio`, `ubigeoNacimiento`, `nombreTitularServicio`, `celularRegistro`, `celularReferencia`, `correo`, `nombreMadre`, `nombrePadre`, `numeroDocumentoTitularCelularRegistro`, `nombreTitularCelularRegistro`.
- Uso frontend: completar datos personales y de contacto del lead en preventa.
- Regla: opera sobre lead asignado al asesor autenticado; si estaba `ASIGNADO`, pasa a `EN_GESTION`.

## LEAD-37 actualizarDireccion

- Metodo/ruta: `PATCH /preventa/{idLead}/direccion`
- Permiso: `UPDATE_LEADS_ASESOR`.
- Body: `ubigeoDomicilio`, `tipoDomicilio`, `tipoVia`, `via`, `direccion`, `referencia`, `latitud`, `longitud`, `urbanizacion`, `numero`, `manzana`, `lote`, `nombreEdificio`, `nombreCondominio`, `plano`, `piso`, `interior`.
- Uso frontend: completar direccion del lead.
- Regla: opera sobre lead asignado al asesor autenticado; si estaba `ASIGNADO`, pasa a `EN_GESTION`.

## LEAD-38 actualizarOfertaComercial

- Metodo/ruta: `PATCH /preventa/{idLead}/oferta-comercial`
- Permiso: `UPDATE_LEADS_ASESOR`.
- Body: `idPlan`, `idPromocionInterna`, `adicionales`.
- `adicionales`: lista de `idAdicional`, `cantidad`.
- Uso frontend: seleccionar plan, promocion y adicionales ofrecidos.
- Reglas: el plan debe estar activo y vigente; no se puede seleccionar promocion sin plan; la promocion debe aplicar al plan y pertenecer al mismo proveedor.

## LEAD-39 tipificarLead

- Metodo/ruta: `POST /preventa/{idLead}/tipificacion`
- Permiso: `TYPIFY_LEADS`.
- Body: `codigoTipificacion`, `codigoSubtipificacion`, `comentario`, `horaProgramada`.
- Uso frontend: cerrar o mover el estado del lead en preventa segun catalogo.
- Reglas: la tipificacion y subtipificacion deben existir activas en etapa `PREVENTA`; `horaProgramada` es obligatoria solo para tipificacion `AGENDADO` y esta prohibida para otras tipificaciones; si la subtipificacion mueve a `VENTA`, el lead debe tener preventa, direccion y oferta completas.
- Efecto: registra evento de tipificacion; si cambia de etapa, limpia asesor asignado y deja el lead gestionado.

## LEAD-40 listarDepartamentos

- Metodo/ruta: `GET /ubigeo/departamentos`
- Permiso: `READ_UBIGEO`.
- Uso frontend: selector geografico inicial.

## LEAD-41 listarProvincias

- Metodo/ruta: `GET /ubigeo/departamentos/{idDepartamento}/provincias`
- Permiso: `READ_UBIGEO`.
- Path params: `idDepartamento`.
- Uso frontend: selector de provincias segun departamento.

## LEAD-42 listarDistritos

- Metodo/ruta: `GET /ubigeo/provincias/{idProvincia}/distritos`
- Permiso: `READ_UBIGEO`.
- Path params: `idProvincia`.
- Uso frontend: selector de distritos segun provincia.

## LEAD-43 listarLeadsMasivo

- Metodo/ruta: `GET /masivo/leads`
- Permiso: `READ_LEADS_GTR`.
- Query params: `idProveedor`, `etapa`, `tipificaciones`, `subtipificaciones`, `fechaDesde`, `fechaHasta` y paginacion comun.
- Uso frontend: consulta masiva de leads para revision o bandejas amplias de GTR.
- Nota: no forma parte del flujo minimo de GTR del borrador, pero queda documentado por compartir permiso y superficie operativa.

## LEAD-44 listarResumenSupervisorVentas

- Metodo/ruta: `GET /preventa/supervisor-ventas/resumen`
- Permiso: `READ_LEADS_SUPERVISOR_VENTAS_RESUMEN`.
- Query params: `idsAsesor` opcional como lista.
- Uso frontend: resumen por asesor para supervision comercial.
- Regla: si no se envian asesores, resume todos los asesores disponibles para el corte calculado por backend.

## LEAD-45 listarBandejaSupervisorVentas

- Metodo/ruta: `GET /preventa/supervisor-ventas/asesor/{idAsesor}/bandeja`
- Permiso: `READ_LEADS_SUPERVISOR_VENTAS_BANDEJA`.
- Path params: `idAsesor`.
- Query params: paginacion comun.
- Uso frontend: revisar la bandeja de preventa de un asesor especifico.
- Nota: reutiliza la misma logica base de bandeja de asesor, pero consultada desde supervisor.

## LEAD-46 listarBandejaVenta

- Metodo/ruta: `GET /venta`
- Permiso: `READ_LEADS_VENTA`.
- Query params: paginacion comun.
- Orden permitido: `lastEntryAt`, `createdAt`, `lead`, `nombreAsesorAsignado`, `estado`.
- Uso frontend: bandeja general de leads en etapa `VENTA`.
- Realtime sugerido: escuchar `/topic/leads/etapa/VENTA` y refrescar solo cuando cambia la disponibilidad del lead en la etapa, por ejemplo entrada a `VENTA`, toma/asignacion o salida hacia otra etapa.

## LEAD-47 listarLeadsVentaAsignados

- Metodo/ruta: `GET /venta/asignados`
- Permiso: `READ_LEADS_ASESOR`.
- Query params: paginacion comun.
- Orden permitido: `lastEntryAt`, `createdAt`, `lead`, `estado`.
- Uso frontend: listar leads de venta asignados al backoffice autenticado.
- Realtime sugerido: escuchar `/topic/leads/asesor/{empleadoId}` para refrescar la bandeja propia cuando el lead entra, cambia durante la gestion o sale de `VENTA`.

## LEAD-48 tomarLeadVenta

- Metodo/ruta: `PATCH /venta/{idLead}/asignacion`
- Permiso: `ASSIGN_LEADS`.
- Uso frontend: permitir que un backoffice se asigne a si mismo un lead de venta.
- Reglas: el lead debe estar disponible en etapa `VENTA`; si otro backoffice ya lo tomo o el lead ya no esta disponible, responde conflicto.
- Evento realtime: publica `ASIGNACION`; la bandeja general debe remover el lead y la bandeja propia del backoffice debe incorporarlo.

## LEAD-49 registrarContactoLeadVenta

- Metodo/ruta: `PATCH /venta/{idLead}/contacto`
- Permiso: `CONTACT_LEADS`.
- Uso frontend: registrar contacto operativo en etapa `VENTA`.
- Reglas: valida que el lead pertenezca al backoffice autenticado y que este en estado `ASIGNADO` o `EN_GESTION`.
- Evento realtime: publica `CONTACTO`; conviene refrescar bandeja propia, detalle e historial del lead, pero no la bandeja general si el lead ya estaba tomado.

## LEAD-50 obtenerDetalleLeadVenta

- Metodo/ruta: `GET /venta/{idLead}/detalle-asesor`
- Permiso: `READ_LEADS_VENTA`.
- Uso frontend: ver detalle del lead de venta asignado al backoffice autenticado.
- Regla: la lectura real valida `idAsesorAsignado` y etapa `VENTA`.
- Realtime sugerido: si el detalle visible coincide con `idLead`, refrescar ante `ASIGNACION`, `CONTACTO`, `DATOS_PREVENTA_ACTUALIZADOS`, `DIRECCION_ACTUALIZADA`, `OFERTA_COMERCIAL_ACTUALIZADA` o `TIPIFICACION`.

## LEAD-51 listarEventosLeadVenta

- Metodo/ruta: `GET /venta/{idLead}/eventos`
- Permiso: `READ_EVENTOS_LEADS`.
- Query params: paginacion comun.
- Uso frontend: historial de eventos del lead en venta.
- Regla: el backend solo lo permite para el lead asignado al backoffice autenticado.
- Realtime sugerido: si el historial visible coincide con `idLead`, refrescar ante cualquier evento operativo del lead, como `ASIGNACION`, `CONTACTO`, actualizaciones o `TIPIFICACION`.

## LEAD-52 actualizarDatosPreventaVenta

- Metodo/ruta: `PATCH /venta/{idLead}/datos-preventa`
- Permiso: `UPDATE_LEADS_ASESOR`.
- Body: mismo contrato que `LEAD-36`.
- Uso frontend: corregir o completar datos personales del lead en etapa `VENTA`.
- Efecto: registra evento de actualizacion.
- Evento realtime: publica `DATOS_PREVENTA_ACTUALIZADOS`; conviene refrescar bandeja propia, detalle e historial del lead.

## LEAD-53 actualizarDireccionVenta

- Metodo/ruta: `PATCH /venta/{idLead}/direccion`
- Permiso: `UPDATE_LEADS_ASESOR`.
- Body: mismo contrato que `LEAD-37`.
- Uso frontend: corregir o completar direccion del lead en etapa `VENTA`.
- Efecto: registra evento de actualizacion.
- Evento realtime: publica `DIRECCION_ACTUALIZADA`; conviene refrescar bandeja propia, detalle e historial del lead.

## LEAD-54 actualizarOfertaComercialVenta

- Metodo/ruta: `PATCH /venta/{idLead}/oferta-comercial`
- Permiso: `UPDATE_LEADS_ASESOR`.
- Body: mismo contrato que `LEAD-38`.
- Uso frontend: ajustar la oferta comercial en etapa `VENTA`.
- Regla: en el ciclo actual de `VENTA`, solo se permite una actualizacion de oferta comercial; un segundo intento responde conflicto.
- Efecto: registra evento de actualizacion comercial.
- Evento realtime: publica `OFERTA_COMERCIAL_ACTUALIZADA`; conviene refrescar bandeja propia, detalle e historial del lead.

## LEAD-55 tipificarLeadVenta

- Metodo/ruta: `PATCH /venta/{idLead}/tipificacion`
- Permiso: `TYPIFY_LEADS`.
- Body: `codigoTipificacion`, `codigoSubtipificacion`, `comentario`, `fechaInstalacion`.
- Uso frontend: tipificar leads en etapa `VENTA`.
- Reglas: usa catalogo de `VENTA`; si la subtipificacion mueve a `POSTVENTA`, se exige `fechaInstalacion`, plan seleccionado y proveedor con cortes de facturacion configurados.
- Efecto: si cambia de etapa, limpia asignacion y tipificaciones de venta; registra evento de tipificacion.
- Evento realtime: publica `TIPIFICACION`; si el lead sale de `VENTA`, la bandeja propia debe removerlo y la bandeja general solo debe refrescarse si la disponibilidad de la etapa cambia.
