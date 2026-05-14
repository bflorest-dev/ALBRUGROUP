# RRHH

Documento funcional y tecnico para implementar la vista de trabajo del rol RRHH en frontend.

Este documento no define layout, navegacion ni decisiones visuales. Su objetivo es dejar claro el flujo operativo, el uso pensado de cada endpoint y las reglas que frontend debe respetar para no romper la logica del backend.

RRHH opera sobre tres microservicios dentro de este bloque:

- `auth-service` para acceso;
- `recruitment-service` para postulaciones y bandeja de contratacion;
- `rrhh-service` para empleado, contrato, pago y eventos del empleado;
- `schedule-service` para asistencia, horarios y cumplimiento.

Cuando en este documento se diga "uso pensado", se refiere al uso operativo recomendado para frontend. Cuando se diga `Inferencia desde backend`, se trata de una conclusion reconstruida a partir del codigo y no de una nota explicita previa.

## INICIO DE SESION

### Proposito del flujo

Permitir que cualquier usuario del rol RRHH pueda ingresar al sistema usando el flujo real de acceso definido en `auth-service`.

Este flujo esta pensado para dos casos:

- empleado nuevo que aun no tiene su password inicializada;
- empleado existente que ya cuenta con una password vigente o necesita regenerarla.

El frontend no debe empezar pidiendo username y password al mismo tiempo. Primero debe pedir solo el `username`, validar el estado de acceso y, segun la respuesta, decidir si muestra el formulario normal de login o el formulario de reseteo/inicializacion de password.

### Secuencia esperada en frontend

1. El usuario ingresa su `username`.
2. Frontend consulta el estado de acceso del usuario.
3. Si el usuario esta activo y `passwordInicializada = true`, frontend conserva el `username` y muestra el campo `password`.
4. Si el usuario esta activo y `passwordInicializada = false`, frontend no debe permitir login todavia y debe derivarlo al formulario de reseteo/inicializacion.
5. En el formulario de reseteo, frontend solicita `username`, `dni` y `email`.
6. Si el reseteo es exitoso, el sistema devuelve una nueva password.
7. El usuario vuelve al login normal usando su `username` y la nueva password.

### Endpoint 1

**Endpoint**  
`GET /autorizacion/estado-acceso/{username}`

**Uso dentro del flujo**  
Es el primer endpoint del flujo de acceso. Sirve para que frontend decida si el usuario debe continuar con login normal o pasar por inicializacion/regeneracion de password.

**Request**

- Path param:
  - `username: string`
  - obligatorio;
  - funcion: identificar la cuenta cuyo estado de acceso debe consultarse.

**Response**

- `200 OK`
- Body:
  - `activo: boolean`
  - `passwordInicializada: boolean`

**Funcion**

- Busca el usuario por `username`.
- Informa si el usuario esta activo.
- Informa si su password ya fue inicializada o si todavia debe pasar por el flujo de reseteo.

**Reglas de negocio implicitas**

- Este endpoint no autentica al usuario; solo informa el estado de acceso.
- Si el `username` no existe, responde error.
- Si `activo = false`, el usuario no debe continuar con el flujo operativo.
- Si `passwordInicializada = false`, frontend debe derivar obligatoriamente al formulario de reseteo/inicializacion.
- Si `passwordInicializada = true`, frontend ya puede pedir password y habilitar el login normal.
- Es un endpoint publico; no requiere token.

**Consideraciones frontend**

- Debe ser el primer paso de la pantalla de acceso.
- El `username` ingresado debe mantenerse para no obligar al usuario a escribirlo otra vez.
- La respuesta de este endpoint define que bloque visual mostrar:
  - formulario de login;
  - formulario de reseteo/inicializacion;
  - mensaje de acceso no disponible si el usuario esta inactivo.
- No debe tratarse como una autenticacion exitosa ni como creacion de sesion.

### Endpoint 2

**Endpoint**  
`POST /autorizacion/login`

**Uso dentro del flujo**  
Se usa solo cuando el usuario ya cuenta con una password vigente y puede iniciar sesion de manera normal.

**Request**

- Body:
  - `username: string`
  - `password: string`
  - ambos obligatorios;
  - `username` identifica la cuenta;
  - `password` autentica la sesion.

**Response**

- `200 OK`
- Body:
  - `token: string`
  - `type: string`
  - `username: string`
  - `empleadoId: number`
  - `nombreCompleto: string`
  - `roles: string[]`

**Funcion**

- Autentica al usuario usando `username` y `password`.
- Genera el JWT de sesion.
- Devuelve el contexto minimo que frontend necesita para identificar al usuario autenticado.

**Reglas de negocio implicitas**

- El login se realiza con `username`, no con email.
- Este endpoint no esta pensado como primer paso del flujo; antes debe consultarse `estado-acceso`.
- Devuelve el token con tipo `Bearer`.
- Los roles devueltos corresponden a las authorities con prefijo `ROLE_`, pero en la respuesta se entregan sin ese prefijo.
- El `empleadoId` devuelto debe considerarse el identificador operativo del usuario autenticado.
- Es un endpoint publico; no requiere token previo.

