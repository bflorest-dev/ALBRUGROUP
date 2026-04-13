# Catálogo de Endpoints Backend → Frontend (FSD)

## 1) Fuente de verdad y convenciones

- **Fuente de verdad de rutas consumibles por frontend:** `gateway-service/src/main/resources/application.yml`.
- **Prefijos públicos vía gateway:**
  - `/auth/**` → `auth-service`
  - `/rrhh/**` → `rrhh-service`
  - `/leads/**` → `lead-service`
  - `/presence/**` → endpoints nativos de `gateway-service`
- **Header de autenticación:** `Authorization: Bearer <jwt>` en todos los endpoints, salvo `POST /auth/autorizacion/login`.
- **Content-Type para requests con body:** `application/json`.

## 2) Contratos TypeScript de respuesta + ejemplos JSON

```ts
export interface LoginResponse {
  token: string;
  type: string;
  username: string;
  empleadoId: number;
  nombreCompleto: string;
  roles: string[];
}

export interface UsuarioResponse {
  id: number;
  username: string;
  email: string;
  empleadoId: number;
  nombreCompleto: string;
  activo: boolean;
  roles: string[];
}

export interface CredencialesResponse {
  username: string;
  password: string;
}

export interface ConnectedUserResponse {
  empleadoId: number;
  nombreCompleto: string;
  roles: string[];
  status: string;
  disponibilidad: string;
  lastSeen: string;
}

export interface ConnectedStatusResponse {
  empleadoId: number;
  conectado: boolean;
}

export interface CampanaResponse {
  id: number;
  nombre: string;
  numeroWhatsappEmpresa: string;
  activo: boolean;
  idCuentaPublicitaria: number;
  numeroCuenta: string;
  nombreCuenta: string;
  idProveedor: number;
  nombreProveedor: string;
  updatedAt: string;
}

export interface CuentaPublicitariaResponse {
  id: number;
  numeroCuenta: string;
  nombreCuenta: string;
  activo: boolean;
}

export interface EventoResponse {
  id: number;
  idLead: number;
  idCampana: number;
  idActor: number;
  nombreActor: string;
  rolActor: string;
  accion: string;
  etapa: string;
  tipificacion: string;
  subtipificacion: string;
  createdAt: string;
}

export interface AdicionalResponse {
  id: number;
  nombre: string;
  precioUnitario: number;
  idProveedor: number;
  nombreProveedor: string;
  activo: boolean;
}

export interface InternetResponse {
  id: number;
  velocidad: number;
  unidad: string;
  tecnologia: string;
}

export interface TelevisionResponse {
  id: number;
  nombre: string;
  cantidadCanales: number;
}

export interface TelefonoResponse {
  id: number;
  minutos: number;
  descripcion: string;
}

export interface PlanAdicionalResponse {
  idAdicional: number;
  nombreAdicional: string;
  cantidadIncluida: number;
  permiteCompraAdicional: boolean;
  cantidadMaximaAdicional: number;
  precioUnitarioAdicional: number;
}

export interface PlanResponse {
  id: number;
  nombre: string;
  precio: number;
  vigenciaDesde: string;
  vigenciaHasta: string;
  idProveedor: number;
  nombreProveedor: string;
  internet: InternetResponse | null;
  television: TelevisionResponse | null;
  telefono: TelefonoResponse | null;
  adicionales: PlanAdicionalResponse[];
  activo: boolean;
}

export interface ServiciosProveedorResponse {
  idProveedor: number;
  nombreProveedor: string;
  internets: InternetResponse[];
  televisiones: TelevisionResponse[];
  telefonos: TelefonoResponse[];
}

export interface ProveedorResponse {
  id: number;
  nombre: string;
  activo: boolean;
  createdAt: string;
}

export interface PromocionComercialResponse {
  id: number;
  nombre: string;
  interno: boolean;
  idProveedor: number;
  nombreProveedor: string;
  idZona: number;
  nombreZona: string;
  descuento: boolean;
  cantidadMeses: number;
  vigenciaDesde: string;
  vigenciaHasta: string;
  activo: boolean;
  createdAt: string;
}

export interface SubtipificacionResponse {
  id: number;
  codigo: string;
  descripcion: string;
  orden: number;
}

export interface TipificacionResponse {
  id: number;
  codigo: string;
  descripcion: string;
  orden: number;
  subtipificaciones: SubtipificacionResponse[];
}

export interface CatalogoResponse {
  etapa: string;
  tipificaciones: TipificacionResponse[];
}

export interface DepartamentoResponse {
  id: number;
  codigo: string;
  nombre: string;
}

export interface ProvinciaResponse {
  id: number;
  codigo: string;
  nombre: string;
  idDepartamento: number;
}

export interface DistritoResponse {
  id: number;
  codigo: string;
  nombre: string;
  idProvincia: number;
  idDepartamento: number;
}

export interface ZonaReglaResponse {
  id: number;
  nivelGeografico: string;
  geoId: number;
  criterio: string;
}

export interface ZonaResponse {
  id: number;
  nombre: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  reglas: ZonaReglaResponse[];
}

export interface LeadAsesorVentasResponse {
  id: number;
  fechaAsignacion: string;
  prefijo: string;
  lead: string;
  nombreTitular: string;
  correo: string;
  estadoSeguimiento: string;
}

export interface LeadAsesorDetalleResponse {
  id: number;
  fechaAsignacion: string;
  lastEntryAt: string;
  prefijo: string;
  lead: string;
  nombreCampana: string;
  nombreProveedorCampana: string;
  base: string;
  estadoSeguimiento: string;
  idAsesorAsignado: number;
  nombreAsesorAsignado: string;
  tipoDocumento: string;
  numeroDocumentoTitularServicio: string;
  nombreTitular: string;
  celularRegistro: string;
  celularReferencia: string;
  correo: string;
  numeroDocumentoTitularCelularRegistro: string;
  nombreTitularCelularRegistro: string;
  ubigeoNacimiento: string;
  ubigeoDomicilio: string;
  tipoDomicilio: string;
  tipoVia: string;
  via: string;
  direccion: string;
  referencia: string;
  latitud: number;
  longitud: number;
  urbanizacion: string;
  numero: string;
  manzana: string;
  lote: string;
  nombreEdificio: string;
  nombreCondominio: string;
  piso: string;
  interior: string;
}

export interface LeadGtrResponse {
  id: number;
  createdAt: string;
  nombreCampana: string;
  nombreProveedorCampana: string;
  base: string;
  nombreTitular: string;
  codigoTipificacion: string;
  codigoSubtipificacion: string;
  nombreAsesorAsignado: string;
  estadoSeguimiento: string;
  reasignaciones: number;
}

export interface EmpresaContratistaResponse {
  id: number;
  nombre: string;
  activo: boolean;
  createdAt: string;
}

export interface EmpleadoResponse {
  id: number;
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nacionalidad: string;
  fechaNacimiento: string;
  estadoCivil: string;
  tieneHijos: boolean;
  celularPersonal: string;
  correoPersonal: string;
  celularCorporativo: string;
  correoCorporativo: string;
  origen: string;
  distrito: string;
  direccion: string;
  banco: string;
  cuentaBancaria: string;
  cuentaInterbancaria: string;
  cuentaPropia: boolean;
  parentesco: string;
  celularTransferencia: string;
  empresaContratista: EmpresaContratistaResponse;
  estadoOperativo: string;
  compania: string;
  listaNegra: boolean;
}

export interface PostulanteResponse {
  id: number;
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  celularPersonal: string;
  compania: string;
  etapaProceso: string;
  evento: string;
  estadoProceso: string;
  subestadoProceso: string;
  origen: string;
  puestoTrabajo: string;
  fechaActualizacion: string;
  listaNegra: boolean;
}

export interface PostulanteEventoResponse {
  id: number;
  postulanteId: number;
  responsableId: number;
  etapaProceso: string;
  evento: string;
  estado: string;
  subestado: string;
  fechaCreacion: string;
  fechaEvento: string;
  inicioCapa: string;
  finCapa: string;
  turnoHorario: string;
  pagoDiaCapa: number;
}

export interface ContratoResponse {
  id: number;
  idEmpleado: number;
  puestoTrabajo: string;
  regimen: string;
  modalidad: string;
  seguroSalud: string;
  sistemaPensiones: string;
  sueldoBase: number;
  fechaInicio: string;
  fechaFin: string;
}

export interface ContratoRegistroResponse {
  contrato: ContratoResponse;
  credenciales: CredencialesResponse;
}

export interface PagoResponse {
  id: number;
  idContrato: number;
  fechaInicio: string;
  fechaFin: string;
  sueldoBase: number;
  asignacionFamiliar: number;
  bonoPuntualidad: number;
  comisionSemanal: number;
  comisionMensual: number;
  bonoExtra: number;
  sueldoTotal: number;
}

```ts
// Request DTO schemas
export interface ActualizarCredencialesRequest {
  nombres: string;
  apellidos: string;
  dni: string;
  puestoTrabajo: PuestoTrabajo;
}

export interface ActualizarDetalleGrupoCapacitacionRequest {
  estadoCapacitacion: EstadoCapacitacionPostulante;
  fechaResultado: string;
  fechaContratacion: string;
  cumplioTresMeses: boolean;
  fechaCumplioTresMeses: string;
}

export interface ActualizarEstadoOfertaLaboralRequest {
  // sin campos
}

export interface AdicionalRequest {
  idProveedor: number;
  nombre: string;
  precioUnitario: number;
}

export interface AgregarPostulacionGrupoCapacitacionRequest {
  fechaAsignacion: string;
}

export interface CampanaRequest {
  // sin campos
}

export interface CampanaWhatsappRequest {
  numeroWhatsappEmpresa: string;
}

export interface CatalogoEstadoRequest {
  etapa: Etapa;
}

export interface CatalogoRequest {
  etapa: Etapa;
}

export interface CatalogoTipificacionRequest {
  etapa: Etapa;
}

export interface CerrarContratoRequest {
  // sin campos
}

export interface ConfirmarContratacionRequest {
  idEmpleadoContratado: number;
  fechaContratacion: string;
}

