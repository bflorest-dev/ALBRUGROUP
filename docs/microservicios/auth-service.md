# auth-service

Servicio responsable de autenticacion, estado de acceso, credenciales y sincronizacion de usuarios.

## Notas generales

- Los endpoints publicos de acceso no requieren token.
- Los endpoints protegidos usan permisos de Spring Security.
- El login devuelve roles sin prefijo `ROLE_`.
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
- Response relevante: `token`, `type`, `username`, `empleadoId`, `nombreCompleto`, `roles`.
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

## AUTH-05 actualizarRoles

- Metodo/ruta: `PATCH /autorizacion/{empleadoId}/roles`
- Permiso: protegido por token, sin `PreAuthorize` explicito en controller.
- Body: `PuestoTrabajo`.
- Uso pensado: actualizar roles segun puesto de trabajo.

## AUTH-06 actualizarUsernameRoles

- Metodo/ruta: `PATCH /autorizacion/{empleadoId}/username-roles`
- Permiso: `UPDATE_EMPLEADOS`.
- Body: `username`, `puestoTrabajo`.
- Uso pensado: corregir credenciales y roles de un usuario existente.

## AUTH-07 resetPassword

- Metodo/ruta: `POST /autorizacion/{empleadoId}/reset-password`
- Permiso: rol `ADMINISTRADOR`.
- Uso pensado: reseteo administrativo de password.
- Response relevante: `username`, `password`.

## AUTH-08 getUsuarioPorEmpleado

- Metodo/ruta: `GET /autorizacion/{empleadoId}/empleado`
- Permiso: `READ_EMPLEADOS`.
- Uso pensado: consultar usuario de autenticacion asociado a un empleado.

## AUTH-09 listarUsuariosActivosPorRol

- Metodo/ruta: `GET /autorizacion/roles/{puestoTrabajo}/usuarios`
- Permiso: cualquiera de `READ_EMPLEADOS`, `READ_LEADS_GTR`, `READ_LEADS_SUPERVISOR_VENTAS_RESUMEN`.
- Uso pensado: catalogo de usuarios activos por puesto/rol.

## AUTH-10 deshabilitarUsuario

- Metodo/ruta: `DELETE /autorizacion/{empleadoId}/deshabilitar`
- Permiso: `CANCEL_CONTRATOS`.
- Uso pensado: desactivar acceso cuando termina un contrato.
- Nota: normalmente lo invoca `rrhh-service` durante cese.