**Consideraciones frontend**

- Si `estado-acceso` ya confirmo que el usuario puede iniciar sesion, frontend debe mantener el `username` precargado y pedir solo la `password`.
- El `token` debe almacenarse para las siguientes peticiones autenticadas.
- `roles` sirve para enrutar o validar la vista que corresponde al usuario.
- `nombreCompleto` y `empleadoId` pueden usarse para cabecera de sesion, contexto de usuario y llamadas posteriores.

### Endpoint 3

**Endpoint**  
`POST /autorizacion/forgot-password`

**Uso dentro del flujo**  
Se usa para generar una nueva password cuando el usuario aun no ha inicializado su acceso o cuando necesita regenerar su password nuevamente.

**Request**

- Body:
  - `username: string`
  - `email: string`
  - `dni: string`
  - todos obligatorios;
  - funcion: validar identidad del usuario antes de devolver una nueva password.

**Response**

- `200 OK`
- Body:
  - `username: string`
  - `password: string`

**Funcion**

- Valida que `username`, `email` y `dni` correspondan al mismo usuario.
- Si los datos coinciden, genera una nueva password aleatoria.
- Guarda la nueva password y marca la cuenta como `passwordInicializada = true`.

**Reglas de negocio implicitas**

- Este endpoint cumple dos funciones:
  - inicializar la password del empleado nuevo;
  - regenerar la password de un empleado existente.
- No basta con conocer el `username`; para completar el reseteo deben coincidir exactamente `username + email + dni`.
- Si el usuario esta inactivo, la operacion se rechaza.
- La nueva password se devuelve directamente en la respuesta.
- Despues de usar este endpoint, el siguiente paso natural es volver al flujo de login normal.
- Es un endpoint publico; no requiere token.

**Consideraciones frontend**

- Cuando `passwordInicializada = false`, frontend debe usar este endpoint como paso obligatorio antes del login.
- El formulario de reseteo debe pedir exactamente `username`, `dni` y `email`.
- El `username` puede venir precargado desde la primera pantalla.
- La password recibida debe tratarse como informacion sensible y mostrarse de manera clara y controlada al usuario.
- Despues de obtener la nueva password, frontend debe redirigir al login normal conservando el `username`.

### Resumen funcional para frontend

- El flujo inicia pidiendo solo `username`.
- `estado-acceso` decide si el usuario ve login normal o reseteo/inicializacion.
- `forgot-password` no solo sirve para "olvide mi password"; tambien sirve para la primera activacion funcional del acceso.
- `login` solo debe ejecutarse cuando el usuario ya tiene una password vigente.

## ASISTENCIA BASE DEL EMPLEADO

Este bloque no es exclusivo de RRHH. Se deja aqui justo despues de login porque RRHH tambien es un empleado y este mismo bloque puede repetirse luego en los documentos de otros roles.

Todos estos endpoints pertenecen a `schedule-service` y su uso es de autoservicio sobre el propio usuario autenticado.

### Uso operativo general

- `registrarIngreso` abre la jornada del dia.
- `registrarSalida` cierra la jornada.
- `iniciarAlmuerzo` y `finalizarAlmuerzo` controlan la pausa de almuerzo.
- `iniciarServicios` y `finalizarServicios` controlan pausas de servicios.
- `getAsistenciaDia` sirve para ver el estado detallado del dia.
- `getAsistenciaMes` sirve para ver calendario/resumen del mes.

### Endpoint: registrarIngreso

**Endpoint**  
`POST /asistencia/ingreso`

**Uso pensado**  
Primer paso operativo del dia. Si todavia no existe registro de asistencia para esa fecha, el backend lo crea usando el horario vigente del empleado.

**Body**

- `fechaHora: LocalDateTime`
  - obligatorio;
  - funcion: fecha y hora exacta del ingreso.

**Reglas**

- Si ya existe ingreso para esa fecha, responde error.
- Si la fecha no es laborable segun horario vigente, responde error.
- Requiere que el empleado tenga horario vigente aplicable para esa fecha.

### Endpoint: registrarSalida

**Endpoint**  
`POST /asistencia/salida`

**Uso pensado**  
Cierre de jornada del dia ya iniciado.

**Body**

- `fechaHora: LocalDateTime`
  - obligatorio;
  - funcion: fecha y hora exacta de salida.

**Reglas**

- No puede ejecutarse si no existe ingreso previo.
- No puede ejecutarse si ya se registro salida.
- No puede ejecutarse con almuerzo o servicios activos.
- Al cerrar la jornada recalcula minutos trabajados y balance del dia.

### Endpoint: iniciarAlmuerzo

**Endpoint**  
`POST /asistencia/almuerzo/inicio`

**Uso pensado**  
Inicia pausa de almuerzo dentro de una jornada ya abierta.

**Body**

- `fechaHora: LocalDateTime`
  - obligatorio.

