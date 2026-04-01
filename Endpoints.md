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

1. **Endpoint**: `POST /auth/autorizacion/login`
   - Parámetros: body `LoginRequest`
   - Headers: `Content-Type`
   - Ejemplo JSON de respuesta: `loginResponse` (arriba)
   - Interfaz TypeScript: `LoginResponse`
   - Feature asociada (FSD): `features/auth/login`
   - Códigos: `200`, `401` (texto: "Credenciales inválidas")

2. **Endpoint**: `POST /auth/autorizacion/registro`
   - Parámetros: body `RegistrarUsuarioRequest`
   - Headers: `Authorization`, `Content-Type`
   - Ejemplo JSON: objeto tipo `UsuarioResponse`
   - Interfaz: `UsuarioResponse`
   - Feature: `features/auth/user-admin`
   - Códigos: `201`, `401`, `403`

3. **Endpoint**: `POST /auth/autorizacion/registro-credenciales`
   - Parámetros: body `RegistrarUsuarioRequest`
   - Headers: `Authorization`, `Content-Type`
   - Ejemplo JSON: `{ "username": "u1", "password": "tmp123" }`
   - Interfaz: `CredencialesResponse`
   - Feature: `features/auth/user-admin`
   - Códigos: `201`, `401`, `403`

4. **Endpoint**: `PATCH /auth/autorizacion/{empleadoId}/roles`
   - Parámetros: path `empleadoId`, body enum `PuestoTrabajo`
   - Headers: `Authorization`, `Content-Type`
   - Ejemplo JSON: objeto tipo `UsuarioResponse`
   - Interfaz: `UsuarioResponse`
   - Feature: `features/auth/user-admin`
   - Códigos: `200`, `400`, `401`, `403`

5. **Endpoint**: `PATCH /auth/autorizacion/{empleadoId}/username-roles`
   - Parámetros: path `empleadoId`, body `ActualizarCredencialesRequest`
   - Headers: `Authorization`, `Content-Type`
   - Ejemplo JSON: objeto tipo `UsuarioResponse`
   - Interfaz: `UsuarioResponse`
   - Feature: `features/auth/user-admin`
   - Códigos: `200`, `400`, `401`, `403`

6. **Endpoint**: `POST /auth/autorizacion/{empleadoId}/reset-password`
   - Parámetros: path `empleadoId`
   - Headers: `Authorization`
   - Ejemplo JSON: `{ "username": "u1", "password": "tmp123" }`
   - Interfaz: `CredencialesResponse`
   - Feature: `features/auth/user-admin`
   - Códigos: `200`, `401`, `403`

6a. **Endpoint**: `POST /auth/autorizacion/upsert-usuario`
   - Parámetros: body `RegistrarUsuarioRequest`
   - Headers: `Authorization`
   - Ejemplo JSON: (mismo que registro)
   - Interfaz: `void`
   - Feature: `features/auth/user-admin`
   - Códigos: `200`, `400`, `401`, `403`

6b. **Endpoint**: `POST /auth/autorizacion/forgot-password`
   - Parámetros: body `ForgotPasswordRequest`
   - Headers: `Content-Type`
   - Ejemplo JSON: `{ "username": "u1" }`
   - Interfaz: `CredencialesResponse`
   - Feature: `features/auth/password-recovery`
   - Códigos: `200`, `400`, `401`

6c. **Endpoint**: `GET /auth/autorizacion/estado-acceso/{username}`
   - Parámetros: path `username`
   - Headers: `Authorization`
   - Ejemplo JSON: objeto tipo `EstadoAccesoResponse`
   - Interfaz: `EstadoAccesoResponse`
   - Feature: `features/auth/user-admin`
   - Códigos: `200`, `401`, `404`

7. **Endpoint**: `GET /auth/autorizacion/{empleadoId}/empleado`
   - Parámetros: path `empleadoId`
   - Headers: `Authorization`
   - Ejemplo JSON: objeto tipo `UsuarioResponse`
   - Interfaz: `UsuarioResponse`
   - Feature: `features/auth/user-admin`
   - Códigos: `200`, `401`, `403`, `404`