export interface CuentaPublicitariaRequest {
  // sin campos
}

export interface DatosContactoCorporativoRequest {
  // sin campos
}

export interface DatosContactoUbicacionRequest {
  // sin campos
}

export interface DatosFinancierosRequest {
  parentesco: Parentesco;
  celularTransferencia: string;
}

export interface DatosPersonalesRequest {
  // sin campos
}

export interface ForgotPasswordRequest {
  username: string;
  email: string;
  dni: string;
}

export interface GrupoCapacitacionRequest {
  // sin campos
}

export interface InternetRequest {
  velocidad: number;
  unidad: Unidad;
  tecnologia: Tecnologia;
}

export interface LeadAsignacionRequest {
  idAsesorAsignado: number;
  nombreAsesorAsignado: string;
}

export interface LeadDatosPreventaRequest {
  tipoDocumento: TipoDocumento;
  numeroDocumentoTitularServicio: string;
  ubigeoNacimiento: string;
  nombreTitularServicio: string;
  celularRegistro: string;
  celularReferencia: string;
  correo: string;
  numeroDocumentoTitularCelularRegistro: string;
  nombreTitularCelularRegistro: string;
}

export interface LeadDireccionRequest {
  ubigeoDomicilio: string;
  tipoDomicilio: TipoDomicilio;
  tipoVia: TipoVia;
  via: string;
  direccion: string;
  referencia: string;
  latitud: number;
  longitud: number;
  urbanizacion: string;
  numero: string;
  manzana: string;
  lote: string;
  nombreEdificio: string;
  nombreCondominio: string;
  piso: string;
  interior: string;
}

export interface LeadIntakeRequest {
  prefijo: string;
  lead: string;
  idCampana: number;
  base: Base;
}

export interface LeadOfertaAdicionalRequest {
  idAdicional: number;
  cantidad: number;
}

export interface LeadOfertaComercialRequest {
  idPlan: number;
  idPromocionInterna: number;
  idPromocionProveedor: number;
  adicionales: LeadOfertaAdicionalRequest[];
}

