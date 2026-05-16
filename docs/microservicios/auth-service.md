# auth-service

Servicio responsable de autenticacion, estado de acceso, credenciales y sincronizacion de usuarios.

## Notas generales

- Los endpoints publicos de acceso no requieren token.
- Los endpoints protegidos usan permisos de Spring Security.
- El login devuelve roles sin prefijo `ROLE_`.
- Los access tokens se firman con RS256 y se validan por issuer.
- `empleadoId` es el identificador operativo que frontend debe conservar para contexto de usuario.

## AUTH-01 estadoAcceso

- Metodo/ruta: `GET /autorizacion/estado-acceso/{username}`
- Permiso: publico.
- Proposito: consultar si una cuenta existe operativamente, esta activa y tiene password inicializada.
- Path params: `username`.
- Response relevante: `activo`, `passwordInicializada`.
- Uso frontend: primer paso antes de mostrar password.
- Reglas: no autentica, no crea sesion, no devuelve token.

## AUTH-02 login

- Metodo/ruta: `POST /autorizacion/login`
- Permiso: publico.
- Body: `username`, `password`.
- Response relevante: `token`, `refreshToken`, `type`, `expiresIn`, `username`, `empleadoId`, `nombreCompleto`, `roles`.
- Uso frontend: crear sesion solo cuando `AUTH-01` permitio continuar con login normal.
- Error relevante: credenciales invalidas responden `401`.

## AUTH-03 forgotPassword

- Metodo/ruta: `POST /autorizacion/forgot-password`
- Permiso: publico.
- Body: `username`, `email`, `dni`.
- Response relevante: `username`, `password`.
- Uso frontend: inicializar password de empleado nuevo o regenerar password.
- Reglas: `username`, `email` y `dni` deben coincidir con el mismo usuario; si el usuario esta inactivo la operacion se rechaza.

## AUTH-04 upsertUsuario

- Metodo/ruta: `POST /autorizacion/upsert-usuario`
- Permiso: `CREATE_CONTRATOS`.
- Uso pensado: sincronizacion desde contratacion, no pantalla directa comun.
- Body relevante: datos de empleado para registrar o actualizar usuario de autenticacion.
- Efecto: crea o actualiza el usuario asociado al empleado.

## AUTH-05 refresh

- Metodo/ruta: `POST /autorizacion/refresh`
- Permiso: publico controlado por refresh token.
- Body: `refreshToken`.
- Response relevante: `token`, `refreshToken`, `type`, `expiresIn`.
- Uso pensado: renovar access token y rotar refresh token.

## AUTH-06 logout

- Metodo/ruta: `POST /autorizacion/logout`
- Permiso: publico controlado por refresh token.
- Body: `refreshToken`.
- Efecto: revoca el refresh token recibido.

## AUTH-07 actualizarUsernameRoles

- Metodo/ruta: `PATCH /autorizacion/{empleadoId}/username-roles`
- Permiso: `UPDATE_EMPLEADOS`.
- Body: `username`, `puestoTrabajo`.
- Uso pensado: corregir credenciales y roles de un usuario existente.

## AUTH-08 resetPassword

- Metodo/ruta: `POST /autorizacion/{empleadoId}/reset-password`
- Permiso: rol `ADMINISTRADOR`.
- Uso pensado: reseteo administrativo de password.
- Response relevante: `username`, `password`.

## AUTH-09 getUsuarioPorEmpleado

- Metodo/ruta: `GET /autorizacion/{empleadoId}/empleado`
- Permiso: `READ_EMPLEADOS`.
- Uso pensado: consultar usuario de autenticacion asociado a un empleado.

## AUTH-10 listarUsuariosActivosPorRol

- Metodo/ruta: `GET /autorizacion/roles/{puestoTrabajo}/usuarios`
- Permiso: cualquiera de `READ_EMPLEADOS`, `READ_LEADS_GTR`, `READ_LEADS_SUPERVISOR_VENTAS_RESUMEN`.
- Uso pensado: catalogo de usuarios activos por puesto/rol.

## AUTH-11 deshabilitarUsuario

- Metodo/ruta: `DELETE /autorizacion/{empleadoId}/deshabilitar`
- Permiso: `CANCEL_CONTRATOS`.
- Uso pensado: desactivar acceso cuando termina un contrato.
- Nota: normalmente lo invoca `rrhh-service` durante cese.