8. **Endpoint**: `DELETE /auth/autorizacion/{empleadoId}/deshabilitar`
   - Parámetros: path `empleadoId`
   - Headers: `Authorization`
   - Ejemplo JSON: vacío (204)
   - Interfaz: `void`
   - Feature: `features/auth/user-admin`
   - Códigos: `204`, `401`, `403`

### 3.2 Presence Gateway (`/presence`)

1. **Endpoint**: `POST /presence/online`
   - Parámetros: sin body
   - Headers: `Authorization`
   - Ejemplo JSON: vacío
   - Interfaz: `void`
   - Feature: `features/presence/online`
   - Códigos: `200`, `401`

2. **Endpoint**: `POST /presence/heartbeat`
   - Parámetros: sin body
   - Headers: `Authorization`
   - Ejemplo JSON: vacío
   - Interfaz: `void`
   - Feature: `features/presence/heartbeat`
   - Códigos: `200`, `401`

3. **Endpoint**: `POST /presence/offline`
   - Parámetros: sin body
   - Headers: `Authorization`
   - Ejemplo JSON: vacío
   - Interfaz: `void`
   - Feature: `features/presence/offline`
   - Códigos: `204`, `401`

4. **Endpoint**: `PATCH /presence/disponibilidad/{disponibilidad}`
   - Parámetros: path `disponibilidad` (enum)
   - Headers: `Authorization`
   - Ejemplo JSON: vacío
   - Interfaz: `void`
   - Feature: `features/presence/status`
   - Códigos: `204`, `401`, `404`

5. **Endpoint**: `GET /presence/connected-users`
   - Parámetros: query opcional `role`
   - Headers: `Authorization`
   - Ejemplo JSON: `[ConnectedUserResponse]`
   - Interfaz: `ConnectedUserResponse[]`
   - Feature: `features/presence/monitor`
   - Códigos: `200`, `401`

6. **Endpoint**: `GET /presence/connected-users/{empleadoId}`
   - Parámetros: path `empleadoId`
   - Headers: `Authorization`
   - Ejemplo JSON: `{ "empleadoId": 12, "conectado": true }`
   - Interfaz: `ConnectedStatusResponse`
   - Feature: `features/presence/monitor`
   - Códigos: `200`, `401`

### 3.3 Leads (`/leads`)

#### LeadController (`/leads/leads`)
- `POST /leads/leads/intake` | body `LeadIntakeRequest` | headers `Authorization` | resp `void` | feature `features/leads/intake` | códigos `204,400,401,403`
- `PATCH /leads/leads/{idLead}/asignacion` | path `idLead`, body `LeadAsignacionRequest` | headers `Authorization` | resp `void` | feature `features/leads/asignacion` | códigos `204,400,401,403`
- `GET /leads/leads/asesor-ventas` | headers `Authorization` | resp `LeadAsesorVentasResponse[]` | feature `features/leads/bandeja-asesor` | códigos `200,401,403`
- `GET /leads/leads/{idLead}/detalle-asesor` | path `idLead` | headers `Authorization` | resp `LeadAsesorDetalleResponse` | feature `features/leads/detalle-asesor` | códigos `200,401,403,404`
- `PATCH /leads/leads/{idLead}/datos-preventa` | path `idLead`, body `LeadDatosPreventaRequest` | headers `Authorization` | resp `void` | feature `features/leads/preventa` | códigos `204,400,401,403`
- `PATCH /leads/leads/{idLead}/direccion` | path `idLead`, body `LeadDireccionRequest` | headers `Authorization` | resp `void` | feature `features/leads/direccion` | códigos `204,400,401,403`
- `PATCH /leads/leads/{idLead}/oferta-comercial` | path `idLead`, body `LeadOfertaComercialRequest` | headers `Authorization` | resp `void` | feature `features/leads/oferta-comercial` | códigos `204,400,401,403`
- `POST /leads/leads/{idLead}/tipificacion` | path `idLead`, body `LeadTipificacionRequest` | headers `Authorization` | resp `void` | feature `features/leads/tipificacion` | códigos `204,400,401,403`
- `POST /leads/leads/{idLead}/contacto` | path `idLead` | headers `Authorization` | resp `void` | feature `features/leads/contacto` | códigos `204,400,401,403`
- `GET /leads/leads/gtr` | query opcional `fecha` | headers `Authorization` | resp `LeadGtrResponse[]` | feature `features/leads/bandeja-gtr` | códigos `200,401,403`