**Reglas**

- El empleado debe estar `ONLINE`.
- No puede ejecutarse si el almuerzo ya fue iniciado antes.

### Endpoint: finalizarAlmuerzo

**Endpoint**  
`POST /asistencia/almuerzo/fin`

**Uso pensado**  
Cierra la pausa de almuerzo y devuelve al empleado a estado `ONLINE`.

**Body**

- `fechaHora: LocalDateTime`
  - obligatorio.

**Reglas**

- Solo puede ejecutarse si hay un almuerzo activo.
- Calcula y guarda los minutos de almuerzo tomados.

### Endpoint: iniciarServicios

**Endpoint**  
`POST /asistencia/servicios/inicio`

**Uso pensado**  
Inicia una pausa de servicios dentro de una jornada ya abierta.

**Body**

- `fechaHora: LocalDateTime`
  - obligatorio.

**Reglas**

- El empleado debe estar `ONLINE`.
- No puede existir otro bloque de servicios en curso.

### Endpoint: finalizarServicios

**Endpoint**  
`POST /asistencia/servicios/fin`

**Uso pensado**  
Finaliza el bloque de servicios activo.

**Body**

- `fechaHora: LocalDateTime`
  - obligatorio.

**Reglas**

- Solo puede ejecutarse si existe un bloque de servicios en curso.
- Acumula minutos de servicios.
- Marca si se excedio el tiempo permitido por el horario.

### Endpoint: getAsistenciaDia

**Endpoint**  
`GET /asistencia/dia`

**Uso pensado**  
Consultar el detalle operativo de un dia especifico o del dia actual.

**Query params**

- `fecha: LocalDate`
  - opcional;
  - default: fecha actual si no se envia;
  - funcion: consultar un dia distinto al actual.

**Reglas**

- Si no existe asistencia registrada para ese dia, responde error.
- No crea asistencia nueva; solo consulta.

### Endpoint: getAsistenciaMes

**Endpoint**  
`GET /asistencia/mes`

**Uso pensado**  
Consultar el calendario mensual de asistencia del propio empleado.

**Query params**

- `anio: integer`
  - opcional;
  - debe enviarse junto con `mes`.
- `mes: integer`
  - opcional;
  - rango valido `1..12`;
  - debe enviarse junto con `anio`.

**Defaults**

- si no se envia `anio` ni `mes`, usa el mes actual;
- si se envia uno sin el otro, responde error;
- si se consulta un mes futuro, devuelve lista vacia.

## FLUJO 1. GESTION DE POSTULANTES

Este bloque pertenece a `recruitment-service`.

### Objetivo del flujo

Permitir que RRHH registre postulantes, actualice postulaciones, consulte listados operativos y llegue a la bandeja de contratacion desde donde empieza el puente hacia `rrhh-service`.

### Secuencia operativa pensada

1. Obtener las ofertas activas disponibles.
2. Registrar la postulacion sobre una oferta activa.
3. Editar la postulacion si aun falta corregir datos.
4. Consultar listados de postulaciones usando filtros operativos.
5. Revisar el historial de eventos de una postulacion cuando se necesite contexto.
6. Consultar la bandeja de contratacion para identificar postulaciones listas para pasar al flujo de empleado/contrato.

### Endpoint: listarOfertasActivas

**Endpoint**  
`GET /ofertas-laborales/activas`

**Uso pensado**  
Catalogo inicial de ofertas a las que RRHH puede asociar una postulacion nueva.

**Parametros**

- no recibe params.

**Funcion**

- devuelve solo ofertas activas;
- debe usarse para poblar selector/lista de oferta al registrar postulacion.

**Reglas**

- una postulacion solo puede registrarse o editarse con una oferta activa.

### Endpoint: registrarPostulacion

**Endpoint**  
`POST /postulaciones`

**Uso pensado**  
Alta inicial de una postulacion.

**Body**

- `idOfertaLaboral: Long`
  - obligatorio;
  - funcion: oferta activa sobre la que se registra la postulacion.
- `origen: Origen`
  - obligatorio;
  - funcion: registrar la procedencia operativa del postulante.
- `postulante: PostulanteRequest`
  - obligatorio;
  - funcion: datos del postulante.

**Funcion**

- crea o actualiza el postulante asociado;
- crea la postulacion en:
  - `etapa = RECLUTAMIENTO`
  - `estado = EN_PROCESO`
  - `estadoBandeja = POSTULANTE`

**Inferencia desde backend**

- frontend puede tratar este endpoint como la puerta formal de entrada al pipeline de reclutamiento. No solo guarda datos, tambien inicializa el estado operativo de la postulacion.

### Endpoint: editarPostulacion

**Endpoint**  
`PUT /postulaciones/{idPostulacion}`

**Uso pensado**  
Corregir o actualizar datos de una postulacion ya creada.

**Path params**

- `idPostulacion: Long`
  - obligatorio;
  - positivo;
  - funcion: identificar la postulacion a modificar.

**Body**

