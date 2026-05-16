# Auth Service - Flujos y contratos

Este documento resume los cambios aplicados en `auth-service` para robustecer autenticacion, recuperacion de acceso y renovacion de tokens sin modificar todavia el frontend.

## Cambios internos

- Se agrego validacion con `@Valid` en los cuerpos de request de los endpoints funcionales.
- El login de un usuario inactivo ya no debe terminar en error interno. Un usuario con `activo=false` se trata como credencial inexistente.
- `forgot-password` mantiene el flujo actual, pero un usuario inactivo tambien se trata como dato no coincidente.
- El endpoint de actualizacion directa de roles queda protegido con permiso `UPDATE_EMPLEADOS`.
- Se agrego refresh token opaco, persistido como hash SHA-256, con expiracion y revocacion.
- Cada uso de refresh token rota la credencial: el token anterior queda revocado y se emite uno nuevo.
- La duracion por defecto del access token es `15m`.
- La duracion por defecto del refresh token es `8h`.

## Endpoints publicos de autenticacion

### `POST /autorizacion/login`

Autentica al usuario y devuelve el JWT de acceso. Mantiene los campos usados actualmente y agrega campos compatibles para refresh token.

Request:

```json
{
  "username": "admin@albru.admin.pe",
  "password": "password"
}
```

Response `200`:

```json
{
  "token": "jwt-access-token",
  "refreshToken": "opaque-refresh-token",
  "type": "Bearer",
  "expiresIn": 900,
  "username": "admin@albru.admin.pe",
  "empleadoId": 1,
  "nombreCompleto": "Nombre Apellido",
  "roles": ["ADMINISTRADOR"]
}
```

Errores relevantes:

- `400`: request incompleto o invalido.
- `401`: credenciales invalidas.
- `404`: usuario inactivo o no disponible para login.

### `POST /autorizacion/refresh`

Rota un refresh token vigente y devuelve un nuevo access token mas un nuevo refresh token.

Request:

```json
{
  "refreshToken": "opaque-refresh-token"
}
```

Response `200`:

```json
{
  "token": "new-jwt-access-token",
  "refreshToken": "new-opaque-refresh-token",
  "type": "Bearer",
  "expiresIn": 900
}
```

Errores relevantes:

- `400`: request incompleto.
- `401`: refresh token invalido, expirado, revocado o reutilizado.
- `404`: usuario asociado inactivo.

### `POST /autorizacion/logout`

Revoca el refresh token recibido. Este endpoint deja disponible el cierre de sesion server-side para una integracion posterior del frontend.

Request:

```json
{
  "refreshToken": "opaque-refresh-token"
}
```

Response:

- `204`: refresh token revocado o inexistente sin exponer detalles.

### `GET /autorizacion/estado-acceso/{username}`

Consulta si el usuario existe, esta activo y si ya inicializo su password temporal.

Response `200`:

```json
{
  "activo": true,
  "passwordInicializada": false
}
```

### `POST /autorizacion/forgot-password`

Mantiene el comportamiento actual: valida `username`, `email` y `dni`; si coinciden, genera una password temporal y marca `passwordInicializada=true`.

Request:

```json
{
  "username": "usuario@albru.sales.pe",
  "email": "usuario@correo.com",
  "dni": "12345678"
}
```

Response `200`:

```json
{
  "username": "usuario@albru.sales.pe",
  "password": "Temporal123"
}
```

## Endpoints internos y operativos

### `POST /autorizacion/upsert-usuario`

Uso interno desde RRHH al crear o sincronizar usuario por contrato. Requiere permiso `CREATE_CONTRATOS`.

### `DELETE /autorizacion/{empleadoId}/deshabilitar`

Uso interno desde RRHH al cancelar contrato. Requiere permiso `CANCEL_CONTRATOS` y marca el usuario como `activo=false`.

### `GET /autorizacion/{empleadoId}/empleado`

Permite enriquecer informacion de empleado con datos de acceso. Requiere permiso `READ_EMPLEADOS`.

### `GET /autorizacion/roles/{puestoTrabajo}/usuarios`

Usado por monitoreo para obtener usuarios activos por rol. Requiere permisos de lectura autorizados.

### Endpoints candidatos a revision posterior

- `PATCH /autorizacion/{empleadoId}/roles`
- `PATCH /autorizacion/{empleadoId}/username-roles`
- `POST /autorizacion/{empleadoId}/reset-password`

Estos endpoints quedan seguros, pero deberian revisarse en una etapa posterior antes de decidir si se documentan como flujo oficial o se deprecian.

## Compatibilidad actual

- El frontend actual puede seguir usando solo `token`; los campos nuevos de login son aditivos.
- La renovacion automatica con `/refresh` no ocurre hasta que el frontend la integre.
- La regla actual de pestañas abiertas sigue siendo responsabilidad del frontend. El backend solo provee las capacidades de emision, rotacion y revocacion de refresh tokens.

## Pendientes posteriores

- Integrar `/refresh` y `/logout` en el frontend si se decide habilitar renovacion automatica.
- Revisar y limpiar endpoints candidatos a deprecacion.
- Migrar `ddl-auto` a Flyway.
- Externalizar secretos reales por entorno y evitar usar defaults versionados en despliegues productivos.