#### Campaña (`/leads/campanas`)
- `POST /leads/campanas` | body `CampanaRequest` | headers `Authorization` | resp `CampanaResponse` | feature `features/campanas/gestion` | `201,400,401,403,409`
- `PUT /leads/campanas/{idCampana}` | path `idCampana`, body `CampanaWhatsappRequest` | headers `Authorization` | resp `CampanaResponse` | feature `features/campanas/gestion` | `200,400,401,403,404`
- `DELETE /leads/campanas/{idCampana}` | path `idCampana` | headers `Authorization` | resp `CampanaResponse` | feature `features/campanas/gestion` | `200,401,403,404`
- `GET /leads/campanas` | query opcional `activo` | headers `Authorization` | resp `CampanaResponse[]` | feature `features/campanas/listado` | `200,401,403`

#### Cuentas publicitarias (`/leads/cuentas-publicitarias`)
- `POST /leads/cuentas-publicitarias` | body `CuentaPublicitariaRequest` | headers `Authorization` | resp `CuentaPublicitariaResponse` | feature `features/cuentas-publicitarias/gestion` | `201,400,401,403,409`
- `GET /leads/cuentas-publicitarias` | query opcional `activo` | headers `Authorization` | resp `CuentaPublicitariaResponse[]` | feature `features/cuentas-publicitarias/listado` | `200,401,403`
- `GET /leads/cuentas-publicitarias/activas` | headers `Authorization` | resp `CuentaPublicitariaResponse[]` | feature `features/cuentas-publicitarias/listado` | `200,401,403`
- `DELETE /leads/cuentas-publicitarias/{idCuentaPublicitaria}` | path `idCuentaPublicitaria` | headers `Authorization` | resp `CuentaPublicitariaResponse` | feature `features/cuentas-publicitarias/gestion` | `200,401,403,404`

#### Eventos de leads (`/leads/eventos`)
- `GET /leads/eventos/lead/{idLead}` | path `idLead` | headers `Authorization` | resp `EventoResponse[]` | feature `features/leads/eventos` | `200,401,403`
- `GET /leads/eventos/empleado/{idEmpleado}` | path `idEmpleado`, query opcional `fechaDesde`, `fechaHasta` | headers `Authorization` | resp `EventoResponse[]` | feature `features/leads/eventos` | `200,401,403`

#### Planes (`/leads/planes`)
- `POST /leads/planes/adicionales` | body `AdicionalRequest` | headers `Authorization` | resp `AdicionalResponse` | feature `features/planes/adicionales` | `201,400,401,403,409`
- `POST /leads/planes` | body `PlanRequest` | headers `Authorization` | resp `PlanResponse` | feature `features/planes/gestion` | `201,400,401,403,409`
- `GET /leads/planes` | query opcional `idProveedor`, `soloVigentes` | headers `Authorization` | resp `PlanResponse[]` | feature `features/planes/listado` | `200,401,403`
- `GET /leads/planes/adicionales` | query requerido `idProveedor` | headers `Authorization` | resp `AdicionalResponse[]` | feature `features/planes/adicionales` | `200,400,401,403`
- `GET /leads/planes/servicios` | query requerido `idProveedor` | headers `Authorization` | resp `ServiciosProveedorResponse` | feature `features/planes/servicios` | `200,400,401,403`
- `PUT /leads/planes/{idPlan}` | path `idPlan`, body `PlanUpdateRequest` | headers `Authorization` | resp `PlanResponse` | feature `features/planes/gestion` | `200,400,401,403,404`
- `DELETE /leads/planes/{idPlan}` | path `idPlan` | headers `Authorization` | resp `PlanResponse` | feature `features/planes/gestion` | `200,401,403,404`