- misma estructura que `registrarPostulacion`.

**Reglas**

- permite cambiar postulante, oferta activa y origen;
- si la oferta no esta activa, responde error.

### Endpoint: listarPostulaciones

**Endpoint**  
`GET /postulaciones`

**Uso pensado**  
Listado general de postulaciones con filtros operativos amplios.

**Query params**

- `etapa: Etapa`
  - opcional;
  - funcion: filtrar por etapa del flujo.
- `estado: EstadoPostulacion`
  - opcional;
  - funcion: filtrar por estado general de la postulacion.
- `estadoBandeja: EstadoBandejaPostulacion`
  - opcional;
  - funcion: filtrar por estado de bandeja.
- `pageNumber: integer`
  - opcional;
  - default `0`.
- `pageSize: integer`
  - opcional;
  - default `8`;
  - maximo `100`.
- `sortBy: string`
  - opcional;
  - default `createdAt`.
- `direction: string`
  - opcional;
  - default `asc`.

**Campos de orden permitidos**

- `id`
- `createdAt`
- `updatedAt`
- `etapa`
- `estado`
- `estadoBandeja`
- `origen`

**Uso pensado en frontend**

- endpoint base para listados amplios;
- cuando RRHH quiera una bandeja mas precisa del proceso, conviene usar vistas especializadas como `listarBandejaContratacion`.

### Endpoint: listarEventosPorPostulacion

**Endpoint**  
`GET /postulaciones/{idPostulacion}/eventos`

**Uso pensado**  
Ver historial de cambios/eventos de una postulacion especifica.

**Path params**

- `idPostulacion: Long`
  - obligatorio.

**Query params**

- `pageNumber`, `pageSize`, `sortBy`, `direction`
  - opcionales;
  - defaults iguales al `PageRequest` de `recruitment-service`.

**Funcion**

- sirve como auditoria operativa de una postulacion;
- frontend puede mostrarlo como historial o timeline.

### Endpoint: listarBandejaContratacion

**Endpoint**  
`GET /postulaciones/bandeja/contratacion`

**Uso pensado**  
Listar solo las postulaciones que ya estan en etapa de contratacion y listas para pasar al bloque RRHH.

**Query params**

- `pageNumber`, `pageSize`, `sortBy`, `direction`
  - opcionales;
  - defaults:
    - `pageNumber = 0`
    - `pageSize = 8`
    - `sortBy = createdAt`
    - `direction = asc`

**Funcion**

- devuelve postulaciones en `Etapa.CONTRATACION`;
- aplica una restriccion adicional de "listo para contratacion".

**Inferencia desde backend**

- este endpoint debe tratarse como la salida natural de `recruitment-service` hacia RRHH;
- desde esta bandeja se decide si el caso continua con:
  - alta de empleado;
  - registro de contrato;
  - confirmacion final de contratacion usando `idPostulacion`.

## FLUJO 2. REGISTRO Y ACTUALIZACION DE EMPLEADOS

Este bloque pertenece a `rrhh-service`.

### Objetivo del flujo

Registrar empleados y completar o corregir sus datos operativos antes del contrato.

### Regla operativa importante

Aunque `registrarEmpleado` permite crear un empleado directamente, el backend exige que un empleado tenga datos personales, contacto, ubicacion y financieros completos antes de poder registrar contrato. Por eso frontend debe tratar este bloque como preparacion obligatoria del empleado para el flujo contractual.

### Endpoint: listarEmpresasContratistas

**Endpoint**  
`GET /empresas-contratistas`

**Uso pensado**  
Catalogo previo para seleccionar empresa contratista cuando aplique.

**Query params**

- `activo: Boolean`
  - opcional;
  - default real: `true` si no se envia;
  - funcion: decidir si listar solo activas o tambien inactivas.

**Uso frontend**

- debe servir como fuente de selector, no como pantalla de mantenimiento dentro del flujo de alta de empleado.

### Endpoint: registrarEmpleado

**Endpoint**  
`POST /empleados`

**Uso pensado**  
Registrar un nuevo empleado con sus datos base.

**Body**

- `nombres: string` obligatorio.
- `apellidos: string` obligatorio.
- `tipoDocumento: Documento` obligatorio.
- `numeroDocumento: string` obligatorio.
- `nacionalidad: Nacionalidad` obligatorio.
- `fechaNacimiento: LocalDate` obligatorio.
- `estadoCivil: EstadoCivil` obligatorio.
- `tieneHijos: Boolean` obligatorio.
- `celularPersonal: string` obligatorio.
- `correoPersonal: string` obligatorio.
- `origen: Origen` obligatorio.
- `distrito: Distrito` obligatorio.
- `direccion: string` obligatorio.
- `banco: Banco` obligatorio.
- `cuentaBancaria: string` obligatorio.
- `cuentaInterbancaria: string` obligatorio.
- `cuentaPropia: Boolean` obligatorio.
- `parentesco: Parentesco` opcional.
- `celularTransferencia: string` opcional.
- `idEmpresaContratista: Long` opcional.

