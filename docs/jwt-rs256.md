# JWT RS256 - Configuracion operativa

El sistema usa RS256 para access tokens:

- `auth-service` firma con clave privada.
- `gateway-service` y los microservicios validan con clave publica.
- Todos validan el mismo `JWT_ISSUER`.
- El frontend no cambia: sigue usando `Authorization: Bearer <token>`.

## Variables requeridas

En el `.env` usado por Docker deben existir:

```env
JWT_ISSUER=http://localhost:8080/auth
JWT_PRIVATE_KEY_BASE64=<private-key-pem-base64>
JWT_PUBLIC_KEY_BASE64=<public-key-pem-base64>
```

Reglas:

- `JWT_PRIVATE_KEY_BASE64` solo lo consume `auth-service`.
- `JWT_PUBLIC_KEY_BASE64` lo consumen `auth-service`, `gateway-service`, `rrhh-service`, `lead-service`, `recruitment-service` y `schedule-service`.
- Si falta alguna variable, `docker-compose` debe fallar antes de arrancar los servicios.
- No versionar el `.env` real.

## Generar claves con OpenSSL

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out jwt-private.pem
openssl rsa -pubout -in jwt-private.pem -out jwt-public.pem
```

Convertir a Base64 en PowerShell:

```powershell
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes((Get-Content .\jwt-private.pem -Raw)))
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes((Get-Content .\jwt-public.pem -Raw)))
```

Copiar cada salida en el `.env` correspondiente.

## Generar claves sin OpenSSL

Si no tienes OpenSSL instalado, usa el script PowerShell incluido:

```powershell
.\docs\generate-jwt-keys.ps1
```

Para indicar otro issuer:

```powershell
.\docs\generate-jwt-keys.ps1 -Issuer "https://api.albrugroup.com/auth"
```

El script imprime las tres lineas que debes colocar en el `.env`.

## Impacto de la migracion

- Los tokens HS256 anteriores dejan de validar.
- Los usuarios deben reloguearse o renovar sesion con el nuevo flujo.
- Los volumenes de PostgreSQL no se afectan.
- El rebuild de Docker sigue funcionando si el `.env` contiene las claves.

## Bots y automatizaciones

No usar JWT permanentes sin expiracion. Para bots, crear un flujo posterior de cuenta tecnica con permisos minimos y credencial revocable, por ejemplo `clientId/clientSecret` o refresh token de servicio.