#### Proveedores (`/leads/proveedores`)
- `POST /leads/proveedores` | body `ProveedorRequest` | headers `Authorization` | resp `ProveedorResponse` | feature `features/proveedores/gestion` | `201,400,401,403,409`
- `PATCH /leads/proveedores/{idProveedor}/estado` | path `idProveedor` | headers `Authorization` | resp `ProveedorResponse` | feature `features/proveedores/gestion` | `200,401,403,404`

#### Promociones (`/leads/promociones`)
- `POST /leads/promociones` | body `PromocionComercialRequest` | headers `Authorization` | resp `PromocionComercialResponse` | feature `features/promociones/gestion` | `201,400,401,403,409`
- `GET /leads/promociones` | query opcional `idProveedor`, `interno`, `idZona` | headers `Authorization` | resp `PromocionComercialResponse[]` | feature `features/promociones/listado` | `200,401,403`
- `DELETE /leads/promociones/{idPromocion}` | path `idPromocion` | headers `Authorization` | resp `PromocionComercialResponse` | feature `features/promociones/gestion` | `200,401,403,404`

#### Tipificaciones (`/leads/tipificaciones`)
- `GET /leads/tipificaciones/{etapa}/catalogo` | path `etapa` (enum: PREVENTA, VENTA, POSTVENTA) | headers `Authorization` | resp `CatalogoResponse` | feature `features/tipificaciones/catalogo` | `200,400,401,403`
- `PUT /leads/tipificaciones/catalogo` | body `CatalogoRequest` | headers `Authorization` | resp `CatalogoResponse` | feature `features/tipificaciones/catalogo` | `200,400,401,403`
- `PATCH /leads/tipificaciones/catalogo/estado` | body `CatalogoEstadoRequest` | headers `Authorization` | resp `CatalogoResponse` | feature `features/tipificaciones/catalogo` | `200,400,401,403`

**Estructura de Tipificaciones por Etapa:**

**PREVENTA**: Categorías iniciales de seguimiento al lead (datos personales, dirección, oferta comercial)
- Típicamente agrupa a subtipificaciones de clasificación temprana por respuesta/interés

**VENTA**: Etapa de cierre comercial
- Agrupa subtipificaciones relacionadas a efectividad de venta, objeciones, cerradas gang, etc.

**POSTVENTA**: Seguimiento post-contratación
- Agrupa subtipificaciones de satisfacción, renovación, soporte, incidencias, etc.

Cada tipificación contiene:
- `id` (number): Identificador único
- `codigo` (string): Código corto para auditoría (ej: "PREVTA_INT", "VENTA_OK")
- `descripción` (string): Descripción legible (ej: "Interés mostrado", "Venta ejecutada")
- `orden` (number): Posición en listado (default 0)
- `subtipificaciones` (SubtipificacionResponse[]): Detalles específicos de categorización

**Ejemplo de respuesta GET /leads/tipificaciones/PREVENTA/catalogo:**
```json
{
  "etapa": "PREVENTA",
  "tipificaciones": [
    {
      "id": 1,
      "codigo": "PREVTA_INT",
      "descripcion": "Interés mostrado",
      "orden": 1,
      "subtipificaciones": [
        {
          "id": 10,
          "codigo": "INT_ALTO",
          "descripcion": "Interés alto",
          "orden": 1
        },
        {
          "id": 11,
          "codigo": "INT_MEDIO",
          "descripcion": "Interés medio",
          "orden": 2
        }
      ]
    },
    {
      "id": 2,
      "codigo": "PREVTA_NORESPONDE",
      "descripcion": "No responde",
      "orden": 2,
      "subtipificaciones": [
        {
          "id": 20,
          "codigo": "NR_CELULAR",
          "descripcion": "Celular no contacta",
          "orden": 1
        }
      ]
    }
  ]
}
```

#### Ubigeo (`/leads/ubigeo`)
- `GET /leads/ubigeo/departamentos` | headers `Authorization` | resp `DepartamentoResponse[]` | feature `features/ubigeo/catalogo` | `200,401,403`
- `GET /leads/ubigeo/departamentos/{idDepartamento}/provincias` | path `idDepartamento` | headers `Authorization` | resp `ProvinciaResponse[]` | feature `features/ubigeo/catalogo` | `200,401,403`
- `GET /leads/ubigeo/provincias/{idProvincia}/distritos` | path `idProvincia` | headers `Authorization` | resp `DistritoResponse[]` | feature `features/ubigeo/catalogo` | `200,401,403`