**Funcion**

- permite alta directa del empleado;
- tambien puede usarse tomando como referencia un postulante aprobado, aunque el endpoint no exige `idPostulacion`.

**Inferencia desde backend**

- si frontend parte desde la bandeja de contratacion, debe precargar aqui toda la informacion ya disponible del postulante para no reingresar datos manualmente.

### Endpoint: actualizarDatosPersonales

**Endpoint**  
`PATCH /empleados/{id}/datos-personales`

**Uso pensado**  
Corregir o completar identidad y datos personales.

**Path params**

- `id: Long`
  - obligatorio;
  - positivo.

**Body**

- `nombres`, `apellidos`, `tipoDocumento`, `numeroDocumento`, `nacionalidad`, `fechaNacimiento`, `estadoCivil`, `tieneHijos`
  - todos obligatorios dentro de este request.

**Uso frontend**

- no es un patch parcial campo a campo;
- debe enviarse el bloque completo de datos personales.

### Endpoint: actualizarDatosContactoUbicacion

**Endpoint**  
`PATCH /empleados/{id}/datos-contacto-ubicacion`

**Uso pensado**  
Corregir o completar contacto personal y ubicacion.

**Body**

- `celularPersonal: string` obligatorio.
- `correoPersonal: string` obligatorio.
- `distrito: Distrito` obligatorio.
- `direccion: string` obligatorio.

### Endpoint: actualizarDatosFinancieros

**Endpoint**  
`PATCH /empleados/{id}/datos-financieros`

**Uso pensado**  
Completar o corregir los datos necesarios para pago.

**Body**

- `banco: Banco` obligatorio.
- `cuentaBancaria: string` obligatorio.
- `cuentaInterbancaria: string` obligatorio.
- `cuentaPropia: Boolean` obligatorio.
- `parentesco: Parentesco` opcional.
- `celularTransferencia: string` opcional.
- `idEmpresaContratista: Long` opcional.

**Uso frontend**

- si `cuentaPropia = false`, conviene tratar `parentesco` y `celularTransferencia` como datos funcionalmente relevantes aunque el backend no los marque como obligatorios a nivel de anotacion.

### Endpoint: actualizarDatosCorporativos

**Endpoint**  
`PATCH /empleados/{id}/datos-corporativos`

**Uso pensado**  
Agregar o corregir datos corporativos del empleado.

**Body**

- `celularCorporativo: string` obligatorio.
- `correoCorporativo: string` obligatorio.

**Regla operativa**

- si existe correo corporativo, el flujo de usuario en `auth-service` usara ese correo como preferente al registrar o actualizar el usuario del empleado durante la contratacion.

### Endpoint: marcarListaNegra

**Endpoint**  
`PATCH /empleados/{id}/lista-negra`

**Uso pensado**  
Marcar un empleado como no apto para recontratacion.

**Path params**

- `id: Long`
  - obligatorio.

**Uso frontend**

- tratarlo como accion sensible de estado, no como edicion comun.

### Endpoints de consulta de empleados

#### getEmpleados

**Endpoint**  
`GET /empleados`

**Uso pensado**  
Listado general con filtros administrativos.

**Query params**

- `q: string` opcional. Texto libre.
- `dni: string` opcional.
- `celular: string` opcional.
- `distrito: Distrito` opcional.
- `banco: Banco` opcional.
- `idEmpresaContratista: Long` opcional.
- `origen: Origen` opcional.
- `estado: EstadoOperativo` opcional.
- `pageNumber` opcional, default `0`.
- `pageSize` opcional, default `8`, max `100`.
- `sortBy` opcional, default `createdAt`.
- `direction` opcional, default `asc`.

**Uso frontend**

- endpoint principal para bandejas administrativas amplias;
- sirve cuando se necesitan filtros combinados.

#### obtenerEmpleadoFiltroUniversal

**Endpoint**  
`GET /empleados/{dato}/universal`

**Uso pensado**  
Busqueda rapida por un dato unico.

**Path params**

- `dato: string`
  - obligatorio;
  - puede ser documento, nombres, apellidos, celular o correo.

**Uso frontend**

- util para un buscador global unico cuando no se quiere mostrar filtros avanzados.

#### listarEmpleadosLight

**Endpoint**  
`GET /empleados/light`

**Uso pensado**  
Catalogo ligero de empleados activos con contrato vigente al dia actual.

**Query params**

- `puestosTrabajo: List<PuestoTrabajo>`
  - opcional;
  - funcion: limitar el catalogo a uno o varios puestos.

**Inferencia desde backend**

- este endpoint conviene para selects, autocompletes o pickers, no para tablas administrativas completas.

#### getEmpleadoNumeroDocumento

**Endpoint**  
`GET /empleados/{documento}/numero-documento`

**Uso pensado**  
Busqueda directa por numero de documento.

**Path params**

- `documento: string`
  - obligatorio;
  - funcion: obtener un unico empleado si ya se conoce el documento exacto.