export interface LeadTipificacionRequest {
  codigoTipificacion: string;
  codigoSubtipificacion: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface OfertaAmpliacionRequest {
  // sin campos
}

export interface OfertaLaboralRequest {
  // sin campos
}

export interface PlanAdicionalRequest {
  idAdicional: number;
  cantidadIncluida: number;
  permiteCompraAdicional: boolean;
  cantidadMaximaAdicional: number;
  precioUnitarioAdicional: number;
}

export interface PlanRequest {
  vigenciaDesde: string;
  vigenciaHasta: string;
}

export interface PlanUpdateRequest {
  nombre: string;
  precio: number;
  vigenciaDesde: string;
  vigenciaHasta: string;
}

export interface PostulacionRequest {
  // sin campos
}

export interface PostulanteRequest {
  // sin campos
}

export interface PromocionComercialRequest {
  idProveedor: number;
  idZona: number;
  vigenciaDesde: string;
  vigenciaHasta: string;
}

export interface ProveedorRequest {
  nombre: string;
}

export interface RegistrarContratoRequest {
  seguroSalud: SeguroSalud;
  sistemaPensiones: SistemaPensiones;
  sueldoBase: number;
  fechaFin: string;
}

export interface RegistrarEmpleadoRequest {
  parentesco: Parentesco;
  celularTransferencia: string;
}

export interface RegistrarEmpresaContratistaRequest {
  nombre: string;
}

export interface RegistrarEventoRequest {
  idLead: number;
  idCampana: number;
  accion: Accion;
  etapa: Etapa;
  tipificacion: string;
  subtipificacion: string;
}

export interface RegistrarPagoRequest {
  fechaInicio: string;
  fechaFin: string;
  asignacionFamiliar: number;
  bonoPuntualidad: number;
  comisionSemanal: number;
  comisionMensual: number;
  bonoExtra: number;
}

export interface RegistrarUsuarioRequest {
  empleadoId: number;
  nombres: string;
  apellidos: string;
  dni: string;
  email: string;
  puestoTrabajo: PuestoTrabajo;
}

export interface SubtipificacionCatalogoRequest {
  id: number;
  codigo: string;
  descripcion: string;
  orden: number;
}

export interface SubtipificacionRequest {
  etapaDestino: Etapa;
  estadoDestino: EstadoPostulacion;
  estadoBandejaDestino: EstadoBandejaPostulacion;
}

export interface TelefonoRequest {
  minutos: number;
  descripcion: string;
}

export interface TelevisionRequest {
  nombre: string;
  cantidadCanales: number;
}

export interface TipificacionCatalogoRequest {
  id: number;
  codigo: string;
  descripcion: string;
  orden: number;
}

export interface TipificacionRequest {
  // sin campos
}

export interface TipificarPostulacionRequest {
  modalidadContacto: ModalidadContacto;
  observacion: string;
}

export interface ZonaReglaRequest {
  nivelGeografico: NivelGeografico;
  geoId: number;
  criterio: CriterioZona;
}

export interface ZonaRequest {
  nombre: string;
}
```

### Ejemplos JSON representativos

```json
{
  "loginResponse": {
    "token": "<jwt>",
    "type": "Bearer",
    "username": "admin",
    "empleadoId": 1,
    "nombreCompleto": "Juan Pérez",
    "roles": ["ADMINISTRADOR"]
  },
  "connectedUserResponse": {
    "empleadoId": 12,
    "nombreCompleto": "Ana Gómez",
    "roles": ["ASESOR_VENTAS"],
    "status": "ONLINE",
    "disponibilidad": "DISPONIBLE",
    "lastSeen": "2026-03-25T12:00:00Z"
  },
  "leadAsesorDetalleResponse": {
    "id": 101,
    "fechaAsignacion": "2026-03-25T08:15:30Z",
    "lead": "987654321",
    "nombreTitular": "Carlos Díaz",
    "tipoDocumento": "DNI",
    "numeroDocumentoTitularServicio": "12345678",
    "direccion": "Av. Principal 123",
    "latitud": -12.0464,
    "longitud": -77.0428
  },
  "empleadoResponse": {
    "id": 44,
    "nombres": "María",
    "apellidos": "Torres",
    "tipoDocumento": "DNI",
    "numeroDocumento": "76543210",
    "empresaContratista": {
      "id": 2,
      "nombre": "Outsourcing SAC",
      "activo": true,
      "createdAt": "2026-01-15T10:00:00Z"
    },
    "estadoOperativo": "ACTIVO",
    "listaNegra": false
  }
}
```

## 3) Endpoints documentados (método + URL + parámetros + headers + interfaz + feature FSD)

> Nota: `body` referencia el DTO request del backend (`entity.request...`).

### 3.1 Auth (`/auth/autorizacion`)

- `POST /auth/autorizacion/login`
  - Request DTO: `LoginRequest`
  - Request JSON:
    ```json
    {
      "username": "juan.perez",
      "password": "P@ssw0rd"
    }
    ```
  - Response DTO: `LoginResponse`
  - Response JSON:
    ```json
    {
      "token": "eyJhbGciOi...",
      "type": "Bearer",
      "username": "juan.perez",
      "empleadoId": 42,
      "nombreCompleto": "Juan Pérez",
      "roles": ["ADMINISTRADOR"]
    }
    ```
  - Headers: `Content-Type: application/json`
  - Códigos: `200`, `401`

- `POST /auth/autorizacion/upsert-usuario`
  - Request DTO: `RegistrarUsuarioRequest`
  - Request JSON:
    ```json
    {
      "empleadoId": 42,
      "nombres": "Juan",
      "apellidos": "Pérez",
      "dni": "12345678",
      "email": "juan.perez@example.com",
      "puestoTrabajo": "ADMINISTRADOR"
    }
    ```
  - Response: `200` sin body
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `200`, `400`, `401`, `403`

- `PATCH /auth/autorizacion/{empleadoId}/roles`
  - Request DTO: `PuestoTrabajo` enum
  - Request JSON:
    ```json
    "ADMINISTRADOR"
    ```
  - Response DTO: `UsuarioResponse`
  - Response JSON:
    ```json
    {
      "empleadoId": 42,
      "dni": "12345678",
      "nombreCompleto": "Juan Pérez",
      "username": "juan.perez",
      "activo": true,
      "passwordInicializada": true,
      "email": "juan.perez@example.com",
      "roles": ["ADMINISTRADOR"]
    }
    ```
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `200`, `400`, `401`, `403`

- `PATCH /auth/autorizacion/{empleadoId}/username-roles`
  - Request DTO: `ActualizarCredencialesRequest`
  - Request JSON:
    ```json
    {
      "nombres": "Juan",
      "apellidos": "Pérez",
      "dni": "12345678",
      "puestoTrabajo": "ADMINISTRADOR"
    }
    ```
  - Response DTO: `UsuarioResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `200`, `400`, `401`, `403`

- `POST /auth/autorizacion/{empleadoId}/reset-password`
  - Request: sin body
  - Response DTO: `CredencialesResponse`
  - Response JSON:
    ```json
    {
      "username": "juan.perez",
      "password": "Nuev0P@ss"
    }
    ```
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`

- `POST /auth/autorizacion/forgot-password`
  - Request DTO: `ForgotPasswordRequest`
  - Request JSON:
    ```json
    {
      "username": "juan.perez",
      "email": "juan.perez@example.com",
      "dni": "12345678"
    }
    ```
  - Response DTO: `CredencialesResponse`
  - Response JSON:
    ```json
    {
      "username": "juan.perez",
      "password": "Nuev0P@ss"
    }
    ```
  - Headers: `Content-Type: application/json`
  - Códigos: `200`, `400`, `401`

- `GET /auth/autorizacion/estado-acceso/{username}`
  - Request: sin body
  - Response DTO: `EstadoAccesoResponse`
  - Response JSON:
    ```json
    {
      "activo": true,
      "passwordInicializada": false
    }
    ```
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `404`

- `GET /auth/autorizacion/{empleadoId}/empleado`
  - Request: sin body
  - Response DTO: `UsuarioResponse`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`, `404`

- `DELETE /auth/autorizacion/{empleadoId}/deshabilitar`
  - Request: sin body
  - Response: `204` sin body
  - Headers: `Authorization`
  - Códigos: `204`, `401`, `403`

### 3.2 Presence Gateway (`/presence`)

- `POST /presence/online`
  - Request: sin body
  - Response: `200` sin body
  - Headers: `Authorization`
  - Códigos: `200`, `401`

- `POST /presence/heartbeat`
  - Request: sin body
  - Response: `200` sin body
  - Headers: `Authorization`
  - Códigos: `200`, `401`

- `POST /presence/offline`
  - Request: sin body
  - Response: `204` sin body
  - Headers: `Authorization`
  - Códigos: `204`, `401`

- `PATCH /presence/disponibilidad/{disponibilidad}`
  - Request: sin body
  - Response: `200` sin body
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `404`

- `GET /presence/connected-users`
  - Query: opcional `role`
  - Request: sin body
  - Response DTO: `ConnectedUserResponse[]`
  - Response JSON:
    ```json
    [
      {
        "empleadoId": 12,
        "nombreCompleto": "Ana Gómez",
        "roles": ["ASESOR_VENTAS"],
        "status": "ONLINE",
        "disponibilidad": "DISPONIBLE",
        "lastSeen": "2026-04-03T12:34:56Z"
      }
    ]
    ```
  - Headers: `Authorization`
  - Códigos: `200`, `401`

- `GET /presence/connected-users/{empleadoId}`
  - Request: sin body
  - Response DTO: `ConnectedStatusResponse`
  - Response JSON:
    ```json
    {
      "empleadoId": 12,
      "conectado": true
    }
    ```
  - Headers: `Authorization`
  - Códigos: `200`, `401`

### 3.3 Leads (`/leads`)

#### LeadController (`/leads/leads`)

- `POST /leads/leads/intake`
  - Request DTO: `LeadIntakeRequest`
  - Request JSON:
    ```json
    {
      "prefijo": "+51",
      "lead": "987654321",
      "idCampana": 10,
      "base": "WHATSAPP"
    }
    ```
  - Response: `204` sin body
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `204`, `400`, `401`, `403`

- `PATCH /leads/leads/{idLead}/asignacion`
  - Request DTO: `LeadAsignacionRequest`
  - Request JSON:
    ```json
    {
      "idAsesorAsignado": 5,
      "nombreAsesorAsignado": "María López"
    }
    ```
  - Response: `204` sin body
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `204`, `400`, `401`, `403`

- `GET /leads/leads/asesor-ventas`
  - Request: sin body
  - Response DTO: `LeadAsesorVentasResponse[]`
  - Response JSON:
    ```json
    [
      {
        "id": 12,
        "fechaAsignacion": "2026-04-01T09:15:00Z",
        "prefijo": "+51",
        "lead": "987654321",
        "nombreTitular": "Carlos Pérez",
        "correo": "carlos.perez@example.com",
        "estadoSeguimiento": "NUEVO"
      }
    ]
    ```
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`

- `GET /leads/leads/{idLead}/detalle-asesor`
  - Request: sin body
  - Response DTO: `LeadAsesorDetalleResponse`
  - Response JSON:
    ```json
    {
      "id": 12,
      "fechaAsignacion": "2026-04-01T09:15:00Z",
      "lastEntryAt": "2026-04-02T10:22:00Z",
      "prefijo": "+51",
      "lead": "987654321",
      "nombreCampana": "Campaña A",
      "nombreProveedorCampana": "Proveedor X",
      "base": "WHATSAPP",
      "estadoSeguimiento": "NUEVO",
      "idAsesorAsignado": 5,
      "nombreAsesorAsignado": "María López",
      "tipoDocumento": "DNI",
      "numeroDocumentoTitularServicio": "12345678",
      "nombreTitular": "Carlos Pérez",
      "celularRegistro": "987654321",
      "correo": "carlos.perez@example.com",
      "ubigeoNacimiento": "150101",
      "ubigeoDomicilio": "150101",
      "tipoDomicilio": "MULTIFAMILIAR",
      "tipoVia": "CALLE",
      "via": "Los Álamos",
      "direccion": "Av. Principal 123",
      "referencia": "Frente al parque",
      "latitud": -12.0464,
      "longitud": -77.0428,
      "urbanizacion": "San Isidro",
      "numero": "123",
      "manzana": "A",
      "lote": "2",
      "nombreEdificio": "Torres del Sol",
      "nombreCondominio": "Central Park",
      "piso": "5",
      "interior": "A"
    }
    ```
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`, `404`

- `PATCH /leads/leads/{idLead}/datos-preventa`
  - Request DTO: `LeadDatosPreventaRequest`
  - Request JSON:
    ```json
    {
      "tipoDocumento": "DNI",
      "numeroDocumentoTitularServicio": "12345678",
      "ubigeoNacimiento": "150101",
      "nombreTitularServicio": "Carlos Pérez",
      "celularRegistro": "987654321",
      "celularReferencia": "912345678",
      "correo": "carlos.perez@example.com",
      "numeroDocumentoTitularCelularRegistro": "87654321",
      "nombreTitularCelularRegistro": "Carlos Pérez"
    }
    ```
  - Response: `204` sin body
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `204`, `400`, `401`, `403`

- `PATCH /leads/leads/{idLead}/direccion`
  - Request DTO: `LeadDireccionRequest`
  - Request JSON:
    ```json
    {
      "ubigeoDomicilio": "150101",
      "tipoDomicilio": "MULTIFAMILIAR",
      "tipoVia": "CALLE",
      "via": "Santa Cruz",
      "direccion": "Av. Principal 123",
      "referencia": "Frente al colegio",
      "latitud": -12.0464,
      "longitud": -77.0428,
      "urbanizacion": "San Isidro",
      "numero": "123",
      "manzana": "A",
      "lote": "2",
      "nombreEdificio": "Torres del Sol",
      "nombreCondominio": "Central Park",
      "piso": "5",
      "interior": "A"
    }
    ```
  - Response: `204` sin body
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `204`, `400`, `401`, `403`

- `PATCH /leads/leads/{idLead}/oferta-comercial`
  - Request DTO: `LeadOfertaComercialRequest`
  - Request JSON:
    ```json
    {
      "idPlan": 22,
      "idPromocionInterna": 5,
      "idPromocionProveedor": 7,
      "adicionales": [
        { "idAdicional": 10, "cantidad": 2 }
      ]
    }
    ```
  - Response: `204` sin body
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `204`, `400`, `401`, `403`

- `POST /leads/leads/{idLead}/tipificacion`
  - Request DTO: `LeadTipificacionRequest`
  - Request JSON:
    ```json
    {
      "codigoTipificacion": "VENTA_EXITOSA",
      "codigoSubtipificacion": "ALTA_CLIENTE"
    }
    ```
  - Response: `204` sin body
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `204`, `400`, `401`, `403`

- `POST /leads/leads/{idLead}/contacto`
  - Request: sin body
  - Response: `204` sin body
  - Headers: `Authorization`
  - Códigos: `204`, `401`, `403`

- `GET /leads/leads/gtr`
  - Query: opcional `fecha` (YYYY-MM-DD)
  - Request: sin body
  - Response DTO: `LeadGtrResponse[]`
  - Response JSON:
    ```json
    [
      {
        "id": 42,
        "createdAt": "2026-04-01T09:15:00Z",
        "prefijo": "+51",
        "lead": "987654321",
        "nombreCampana": "Campaña A",
        "nombreProveedorCampana": "Proveedor X",
        "base": "WHATSAPP",
        "nombreTitular": "Carlos Pérez",
        "codigoTipificacion": "CONTACTADO",
        "codigoSubtipificacion": "INTERESADO",
        "nombreAsesorAsignado": "María López",
        "estadoSeguimiento": "NUEVO",
        "reasignaciones": 1
      }
    ]
    ```
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`

#### Campaña (`/leads/campanas`)

- `POST /leads/campanas`
  - Request DTO: `CampanaRequest`
  - Request JSON:
    ```json
    {
      "nombre": "Campaña Abril",
      "numeroWhatsappEmpresa": "+51987654321",
      "idCuentaPublicitaria": 3,
      "idProveedor": 2
    }
    ```
  - Response DTO: `CampanaResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `201`, `400`, `401`, `403`, `409`

- `PUT /leads/campanas/{idCampana}`
  - Request DTO: `CampanaWhatsappRequest`
  - Request JSON:
    ```json
    {
      "numeroWhatsappEmpresa": "+51987654399"
    }
    ```
  - Response DTO: `CampanaResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `200`, `400`, `401`, `403`, `404`

- `DELETE /leads/campanas/{idCampana}`
  - Request: sin body
  - Response DTO: `CampanaResponse`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`, `404`

- `GET /leads/campanas`
  - Query: opcional `activo`
  - Request: sin body
  - Response DTO: `CampanaResponse[]`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`

#### Cuentas publicitarias (`/leads/cuentas-publicitarias`)

- `POST /leads/cuentas-publicitarias`
  - Request DTO: `CuentaPublicitariaRequest`
  - Request JSON:
    ```json
    {
      "numeroCuenta": "CUENTA123",
      "nombreCuenta": "Cuenta Principal"
    }
    ```
  - Response DTO: `CuentaPublicitariaResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `201`, `400`, `401`, `403`, `409`

- `GET /leads/cuentas-publicitarias`
  - Query: opcional `activo`
  - Request: sin body
  - Response DTO: `CuentaPublicitariaResponse[]`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`

- `GET /leads/cuentas-publicitarias/activas`
  - Request: sin body
  - Response DTO: `CuentaPublicitariaResponse[]`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`

- `DELETE /leads/cuentas-publicitarias/{idCuentaPublicitaria}`
  - Request: sin body
  - Response DTO: `CuentaPublicitariaResponse`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`, `404`

#### Eventos de leads (`/leads/eventos`)

- `GET /leads/eventos/lead/{idLead}`
  - Request: sin body
  - Response DTO: `EventoResponse[]`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`

- `GET /leads/eventos/empleado/{idEmpleado}`
  - Query: opcional `fechaDesde`, `fechaHasta`
  - Request: sin body
  - Response DTO: `EventoResponse[]`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`

#### Planes (`/leads/planes`)

- `POST /leads/planes/adicionales`
  - Request DTO: `AdicionalRequest`
  - Request JSON:
    ```json
    {
      "idProveedor": 2,
      "nombre": "Adicional TV",
      "precioUnitario": 35.5
    }
    ```
  - Response DTO: `AdicionalResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `201`, `400`, `401`, `403`, `409`

- `POST /leads/planes`
  - Request DTO: `PlanRequest`
  - Request JSON:
    ```json
    {
      "idProveedor": 2,
      "nombre": "Plan 200 Mbps",
      "precio": 99.9,
      "vigenciaDesde": "2026-04-01",
      "vigenciaHasta": "2026-12-31",
      "internet": {
        "velocidad": 200,
        "unidad": "MBPS",
        "tecnologia": "FTTH"
      },
      "television": {
        "nombre": "Básico",
        "cantidadCanales": 120
      },
      "telefono": {
        "minutos": 500,
        "descripcion": "Minutos nacionales"
      },
      "adicionales": [
        {
          "idAdicional": 10,
          "cantidadIncluida": 2,
          "permiteCompraAdicional": true,
          "cantidadMaximaAdicional": 5,
          "precioUnitarioAdicional": 10.0
        }
      ]
    }
    ```
  - Response DTO: `PlanResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `201`, `400`, `401`, `403`, `409`

- `GET /leads/planes`
  - Query: opcional `idProveedor`, `soloVigentes`
  - Request: sin body
  - Response DTO: `PlanResponse[]`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`

- `GET /leads/planes/adicionales`
  - Query: requerido `idProveedor`
  - Request: sin body
  - Response DTO: `AdicionalResponse[]`
  - Headers: `Authorization`
  - Códigos: `200`, `400`, `401`, `403`

- `GET /leads/planes/servicios`
  - Query: requerido `idProveedor`
  - Request: sin body
  - Response DTO: `ServiciosProveedorResponse`
  - Headers: `Authorization`
  - Códigos: `200`, `400`, `401`, `403`

- `PUT /leads/planes/{idPlan}`
  - Request DTO: `PlanUpdateRequest`
  - Request JSON:
    ```json
    {
      "nombre": "Plan 250 Mbps",
      "precio": 109.9,
      "vigenciaDesde": "2026-05-01",
      "vigenciaHasta": "2027-04-30"
    }
    ```
  - Response DTO: `PlanResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `200`, `400`, `401`, `403`, `404`

- `DELETE /leads/planes/{idPlan}`
  - Request: sin body
  - Response DTO: `PlanResponse`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`, `404`

#### Proveedores (`/leads/proveedores`)

- `POST /leads/proveedores`
  - Request DTO: `ProveedorRequest`
  - Request JSON:
    ```json
    {
      "nombre": "Proveedor Y"
    }
    ```
  - Response DTO: `ProveedorResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `201`, `400`, `401`, `403`, `409`

- `PATCH /leads/proveedores/{idProveedor}/estado`
  - Request: sin body
  - Response DTO: `ProveedorResponse`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`, `404`

#### Promociones (`/leads/promociones`)

- `POST /leads/promociones`
  - Request DTO: `PromocionComercialRequest`
  - Request JSON:
    ```json
    {
      "nombre": "Promoción Abril",
      "interno": false,
      "idProveedor": 2,
      "idZona": 3,
      "descuento": true,
      "descuentoPorcentual": 10.0,
      "cantidadMeses": 6,
      "vigenciaDesde": "2026-04-01",
      "vigenciaHasta": "2026-09-30"
    }
    ```
  - Response DTO: `PromocionComercialResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `201`, `400`, `401`, `403`, `409`

- `GET /leads/promociones`
  - Query: opcional `idProveedor`, `interno`, `idZona`
  - Request: sin body
  - Response DTO: `PromocionComercialResponse[]`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`

- `DELETE /leads/promociones/{idPromocion}`
  - Request: sin body
  - Response DTO: `PromocionComercialResponse`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`, `404`

#### Tipificaciones (`/leads/tipificaciones`)

- `GET /leads/tipificaciones/{etapa}/catalogo`
  - Request: sin body
  - Response DTO: `CatalogoResponse`
  - Headers: `Authorization`
  - Códigos: `200`, `400`, `401`, `403`

- `PUT /leads/tipificaciones/catalogo`
  - Request DTO: `CatalogoRequest`
  - Request JSON:
    ```json
    {
      "etapa": "PREVENTA",
      "tipificaciones": [
        {
          "id": 1,
          "codigo": "INTERESADO",
          "descripcion": "Interesado",
          "orden": 1,
          "subtipificaciones": [
            {
              "id": 11,
              "codigo": "ALTA",
              "descripcion": "Alta por oferta",
              "orden": 1
            }
          ]
        }
      ]
    }
    ```
  - Response DTO: `CatalogoResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `200`, `400`, `401`, `403`

- `PATCH /leads/tipificaciones/catalogo/estado`
  - Request DTO: `CatalogoEstadoRequest`
  - Request JSON:
    ```json
    {
      "etapa": "PREVENTA",
      "tipificacionesActivar": [1],
      "tipificacionesDesactivar": [2],
      "subtipificacionesActivar": [11],
      "subtipificacionesDesactivar": [12]
    }
    ```
  - Response DTO: `CatalogoResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `200`, `400`, `401`, `403`

#### Ubigeo (`/leads/ubigeo`)

- `GET /leads/ubigeo/departamentos`
  - Request: sin body
  - Response DTO: `DepartamentoResponse[]`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`

- `GET /leads/ubigeo/departamentos/{idDepartamento}/provincias`
  - Request: sin body
  - Response DTO: `ProvinciaResponse[]`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`

- `GET /leads/ubigeo/provincias/{idProvincia}/distritos`
  - Request: sin body
  - Response DTO: `DistritoResponse[]`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`

#### Zonas (`/leads/zonas`)

- `POST /leads/zonas`
  - Request DTO: `ZonaRequest`
  - Request JSON:
    ```json
    {
      "nombre": "Zona Norte",
      "reglas": [
        {
          "nivelGeografico": "DEPARTAMENTO",
          "geoId": 15,
          "criterio": "INCLUIR"
        }
      ]
    }
    ```
  - Response DTO: `ZonaResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `201`, `400`, `401`, `403`, `409`

- `GET /leads/zonas`
  - Request: sin body
  - Response DTO: `ZonaResponse[]`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`

- `PATCH /leads/zonas/{idZona}/estado`
  - Request: sin body
  - Response DTO: `ZonaResponse`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`, `404`

- `PUT /leads/zonas/{idZona}`
  - Request DTO: `ZonaRequest`
  - Response DTO: `ZonaResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `200`, `400`, `401`, `403`, `404`

### 3.3.1 Recruitment (`/recruitment/postulaciones`, `/recruitment/ofertas-laborales`, `/recruitment/grupos-capacitacion`)

#### Grupo de capacitación (`/recruitment/grupos-capacitacion`)

- `POST /recruitment/grupos-capacitacion`
  - Request DTO: `GrupoCapacitacionRequest`
  - Request JSON:
    ```json
    {
      "codigo": "GRUPO-01",
      "idCapacitador": 8,
      "turno": "MORNING",
      "sala": "SALON_A",
      "fechaInicio": "2026-05-10",
      "fechaFin": "2026-05-20"
    }
    ```
  - Response DTO: `GrupoCapacitacionResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `201`, `400`, `401`, `403`

- `GET /recruitment/grupos-capacitacion`
  - Query: opcional `estado`
  - Request: sin body
  - Response DTO: `GrupoCapacitacionResponse[]`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`

- `GET /recruitment/grupos-capacitacion/{idGrupoCapacitacion}`
  - Request: sin body
  - Response DTO: `GrupoCapacitacionResponse`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`, `404`

- `POST /recruitment/grupos-capacitacion/{idGrupoCapacitacion}/postulaciones`
  - Request DTO: `AgregarPostulacionGrupoCapacitacionRequest`
  - Request JSON:
    ```json
    {
      "idPostulacion": 42,
      "fechaAsignacion": "2026-05-12"
    }
    ```
  - Response DTO: `GrupoCapacitacionDetalleResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `201`, `400`, `401`, `403`, `404`

- `PATCH /recruitment/grupos-capacitacion/{idGrupoCapacitacion}/postulaciones/{idPostulacion}`
  - Request DTO: `ActualizarDetalleGrupoCapacitacionRequest`
  - Request JSON:
    ```json
    {
      "estadoCapacitacion": "APROBADO",
      "fechaResultado": "2026-05-15",
      "idEmpleadoContratado": 123,
      "fechaContratacion": "2026-05-20",
      "cumplioTresMeses": false,
      "fechaCumplioTresMeses": "2026-08-20"
    }
    ```
  - Response DTO: `GrupoCapacitacionDetalleResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `200`, `400`, `401`, `403`, `404`

#### Ofertas laborales (`/recruitment/ofertas-laborales`)

- `POST /recruitment/ofertas-laborales`
  - Request DTO: `OfertaLaboralRequest`
  - Request JSON:
    ```json
    {
      "codigo": "OF-2026-01",
      "negocio": "TELECOM",
      "puestoObjetivo": "ASESOR_VENTAS",
      "horario": "AFTERNOON",
      "cantidadInicial": 10,
      "plazoInicial": "2026-06-01"
    }
    ```
  - Response DTO: `OfertaLaboralResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `201`, `400`, `401`, `403`

- `POST /recruitment/ofertas-laborales/{idOfertaLaboral}/ampliacion`
  - Request DTO: `OfertaAmpliacionRequest`
  - Request JSON:
    ```json
    {
      "cantidad": 5,
      "plazo": "2026-07-01"
    }
    ```
  - Response DTO: `OfertaAmpliacionResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `201`, `400`, `401`, `403`

- `GET /recruitment/ofertas-laborales/activas`
  - Request: sin body
  - Response DTO: `OfertaLaboralResponse[]`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`

- `GET /recruitment/ofertas-laborales`
  - Query: opcional `estado`
  - Request: sin body
  - Response DTO: `OfertaLaboralResponse[]`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`

- `PATCH /recruitment/ofertas-laborales/{idOfertaLaboral}/estado`
  - Request DTO: `ActualizarEstadoOfertaLaboralRequest`
  - Request JSON: `{}`
  - Response DTO: `OfertaLaboralResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `200`, `400`, `401`, `403`, `404`

#### Postulaciones (`/recruitment/postulaciones`)

- `POST /recruitment/postulaciones`
  - Request DTO: `PostulacionRequest`
  - Request JSON:
    ```json
    {
      "idOfertaLaboral": 15,
      "origen": "COMPUTRABAJO",
      "postulante": {
        "nombres": "Ana",
        "apellidos": "Ramírez",
        "tipoDocumento": "DNI",
        "documento": "12345678",
        "celular": "987654321",
        "fechaNacimiento": "1995-10-10"
      }
    }
    ```
  - Response DTO: `PostulacionResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `201`, `400`, `401`, `403`

- `PUT /recruitment/postulaciones/{idPostulacion}`
  - Request DTO: `PostulacionRequest`
  - Request JSON: igual que POST /recruitment/postulaciones
  - Response DTO: `PostulacionResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `200`, `400`, `401`, `403`, `404`

- `POST /recruitment/postulaciones/{idPostulacion}/tipificacion`
  - Request DTO: `TipificarPostulacionRequest`
  - Request JSON:
    ```json
    {
      "idTipificacion": 4,
      "idSubtipificacion": 22,
      "modalidadContacto": "TELEFONO",
      "observacion": "Cliente interesado"
    }
    ```
  - Response DTO: `PostulacionResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `200`, `400`, `401`, `403`, `404`

- `GET /recruitment/postulaciones/{idPostulacion}`
  - Request: sin body
  - Response DTO: `PostulacionResponse`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`, `404`

- `GET /recruitment/postulaciones`
  - Query: opcional `etapa`, `estado`, `estadoBandeja`
  - Request: sin body
  - Response DTO: `PostulacionResponse[]`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`

- `GET /recruitment/postulaciones/bandeja/reclutamiento`
  - Query: opcional `estadoBandeja`
  - Request: sin body
  - Response DTO: `PostulacionResponse[]`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`

- `GET /recruitment/postulaciones/bandeja/capacitacion`
  - Query: opcional `sinGrupo`
  - Request: sin body
  - Response DTO: `PostulacionResponse[]`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`

- `GET /recruitment/postulaciones/bandeja/contratacion`
  - Request: sin body
  - Response DTO: `PostulacionResponse[]`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`

- `POST /recruitment/postulaciones/{idPostulacion}/confirmar-contratacion`
  - Request DTO: `ConfirmarContratacionRequest`
  - Request JSON:
    ```json
    {
      "idEmpleadoContratado": 99,
      "fechaContratacion": "2026-05-01"
    }
    ```
  - Response DTO: `PostulacionResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `200`, `400`, `401`, `403`, `404`

#### Eventos de postulaciones (`/recruitment/postulaciones/{idPostulacion}/eventos`)

- `GET /recruitment/postulaciones/{idPostulacion}/eventos`
  - Request: sin body
  - Response DTO: `EventoResponse[]`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`

#### Tipificaciones recruitment (`/recruitment/tipificaciones`)

- `GET /recruitment/tipificaciones/{etapa}/catalogo`
  - Query: opcional `puestoObjetivo`
  - Request: sin body
  - Response DTO: `CatalogoTipificacionResponse`
  - Headers: `Authorization`
  - Códigos: `200`, `400`, `401`, `403`

- `POST /recruitment/tipificaciones/catalogo`
  - Request DTO: `CatalogoTipificacionRequest`
  - Request JSON:
    ```json
    {
      "etapa": "RECLUTAMIENTO",
      "tipificaciones": [
        {
          "codigo": "PRESELECCION",
          "descripcion": "Preselección",
          "orden": 1,
          "subtipificaciones": [
            {
              "codigo": "ENTREVISTA",
              "descripcion": "Entrevista agendada",
              "orden": 1,
              "etapaCambio": "CAPACITACION"
            }
          ]
        }
      ]
    }
    ```
  - Response DTO: `CatalogoTipificacionResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `201`, `400`, `401`, `403`

- `PATCH /recruitment/tipificaciones/estado`
  - Request DTO: `CatalogoEstadoRequest`
  - Request JSON:
    ```json
    {
      "etapa": "RECLUTAMIENTO",
      "tipificacionesActivar": [1],
      "tipificacionesDesactivar": [],
      "subtipificacionesActivar": [11],
      "subtipificacionesDesactivar": []
    }
    ```
  - Response DTO: `CatalogoTipificacionResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `200`, `400`, `401`, `403`

- `POST /recruitment/tipificaciones/{idTipificacion}/subtipificaciones`
  - Request DTO: `SubtipificacionRequest`
  - Request JSON:
    ```json
    {
      "codigo": "SEGUIMIENTO",
      "descripcion": "Seguimiento telefónico",
      "orden": 2,
      "alcance": "GLOBAL",
      "etapaDestino": "CAPACITACION",
      "estadoDestino": "APROBADO",
      "estadoBandejaDestino": "EN_PROCESO"
    }
    ```
  - Response DTO: `SubtipificacionResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `201`, `400`, `401`, `403`, `404`

### 3.4 RRHH (`/rrhh`)

#### Empleados (`/rrhh/empleados`)

- `PATCH /rrhh/empleados/{id}/lista-negra`
  - Request: sin body
  - Response DTO: `EmpleadoResponse`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`, `404`, `406`

- `GET /rrhh/empleados`
  - Query: opcional `q`, `dni`, `celular`, `distrito`, `banco`, `idEmpresaContratista`, `origen`, `estado`, `page`, `size`, `sort`
  - Request: sin body
  - Response DTO: `Page<EmpleadoResponse>`
  - Headers: `Authorization`
  - Códigos: `200`, `400`, `401`, `403`

- `GET /rrhh/empleados/{dato}/universal`
  - Query: `page`, `size`, `sort`
  - Request: sin body
  - Response DTO: `Page<EmpleadoResponse>`
  - Headers: `Authorization`
  - Códigos: `200`, `400`, `401`, `403`

- `GET /rrhh/empleados/{documento}/numero-documento`
  - Request: sin body
  - Response DTO: `EmpleadoResponse`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`, `404`

- `POST /rrhh/empleados`
  - Request DTO: `RegistrarEmpleadoRequest`
  - Request JSON:
    ```json
    {
      "nombres": "Ana",
      "apellidos": "Torres",
      "tipoDocumento": "DNI",
      "numeroDocumento": "76543210",
      "nacionalidad": "PERUANO",
      "fechaNacimiento": "1990-05-20",
      "estadoCivil": "SOLTERO",
      "tieneHijos": false,
      "celularPersonal": "987654321",
      "correoPersonal": "ana.torres@example.com",
      "origen": "REFERIDO",
      "distrito": "SURCO",
      "direccion": "Av. Los Próceres 123",
      "banco": "BCP",
      "cuentaBancaria": "123456789012",
      "cuentaInterbancaria": "00112345678901234567",
      "cuentaPropia": true
    }
    ```
  - Response DTO: `EmpleadoResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `201`, `400`, `401`, `403`, `409`

- `PATCH /rrhh/empleados/{id}/datos-personales`
  - Request DTO: `DatosPersonalesRequest`
  - Request JSON:
    ```json
    {
      "nombres": "Ana",
      "apellidos": "Torres",
      "tipoDocumento": "DNI",
      "numeroDocumento": "76543210",
      "nacionalidad": "PERUANO",
      "fechaNacimiento": "1990-05-20",
      "estadoCivil": "SOLTERO",
      "tieneHijos": false
    }
    ```
  - Response DTO: `EmpleadoResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `200`, `400`, `401`, `403`, `404`

- `PATCH /rrhh/empleados/{id}/datos-contacto-ubicacion`
  - Request DTO: `DatosContactoUbicacionRequest`
  - Request JSON:
    ```json
    {
      "celularPersonal": "987654321",
      "correoPersonal": "ana.torres@example.com",
      "distrito": "SURCO",
      "direccion": "Av. Los Próceres 123"
    }
    ```
  - Response DTO: `EmpleadoResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `200`, `400`, `401`, `403`, `404`

- `PATCH /rrhh/empleados/{id}/datos-financieros`
  - Request DTO: `DatosFinancierosRequest`
  - Request JSON:
    ```json
    {
      "banco": "BCP",
      "cuentaBancaria": "123456789012",
      "cuentaInterbancaria": "00112345678901234567",
      "cuentaPropia": true,
      "parentesco": "OTRO",
      "celularTransferencia": "987654321",
      "idEmpresaContratista": 2
    }
    ```
  - Response DTO: `EmpleadoResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `200`, `400`, `401`, `403`, `404`

- `PATCH /rrhh/empleados/{id}/datos-corporativos`
  - Request DTO: `DatosContactoCorporativoRequest`
  - Request JSON:
    ```json
    {
      "celularCorporativo": "987654321",
      "correoCorporativo": "ana.torres@empresa.com"
    }
    ```
  - Response DTO: `EmpleadoResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `200`, `400`, `401`, `403`, `404`

#### Contratos (`/rrhh/contratos`)

- `GET /rrhh/contratos/{id}/historico`
  - Request: sin body
  - Response DTO: `ContratoResponse[]`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`, `404`

- `GET /rrhh/contratos/{id}/vigente`
  - Request: sin body
  - Response DTO: `ContratoResponse`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`, `404`

- `POST /rrhh/contratos/{id}/registrar`
  - Request DTO: `RegistrarContratoRequest`
  - Request JSON:
    ```json
    {
      "idPostulacion": 77,
      "puestoTrabajo": "ASESOR_VENTAS",
      "regimen": "PLANILLA",
      "modalidad": "FULL_TIME",
      "seguroSalud": "ESSALUD",
      "sistemaPensiones": "ONP",
      "sueldoBase": 1500.0,
      "fechaInicio": "2026-05-01",
      "fechaFin": "2027-04-30"
    }
    ```
  - Response DTO: `ContratoRegistroResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `201`, `400`, `401`, `403`, `404`, `409`, `422`

- `PATCH /rrhh/contratos/{id}/cesar-contrato`
  - Request DTO: `CerrarContratoRequest`
  - Request JSON:
    ```json
    {}
    ```
  - Response DTO: `ContratoResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `200`, `400`, `401`, `403`, `404`, `409`

#### Pagos (`/rrhh/pagos`)

- `GET /rrhh/pagos`
  - Query: opcional `contrato`, `empleado`, `desde`, `hasta`
  - Request: sin body
  - Response DTO: `PagoResponse[]`
  - Headers: `Authorization`
  - Códigos: `200`, `400`, `401`, `403`

- `POST /rrhh/pagos/{id}/pagar-contrato`
  - Request DTO: `RegistrarPagoRequest`
  - Request JSON:
    ```json
    {
      "fechaInicio": "2026-05-01",
      "fechaFin": "2026-05-31",
      "asignacionFamiliar": 93.1,
      "bonoPuntualidad": 50.0,
      "comisionSemanal": 120.0,
      "comisionMensual": 240.0,
      "bonoExtra": 30.0
    }
    ```
  - Response DTO: `PagoResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `201`, `400`, `401`, `403`, `404`, `409`

#### Empresas contratistas (`/rrhh/empresas-contratistas`)

- `POST /rrhh/empresas-contratistas`
  - Request DTO: `RegistrarEmpresaContratistaRequest`
  - Request JSON:
    ```json
    {
      "nombre": "Contratistas SAC"
    }
    ```
  - Response DTO: `EmpresaContratistaResponse`
  - Headers: `Authorization`, `Content-Type: application/json`
  - Códigos: `201`, `400`, `401`, `403`, `409`

- `GET /rrhh/empresas-contratistas`
  - Query: opcional `activo`
  - Request: sin body
  - Response DTO: `EmpresaContratistaResponse[]`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`

- `PATCH /rrhh/empresas-contratistas/{id}/desactivar`
  - Request: sin body
  - Response DTO: `EmpresaContratistaResponse`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`, `404`

#### Eventos (`/rrhh/eventos`)

- `GET /rrhh/eventos/{idEmpleado}/empleados`
  - Request: sin body
  - Response DTO: `EmpleadoEventoResponse[]`
  - Headers: `Authorization`
  - Códigos: `200`, `401`, `403`

## 4) Errores y códigos (resumen)

- **401 Unauthorized**: token ausente/inválido/expirado (filtro JWT en gateway y servicios).
- **403 Forbidden**: token válido pero sin autoridad `@PreAuthorize` requerida.
- **400 Bad Request**: validaciones de body/query/path, enums inválidos, tipos incorrectos.
- **404 Not Found**: recurso no encontrado o endpoint inexistente.
- **409 Conflict**: duplicados/violaciones de reglas de negocio o integridad.
- **422 Unprocessable Entity**: casos de empleado/contrato no apto (principalmente RRHH).
- **500 Internal Server Error**: error no controlado.

### Formato de error en RRHH (`GlobalExceptionHandler`)
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Campos Invalidos en la solicitud",
  "details": ["..."]
}
```

## 5) Duplicados detectados y fuente de verdad

1. **Postulantes por etapa (antiguo / no implementado):**
   - En el código actual no se encontró `/rrhh/postulantes/reclutamiento` ni `/rrhh/postulantes/capacitacion`.
   - El servicio vigente de postulaciones está en `recruitment-service` bajo `/recruitment/postulaciones` y `recruitment/tipificaciones`.
   - **Fuente de verdad recomendada para frontend:** `GET /recruitment/postulaciones` con los filtros `etapa`, `estado` y `estadoBandeja`.

2. **Cuentas publicitarias activas (duplicado funcional):**
   - `GET /leads/cuentas-publicitarias/activas`
   - `GET /leads/cuentas-publicitarias?activo=true`
   - **Fuente de verdad recomendada:** `GET /leads/cuentas-publicitarias?activo=true` (más extensible y parametrizable).

3. **Fuente de verdad de exposición pública:**
   - Aunque los controladores definen rutas internas, para frontend la fuente de verdad final es el routing del gateway (`/auth`, `/rrhh`, `/leads`, `/presence`).

## 6) Enums centralizados (fuente única de verdad)

> **CRITICAL**: Todos los enums del proyecto deben consumirse desde esta sección. No duplicar valores en features/entities.

### 6.1 Enums de Auth & Acceso

#### PuestoTrabajo (Roles / Autoridades)
Presente en: `auth-service`, `gateway-service`, `rrhh-service`

```ts
export enum PuestoTrabajo {
  ADMINISTRADOR = "ADMINISTRADOR",
  RECLUTADOR = "RECLUTADOR",
  RRHH = "RRHH",
  CAPACITADOR = "CAPACITADOR",
  DESARROLLADOR = "DESARROLLADOR",
  CONTADOR = "CONTADOR",
  COMMUNITY = "COMMUNITY",
  MONITOR = "MONITOR",
  SUPERVISOR_VENTAS = "SUPERVISOR_VENTAS",
  ASESOR_VENTAS = "ASESOR_VENTAS",
  SUPERVISOR_BACKOFFICE = "SUPERVISOR_BACKOFFICE",
  ASESOR_BACKOFFICE = "ASESOR_BACKOFFICE",
  SUPERVISOR_GTR = "SUPERVISOR_GTR",
  ASESOR_GTR = "ASESOR_GTR",
  SUPERVISOR_POSTVENTA = "SUPERVISOR_POSTVENTA",
  ASESOR_POSTVENTA = "ASESOR_POSTVENTA",
}

// Mapeo a valores internos (para requests)
export const PuestoTrabajoEnglish = {
  [PuestoTrabajo.ADMINISTRADOR]: "admin",
  [PuestoTrabajo.RECLUTADOR]: "recruiter",
  [PuestoTrabajo.RRHH]: "rrhh",
  [PuestoTrabajo.CAPACITADOR]: "trainer",
  [PuestoTrabajo.DESARROLLADOR]: "developer",
  [PuestoTrabajo.CONTADOR]: "accountant",
  [PuestoTrabajo.COMMUNITY]: "community",
  [PuestoTrabajo.MONITOR]: "monitor",
  [PuestoTrabajo.SUPERVISOR_VENTAS]: "supsales",
  [PuestoTrabajo.ASESOR_VENTAS]: "sales",
  [PuestoTrabajo.SUPERVISOR_BACKOFFICE]: "supback",
  [PuestoTrabajo.ASESOR_BACKOFFICE]: "back",
  [PuestoTrabajo.SUPERVISOR_GTR]: "supgtr",
  [PuestoTrabajo.ASESOR_GTR]: "gtr",
  [PuestoTrabajo.SUPERVISOR_POSTVENTA]: "suppost",
  [PuestoTrabajo.ASESOR_POSTVENTA]: "post",
};
```

**Endpoints que usan este enum:**
- `PATCH /auth/autorizacion/{empleadoId}/roles`
- `PATCH /auth/autorizacion/{empleadoId}/username-roles`
- GET endpoints que retornan `roles: string[]`

---

### 6.2 Enums de Presence (Gateway)

#### Disponibilidad
Presente en: `gateway-service` (PresenceController)

```ts
export enum Disponibilidad {
  DISPONIBLE = "DISPONIBLE",
  GESTIONANDO = "GESTIONANDO",
  OCUPADO = "OCUPADO",
  SATURADO = "SATURADO",
}
```

**Endpoints que usan este enum:**
- `PATCH /presence/disponibilidad/{disponibilidad}`
- Response en `GET /presence/connected-users` → campo `disponibilidad`

---

### 6.3 Enums de Leads

#### Etapa (Ciclo de vida del lead)
Presente en: `lead-service` (LeadController, TipificacionController)

```ts
export enum Etapa {
  PREVENTA = "PREVENTA",
  VENTA = "VENTA",
  POSTVENTA = "POSTVENTA",
}
```

**Endpoints que usan este enum:**
- `GET /leads/tipificaciones/{etapa}/catalogo` (path param)
- `PUT /leads/tipificaciones/catalogo` (body: etapa)
- Response en eventos: campo etapa

#### EstadoSeguimiento (Estado del seguimiento en venta)
Presente en: `lead-service` (LeadController)

```ts
export enum EstadoSeguimiento {
  NUEVO = "NUEVO",
  ASIGNADO = "ASIGNADO",
  EN_GESTION = "EN_GESTION",
  GESTIONADO = "GESTIONADO",
}
```

**Endpoints que usan este enum:**
- Response en `GET /leads/leads/asesor-ventas` → campo estadoSeguimiento
- Response en `GET /leads/leads/{idLead}/detalle-asesor` → campo estadoSeguimiento
- Response en eventos: campo estadoSeguimiento

#### TipoDocumento (Para leads)
Presente en: `lead-service` (LeadController)

```ts
export enum TipoDocumento {
  DNI = "DNI",
  CE = "CE",
  RUC = "RUC",
}
```

**Endpoints que usan este enum:**
- Request en `POST /leads/leads/intake` → campo tipoDocumento
- Response en `GET /leads/leads/{idLead}/detalle-asesor` → campo tipoDocumento

#### TipoVenta
Presente en: `lead-service` (LeadController)

```ts
export enum TipoVenta {
  NATURAL = "NATURAL",
  JURIDICA = "JURIDICA",
}
```

**Endpoints que usan este enum:**
- Request en `POST /leads/leads/intake` → campo tipoVenta

#### TipoDomicilio (Tipo de vivienda)
Presente en: `lead-service` (LeadController)

```ts
export enum TipoDomicilio {
  MULTIFAMILIAR = "MULTIFAMILIAR",
  JURIDICA = "JURIDICA",
}
```

**Endpoints que usan este enum:**
- Request en `PATCH /leads/leads/{idLead}/direccion` → campo tipoDomicilio
- Response en `GET /leads/leads/{idLead}/detalle-asesor` → campo tipoDomicilio

#### TipoVia (Tipo de vía / calle)
Presente en: `lead-service` (LeadController)

```ts
export enum TipoVia {
  JIRON = "JIRON",
  CALLE = "CALLE",
}
```

**Endpoints que usan este enum:**
- Request en `PATCH /leads/leads/{idLead}/direccion` → campo tipoVia

#### NivelGeografico (Para zonas)
Presente en: `lead-service` (ZonaController)

```ts
export enum NivelGeografico {
  DEPARTAMENTO = "DEPARTAMENTO",
  PROVINCIA = "PROVINCIA",
  DISTRITO = "DISTRITO",
}
```

**Endpoints que usan este enum:**
- Request en `POST /leads/zonas` → reglas[].nivelGeografico
- Response en `GET /leads/zonas` → reglas[].nivelGeografico

#### CriterioZona (Incluir/Excluir en zona)
Presente en: `lead-service` (ZonaController)

```ts
export enum CriterioZona {
  INCLUIR = "INCLUIR",
  EXCLUIR = "EXCLUIR",
}
```

**Endpoints que usan este enum:**
- Request en `POST /leads/zonas` → reglas[].criterio
- Response en `GET /leads/zonas` → reglas[].criterio

#### Base (Origen del lead - canal de captación)
Presente en: `lead-service` (LeadController, EventoController)

```ts
export enum Base {
  WHATSAPP = "WHATSAPP",
  MESSENGER = "MESSENGER",
  REFERIDO = "REFERIDO",
  MASIVO = "MASIVO",
}
```

**Endpoints que usan este enum:**
- Request en `POST /leads/leads/intake` → campo base
- Response en `GET /leads/leads/gtr` → campo base

#### Accion (Acciones en eventos)
Presente en: `lead-service` (EventoController)

```ts
export enum Accion {
  REGISTRO = "REGISTRO",
  ASIGNACION = "ASIGNACION",
  CONTACTO = "CONTACTO",
  TIPIFICACION = "TIPIFICACION",
  VALIDACION = "VALIDACION",
}
```

**Endpoints que usan este enum:**
- Response en `GET /leads/eventos/lead/{idLead}` → campo accion
- Response en `GET /leads/eventos/empleado/{idEmpleado}` → campo accion

#### Tecnologia (Tecnología de internet)
Presente en: `lead-service` (PlanController)

```ts
export enum Tecnologia {
  HFC = "HFC",
  FTTH = "FTTH",
}
```

**Endpoints que usan este enum:**
- Request en `POST /leads/planes` → internet.tecnologia
- Response en `GET /leads/planes` → internet.tecnologia

#### Unidad (Unidad de velocidad)
Presente en: `lead-service` (PlanController)

```ts
export enum Unidad {
  MBPS = "MBPS",
  GBPS = "GBPS",
}
```

**Endpoints que usan este enum:**
- Request en `POST /leads/planes` → internet.unidad
- Response en `GET /leads/planes` → internet.unidad

---

### 6.4 Enums de RRHH

#### EtapaProceso (Etapa en el proceso de postulante/empleado)
Presente en: `rrhh-service` (PostulanteController, EmpleadoController)

```ts
export enum EtapaProceso {
  RECLUTAMIENTO = "RECLUTAMIENTO",
  CAPACITACION = "CAPACITACION",
  GESTION = "GESTION",
  CONTRATADO = "CONTRATADO",
}
```

**Notas:**
- Este enum está definido en rrhh-service, pero las rutas públicas actuales de postulados no exponen `/rrhh/postulantes/*`.
- La gestión de postulaciones en el código actual se realiza desde `recruitment-service`.

#### ReclutamientoEstado (Estado en reclutamiento)
Presente en: `rrhh-service` (PostulanteController)

```ts
export enum ReclutamientoEstado {
  POR_RECLUTAR = "POR_RECLUTAR",
  SIN_CONTACTO = "SIN_CONTACTO",
  NO_INTERESADO = "NO_INTERESADO",
  INTERESADO = "INTERESADO",
  RECHAZADO = "RECHAZADO",
  RECLUTADO = "RECLUTADO",
}
```

**Notas:**
- Este enum está definido en rrhh-service, pero no hay rutas públicas de `/rrhh/postulantes/*` en el código actual.

#### ReclutamientoSubEstado (Sub-razones de rechazo/no interés en reclutamiento)
Presente en: `rrhh-service` (PostulanteController)

```ts
export enum ReclutamientoSubEstado {
  NO_DESEA_PUESTO = "NO_DESEA_PUESTO",
  NO_ASISTIO_MEET = "NO_ASISTIO_MEET",
  POCA_FLUIDEZ_VERBAL = "POCA_FLUIDEZ_VERBAL",
  SIN_HABILIDADES_COMERCIALES = "SIN_HABILIDADES_COMERCIALES",
  INEXPERIENCIA = "INEXPERIENCIA",
  PROBLEMAS_CON_HORARIOS = "PROBLEMAS_CON_HORARIOS",
  DISTANCIA_TIEMPO = "DISTANCIA_TIEMPO",
  BENEFICIOS_PLANILLA = "BENEFICIOS_PLANILLA",
  SALARIO_BASE = "SALARIO_BASE",
  MALA_EXPERIENCIA = "MALA_EXPERIENCIA",
  RUBRO_DE_LA_EMPRESA = "RUBRO_DE_LA_EMPRESA",
  RECIBIO_MEJOR_PROPUESTA = "RECIBIO_MEJOR_PROPUESTA",
}
```

**Notas:**
- Este enum está definido en rrhh-service, pero no hay rutas públicas de `/rrhh/postulantes/*` en el código actual.

#### CapacitacionEstado (Estado en capacitación)
Presente en: `rrhh-service` (PostulanteController)

```ts
export enum CapacitacionEstado {
  POR_CAPACITAR = "POR_CAPACITAR",
  RECHAZADO = "RECHAZADO",
  APROBADO = "APROBADO",
}
```

**Notas:**
- Este enum está definido en rrhh-service, pero no hay rutas públicas de `/rrhh/postulantes/*` en el código actual.

#### CapacitacionSubEstado (Razones de rechazo en capacitación)
Presente en: `rrhh-service` (PostulanteController)

```ts
export enum CapacitacionSubEstado {
  MALA_ACTITUD = "MALA_ACTITUD",
  NO_DESARROLLA_HABILIDADES = "NO_DESARROLLA_HABILIDADES",
  INASISTENCIA_2_DIAS = "INASISTENCIA_2_DIAS",
  NO_CUMPLE_OBJETIVO = "NO_CUMPLE_OBJETIVO",
}
```

**Notas:**
- Este enum está definido en rrhh-service, pero no hay rutas públicas de `/rrhh/postulantes/*` en el código actual.

#### Documento (Tipo de documento de identidad - RRHH)
Presente en: `rrhh-service` (EmpleadoController, PostulanteController)

```ts
export enum Documento {
  DNI = "DNI",
  CE = "CE",
}
```

**Endpoints que usan este enum:**
- Request en `POST /rrhh/empleados` → tipoDocumento
- Request en `PATCH /rrhh/empleados/{id}/datos-personales` → tipoDocumento
- Response en `GET /rrhh/empleados` → tipoDocumento

#### Nacionalidad
Presente en: `rrhh-service` (EmpleadoController, PostulanteController)

```ts
export enum Nacionalidad {
  PERUANO = "PERUANO",
  EXTRANJERO = "EXTRANJERO",
}
```

**Endpoints que usan este enum:**
- Request en `POST /rrhh/empleados` → nacionalidad
- Request en `PATCH /rrhh/empleados/{id}/datos-personales` → nacionalidad
- Response en `GET /rrhh/empleados` → nacionalidad

#### EstadoCivil
Presente en: `rrhh-service` (EmpleadoController)

```ts
export enum EstadoCivil {
  SOLTERO = "SOLTERO",
  CASADO = "CASADO",
  VIUDO = "VIUDO",
  DIVORCIADO = "DIVORCIADO",
}
```

**Endpoints que usan este enum:**
- Request en `POST /rrhh/empleados` → estadoCivil
- Request en `PATCH /rrhh/empleados/{id}/datos-personales` → estadoCivil
- Response en `GET /rrhh/empleados` → estadoCivil

#### Parentesco (Parentesco para beneficiarios)
Presente en: `rrhh-service` (EmpleadoController)

```ts
export enum Parentesco {
  PADRE = "PADRE",
  MADRE = "MADRE",
  TIO = "TIO",
  ESPOSO = "ESPOSO",
  HERMANO = "HERMANO",
  ABUELO = "ABUELO",
  PAREJA = "PAREJA",
  OTRO = "OTRO",
}
```

**Endpoints que usan este enum:**
- Request en `POST /rrhh/empleados` → parentesco
- Response en `GET /rrhh/empleados` → parentesco

#### Origen (Canal de reclutamiento)
Presente en: `rrhh-service` (PostulanteController)

```ts
export enum Origen {
  COMPUTRABAJO = "COMPUTRABAJO",
  INDEED = "INDEED",
  TIKTOK = "TIKTOK",
  FACEBOOK = "FACEBOOK",
  LINKEDIN = "LINKEDIN",
  REFERIDO = "REFERIDO",
}
```

**Endpoints que usan este enum:**
- Request en `POST /rrhh/empleados` → origen

#### Compania
Presente en: `rrhh-service` (EmpleadoController, PostulanteController)

```ts
export enum Compania {
  ALBRU = "ALBRU",
  WIN = "WIN",
  CLARO = "CLARO",
}
```

**Endpoints que usan este enum:**
- Request en `POST /rrhh/empleados` → compania
- Response en `GET /rrhh/empleados` → compania

#### Distrito (Distritos de Lima - RRHH)
Presente en: `rrhh-service` (EmpleadoController)

```ts
export enum Distrito {
  ANCÓN = "ANCÓN",
  ATE = "ATE",
  BARRANCO = "BARRANCO",
  BELLAVISTA = "BELLAVISTA",
  BREÑA = "BREÑA",
  CALLAO = "CALLAO",
  CARABAYLLO = "CARABAYLLO",
  CARMEN_DE_LA_LEGUA = "CARMEN_DE_LA_LEGUA",
  CERCADO_DE_LIMA = "CERCADO_DE_LIMA",
  CHACLACAYO = "CHACLACAYO",
  CHORRILLOS = "CHORRILLOS",
  CIENEGUILLA = "CIENEGUILLA",
  COMAS = "COMAS",
  EL_AGUSTINO = "EL_AGUSTINO",
  INDEPENDENCIA = "INDEPENDENCIA",
  JESÚS_MARÍA = "JESÚS_MARÍA",
  LA_MOLINA = "LA_MOLINA",
  LA_PUNTA = "LA_PUNTA",
  LA_PERLA = "LA_PERLA",
  LA_VICTORIA = "LA_VICTORIA",
  LINCE = "LINCE",
  LOS_OLIVOS = "LOS_OLIVOS",
  LURÍN = "LURÍN",
  LURIGANCHO = "LURIGANCHO",
  MAGDALENA_DEL_MAR = "MAGDALENA_DEL_MAR",
  MIRAFLORES = "MIRAFLORES",
  MI_PERU = "MI_PERU",
  PACHACÁMAC = "PACHACÁMAC",
  PUCUSANA = "PUCUSANA",
  PUEBLO_LIBRE = "PUEBLO_LIBRE",
  PUENTE_PIEDRA = "PUENTE_PIEDRA",
  PUNTA_HERMOSA = "PUNTA_HERMOSA",
  PUNTA_NEGRA = "PUNTA_NEGRA",
  RÍMAC = "RÍMAC",
  SAN_BARTOLO = "SAN_BARTOLO",
  SAN_BORJA = "SAN_BORJA",
  SAN_ISIDRO = "SAN_ISIDRO",
  SAN_JUAN_DE_LURIGANCHO = "SAN_JUAN_DE_LURIGANCHO",
  SAN_JUAN_DE_MIRAFLORES = "SAN_JUAN_DE_MIRAFLORES",
  SAN_LUIS = "SAN_LUIS",
  SAN_MARTÍN_DE_PORRES = "SAN_MARTÍN_DE_PORRES",
  SAN_MIGUEL = "SAN_MIGUEL",
  SANTA_ANITA = "SANTA_ANITA",
  SANTA_MARÍA_DEL_MAR = "SANTA_MARÍA_DEL_MAR",
  SANTA_ROSA = "SANTA_ROSA",
  SANTIAGO_DE_SURCO = "SANTIAGO_DE_SURCO",
  SURQUILLO = "SURQUILLO",
  VENTANILLA = "VENTANILLA",
  VILLA_EL_SALVADOR = "VILLA_EL_SALVADOR",
  VILLA_MARÍA_DEL_TRIUNFO = "VILLA_MARÍA_DEL_TRIUNFO",
}
```

**Endpoints que usan este enum:**
- Request en `PATCH /rrhh/empleados/{id}/datos-contacto-ubicacion` → distrito
- Response en `GET /rrhh/empleados` → distrito
- Query filter en `GET /rrhh/empleados?distrito=`

#### Regimen (Régimen laboral)
Presente en: `rrhh-service` (ContratoController)

```ts
export enum Regimen {
  RECIBO_POR_HONORARIOS = "RECIBO_POR_HONORARIOS",
  PLANILLA = "PLANILLA",
}
```

**Endpoints que usan este enum:**
- Request en `POST /rrhh/contratos/{id}/registrar` → regimen
- Response en `GET /rrhh/contratos/{id}/vigente` → regimen

#### Modalidad (Modalidad de trabajo)
Presente en: `rrhh-service` (ContratoController)

```ts
export enum Modalidad {
  PART_TIME = "PART_TIME",
  FULL_TIME = "FULL_TIME",
  SEMI_FULL = "SEMI_FULL",
  SUPER_FULL = "SUPER_FULL",
}
```

**Endpoints que usan este enum:**
- Request en `POST /rrhh/contratos/{id}/registrar` → modalidad
- Response en `GET /rrhh/contratos/{id}/vigente` → modalidad

#### SeguroSalud (Sistema de salud)
Presente en: `rrhh-service` (ContratoController)

```ts
export enum SeguroSalud {
  SIS = "SIS",
  ESSALUD = "ESSALUD",
}
```

**Endpoints que usan este enum:**
- Request en `POST /rrhh/contratos/{id}/registrar` → seguroSalud
- Response en `GET /rrhh/contratos/{id}/vigente` → seguroSalud

#### SistemaPensiones (Sistema de pensiones)
Presente en: `rrhh-service` (ContratoController)

```ts
export enum SistemaPensiones {
  ONP = "ONP",
  AFP_INTEGRA = "AFP_INTEGRA",
  AFP_PROFUTURO = "AFP_PROFUTURO",
  AFP_HABITAT = "AFP_HABITAT",
  PRIMA_AFP = "PRIMA_AFP",
}
```

**Endpoints que usan este enum:**
- Request en `POST /rrhh/contratos/{id}/registrar` → sistemaPensiones
- Response en `GET /rrhh/contratos/{id}/vigente` → sistemaPensiones

#### Banco (Entidades bancarias)
Presente en: `rrhh-service` (EmpleadoController)

```ts
export enum Banco {
  BCP = "BCP",
  BBVA = "BBVA",
  INTERBANK = "INTERBANK",
  SCOTIABANK = "SCOTIABANK",
  BANCO_DE_LA_NACION = "BANCO_DE_LA_NACION",
}
```

**Endpoints que usan este enum:**
- Request en `PATCH /rrhh/empleados/{id}/datos-financieros` → banco
- Response en `GET /rrhh/empleados` → banco
- Query filter en `GET /rrhh/empleados?banco=`

#### TurnoHorario (Turno de trabajo)
Presente en: `rrhh-service` (PostulanteController eventos)

```ts
export enum TurnoHorario {
  MORNING = "MORNING",
  AFTERNOON = "AFTERNOON",
}
```

**Endpoints que usan este enum:**
- Response en `GET /rrhh/eventos/{idPostulante}/postulantes` → turnoHorario

#### EventoPostulante (Tipos de eventos para postulantes)
Presente en: `rrhh-service` (PostulanteController)

```ts
export enum EventoPostulante {
  CREAR_POSTULACION = "CREAR_POSTULACION",
  REALIZAR_LLAMADA = "REALIZAR_LLAMADA",
  REUNION_MEET = "REUNION_MEET",
  REUNION_PRESENCIAL = "REUNION_PRESENCIAL",
  EVALUACION_RECLUTAMIENTO = "EVALUACION_RECLUTAMIENTO",
  EVALUACION_CAPACITACION = "EVALUACION_CAPACITACION",
}
```

**Endpoints que usan este enum:**
- Response mappings internos para eventos de postulantes

#### EventoEmpleado (Tipos de eventos para empleados)
Presente en: `rrhh-service` (EmpleadoController)

```ts
export enum EventoEmpleado {
  CONTRATACION = "CONTRATACION",
  LISTA_NEGRA = "LISTA_NEGRA",
  PAGO = "PAGO",
}
```

**Endpoints que usan este enum:**
- Response mappings internos para eventos de empleados

#### EstadoOperativo (Estado operativo del empleado)
Presente en: `rrhh-service` (EmpleadoController)

```ts
export enum EstadoOperativo {
  POSTULANTE = "POSTULANTE",
  ACTIVO = "ACTIVO",
  INACTIVO = "INACTIVO",
}
```

**Endpoints que usan este enum:**
- Response en `GET /rrhh/empleados` → estadoOperativo
- Query filter en `GET /rrhh/empleados?estado=`

---

## 🔧 Guía de Importación en Frontend (FSD)

Estructura recomendada en el frontend:

```
src/
├── entities/
│   ├── auth/
│   │   ├── model/
│   │   │   └── Auth.ts (importa PuestoTrabajo desde shared/backendEnums)
│   │   └── index.ts
│   ├── leads/
│   │   ├── model/
│   │   │   ├── Lead.ts (importa Etapa, EstadoSeguimiento, etc.)
│   │   │   └── index.ts
│   ├── rrhh/
│   │   ├── model/
│   │   │   ├── Empleado.ts (importa EtapaProceso, Documento, etc.)
│   │   │   └── index.ts
│   └── index.ts
├── shared/
│   ├── backendEnums/
│   │   ├── auth.ts (PuestoTrabajo)
│   │   ├── leads.ts (Etapa, EstadoSeguimiento, TipoDocumento, ...)
│   │   ├── rrhh.ts (ReclutamientoEstado, Documento, ...)
│   │   └── index.ts (re-exports)
│   └── index.ts
└── features/
    ├── leads/
    │   ├── LeadForm.tsx (usa enums desde entities/leads/model)
    │   └── index.tsx
    └── ...
```

**Archivo `shared/backendEnums/index.ts`:**

```ts
export * from "./auth";
export * from "./leads";
export * from "./rrhh";
```

**Uso en formularios:**

```tsx
// features/leads/components/LeadForm.tsx
import { Etapa, EstadoSeguimiento, TipoDomicilio } from "@/shared/backendEnums";

export const LeadForm = () => {
  return (
    <>
      <select name="etapa">
        {Object.entries(Etapa).map(([key, value]) => (
          <option key={key} value={value}>{key}</option>
        ))}
      </select>
      
      <select name="tipoDomicilio">
        {Object.entries(TipoDomicilio).map(([key, value]) => (
          <option key={key} value={value}>{key}</option>
        ))}
      </select>
    </>
  );
};
```

---

## ✅ Checklist de Implementación

- ☐ Crear `src/shared/backendEnums/` con archivos separados por dominio
- ☐ Exportar TODOS los enums desde `shared/backendEnums/index.ts`
- ☐ Actualizar `entities/*/model/*.ts` para importar enums desde shared/backendEnums
- ☐ Reemplazar strings "mágicos" en formularios por enums
- ☐ Usar enums en validaciones de requests/responses
- ☐ Documentar tipos esperados en componentes que usen enums
- ☐ NO duplicar enums en features o capas superiores
- ☐ Mantener este documento como referencia única (BACKEND_ENDPOINTS_FSD.md Sección 6)