#### Zonas (`/leads/zonas`)
- `POST /leads/zonas` | body `ZonaRequest` | headers `Authorization` | resp `ZonaResponse` | feature `features/zonas/gestion` | `201,400,401,403,409`
- `GET /leads/zonas` | query opcional `activo` | headers `Authorization` | resp `ZonaResponse[]` | feature `features/zonas/listado` | `200,401,403`
- `PATCH /leads/zonas/{idZona}/estado` | path `idZona` | headers `Authorization` | resp `ZonaResponse` | feature `features/zonas/gestion` | `200,401,403,404`
- `PUT /leads/zonas/{idZona}` | path `idZona`, body `ZonaRequest` | headers `Authorization` | resp `ZonaResponse` | feature `features/zonas/gestion` | `200,400,401,403,404`

### 3.3.1 Recruitment (`/recruitment/postulaciones`, `/recruitment/ofertas-laborales`, `/recruitment/grupos-capacitacion`)

#### Grupo de capacitación (`/recruitment/grupos-capacitacion`)
- `POST /recruitment/grupos-capacitacion` | body `GrupoCapacitacionRequest` | headers `Authorization` | resp `GrupoCapacitacionResponse` | feature `features/recruitment/grupos-capacitacion` | `201,400,401,403`
- `GET /recruitment/grupos-capacitacion` | query opcional `estado` | headers `Authorization` | resp `GrupoCapacitacionResponse[]` | feature `features/recruitment/grupos-capacitacion` | `200,401,403`
- `GET /recruitment/grupos-capacitacion/{idGrupoCapacitacion}` | path `idGrupoCapacitacion` | headers `Authorization` | resp `GrupoCapacitacionResponse` | feature `features/recruitment/grupos-capacitacion` | `200,401,403,404`
- `POST /recruitment/grupos-capacitacion/{idGrupoCapacitacion}/postulaciones` | path `idGrupoCapacitacion`, body `AgregarPostulacionGrupoCapacitacionRequest` | headers `Authorization` | resp `GrupoCapacitacionDetalleResponse` | feature `features/recruitment/grupos-capacitacion` | `201,400,401,403,404`
- `PATCH /recruitment/grupos-capacitacion/{idGrupoCapacitacion}/postulaciones/{idPostulacion}` | path `idGrupoCapacitacion,idPostulacion`, body `ActualizarDetalleGrupoCapacitacionRequest` | headers `Authorization` | resp `GrupoCapacitacionDetalleResponse` | feature `features/recruitment/grupos-capacitacion` | `200,400,401,403,404`

#### Ofertas laborales (`/recruitment/ofertas-laborales`)
- `POST /recruitment/ofertas-laborales` | body `OfertaLaboralRequest` | headers `Authorization` | resp `OfertaLaboralResponse` | feature `features/recruitment/ofertas-laborales` | `201,400,401,403`
- `POST /recruitment/ofertas-laborales/{idOfertaLaboral}/ampliacion` | path `idOfertaLaboral`, body `OfertaAmpliacionRequest` | headers `Authorization` | resp `OfertaAmpliacionResponse` | feature `features/recruitment/ofertas-laborales` | `201,400,401,403`
- `GET /recruitment/ofertas-laborales/activas` | headers `Authorization` | resp `OfertaLaboralResponse[]` | feature `features/recruitment/ofertas-laborales` | `200,401,403`
- `GET /recruitment/ofertas-laborales` | query opcional `estado` | headers `Authorization` | resp `OfertaLaboralResponse[]` | feature `features/recruitment/ofertas-laborales` | `200,401,403`
- `PATCH /recruitment/ofertas-laborales/{idOfertaLaboral}/estado` | path `idOfertaLaboral`, body `ActualizarEstadoOfertaLaboralRequest` | headers `Authorization` | resp `OfertaLaboralResponse` | feature `features/recruitment/ofertas-laborales` | `200,400,401,403,404`