## FLUJO 3. GESTION DE CONTRATOS

Este bloque pertenece a `rrhh-service`, pero puede cerrar el flujo pendiente en `recruitment-service` si se envia `idPostulacion`.

### Objetivo del flujo

Registrar el contrato vigente del empleado, consultar historico, obtener contrato actual y finalizar contratos cuando corresponda.

### Regla funcional para frontend

Frontend debe usar este bloque inmediatamente despues de completar el empleado cuando el caso corresponde a una nueva contratacion. El backend permite registrar empleado y contrato por separado, pero no permite contratar si al empleado le faltan datos base obligatorios.

### Endpoint: registrarContrato

**Endpoint**  
`POST /contratos/{id}/registrar`

**Uso pensado**  
Paso inmediatamente posterior al alta o regularizacion del empleado.

**Path params**

- `id: Long`
  - obligatorio;
  - id del empleado a contratar.

**Headers**

- `Authorization: string`
  - funcionalmente obligatorio;
  - aunque el controller lo reciba como opcional, el service lo exige;
  - si falta, responde `401` con mensaje de falta de authorization.

**Body**

- `idPostulacion: Long`
  - opcional;
  - funcion: si el empleado proviene de `recruitment-service`, permite confirmar esa contratacion en el backend de recruitment despues del commit.
- `puestoTrabajo: PuestoTrabajo`
  - obligatorio.
- `regimen: Regimen`
  - obligatorio.
- `modalidad: Modalidad`
  - obligatorio.
- `seguroSalud: SeguroSalud`
  - opcional.
- `sistemaPensiones: SistemaPensiones`
  - opcional.
- `sueldoBase: BigDecimal`
  - obligatorio;
  - debe ser mayor a `0`.
- `fechaInicio: LocalDate`
  - obligatorio.
- `fechaFin: LocalDate`
  - opcional.

**Funcion**

- valida que el empleado exista;
- valida que el empleado tenga completos los datos minimos requeridos;
- activa operativamente al empleado;
- si existe contrato vigente que se cruza con la nueva fecha de inicio, cierra el anterior en `fechaInicio - 1 dia`;
- registra o actualiza el usuario en `auth-service` despues del commit;
- si llega `idPostulacion`, confirma la contratacion en `recruitment-service` despues del commit.

**Reglas importantes**

- si `fechaFin` no se envia y existe contrato futuro a partir de esa fecha, responde conflicto y exige enviar fecha fin;
- si `fechaInicio` y `fechaFin` se solapan con un contrato existente, responde conflicto;
- el endpoint no debe ejecutarse sobre empleados incompletos.

### Endpoint: listarContratosEmpleado

**Endpoint**  
`GET /contratos/{id}/historico`

**Uso pensado**  
Consultar el historico completo de contratos de un empleado.

**Query params**

- `pageNumber` opcional, default `0`.
- `pageSize` opcional, default `8`, max `100`.
- `sortBy` opcional, default `createdAt`.
- `direction` opcional, default `asc`.

**Campos de orden permitidos**

- `id`
- `createdAt`
- `updatedAt`
- `fechaInicio`
- `fechaFin`
- `sueldoBase`

### Endpoint: getContratoVigenteEmpleado

**Endpoint**  
`GET /contratos/{id}/vigente`

**Uso pensado**  
Consultar el contrato vigente segun la fecha actual.

**Path params**

- `id: Long`
  - obligatorio.

**Uso frontend**

- usarlo para contexto operativo actual del empleado;
- si no existe contrato vigente hoy, responde error.

### Endpoint: finalizarContrato

**Endpoint**  
`PATCH /contratos/{id}/cesar-contrato`

**Uso pensado**  
Cierre operativo del contrato vigente del empleado.

**Path params**

- `id: Long`
  - obligatorio.

**Headers**

- `Authorization: string`
  - funcionalmente obligatorio.

**Body**

- `fechaFin: LocalDate`
  - obligatorio;
  - funcion: fecha exacta de cese.

**Funcion**

- busca el contrato vigente para esa fecha;
- actualiza su `fechaFin`;
- cambia al empleado a estado `INACTIVO`;
- deshabilita el usuario en `auth-service` despues del commit.

## FLUJO 4. GESTION DE HORARIOS Y CUMPLIMIENTO

Este bloque pertenece a `schedule-service`.

### Objetivo del flujo

Asignar horario al empleado contratado, administrar excepciones, consultar vigencias e inspeccionar cumplimiento.

### Regla operativa

Idealmente se usa justo despues de `registrarContrato`, pero no es obligatoriamente en el mismo momento. Aun asi, mientras el empleado no tenga horario vigente, varios comportamientos de asistencia quedaran bloqueados o incompletos.

### Endpoint: registrarHorario

**Endpoint**  
`POST /horarios`

**Uso pensado**  
Alta inicial del horario del empleado.

**Body**

- `idEmpleado: Long`
  - obligatorio.
- `idContrato: Long`
  - obligatorio.
