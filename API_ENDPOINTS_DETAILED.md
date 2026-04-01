# Documentación Detallada de Endpoints Backend

**Compilado el:** 1 de Abril de 2026  
**Última sincronización:** Comparada con controllers Java via script  
**Cobertura:** 101 endpoints únicos documentados

## Índice
1. [Convenciones Globales](#convenciones-globales)
2. [Autenticación (`/auth`)](#autenticación)
3. [Presencia (`/presence`)](#presencia)
4. [Leads (`/leads`)](#leads)
5. [Recruitment (`/recruitment`)](#recruitment)
6. [RRHH (`/rrhh`)](#rrhh)
7. [Códigos de Error](#códigos-de-error)
8. [Estructura de Respuestas](#estructura-de-respuestas)

---

## Convenciones Globales

### Headers Requeridos (por defecto)
- **Authorization**: `Bearer <jwt_token>` (EXCEPTO `POST /auth/autorizacion/login`)
- **Content-Type**: `application/json` (para requests con body)

### Formato de Respuesta
- **200 OK**: Operación exitosa, devuelve data
- **201 Created**: Recurso creado
- **204 No Content**: Éxito sin contenido en respuesta
- **400 Bad Request**: Validación fallida
- **401 Unauthorized**: Token ausente/inválido/expirado
- **403 Forbidden**: Autorización insuficiente
- **404 Not Found**: Recurso no existe
- **409 Conflict**: Duplicado/violación de reglas de negocio
- **422 Unprocessable Entity**: Datos válidos pero no procesables (RRHH)

### Gateway Routing (Prefijos)
```
/auth/**       → auth-service
/rrhh/**       → rrhh-service
/leads/**      → lead-service
/recruitment/** → recruitment-service
/presence/**   → gateway-service (nativo)
```

---

## Autenticación

### POST /auth/autorizacion/login
**¿Qué hace?** Autentica un usuario y devuelve un token JWT

**Parámetros:**
- **Body** (requerido): `LoginRequest`

**Request JSON:**
```json
{
  "username": "asesor_ventas_1",
  "password": "securepassword123"
}
```

**Response JSON (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "username": "asesor_ventas_1",
  "empleadoId": 12,
  "nombreCompleto": "Juan Pérez García",
  "roles": ["ASESOR_VENTAS", "COMMUNITY"]
}
```

**Respuesta Error (401):**
```json
{
  "error": "Unauthorized",
  "message": "Credenciales inválidas"
}
```

**Códigos HTTP:** `200`, `401`

---

### POST /auth/autorizacion/registro
**¿Qué hace?** Crea un nuevo usuario en el sistema

**Parámetros:**
- **Body** (requerido): `RegistrarUsuarioRequest`
- **Headers**: Authorization (Token de admin/RRHH), Content-Type

**Request JSON:**
```json
{
  "empleadoId": 45,
  "nombres": "María",
  "apellidos": "González López",
  "dni": "87654321",
  "email": "maria.gonzalez@albrugroup.com",
  "puestoTrabajo": "ASESOR_BACKOFFICE"
}
```

**Response JSON (201):**
```json
{
  "id": 123,
  "username": "mgonzalez",
  "email": "maria.gonzalez@albrugroup.com",
  "empleadoId": 45,
  "nombreCompleto": "María González López",
  "activo": true,
  "roles": ["ASESOR_BACKOFFICE"]
}
```

**Códigos HTTP:** `201`, `400`, `401`, `403`, `409` (usuario duplicado)

---

### POST /auth/autorizacion/registro-credenciales
**¿Qué hace?** Genera credenciales temporales (username + password) para un nuevo usuario

**Parámetros:**
- **Body** (requerido): `RegistrarUsuarioRequest`
- **Headers**: Authorization, Content-Type

**Response JSON (201):**
```json
{
  "username": "mgonzalez",
  "password": "Temp1234!@#"
}
```

**Códigos HTTP:** `201`, `400`, `401`, `403`

---

### PATCH /auth/autorizacion/{empleadoId}/roles
**¿Qué hace?** Actualiza el rol de un empleado existente

**Parámetros:**
- **Path**: `empleadoId` (número)
- **Body** (requerido): Enum `PuestoTrabajo`
- **Headers**: Authorization, Content-Type

**Request JSON:**
```json
{
  "puestoTrabajo": "SUPERVISOR_VENTAS"
}
```

**Response JSON (200):**
```json
{
  "id": 123,
  "username": "mgonzalez",
  "email": "maria.gonzalez@albrugroup.com",
  "empleadoId": 45,
  "nombreCompleto": "María González López",
  "activo": true,
  "roles": ["SUPERVISOR_VENTAS"]
}
```

**Códigos HTTP:** `200`, `400`, `401`, `403`, `404`

---

### PATCH /auth/autorizacion/{empleadoId}/username-roles
**¿Qué hace?** Actualiza username y/o rol de un empleado

**Parámetros:**
- **Path**: `empleadoId` (número)
- **Body**: `ActualizarCredencialesRequest`

**Request JSON:**
```json
{
  "nombres": "María Elena",
  "apellidos": "González López",
  "dni": "87654321",
  "puestoTrabajo": "SUPERVISOR_BACKOFFICE"
}
```

**Response JSON (200):** Mismo patrón que endpoint anterior

**Códigos HTTP:** `200`, `400`, `401`, `403`, `404`

---

### POST /auth/autorizacion/{empleadoId}/reset-password
**¿Qué hace?** Genera una nueva contraseña temporal para un empleado

**Parámetros:**
- **Path**: `empleadoId` (número)
- **Headers**: Authorization

**Response JSON (200):**
```json
{
  "username": "mgonzalez",
  "password": "NewTemp5678!@#"
}
```

**Códigos HTTP:** `200`, `401`, `403`

---

### GET /auth/autorizacion/{empleadoId}/empleado
**¿Qué hace?** Obtiene información del usuario por empleadoId

**Parámetros:**
- **Path**: `empleadoId` (número)
- **Headers**: Authorization

**Response JSON (200):**
```json
{
  "id": 123,
  "username": "mgonzalez",
  "email": "maria.gonzalez@albrugroup.com",
  "empleadoId": 45,
  "nombreCompleto": "María González López",
  "activo": true,
  "roles": ["SUPERVISOR_BACKOFFICE"]
}
```

**Códigos HTTP:** `200`, `401`, `403`, `404`

---

### DELETE /auth/autorizacion/{empleadoId}/deshabilitar
**¿Qué hace?** Desactiva un usuario (baja lógica)

**Parámetros:**
- **Path**: `empleadoId` (número)
- **Headers**: Authorization

**Response:** Empty body (204)

**Códigos HTTP:** `204`, `401`, `403`, `404`

---

## Presencia

### POST /presence/online
**¿Qué hace?** Marca al empleado como online en el sistema

**Parámetros:**
- **Headers**: Authorization

**Response:** Empty body (200)

**Códigos HTTP:** `200`, `401`

---

### POST /presence/heartbeat
**¿Qué hace?** Actualiza la actividad del empleado (keep-alive)

**Parámetros:**
- **Headers**: Authorization

**Response:** Empty body (200)

**Códigos HTTP:** `200`, `401`

---

### POST /presence/offline
**¿Qué hace?** Marca al empleado como offline

**Parámetros:**
- **Headers**: Authorization

**Response:** Empty body (204)

**Códigos HTTP:** `204`, `401`

---

### PATCH /presence/disponibilidad/{disponibilidad}
**¿Qué hace?** Cambia la disponibilidad del empleado

**Parámetros:**
- **Path**: `disponibilidad` (enum: DISPONIBLE, GESTIONANDO, OCUPADO, SATURADO)
- **Headers**: Authorization

**Response:** Empty body (204)

**Ejemplo URL:** `PATCH /presence/disponibilidad/OCUPADO`

**Códigos HTTP:** `204`, `401`, `404`

---

### GET /presence/connected-users
**¿Qué hace?** Obtiene lista de empleados conectados en tiempo real

**Parámetros:**
- **Query** (opcional): `role` (filtro por rol)
- **Headers**: Authorization

**Response JSON (200):**
```json
[
  {
    "empleadoId": 12,
    "nombreCompleto": "Juan Pérez García",
    "roles": ["ASESOR_VENTAS"],
    "status": "ONLINE",
    "disponibilidad": "DISPONIBLE",
    "lastSeen": "2026-03-25T12:00:00Z"
  },
  {
    "empleadoId": 45,
    "nombreCompleto": "María González López",
    "roles": ["SUPERVISOR_BACKOFFICE"],
    "status": "ONLINE",
    "disponibilidad": "GESTIONANDO",
    "lastSeen": "2026-03-25T11:55:30Z"
  }
]
```

**Códigos HTTP:** `200`, `401`

---

### GET /presence/connected-users/{empleadoId}
**¿Qué hace?** Obtiene estado de conexión de un empleado específico

**Parámetros:**
- **Path**: `empleadoId` (número)
- **Headers**: Authorization

**Response JSON (200):**
```json
{
  "empleadoId": 12,
  "conectado": true
}
```

**Códigos HTTP:** `200`, `401`, `404`

---

## Leads

### POST /leads/leads/intake
**¿Qué hace?** Crea un nuevo lead en el sistema (crm intake)

**Parámetros:**
- **Body**: `LeadIntakeRequest`
- **Headers**: Authorization, Content-Type

**Request JSON:**
```json
{
  "prefijo": "LD",
  "lead": "987654321",
  "idCampana": 3,
  "base": "WHATSAPP"
}
```

**Response:** Empty body (204)

**Códigos HTTP:** `204`, `400`, `401`, `403`

---

### GET /leads/leads/asesor-ventas
**¿Qué hace?** Obtiene leads asignados al asesor (bandeja personal)

**Parámetros:**
- **Headers**: Authorization

**Response JSON (200):**
```json
[
  {
    "id": 101,
    "fechaAsignacion": "2026-03-25T08:15:30Z",
    "prefijo": "LD",
    "lead": "987654321",
    "nombreTitular": "Carlos Díaz",
    "correo": "carlos@email.com",
    "estadoSeguimiento": "EN_GESTION"
  },
  {
    "id": 102,
    "fechaAsignacion": "2026-03-24T10:00:00Z",
    "prefijo": "LD",
    "lead": "987654322",
    "nombreTitular": "Ana García",
    "correo": "ana@email.com",
    "estadoSeguimiento": "GESTIONADO"
  }
]
```

**Códigos HTTP:** `200`, `401`, `403`

---

### GET /leads/leads/{idLead}/detalle-asesor
**¿Qué hace?** Obtiene detalles completos de un lead específico

**Parámetros:**
- **Path**: `idLead` (número)
- **Headers**: Authorization

**Response JSON (200):**
```json
{
  "id": 101,
  "fechaAsignacion": "2026-03-25T08:15:30Z",
  "lastEntryAt": "2026-03-25T12:00:00Z",
  "prefijo": "LD",
  "lead": "987654321",
  "nombreCampana": "Campaña Verano 2026",
  "nombreProveedorCampana": "Proveedores SAC",
  "base": "WHATSAPP",
  "estadoSeguimiento": "EN_GESTION",
  "idAsesorAsignado": 12,
  "nombreAsesorAsignado": "Juan Pérez",
  "tipoDocumento": "DNI",
  "numeroDocumentoTitularServicio": "12345678",
  "nombreTitular": "Carlos Díaz López",
  "celularRegistro": "987654321",
  "celularReferencia": "987654322",
  "correo": "carlos@email.com",
  "numeroDocumentoTitularCelularRegistro": "12345678",
  "nombreTitularCelularRegistro": "Carlos Díaz",
  "ubigeoNacimiento": "150131",
  "ubigeoDomicilio": "150131",
  "tipoDomicilio": "MULTIFAMILIAR",
  "tipoVia": "CALLE",
  "via": "Principal",
  "direccion": "Número 123",
  "referencia": "Frente a la farmacia",
  "latitud": -12.0464,
  "longitud": -77.0428,
  "urbanizacion": "Los Ángeles",
  "numero": "123",
  "manzana": "A",
  "lote": "01",
  "nombreEdificio": null,
  "nombreCondominio": null,
  "piso": null,
  "interior": null
}
```

**Códigos HTTP:** `200`, `401`, `403`, `404`

---

### PATCH /leads/leads/{idLead}/asignacion
**¿Qué hace?** Asigna un lead a un asesor específico

**Parámetros:**
- **Path**: `idLead` (número)
- **Body**: `LeadAsignacionRequest`
- **Headers**: Authorization, Content-Type

**Request JSON:**
```json
{
  "idAsesorAsignado": 15,
  "nombreAsesorAsignado": "Roberto Martínez"
}
```

**Response:** Empty body (204)

**Códigos HTTP:** `204`, `400`, `401`, `403`

---

### PATCH /leads/leads/{idLead}/datos-preventa
**¿Qué hace?** Actualiza datos del titular del servicio (preventa)

**Parámetros:**
- **Path**: `idLead` (número)
- **Body**: `LeadDatosPreventaRequest`

**Request JSON:**
```json
{
  "tipoDocumento": "DNI",
  "numeroDocumentoTitularServicio": "87654321",
  "ubigeoNacimiento": "150131",
  "nombreTitularServicio": "Ana García García",
  "celularRegistro": "987654321",
  "celularReferencia": "987654322",
  "correo": "ana@email.com",
  "numeroDocumentoTitularCelularRegistro": "87654321",
  "nombreTitularCelularRegistro": "Ana García"
}
```

**Response:** Empty body (204)

**Códigos HTTP:** `204`, `400`, `401`, `403`

---

### PATCH /leads/leads/{idLead}/direccion
**¿Qué hace?** Actualiza dirección y ubicación geográfica del lead

**Parámetros:**
- **Path**: `idLead` (número)
- **Body**: `LeadDireccionRequest`

**Request JSON:**
```json
{
  "ubigeoDomicilio": "150131",
  "tipoDomicilio": "MULTIFAMILIAR",
  "tipoVia": "CALLE",
  "via": "Principal",
  "direccion": "Número 465",
  "referencia": "Intersección con Av. Secundaria",
  "latitud": -12.0464,
  "longitud": -77.0428,
  "urbanizacion": "Los Ángeles",
  "numero": "465",
  "manzana": "B",
  "lote": "05",
  "nombreEdificio": "Edificio Centro",
  "nombreCondominio": null,
  "piso": "12",
  "interior": "1205"
}
```

**Response:** Empty body (204)

**Códigos HTTP:** `204`, `400`, `401`, `403`

---

### PATCH /leads/leads/{idLead}/oferta-comercial
**¿Qué hace?** Asigna planes y promociones a un lead (oferta comercial)

**Parámetros:**
- **Path**: `idLead` (número)
- **Body**: `LeadOfertaComercialRequest`

**Request JSON:**
```json
{
  "idPlan": 5,
  "idPromocionInterna": 2,
  "idPromocionProveedor": 8,
  "adicionales": [
    {
      "idAdicional": 1,
      "cantidad": 2
    },
    {
      "idAdicional": 3,
      "cantidad": 1
    }
  ]
}
```

**Response:** Empty body (204)

**Códigos HTTP:** `204`, `400`, `401`, `403`

---

### POST /leads/leads/{idLead}/tipificacion
**¿Qué hace?** Tipifica un lead con clasificación de resultado

**Parámetros:**
- **Path**: `idLead` (número)
- **Body**: `LeadTipificacionRequest`

**Request JSON:**
```json
{
  "codigoTipificacion": "INTERESADO",
  "codigoSubtipificacion": "ESPERA_CONTACTO"
}
```

**Response:** Empty body (204)

**Códigos HTTP:** `204`, `400`, `401`, `403`

---

### POST /leads/leads/{idLead}/contacto
**¿Qué hace?** Registra un contacto/intento de contacto con el lead

**Parámetros:**
- **Path**: `idLead` (número)
- **Headers**: Authorization

**Response:** Empty body (204)

**Códigos HTTP:** `204`, `400`, `401`, `403`

---

### GET /leads/leads/gtr
**¿Qué hace?** Obtiene leads para reportes GTR (Gerente Técnico de Reclutamiento)

**Parámetros:**
- **Query** (opcional): `fecha` (filtro de fecha)
- **Headers**: Authorization

**Response JSON (200):**
```json
[
  {
    "id": 101,
    "createdAt": "2026-03-25T08:15:30Z",
    "nombreCampana": "Campaña Verano 2026",
    "nombreProveedorCampana": "Proveedores SAC",
    "base": "WHATSAPP",
    "nombreTitular": "Carlos Díaz",
    "codigoTipificacion": "INTERESADO",
    "codigoSubtipificacion": "ESPERA_CONTACTO",
    "nombreAsesorAsignado": "Juan Pérez",
    "estadoSeguimiento": "EN_GESTION",
    "reasignaciones": 1
  }
]
```

**Códigos HTTP:** `200`, `401`, `403`

---

### GET /leads/eventos/lead/{idLead}
**¿Qué hace?** Obtiene historial completo de eventos de un lead

**Parámetros:**
- **Path**: `idLead` (número)
- **Headers**: Authorization

**Response JSON (200):**
```json
[
  {
    "id": 1001,
    "idLead": 101,
    "idCampana": 3,
    "idActor": 12,
    "nombreActor": "Juan Pérez",
    "rolActor": "ASESOR_VENTAS",
    "accion": "REGISTRO",
    "etapa": "PREVENTA",
    "tipificacion": null,
    "subtipificacion": null,
    "createdAt": "2026-03-25T08:15:30Z"
  },
  {
    "id": 1002,
    "idLead": 101,
    "idCampana": 3,
    "idActor": 12,
    "nombreActor": "Juan Pérez",
    "rolActor": "ASESOR_VENTAS",
    "accion": "CONTACTO",
    "etapa": "PREVENTA",
    "tipificacion": null,
    "subtipificacion": null,
    "createdAt": "2026-03-25T09:30:45Z"
  },
  {
    "id": 1003,
    "idLead": 101,
    "idCampana": 3,
    "idActor": 12,
    "nombreActor": "Juan Pérez",
    "rolActor": "ASESOR_VENTAS",
    "accion": "TIPIFICACION",
    "etapa": "PREVENTA",
    "tipificacion": "INTERESADO",
    "subtipificacion": "ESPERA_CONTACTO",
    "createdAt": "2026-03-25T10:00:00Z"
  }
]
```

**Códigos HTTP:** `200`, `401`, `403`

---

### GET /leads/eventos/empleado/{idEmpleado}
**¿Qué hace?** Obtiene todos los eventos (acciones) registradas por un empleado específico

**Parámetros:**
- **Path**: `idEmpleado` (número)
- **Query** (opcional): `fechaDesde`, `fechaHasta` (filtro de rango de fechas)
- **Headers**: Authorization

**Response JSON (200):** Array de `EventoResponse[]` (mismo formato anterior)

**Códigos HTTP:** `200`, `401`, `403`

---

### POST /leads/campanas
**¿Qué hace?** Crea una nueva campaña de marketing

**Parámetros:**
- **Body**: `CampanaRequest` (vacío en request, genera ID automático)

**Response JSON (201):**
```json
{
  "id": 10,
  "nombre": "Campaña Verano 2026",
  "numeroWhatsappEmpresa": "51987654321",
  "activo": true,
  "idCuentaPublicitaria": 2,
  "numeroCuenta": "ACC-2026-001",
  "nombreCuenta": "Cuenta Publicidad Externa",
  "idProveedor": 1,
  "nombreProveedor": "Proveedores SAC",
  "updatedAt": "2026-03-25T12:00:00Z"
}
```

**Códigos HTTP:** `201`, `400`, `401`, `403`, `409`

---

### GET /leads/campanas
**¿Qué hace?** Lista todas las campañas (filtro opcional por estado activo)

**Parámetros:**
- **Query** (opcional): `activo` (true/false)
- **Headers**: Authorization

**Response JSON (200):**
```json
[
  {
    "id": 10,
    "nombre": "Campaña Verano 2026",
    "numeroWhatsappEmpresa": "51987654321",
    "activo": true,
    "idCuentaPublicitaria": 2,
    "numeroCuenta": "ACC-2026-001",
    "nombreCuenta": "Cuenta Publicidad Externa",
    "idProveedor": 1,
    "nombreProveedor": "Proveedores SAC",
    "updatedAt": "2026-03-25T12:00:00Z"
  }
]
```

**Códigos HTTP:** `200`, `401`, `403`

---

### PUT /leads/campanas/{idCampana}
**¿Qué hace?** Actualiza el número de WhatsApp de una campaña

**Parámetros:**
- **Path**: `idCampana` (número)
- **Body**: `CampanaWhatsappRequest`

**Request JSON:**
```json
{
  "numeroWhatsappEmpresa": "51987654322"
}
```

**Response JSON (200):** Objeto `CampanaResponse` actualizado

**Códigos HTTP:** `200`, `400`, `401`, `403`, `404`

---

### DELETE /leads/campanas/{idCampana}
**¿Qué hace?** Elimina una campaña

**Parámetros:**
- **Path**: `idCampana` (número)
- **Headers**: Authorization

**Response JSON (200):** Objeto `CampanaResponse` eliminado

**Códigos HTTP:** `200`, `401`, `403`, `404`

---

### POST /leads/proveedores
**¿Qué hace?** Crea un nuevo proveedor de servicios

**Parámetros:**
- **Body**: `ProveedorRequest`

**Request JSON:**
```json
{
  "nombre": "Nuevos Proveedores SAC"
}
```

**Response JSON (201):**
```json
{
  "id": 5,
  "nombre": "Nuevos Proveedores SAC",
  "activo": true,
  "createdAt": "2026-03-25T12:00:00Z"
}
```

**Códigos HTTP:** `201`, `400`, `401`, `403`, `409`

---

### PATCH /leads/proveedores/{idProveedor}/estado
**¿Qué hace?** Cambia el estado (activo/inactivo) de un proveedor

**Parámetros:**
- **Path**: `idProveedor` (número)

**Response JSON (200):** Objeto `ProveedorResponse` actualizado

**Códigos HTTP:** `200`, `401`, `403`, `404`

---

### POST /leads/planes
**¿Qué hace?** Crea un nuevo plan de servicios

**Parámetros:**
- **Body**: `PlanRequest`

**Request JSON:**
```json
{
  "vigenciaDesde": "2026-03-01",
  "vigenciaHasta": "2026-12-31"
}
```

**Response JSON (201):**
```json
{
  "id": 15,
  "nombre": "Plan Premium",
  "precio": 99.99,
  "vigenciaDesde": "2026-03-01",
  "vigenciaHasta": "2026-12-31",
  "idProveedor": 1,
  "nombreProveedor": "Proveedores SAC",
  "internet": {
    "id": 10,
    "velocidad": 100,
    "unidad": "MBPS",
    "tecnologia": "FTTH"
  },
  "television": {
    "id": 5,
    "nombre": "TV Cable 120 Canales",
    "cantidadCanales": 120
  },
  "telefono": {
    "id": 3,
    "minutos": 200,
    "descripcion": "Llamadas a nivel nacional"
  },
  "adicionales": [
    {
      "idAdicional": 1,
      "nombreAdicional": "Modem Wifi",
      "cantidadIncluida": 1,
      "permiteCompraAdicional": false,
      "cantidadMaximaAdicional": 0,
      "precioUnitarioAdicional": 0
    }
  ],
  "activo": true
}
```

**Códigos HTTP:** `201`, `400`, `401`, `403`, `409`

---

### GET /leads/planes
**¿Qué hace?** Lista planes disponibles (filtro por proveedor y/o solo vigentes)

**Parámetros:**
- **Query** (opcional): `idProveedor`, `soloVigentes` (true/false)
- **Headers**: Authorization

**Response JSON (200):** Array de `PlanResponse[]` (mismo formato anterior)

**Códigos HTTP:** `200`, `401`, `403`

---

### GET /leads/planes/adicionales
**¿Qué hace?** Obtiene adicionales disponibles para un proveedor específico

**Parámetros:**
- **Query** (requerido): `idProveedor`
- **Headers**: Authorization

**Response JSON (200):**
```json
[
  {
    "id": 1,
    "nombre": "Modem Wifi 6",
    "precioUnitario": 150.00,
    "idProveedor": 1,
    "nombreProveedor": "Proveedores SAC",
    "activo": true
  },
  {
    "id": 2,
    "nombre": "Protección Antivirus",
    "precioUnitario": 25.00,
    "idProveedor": 1,
    "nombreProveedor": "Proveedores SAC",
    "activo": true
  }
]
```

**Códigos HTTP:** `200`, `400`, `401`, `403`

---

### GET /leads/planes/servicios
**¿Qué hace?** Obtiene todos los servicios (internet/tv/telefono) de un proveedor

**Parámetros:**
- **Query** (requerido): `idProveedor`
- **Headers**: Authorization

**Response JSON (200):**
```json
{
  "idProveedor": 1,
  "nombreProveedor": "Proveedores SAC",
  "internets": [
    {
      "id": 10,
      "velocidad": 100,
      "unidad": "MBPS",
      "tecnologia": "FTTH"
    },
    {
      "id": 11,
      "velocidad": 300,
      "unidad": "MBPS",
      "tecnologia": "HFC"
    }
  ],
  "televisiones": [
    {
      "id": 5,
      "nombre": "TV Cable 120 Canales",
      "cantidadCanales": 120
    }
  ],
  "telefonos": [
    {
      "id": 3,
      "minutos": 200,
      "descripcion": "Llamadas nacionales"
    }
  ]
}
```

**Códigos HTTP:** `200`, `400`, `401`, `403`

---

### PUT /leads/planes/{idPlan}
**¿Qué hace?** Actualiza detalles de un plan existente

**Parámetros:**
- **Path**: `idPlan` (número)
- **Body**: `PlanUpdateRequest`

**Request JSON:**
```json
{
  "nombre": "Plan Premium Plus",
  "precio": 129.99,
  "vigenciaDesde": "2026-03-01",
  "vigenciaHasta": "2027-02-28"
}
```

**Response JSON (200):** Objeto `PlanResponse` actualizado

**Códigos HTTP:** `200`, `400`, `401`, `403`, `404`

---

### DELETE /leads/planes/{idPlan}
**¿Qué hace?** Elimina un plan

**Parámetros:**
- **Path**: `idPlan` (número)

**Response JSON (200):** Objeto `PlanResponse` eliminado

**Códigos HTTP:** `200`, `401`, `403`, `404`

---

### GET /leads/tipificaciones/{etapa}/catalogo
**¿Qué hace?** Obtiene catálogo de tipificaciones y subtipificaciones para una etapa

**Parámetros:**
- **Path**: `etapa` (enum: PREVENTA, VENTA, POSTVENTA)
- **Headers**: Authorization

**Response JSON (200):**
```json
{
  "etapa": "PREVENTA",
  "tipificaciones": [
    {
      "id": 1,
      "codigo": "INTERESADO",
      "descripcion": "Cliente mostró interés",
      "orden": 1,
      "subtipificaciones": [
        {
          "id": 10,
          "codigo": "ESPERA_CONTACTO",
          "descripcion": "Espera que lo contactemos",
          "orden": 1
        },
        {
          "id": 11,
          "codigo": "EVALUANDO",
          "descripcion": "Evaluando la oferta",
          "orden": 2
        }
      ]
    },
    {
      "id": 2,
      "codigo": "NO_INTERESADO",
      "descripcion": "Cliente rechazó oferta",
      "orden": 2,
      "subtipificaciones": [
        {
          "id": 20,
          "codigo": "PRECIO_ALTO",
          "descripcion": "Precio muy alto",
          "orden": 1
        }
      ]
    }
  ]
}
```

**Códigos HTTP:** `200`, `400`, `401`, `403`

---

### GET /leads/ubigeo/departamentos
**¿Qué hace?** Obtiene lista de todos los departamentos sobre Peru

**Parámetros:**
- **Headers**: Authorization

**Response JSON (200):**
```json
[
  {
    "id": 1,
    "codigo": "150000",
    "nombre": "Lima"
  },
  {
    "id": 2,
    "codigo": "080000",
    "nombre": "Cusco"
  }
]
```

**Códigos HTTP:** `200`, `401`, `403`

---

### GET /leads/ubigeo/departamentos/{idDepartamento}/provincias
**¿Qué hace?** Obtiene provincias de un departamento

**Parámetros:**
- **Path**: `idDepartamento` (número)
- **Headers**: Authorization

**Response JSON (200):**
```json
[
  {
    "id": 10,
    "codigo": "150131",
    "nombre": "Lima",
    "idDepartamento": 1
  },
  {
    "id": 11,
    "codigo": "150140",
    "nombre": "Barranca",
    "idDepartamento": 1
  }
]
```

**Códigos HTTP:** `200`, `401`, `403`

---

### GET /leads/ubigeo/provincias/{idProvincia}/distritos
**¿Qué hace?** Obtiene distritos de una provincia

**Parámetros:**
- **Path**: `idProvincia` (número)
- **Headers**: Authorization

**Response JSON (200):**
```json
[
  {
    "id": 100,
    "codigo": "150131",
    "nombre": "Lima",
    "idProvincia": 10,
    "idDepartamento": 1
  },
  {
    "id": 101,
    "codigo": "150132",
    "nombre": "Ancón",
    "idProvincia": 10,
    "idDepartamento": 1
  }
]
```

**Códigos HTTP:** `200`, `401`, `403`

---

### POST /leads/zonas
**¿Qué hace?** Crea una zona geográfica con reglas de inclusión/exclusión

**Parámetros:**
- **Body**: `ZonaRequest`

**Request JSON:**
```json
{
  "nombre": "Zona Lima Centro",
  "reglas": [
    {
      "nivelGeografico": "DISTRITO",
      "geoId": 100,
      "criterio": "INCLUIR"
    },
    {
      "nivelGeografico": "DISTRITO",
      "geoId": 101,
      "criterio": "INCLUIR"
    }
  ]
}
```

**Response JSON (201):**
```json
{
  "id": 5,
  "nombre": "Zona Lima Centro",
  "activo": true,
  "createdAt": "2026-03-25T12:00:00Z",
  "updatedAt": "2026-03-25T12:00:00Z",
  "reglas": [
    {
      "id": 45,
      "nivelGeografico": "DISTRITO",
      "geoId": 100,
      "criterio": "INCLUIR"
    },
    {
      "id": 46,
      "nivelGeografico": "DISTRITO",
      "geoId": 101,
      "criterio": "INCLUIR"
    }
  ]
}
```

**Códigos HTTP:** `201`, `400`, `401`, `403`, `409`

---

### GET /leads/zonas
**¿Qué hace?** Lista todas las zonas (filtro opcional por estado)

**Parámetros:**
- **Query** (opcional): `activo` (true/false)
- **Headers**: Authorization

**Response JSON (200):** Array de `ZonaResponse[]`

**Códigos HTTP:** `200`, `401`, `403`

---

### PATCH /leads/zonas/{idZona}/estado
**¿Qué hace?** Cambia el estado (activo/inactivo) de una zona

**Parámetros:**
- **Path**: `idZona` (número)

**Response JSON (200):** Objeto `ZonaResponse` actualizado

**Códigos HTTP:** `200`, `401`, `403`, `404`

---

### POST /leads/promociones
**¿Qué hace?** Crea una promoción comercial

**Parámetros:**
- **Body**: `PromocionComercialRequest`

**Request JSON:**
```json
{
  "idProveedor": 1,
  "idZona": 5,
  "vigenciaDesde": "2026-04-01",
  "vigenciaHasta": "2026-06-30"
}
```

**Response JSON (201):**
```json
{
  "id": 20,
  "nombre": "Promoción Verano Zona Lima",
  "interno": false,
  "idProveedor": 1,
  "nombreProveedor": "Proveedores SAC",
  "idZona": 5,
  "nombreZona": "Zona Lima Centro",
  "descuento": true,
  "cantidadMeses": 3,
  "vigenciaDesde": "2026-04-01",
  "vigenciaHasta": "2026-06-30",
  "activo": true,
  "createdAt": "2026-03-25T12:00:00Z"
}
```

**Códigos HTTP:** `201`, `400`, `401`, `403`, `409`

---

### GET /leads/promociones
**¿Qué hace?** Lista promociones disponibles (filtro por proveedor, interno, zona)

**Parámetros:**
- **Query** (opcional): `idProveedor`, `interno`, `idZona`
- **Headers**: Authorization

**Response JSON (200):** Array de `PromocionComercialResponse[]`

**Códigos HTTP:** `200`, `401`, `403`

---

### DELETE /leads/promociones/{idPromocion}
**¿Qué hace?** Elimina una promoción

**Parámetros:**
- **Path**: `idPromocion` (número)

**Response JSON (200):** Objeto `PromocionComercialResponse` eliminado

**Códigos HTTP:** `200`, `401`, `403`, `404`

---

## Recruitment

### POST /recruitment/postulaciones
**¿Qué hace?** Crea una nueva postulación de candidato

**Parámetros:**
- **Body**: `PostulacionRequest`

**Response JSON (201):**
```json
{
  "id": 501,
  "nombres": "Roberto",
  "apellidos": "Martínez López",
  "tipoDocumento": "DNI",
  "numeroDocumento": "76543210",
  "celularPersonal": "987654321",
  "etapaProceso": "RECLUTAMIENTO",
  "estadoProceso": "POR_RECLUTAR",
  "subestadoProceso": null,
  "origen": "WHATSAPP",
  "puestoTrabajo": "ASESOR_VENTAS",
  "fechaActualizacion": "2026-03-25T12:00:00Z"
}
```

**Códigos HTTP:** `201`, `400`, `401`, `403`

---

### GET /recruitment/postulaciones
**¿Qué hace?** Lista postulaciones con filtros (etapa, estado, bandeja)

**Parámetros:**
- **Query** (opcional): `etapa`, `estado`, `estadoBandeja`
- **Headers**: Authorization

**Response JSON (200):** Array de `PostulacionResponse[]`

**Códigos HTTP:** `200`, `401`, `403`

---

### GET /recruitment/postulaciones/bandeja/reclutamiento
**¿Qué hace?** Obtiene postulantes en etapa de reclutamiento

**Parámetros:**
- **Query** (opcional): `estadoBandeja`
- **Headers**: Authorization

**Response JSON (200):** Array de `PostulacionResponse[]`

**Códigos HTTP:** `200`, `401`, `403`

---

### GET /recruitment/postulaciones/bandeja/capacitacion
**¿Qué hace?** Obtiene postulantes en etapa de capacitación

**Parámetros:**
- **Query** (opcional): `sinGrupo` (only postulantes without grupo)
- **Headers**: Authorization

**Response JSON (200):** Array de `PostulacionResponse[]`

**Códigos HTTP:** `200`, `401`, `403`

---

### GET /recruitment/postulaciones/bandeja/contratacion
**¿Qué hace?** Obtiene postulantes listos para contratación

**Parámetros:**
- **Headers**: Authorization

**Response JSON (200):** Array de `PostulacionResponse[]`

**Códigos HTTP:** `200`, `401`, `403`

---

### POST /recruitment/postulaciones/{idPostulacion}/tipificacion
**¿Qué hace?** Tipifica el resultado de una postulación

**Parámetros:**
- **Path**: `idPostulacion` (número)
- **Body**: `TipificarPostulacionRequest`

**Request JSON:**
```json
{
  "modalidadContacto": "LLAMADA",
  "observacion": "Cliente interesado pero con dudas sobre horario"
}
```

**Response JSON (200):** Objeto `PostulacionResponse` actualizado

**Códigos HTTP:** `200`, `400`, `401`, `403`, `404`

---

### POST /recruitment/postulaciones/{idPostulacion}/confirmar-contratacion
**¿Qué hace?** Confirma la contratación de un postulante

**Parámetros:**
- **Path**: `idPostulacion` (número)
- **Body**: `ConfirmarContratacionRequest`

**Request JSON:**
```json
{
  "idEmpleadoContratado": 50,
  "fechaContratacion": "2026-04-01"
}
```

**Response JSON (200):** Objeto `PostulacionResponse` con etapa actualizada a CONTRATADO

**Códigos HTTP:** `200`, `400`, `401`, `403`, `404`

---

### GET /recruitment/postulaciones/{idPostulacion}/eventos
**¿Qué hace?** Obtiene historial de eventos de una postulación

**Parámetros:**
- **Path**: `idPostulacion` (número)
- **Headers**: Authorization

**Response JSON (200):** Array de `EventoResponse[]`

**Códigos HTTP:** `200`, `401`, `403`

---

### POST /recruitment/grupos-capacitacion
**¿Qué hace?** Crea un grupo de capacitación

**Parámetros:**
- **Body**: `GrupoCapacitacionRequest`

**Response JSON (201):**
```json
{
  "id": 101,
  "nombre": "Grupo Capacitación Asesor Ventas Marzo",
  "fechaInicio": "2026-04-01",
  "fechaFin": "2026-04-15",
  "estado": "PROGRAMADO",
  "capacitador": "Dr. Carlos López",
  "ubicacion": "Sala 301 - Piso 3",
  "createdAt": "2026-03-25T12:00:00Z"
}
```

**Códigos HTTP:** `201`, `400`, `401`, `403`

---

### GET /recruitment/grupos-capacitacion
**¿Qué hace?** Lista grupos de capacitación (filtro por estado)

**Parámetros:**
- **Query** (opcional): `estado`
- **Headers**: Authorization

**Response JSON (200):** Array de `GrupoCapacitacionResponse[]`

**Códigos HTTP:** `200`, `401`, `403`

---

### POST /recruitment/grupos-capacitacion/{idGrupoCapacitacion}/postulaciones
**¿Qué hace?** Agrega un postulante a un grupo de capacitación

**Parámetros:**
- **Path**: `idGrupoCapacitacion` (número)
- **Body**: `AgregarPostulacionGrupoCapacitacionRequest`

**Request JSON:**
```json
{
  "fechaAsignacion": "2026-03-25T12:00:00Z"
}
```

**Response JSON (201):** Objeto `GrupoCapacitacionDetalleResponse`

**Códigos HTTP:** `201`, `400`, `401`, `403`, `404`

---

### GET /recruitment/tipificaciones/{etapa}/catalogo
**¿Qué hace?** Obtiene tipificaciones recruitment (con parámetro opcional puestoObjetivo)

**Parámetros:**
- **Path**: `etapa` (enum: RECLUTAMIENTO, CAPACITACION, CONTRATACION)
- **Query** (opcional): `puestoObjetivo`
- **Headers**: Authorization

**Response JSON (200)**:
```json
{
  "etapa": "RECLUTAMIENTO",
  "tipificaciones": [
    {
      "id": 100,
      "codigo": "RECLUTADO",
      "descripcion": "Candidato reclutado exitosamente",
      "orden": 1,
      "subtipificaciones": [
        {
          "id": 200,
          "codigo": "ESPERA_CAPACITACION",
          "descripcion": "Espera inicio de capacitación",
          "orden": 1
        }
      ]
    }
  ]
}
```

**Códigos HTTP:** `200`, `400`, `401`, `403`

---

## RRHH

### POST /rrhh/empleados
**¿Qué hace?** Registra un nuevo empleado en el sistema

**Parámetros:**
- **Body**: `RegistrarEmpleadoRequest`

**Request JSON:**
```json
{
  "parentesco": "ESPOSO",
  "celularTransferencia": "987654321"
}
```

**Response JSON (201):**
```json
{
  "id": 50,
  "nombres": "Carlos",
  "apellidos": "Mendoza García",
  "tipoDocumento": "DNI",
  "numeroDocumento": "12345678",
  "nacionalidad": "PERUANA",
  "fechaNacimiento": "1990-05-15",
  "estadoCivil": "CASADO",
  "tieneHijos": true,
  "celularPersonal": "987654321",
  "correoPersonal": "carlos@personal.com",
  "celularCorporativo": "51987654321",
  "correoCorporativo": "carlos@albrugroup.com",
  "origen": "Reclutamiento Interno",
  "distrito": "Lima",
  "direccion": "Calle Principal 123",
  "banco": "BCP",
  "cuentaBancaria": "19123456789",
  "cuentaInterbancaria": "021060001912345678909",
  "cuentaPropia": true,
  "parentesco": "ESPOSO",
  "celularTransferencia": "987654321",
  "empresaContratista": {
    "id": 1,
    "nombre": "Outsourcing SAC",
    "activo": true,
    "createdAt": "2026-01-15T10:00:00Z"
  },
  "estadoOperativo": "ACTIVO",
  "compania": "Centro",
  "listaNegra": false
}
```

**Códigos HTTP:** `201`, `400`, `401`, `403`, `409`

---

### GET /rrhh/empleados
**¿Qué hace?** Lista empleados con filtros avanzados (búsqueda, DNI, celular, distrito, banco, etc)

**Parámetros:**
- **Query** (opcional): `q` (búsqueda general), `dni`, `celular`, `distrito`, `banco`, `idEmpresaContratista`, `origen`, `estado`, `page`, `size`, `sort`
- **Headers**: Authorization

**Response JSON (200):**
```json
{
  "content": [
    {
      "id": 50,
      "nombres": "Carlos",
      "apellidos": "Mendoza García",
      ...
    }
  ],
  "pageable": {
    "pageSize": 20,
    "pageNumber": 0,
    "totalElements": 145
  }
}
```

**Códigos HTTP:** `200`, `400`, `401`, `403`

---

### GET /rrhh/empleados/{documento}/numero-documento
**¿Qué hace?** Obtiene empleado por número de documento

**Parámetros:**
- **Path**: `documento` (string, DNI/CE/RUC)
- **Headers**: Authorization

**Response JSON (200):** Objeto `EmpleadoResponse`

**Códigos HTTP:** `200`, `401`, `403`, `404`

---

### PATCH /rrhh/empleados/{id}/lista-negra
**¿Qué hace?** Marca/desmarca un empleado en lista negra

**Parámetros:**
- **Path**: `id` (número)
- **Headers**: Authorization

**Response JSON (200):** Objeto `EmpleadoResponse` con campo `listaNegra` actualizado

**Códigos HTTP:** `200`, `401`, `403`, `404`, `406`

---

### POST /rrhh/postulantes
**¿Qué hace?** Registra un nuevo postulante (candidato a empleo)

**Parámetros:**
- **Body**: `RegistrarPostulanteRequest`

**Response JSON (201):**
```json
{
  "id": 501,
  "nombres": "Roberto",
  "apellidos": "Martínez López",
  "tipoDocumento": "DNI",
  "numeroDocumento": "76543210",
  "celularPersonal": "987654321",
  "compania": "Centro",
  "etapaProceso": "RECLUTAMIENTO",
  "evento": "REGISTRO",
  "estadoProceso": "POR_RECLUTAR",
  "subestadoProceso": null,
  "origen": "WHATSAPP",
  "puestoTrabajo": "ASESOR_VENTAS",
  "fechaActualizacion": "2026-03-25T12:00:00Z",
  "listaNegra": false
}
```

**Códigos HTTP:** `201`, `400`, `401`, `403`, `409`

---

### GET /rrhh/postulantes/reclutamiento
**¿Qué hace?** Lista postulantes en etapa de reclutamiento

**Parámetros:**
- **Query** (opcional): `estado`, `subestado`, `origen`, `puesto`, `desde`, `hasta`, `listaNegra`
- **Headers**: Authorization

**Response JSON (200):** Array de `PostulanteResponse[]`

**Códigos HTTP:** `200`, `400`, `401`, `403`

---

### GET /rrhh/postulantes/capacitacion
**¿Qué hace?** Lista postulantes en etapa de capacitación

**Parámetros:**
- **Query** (opcional): `estado`, `subestado`, `origen`, `puesto`, `desde`, `hasta`, `listaNegra`
- **Headers**: Authorization

**Response JSON (200):** Array de `PostulanteResponse[]`

**Códigos HTTP:** `200`, `400`, `401`, `403`

---

### GET /rrhh/postulantes?etapa=...
**¿Qué hace?** Lista postulantes por etapa específica (RECLUTAMIENTO, CAPACITACION, GESTION, CONTRATADO)

**Parámetros:**
- **Query** (requerido): `etapa` (enum)
- **Headers**: Authorization

**Response JSON (200):** Array de `PostulanteResponse[]`

**Códigos HTTP:** `200`, `400`, `401`

---

### PATCH /rrhh/postulantes/{id}/estado-reclutamiento
**¿Qué hace?** Actualiza estado de postulante en reclutamiento

**Parámetros:**
- **Path**: `id` (número)
- **Body**: `EventoPostulanteRequest`

**Request JSON:**
```json
{
  "estado": "INTERESADO",
  "subestado": "ESPERA_CONTACTO"
}
```

**Response JSON (200):** Objeto `PostulanteResponse` actualizado

**Códigos HTTP:** `200`, `400`, `401`, `403`

---

### GET /rrhh/contratos/{id}/vigente
**¿Qué hace?** Obtiene contrato vigente de un empleado

**Parámetros:**
- **Path**: `id` (número, empleadoId)
- **Headers**: Authorization

**Response JSON (200):**
```json
{
  "id": 1001,
  "idEmpleado": 50,
  "puestoTrabajo": "ASESOR_VENTAS",
  "regimen": "APORTE",
  "modalidad": "REMOTO",
  "seguroSalud": "CLINICA_INTERNACIONAL",
  "sistemaPensiones": "INTEGRA",
  "sueldoBase": 1500.00,
  "fechaInicio": "2026-01-15",
  "fechaFin": null
}
```

**Códigos HTTP:** `200`, `401`, `403`, `404`

---

### POST /rrhh/contratos/{id}/registrar
**¿Qué hace?** Registra un nuevo contrato para un empleado

**Parámetros:**
- **Path**: `id` (número, empleadoId

)
- **Body**: `RegistrarContratoRequest`

**Request JSON:**
```json
{
  "seguroSalud": "CLINICA_INTERNACIONAL",
  "sistemaPensiones": "INTEGRA",
  "sueldoBase": 1500.00,
  "fechaFin": "2027-01-14"
}
```

**Response JSON (201):**
```json
{
  "contrato": {
    "id": 1001,
    "idEmpleado": 50,
    "puestoTrabajo": "ASESOR_VENTAS",
    ...
  },
  "credenciales": {
    "username": "cmendoza",
    "password": "Temp1234!@#"
  }
}
```

**Códigos HTTP:** `201`, `400`, `401`, `403`, `404`, `409`, `422`

---

### PATCH /rrhh/contratos/{id}/cesar-contrato
**¿Qué hace?** Finaliza el contrato vigente de un empleado

**Parámetros:**
- **Path**: `id` (número, empleadoId)
- **Body**: `CerrarContratoRequest` (vacío)

**Response JSON (200):** Objeto `ContratoResponse` actualizado

**Códigos HTTP:** `200`, `400`, `401`, `403`, `404`, `409`

---

### GET /rrhh/pagos
**¿Qué hace?** Lista pagos registrados (filtro por contrato, empleado, fechas)

**Parámetros:**
- **Query** (opcional): `contrato`, `empleado`, `desde`, `hasta`
- **Headers**: Authorization

**Response JSON (200):**
```json
[
  {
    "id": 5001,
    "idContrato": 1001,
    "fechaInicio": "2026-03-01",
    "fechaFin": "2026-03-31",
    "sueldoBase": 1500.00,
    "asignacionFamiliar": 100.00,
    "bonoPuntualidad": 50.00,
    "comisionSemanal": 200.00,
    "comisionMensual": 500.00,
    "bonoExtra": 0.00,
    "sueldoTotal": 2350.00
  }
]
```

**Códigos HTTP:** `200`, `400`, `401`, `403`

---

### POST /rrhh/pagos/{id}/pagar-contrato
**¿Qué hace?** Registra un pago para un contrato

**Parámetros:**
- **Path**: `id` (número, contratoId)
- **Body**: `RegistrarPagoRequest`

**Request JSON:**
```json
{
  "fechaInicio": "2026-03-01",
  "fechaFin": "2026-03-31",
  "asignacionFamiliar": 100.00,
  "bonoPuntualidad": 50.00,
  "comisionSemanal": 200.00,
  "comisionMensual": 500.00,
  "bonoExtra": 0.00
}
```

**Response JSON (201):** Objeto `PagoResponse`

**Códigos HTTP:** `201`, `400`, `401`, `403`, `404`, `409`

---

### GET /rrhh/eventos/{idEmpleado}/empleados
**¿Qué hace?** Obtiene historia de eventos (acciones) de un empleado

**Parámetros:**
- **Path**: `idEmpleado` (número)
- **Headers**: Authorization

**Response JSON (200):**
```json
[
  {
    "id": 10001,
    "idLead": null,
    "idCampana": null,
    "idActor": 50,
    "nombreActor": "Carlos Mendoza",
    "rolActor": "ASESOR_VENTAS",
    "accion": "REGISTRO",
    "etapa": null,
    "tipificacion": null,
    "subtipificacion": null,
    "createdAt": "2026-01-15T10:00:00Z"
  },
  {
    "id": 10002,
    "idLead": null,
    "idCampana": null,
    "idActor": 2,
    "nombreActor": "Admin",
    "rolActor": "ADMINISTRADOR",
    "accion": "ASIGNACION",
    "etapa": null,
    "tipificacion": null,
    "subtipificacion": null,
    "createdAt": "2026-01-16T14:30:00Z"
  }
]
```

**Códigos HTTP:** `200`, `401`, `403`

---

## Códigos de Error

### 400 Bad Request
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Campos Invalidos en la solicitud",
  "details": [
    "El campo 'email' es requerido",
    "El campo 'dni' debe tener 8 dígitos"
  ]
}
```

### 401 Unauthorized
```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Token ausente, inválido o expirado"
}
```

### 403 Forbidden
```json
{
  "status": 403,
  "error": "Forbidden",
  "message": "No tienes permisos para acceder a este recurso"
}
```

### 404 Not Found
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "El recurso solicitado no existe"
}
```

### 409 Conflict
```json
{
  "status": 409,
  "error": "Conflict",
  "message": "El recurso ya existe o genera conflicto con datos existentes",
  "details": [
    "Usuario con email 'test@email.com' ya registrado"
  ]
}
```

### 422 Unprocessable Entity (RRHH)
```json
{
  "status": 422,
  "error": "Unprocessable Entity",
  "message": "El empleado no cumple requisitos para esta operación",
  "details": [
    "Empleado tiene contrato vigente",
    "Empleado en lista negra"
  ]
}
```

---

## Estructura de Respuestas

### Patrón de Listados Paginados
```json
{
  "content": [
    { "id": 1, ... },
    { "id": 2, ... }
  ],
  "pageable": {
    "pageSize": 20,
    "pageNumber": 0,
    "totalElements": 145,
    "totalPages": 8
  },
  "last": false,
  "first": true,
  "empty": false
}
```

### Patrón de Respuesta Vacía (204 No Content)
- Cuerpo vacío
- Headers: `Content-Length: 0`

### Header de Respuesta Estándar
```
Content-Type: application/json;charset=UTF-8
Date: Wed, 25 Mar 2026 12:00:00 GMT
Server: Apache Tomcat/9.0.x
```

---

**Fin de documentación - Última actualización: 1 de Abril de 2026**