#### Postulaciones (`/recruitment/postulaciones`)
- `POST /recruitment/postulaciones` | body `PostulacionRequest` | headers `Authorization` | resp `PostulacionResponse` | feature `features/recruitment/postulaciones` | `201,400,401,403`
- `PUT /recruitment/postulaciones/{idPostulacion}` | path `idPostulacion`, body `PostulacionRequest` | headers `Authorization` | resp `PostulacionResponse` | feature `features/recruitment/postulaciones` | `200,400,401,403,404`
- `POST /recruitment/postulaciones/{idPostulacion}/tipificacion` | path `idPostulacion`, body `TipificarPostulacionRequest` | headers `Authorization` | resp `PostulacionResponse` | feature `features/recruitment/postulaciones` | `200,400,401,403,404`
- `GET /recruitment/postulaciones/{idPostulacion}` | path `idPostulacion` | headers `Authorization` | resp `PostulacionResponse` | feature `features/recruitment/postulaciones` | `200,401,403,404`
- `GET /recruitment/postulaciones` | query opcional `etapa,estado,estadoBandeja` | headers `Authorization` | resp `PostulacionResponse[]` | feature `features/recruitment/postulaciones` | `200,401,403`
- `GET /recruitment/postulaciones/bandeja/reclutamiento` | query opcional `estadoBandeja` | headers `Authorization` | resp `PostulacionResponse[]` | feature `features/recruitment/postulaciones` | `200,401,403`
- `GET /recruitment/postulaciones/bandeja/capacitacion` | query opcional `sinGrupo` | headers `Authorization` | resp `PostulacionResponse[]` | feature `features/recruitment/postulaciones` | `200,401,403`
- `GET /recruitment/postulaciones/bandeja/contratacion` | headers `Authorization` | resp `PostulacionResponse[]` | feature `features/recruitment/postulaciones` | `200,401,403`
- `POST /recruitment/postulaciones/{idPostulacion}/confirmar-contratacion` | path `idPostulacion`, body `ConfirmarContratacionRequest` | headers `Authorization` | resp `PostulacionResponse` | feature `features/recruitment/postulaciones` | `200,400,401,403,404`

#### Eventos de postulaciones (`/recruitment/postulaciones/{idPostulacion}/eventos`)
- `GET /recruitment/postulaciones/{idPostulacion}/eventos` | path `idPostulacion` | headers `Authorization` | resp `EventoResponse[]` | feature `features/recruitment/eventos` | `200,401,403`

#### Tipificaciones recruitment (`/recruitment/tipificaciones`)
- `GET /recruitment/tipificaciones/{etapa}/catalogo` | path `etapa` | headers `Authorization` | resp `CatalogoTipificacionResponse` | feature `features/recruitment/tipificaciones` | `200,400,401,403`
- `POST /recruitment/tipificaciones/catalogo` | body `CatalogoTipificacionRequest` | headers `Authorization` | resp `CatalogoTipificacionResponse` | feature `features/recruitment/tipificaciones` | `201,400,401,403`
- `PATCH /recruitment/tipificaciones/estado` | body `CatalogoEstadoRequest` | headers `Authorization` | resp `CatalogoTipificacionResponse` | feature `features/recruitment/tipificaciones` | `200,400,401,403`
- `POST /recruitment/tipificaciones/{idTipificacion}/subtipificaciones` | path `idTipificacion`, body `SubtipificacionRequest` | headers `Authorization` | resp `SubtipificacionResponse` | feature `features/recruitment/tipificaciones` | `201,400,401,403,404`

### 3.4 RRHH (`/rrhh`)