- `modalidad: ModalidadContrato`
  - obligatorio.
- `fechaInicio: LocalDate`
  - obligatorio.
- `compensable: Boolean`
  - obligatorio a nivel de request;
  - default real del DTO: `true`.
- `detalles: List<BloqueHorarioRequest>`
  - obligatorio;
  - no puede venir vacio.

**Reglas**

- no se pueden repetir dias dentro de `detalles`;
- no puede existir solapamiento con otro horario del empleado.

### Endpoint: reemplazarHorario

**Endpoint**  
`PUT /horarios/{idHorario}`

**Uso pensado**  
Reemplazar un horario vigente por una nueva vigencia.

**Path params**

- `idHorario: Long`
  - obligatorio.

**Body**

- `modalidad: ModalidadContrato` obligatorio.
- `fechaInicio: LocalDate` obligatorio.
- `compensable: Boolean` obligatorio con default DTO `true`.
- `detalles: List<BloqueHorarioRequest>` obligatorio.

**Funcion**

- cierra el horario actual en `fechaInicio - 1 dia`;
- crea uno nuevo heredando `idEmpleado` e `idContrato`.

**Reglas**

- la nueva `fechaInicio` debe ser posterior a la del horario actual;
- no puede generar solapamientos;
- no puede repetir dias en `detalles`.

### Endpoint: finalizarHorario

**Endpoint**  
`PATCH /horarios/{idHorario}/finalizar`

**Uso pensado**  
Cerrar manualmente una vigencia de horario sin crear otra de reemplazo en el mismo paso.

**Body**

- `fechaFin: LocalDate`
  - obligatorio.

**Reglas**

- `fechaFin` no puede ser anterior a `fechaInicio` del horario.

### Endpoint: registrarExcepcion

**Endpoint**  
`POST /horarios/{idHorario}/excepciones`

**Uso pensado**  
Registrar una modificacion puntual sobre un dia concreto de un horario.

**Body**

- `fecha: LocalDate` obligatorio.
- `tipo: TipoExcepcionHorario` obligatorio.
- `horaEntrada: LocalTime` opcional.
- `horaSalida: LocalTime` opcional.
- `inicioAlmuerzo: LocalTime` opcional.
- `finAlmuerzo: LocalTime` opcional.
- `laborable: Boolean` opcional.
- `motivo: string` obligatorio.

**Reglas**

- la fecha debe estar dentro de la vigencia del horario;
- no puede existir otra excepcion para la misma fecha en ese horario.

### Endpoint: actualizarExcepcion

**Endpoint**  
`PUT /horarios/{idHorario}/excepciones/{idExcepcion}`

**Uso pensado**  
Corregir una excepcion ya creada.

**Reglas**

- mantiene las mismas validaciones que `registrarExcepcion`.

### Endpoint: eliminarExcepcion

**Endpoint**  
`DELETE /horarios/{idHorario}/excepciones/{idExcepcion}`

**Uso pensado**  
Eliminar una excepcion puntual ya no aplicable.

### Endpoint: getHorarioMes

**Endpoint**  
`GET /horarios/mes`

**Uso pensado**  
Consulta mensual del propio horario del usuario autenticado.

**Query params**

- `anio: integer`
  - opcional;
  - debe enviarse junto con `mes`.
- `mes: integer`
  - opcional;
  - rango `1..12`;
  - debe enviarse junto con `anio`.

**Defaults**

- si no se envia ninguno, usa el mes actual;
- si se envia solo uno, responde error.

**Funcion**

- devuelve las vigencias de horario aplicables dentro del mes;
- incluye excepciones del mismo rango;
- sirve como calendario detallado del horario.

### Endpoint: getHorarioVigente

**Endpoint**  
`GET /horarios/empleados/{idEmpleado}/vigente`

**Uso pensado**  
Consultar el horario vigente de un empleado para una fecha especifica o para hoy.

**Query params**

- `fecha: LocalDate`
  - opcional;
  - default real: fecha actual.

### Endpoint: listarHistorico

**Endpoint**  
`GET /horarios/empleados/{idEmpleado}/historico`

**Uso pensado**  
Historial completo de horarios de un empleado.

**Query params**

- `pageNumber` opcional, default `0`.
- `pageSize` opcional, default `8`, max `100`.
- `sortBy` opcional, default `fechaInicio`.
- `direction` opcional, default `desc`.

### Endpoint: getCumplimientoResumen

**Endpoint**  
`POST /revision/asistencia/cumplimiento/resumen`

**Uso pensado**  
Vista resumida de cumplimiento para uno o varios empleados dentro de un rango.

**Body**

- `empleadoIds: List<Long>`
  - obligatorio;
  - no puede ser vacio;
  - el backend elimina duplicados.
- `desde: LocalDate`
  - obligatorio.
- `hasta: LocalDate`
  - obligatorio.

**Reglas**

- `desde` no puede ser posterior a `hasta`.

**Funcion**

