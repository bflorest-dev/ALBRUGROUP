# RRHH

Documento funcional y tecnico para implementar la vista de trabajo del rol RRHH en frontend.

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

**Errores esperados**

- Usuario no encontrado cuando el `username` no existe.

### Endpoint 2

**Endpoint**  
`POST /autorizacion/login`

**Uso dentro del flujo**  
Se usa solo cuando el usuario ya cuenta con una password vigente y puede iniciar sesion de manera normal.

**Request**

- Body:
  - `username: string`
  - `password: string`

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

**Errores esperados**

- `401 Unauthorized` con mensaje `Credenciales invalidas` cuando el `username` o la `password` no coinciden.

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

**Errores esperados**

- Error cuando no coinciden `username`, `email` y `dni`.
- Error cuando el usuario existe pero esta inactivo.
- Error de validacion cuando faltan campos o el email no tiene formato valido.

### Resumen funcional para frontend

- El flujo inicia pidiendo solo `username`.
- `estado-acceso` decide si el usuario ve login normal o reseteo/inicializacion.
- `forgot-password` no solo sirve para "olvide mi password"; tambien sirve para la primera activacion funcional del acceso.
- `login` solo debe ejecutarse cuando el usuario ya tiene una password vigente.
- Este mismo bloque puede reutilizarse luego en los documentos de otros roles, porque el flujo de acceso base es compartido por todos los empleados.