#### Empleados (`/rrhh/empleados`)
- `PATCH /rrhh/empleados/{id}/lista-negra` | path `id` | headers `Authorization` | resp `EmpleadoResponse` | feature `features/rrhh/empleados` | `200,401,403,404,406`
- `GET /rrhh/empleados` | query opcional `q,dni,celular,distrito,banco,idEmpresaContratista,origen,estado,page,size,sort` | headers `Authorization` | resp `Page<EmpleadoResponse>` | feature `features/rrhh/empleados` | `200,400,401,403`
- `GET /rrhh/empleados/{dato}/universal` | path `dato`, query `page,size,sort` | headers `Authorization` | resp `Page<EmpleadoResponse>` | feature `features/rrhh/empleados` | `200,400,401,403`
- `GET /rrhh/empleados/{documento}/numero-documento` | path `documento` | headers `Authorization` | resp `EmpleadoResponse` | feature `features/rrhh/empleados` | `200,401,403,404`
- `POST /rrhh/empleados` | body `RegistrarEmpleadoRequest` | headers `Authorization` | resp `EmpleadoResponse` | feature `features/rrhh/empleados` | `201,400,401,403,409`
- `PATCH /rrhh/empleados/{id}/datos-personales` | path `id`, body `DatosPersonalesRequest` | headers `Authorization` | resp `EmpleadoResponse` | feature `features/rrhh/empleados` | `200,400,401,403,404`
- `PATCH /rrhh/empleados/{id}/datos-contacto-ubicacion` | path `id`, body `DatosContactoUbicacionRequest` | headers `Authorization` | resp `EmpleadoResponse` | feature `features/rrhh/empleados` | `200,400,401,403,404`
- `PATCH /rrhh/empleados/{id}/datos-financieros` | path `id`, body `DatosFinancierosRequest` | headers `Authorization` | resp `EmpleadoResponse` | feature `features/rrhh/empleados` | `200,400,401,403,404`
- `PATCH /rrhh/empleados/{id}/datos-corporativos` | path `id`, body `DatosContactoCorporativoRequest` | headers `Authorization` | resp `EmpleadoResponse` | feature `features/rrhh/empleados` | `200,400,401,403,404`

#### Postulantes (`/rrhh/postulantes`)
- `POST /rrhh/postulantes` | body `RegistrarPostulanteRequest` | headers `Authorization` | resp `PostulanteResponse` | feature `features/rrhh/postulantes` | `201,400,401,403,409`
- `GET /rrhh/postulantes/reclutamiento` | query opcional `estado,subestado,origen,puesto,desde,hasta,listaNegra` | headers `Authorization` | resp `PostulanteResponse[]` | feature `features/rrhh/reclutamiento` | `200,400,401,403`
- `GET /rrhh/postulantes/capacitacion` | query opcional `estado,subestado,origen,puesto,desde,hasta,listaNegra` | headers `Authorization` | resp `PostulanteResponse[]` | feature `features/rrhh/capacitacion` | `200,400,401,403`
- `GET /rrhh/postulantes` | query requerido `etapa` + filtros opcionales | headers `Authorization` | resp `PostulanteResponse[]` | feature `features/rrhh/postulantes` | `200,400,401`
- `PATCH /rrhh/postulantes/{id}/estado-reclutamiento` | path `id`, body `EventoPostulanteRequest` | headers `Authorization` | resp `PostulanteResponse` | feature `features/rrhh/reclutamiento` | `200,400,401,403`
- `PATCH /rrhh/postulantes/estado-capacitacion` | body `EstadoCapacitacionRequest[]` | headers `Authorization` | resp `PostulanteResponse[]` | feature `features/rrhh/capacitacion` | `200,400,401,403`
- `PATCH /rrhh/postulantes/{id}/rechazo-inasistencia-capacitacion` | path `id` | headers `Authorization` | resp `PostulanteResponse` | feature `features/rrhh/capacitacion` | `200,400,401,403`

#### Contratos (`/rrhh/contratos`)
- `GET /rrhh/contratos/{id}/historico` | path `id` | headers `Authorization` | resp `ContratoResponse[]` | feature `features/rrhh/contratos` | `200,401,403,404`
- `GET /rrhh/contratos/{id}/vigente` | path `id` | headers `Authorization` | resp `ContratoResponse` | feature `features/rrhh/contratos` | `200,401,403,404`
- `POST /rrhh/contratos/{id}/registrar` | path `id`, body `RegistrarContratoRequest` | headers `Authorization` | resp `ContratoRegistroResponse` | feature `features/rrhh/contratos` | `201,400,401,403,404,409,422`
- `PATCH /rrhh/contratos/{id}/cesar-contrato` | path `id`, body `CerrarContratoRequest` | headers `Authorization` | resp `ContratoResponse` | feature `features/rrhh/contratos` | `200,400,401,403,404,409`