- devuelve metricas agregadas:
  - dias laborables;
  - dias con registro;
  - dias sin registro;
  - dias cerrados;
  - tardanzas;
  - minutos objetivo;
  - minutos trabajados;
  - balance;
  - servicios acumulados.

### Endpoint: getCumplimientoDetalle

**Endpoint**  
`POST /revision/asistencia/cumplimiento/detalle`

**Uso pensado**  
Desglose diario del cumplimiento por empleado dentro de un rango.

**Body**

- misma estructura que `getCumplimientoResumen`.

**Uso frontend**

- usarlo cuando RRHH necesite auditar dia por dia, no solo ver agregados.

## FLUJO 5. GESTION DE PAGOS

Este bloque pertenece a `rrhh-service`.

### Objetivo del flujo

Registrar pagos de contratos y consultar historial de pagos filtrado por contrato, empleado o rango de fechas.

### Endpoint: registrarPago

**Endpoint**  
`POST /pagos/{id}/pagar-contrato`

**Uso pensado**  
Registrar el pago de un contrato especifico.

**Path params**

- `id: Long`
  - obligatorio;
  - corresponde al `idContrato`.

**Body**

- `fechaInicio: LocalDate`
  - opcional.
- `fechaFin: LocalDate`
  - opcional.
- `asignacionFamiliar: BigDecimal`
  - obligatorio;
  - debe ser mayor a `0`.
- `bonoPuntualidad: BigDecimal`
  - opcional;
  - si se envia debe ser mayor a `0`.
- `comisionSemanal: BigDecimal`
  - opcional;
  - si se envia debe ser mayor a `0`.
- `comisionMensual: BigDecimal`
  - opcional;
  - si se envia debe ser mayor a `0`.
- `bonoExtra: BigDecimal`
  - opcional;
  - si se envia debe ser mayor a `0`.

**Defaults del periodo**

- si no se envia `fechaInicio` ni `fechaFin`, toma el mes actual completo;
- si se envia `fechaInicio` sin `fechaFin`, usa como fin el ultimo dia de ese mismo mes;
- si se envia `fechaFin` sin `fechaInicio`, usa como inicio el primer dia de ese mismo mes.

**Reglas**

- el periodo no puede iniciar antes del contrato;
- si el contrato tiene `fechaFin`, el pago no puede terminar despues de esa fecha;
- `fechaFin` no puede ser anterior a `fechaInicio`.

**Inferencia desde backend**

- frontend debe usar este endpoint sobre contratos, no sobre empleados aislados. El empleado es contexto derivado del contrato.

### Endpoint: getPagos

**Endpoint**  
`GET /pagos`

**Uso pensado**  
Consultar pagos ya registrados con filtros combinables.

**Query params**

- `contrato: Long`
  - opcional;
  - filtro por contrato.
- `empleado: Long`
  - opcional;
  - filtro por empleado.
- `desde: LocalDate`
  - opcional;
  - sin default.
- `hasta: LocalDate`
  - opcional;
  - sin default.
- `pageNumber` opcional, default `0`.
- `pageSize` opcional, default `8`, max `100`.
- `sortBy` opcional, default `createdAt`.
- `direction` opcional, default `asc`.

**Uso frontend**

- sirve como listado administrativo general;
- si ya se esta dentro del contexto de un empleado, conviene precargar `empleado`;
- si ya se esta dentro del contexto de un contrato, conviene precargar `contrato`.

## FLUJO 6. EVENTOS DEL EMPLEADO

Este bloque pertenece a `rrhh-service`.

### Objetivo del flujo

Consultar historial de eventos administrativos asociados a un empleado.

### Endpoint: listarEventosEmpleado

**Endpoint**  
`GET /eventos/{idEmpleado}/empleados`

**Uso pensado**  
Revisar historial operativo del empleado desde cualquier lista o detalle donde RRHH ya tenga identificado al empleado.

**Path params**

- `idEmpleado: Long`
  - obligatorio.

**Query params**

- `pageNumber` opcional, default `0`.
- `pageSize` opcional, default `8`, max `100`.
- `sortBy` opcional, default `createdAt`.
- `direction` opcional, default `asc`.

**Uso frontend**

- puede exponerse como historial o timeline;
- sirve para entender contratacion, pagos y otras acciones administrativas relevantes sobre el empleado.

## RESUMEN OPERATIVO DEL ROL RRHH

- `LOGIN` define el acceso comun del empleado.
- `ASISTENCIA BASE DEL EMPLEADO` aplica tambien a RRHH como usuario final.
- `recruitment-service` se usa para registrar postulantes y llegar a la bandeja de contratacion.
- `rrhh-service` toma el relevo para alta de empleado, contrato, pagos y eventos.
- `schedule-service` completa el flujo con horarios, asistencia y cumplimiento.
- El paso mas sensible del flujo es `registrarContrato`, porque:
  - exige datos completos del empleado;
  - activa al empleado;
  - sincroniza usuario con `auth-service`;
  - y puede confirmar la contratacion pendiente en `recruitment-service` cuando recibe `idPostulacion`.