#### Pagos (`/rrhh/pagos`)
- `GET /rrhh/pagos` | query opcional `contrato,empleado,desde,hasta` | headers `Authorization` | resp `PagoResponse[]` | feature `features/rrhh/pagos` | `200,400,401,403`
- `POST /rrhh/pagos/{id}/pagar-contrato` | path `id`, body `RegistrarPagoRequest` | headers `Authorization` | resp `PagoResponse` | feature `features/rrhh/pagos` | `201,400,401,403,404,409`

#### Empresas contratistas (`/rrhh/empresas-contratistas`)
- `POST /rrhh/empresas-contratistas` | body `RegistrarEmpresaContratistaRequest` | headers `Authorization` | resp `EmpresaContratistaResponse` | feature `features/rrhh/contratistas` | `201,400,401,403,409`
- `GET /rrhh/empresas-contratistas` | query opcional `activo` | headers `Authorization` | resp `EmpresaContratistaResponse[]` | feature `features/rrhh/contratistas` | `200,401,403`
- `PATCH /rrhh/empresas-contratistas/{id}/desactivar` | path `id` | headers `Authorization` | resp `EmpresaContratistaResponse` | feature `features/rrhh/contratistas` | `200,401,403,404`

#### Eventos (`/rrhh/eventos`)
- `GET /rrhh/eventos/{idEmpleado}/empleados` | path `idEmpleado` | headers `Authorization` | resp `EmpleadoEventoResponse[]` | feature `features/rrhh/eventos` | `200,401,403`

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

1. **Postulantes por etapa (duplicado funcional):**
   - `GET /rrhh/postulantes/reclutamiento`
   - `GET /rrhh/postulantes/capacitacion`
   - `GET /rrhh/postulantes?etapa=RECLUTAMIENTO|CAPACITACION`
   - **Fuente de verdad recomendada para frontend:** endpoint genérico `GET /rrhh/postulantes` (evita duplicar lógica de filtros).

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

**Endpoints que usan este enum:**
- `GET /rrhh/postulantes/reclutamiento` (devuelve etapa)
- `GET /rrhh/postulantes/capacitacion` (devuelve etapa)
- `GET /rrhh/postulantes?etapa=RECLUTAMIENTO|CAPACITACION|...`
- Response en `GET /rrhh/postulantes` → campo etapaProceso

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

**Endpoints que usan este enum:**
- Response en `GET /rrhh/postulantes/reclutamiento` → campo estadoProceso
- Request en `PATCH /rrhh/postulantes/{id}/estado-reclutamiento` → evento.estado

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

**Endpoints que usan este enum:**
- Request en `PATCH /rrhh/postulantes/{id}/estado-reclutamiento` → evento.subestado
- Response en `GET /rrhh/postulantes` → campo subestadoProceso

#### CapacitacionEstado (Estado en capacitación)
Presente en: `rrhh-service` (PostulanteController)

```ts
export enum CapacitacionEstado {
  POR_CAPACITAR = "POR_CAPACITAR",
  RECHAZADO = "RECHAZADO",
  APROBADO = "APROBADO",
}
```

**Endpoints que usan este enum:**
- Response en `GET /rrhh/postulantes/capacitacion` → campo estadoProceso
- Request en `PATCH /rrhh/postulantes/estado-capacitacion` → estado

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

**Endpoints que usan este enum:**
- Request en `PATCH /rrhh/postulantes/{id}/rechazo-inasistencia-capacitacion` → subestado
- Response en `GET /rrhh/postulantes` → campo subestadoProceso

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
- Request en `POST /rrhh/postulantes` → tipoDocumento

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
- Request en `POST /rrhh/postulantes` → origen
- Request en `GET /rrhh/postulantes` (query filter)
- Response en `GET /rrhh/postulantes` → origen

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
- Response en `GET /rrhh/postulantes` → compania

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
- Request en `PATCH /rrhh/postulantes/{id}/estado-reclutamiento` → evento.tipo
- Response en `GET /rrhh/eventos/{idPostulante}/postulantes` → evento

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
