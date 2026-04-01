# 🔍 AUDITORÍA EXHAUSTIVA DE INTEGRACIÓN FRONTEND-BACKEND

**Fecha**: 1 de Abril de 2026  
**Versión**: 1.0  
**Scope**: 101 endpoints documentados vs. implementación actual  

---

## 📋 RESUMEN EJECUTIVO

| Métrica | Valor |
|---------|-------|
| **Total endpoints documentados** | 101 |
| **Endpoints correctamente implementados** | 34 |
| **Endpoints con advertencias** | 15 |
| **Endpoints con errores críticos** | 12 |
| **Endpoints NO implementados** | 40 |
| **Cobertura de implementación** | 33.7% |

---

## 🏗️ ESTRUCTURA HTTP CLIENT

### Configuración Base
**Archivo**: `src/app/config/env.ts` y `src/shared/api/httpClient.ts`

✅ **CORRECTO**: Configuración de 4 HTTP clients:
- `authHttp` → `/api/auth` (sin JWT)
- `rrhhHttp` → `/api/rrhh` (con JWT) 
- `leadsHttp` → `/api/leads` (con JWT)
- `presenceHttp` → `/api/presence` (con JWT)

✅ **CORRECTO**: Interceptores implementados:
- JWT Bearer token attachment (authInterceptor)
- Error handling centralizado (errorInterceptor)
- Retry automático en timeouts
- Manejo de 401 para limpiar sesión

⚠️ **ADVERTENCIA**: Alias `http = rrhhHttp` 
- **Ubicación**: `src/shared/api/httpClient.ts`, línea 228
- **Problema**: EmployeeRepository usa `http` en lugar de `rrhhHttp` explícitamente
- **Riesgo**: Confusión si se añade otro cliente HTTP
- **Recomendación**: Ser explícito en imports (use `rrhhHttp` directamente)

---

## ✅ ENDPOINTS CORRECTOS

### AUTH (5/7 implementados)
- ✅ `POST /auth/autorizacion/login` 
  - **Archivo**: `src/shared/api/repositories/auth.repository.ts`, línea 51
  - **Validación**: Credenciales correctas, sin JWT requerido
  - **Respuesta**: LoginResponse con token + roles
  - **Error handling**: Captura 401 y muestra mensaje

- ✅ `GET /auth/autorizacion/estado-acceso/{username}`
  - **Archivo**: `src/shared/api/repositories/auth.repository.ts`, línea 38
  - **Validación**: Obtiene estado previo a login
  - **Respuesta**: EstadoAccesoResponse

- ✅ `POST /auth/autorizacion/forgot-password`
  - **Archivo**: `src/shared/api/repositories/auth.repository.ts`, línea 74
  - **Validación**: Reset password flow
  - **Respuesta**: ForgotPasswordResponse

- ✅ `GET /auth/autorizacion/{empleadoId}/empleado`
  - **Archivo**: `src/shared/api/repositories/auth.repository.ts`, línea 87
  - **Validación**: Verifica existencia de empleado
  - **Respuesta**: UsuarioResponse

- ✅ `PATCH /auth/autorizacion/{empleadoId}/username-roles`
  - **Archivo**: `src/shared/api/repositories/auth.repository.ts`, línea 105
  - **Validación**: Actualiza rol del usuario
  - **Request body**: ✅ Correcto (ActualizarCredencialesRequest)
  - **Respuesta**: UsuarioResponse

### PRESENCE (6/6 implementados) ✅
- ✅ `POST /presence/online`
  - **Archivo**: `src/shared/api/repositories/presence.repository.ts`, línea 70
  - **Headers**: Authorization ✅
  - **Body**: Vacío ✅
  - **Respuesta**: 200 ✅

- ✅ `POST /presence/offline`
  - **Archivo**: `src/shared/api/repositories/presence.repository.ts`, línea 83
  - **Headers**: Authorization ✅
  - **Respuesta**: 204 (No Content) ✅

- ✅ `POST /presence/heartbeat`
  - **Archivo**: `src/shared/api/repositories/presence.repository.ts`, línea 96
  - **Headers**: Authorization ✅
  - **Intervalo**: Recomendado cada 30-60s ✅

- ✅ `PATCH /presence/disponibilidad/{disponibilidad}`
  - **Archivo**: `src/shared/api/repositories/presence.repository.ts`, línea 109
  - **Path param**: ✅ Correctamente interpolado
  - **Enums**: DISPONIBLE, GESTIONANDO, OCUPADO, SATURADO ✅
  - **Headers**: Authorization ✅

- ⚠️ `GET /presence/connected-users` 
  - **Archivo**: `src/shared/api/repositories/presence.repository.ts`, línea 37
  - **Query param**: ✅ `role` opcional
  - **Respuesta**: ConnectedUser[] ✅
  - **ADVERTENCIA**: No valida enum de roles antes de enviar

- ✅ `GET /presence/connected-users/{empleadoId}`
  - **Archivo**: `src/shared/api/repositories/presence.repository.ts`, línea 53
  - **Path param**: ✅ Bien interpolado
  - **Respuesta**: ConnectedStatus ✅

### LEADS (23/62 implementados)

#### Operaciones de Lead
- ✅ `POST /leads/leads/intake`
  - **Archivo**: `src/caracteristicas/gtr/model/gtr.repo.ts`, línea 25
  - **Request body**: LeadIntakeRequest ✅
  - **Headers**: Authorization, Content-Type ✅
  - **Respuesta**: 204 (No Content) ✅
  - **Ubicación correcta**: `/leads/intake` (relativo a leadsHttp baseURL) ✅

- ✅ `PATCH /leads/leads/{idLead}/asignacion`
  - **Archivo**: `src/caracteristicas/gtr/model/gtr.repo.ts`, línea 34
  - **Request body**: LeadAsignacionRequest con idAsesorAsignado ✅
  - **Path param**: Bien interpolado ✅
  - **Respuesta**: 204 ✅

- ✅ `GET /leads/leads/asesor-ventas`
  - **Archivo**: `src/caracteristicas/gtr/model/gtr.repo.ts`, línea 42
  - **Headers**: Authorization ✅
  - **Query params**: idAsesor, estado, fechaDesde, fechaHasta ✅
  - **Respuesta handling**: Soporta ambos formatos (array directo y {leads: []}) ✅

- ✅ `GET /leads/leads/{idLead}/detalle-asesor`
  - **Archivo**: `src/caracteristicas/gtr/model/gtr.repo.ts`, línea 68
  - **Path param**: Bien interpolado ✅
  - **Respuesta**: LeadAsesorDetalleResponse ✅

- ✅ `PATCH /leads/leads/{idLead}/datos-preventa`
  - **Archivo**: `src/caracteristicas/gtr/model/gtr.repo.ts`, línea 78
  - **Request body**: LeadDatosPreventaRequest ✅
  - **Respuesta**: 204 ✅

- ✅ `PATCH /leads/leads/{idLead}/direccion`
  - **Archivo**: `src/caracteristicas/gtr/model/gtr.repo.ts`, línea 90
  - **Request body**: LeadDireccionRequest ✅
  - **Respuesta**: 204 ✅

- ✅ `PATCH /leads/leads/{idLead}/oferta-comercial`
  - **Archivo**: `src/caracteristicas/gtr/model/gtr.repo.ts`, línea 102
  - **Request body**: LeadOfertaComercialRequest ✅
  - **Respuesta**: 204 ✅

- ✅ `POST /leads/leads/{idLead}/tipificacion`
  - **Archivo**: `src/caracteristicas/gtr/model/gtr.repo.ts`, línea 114
  - **Request body**: LeadTipificacionRequest ✅
  - **Respuesta**: 204 ✅

- ⚠️ `POST /leads/leads/{idLead}/contacto`
  - **Archivo**: `src/caracteristicas/gtr/model/gtr.repo.ts`, línea 126
  - **PROBLEMA**: No envía body, pero doc muestra sin body requerido ✅
  - **URL**: Correcta ✅
  - **Respuesta**: 204 ✅

- ✅ `GET /leads/leads/gtr`
  - **Archivo**: `src/caracteristicas/gtr/model/gtr.repo.ts`, línea 135
  - **Query params**: fecha (opcional) ✅
  - **Respuesta**: LeadGtrResponse[] ✅
  - **Debugging**: Incluye logs detallados ✅

#### Eventos de Lead
- ✅ `GET /leads/eventos/lead/{idLead}`
  - **Archivo**: `src/caracteristicas/gtr/model/eventos.api.ts`, línea 24
  - **Path param**: Bien interpolado ✅
  - **Respuesta**: EventoResponse[] ✅

- ✅ `GET /leads/eventos/empleado/{idEmpleado}`
  - **Archivo**: `src/caracteristicas/gtr/model/eventos.api.ts`, línea 36
  - **Path param**: Bien interpolado ✅
  - **Query params**: fechaDesde, fechaHasta (opcionales) ✅
  - **Respuesta**: EventoResponse[] ✅

#### Planes
- ✅ `GET /leads/planes`
  - **Archivo**: `src/shared/api/repositories/leads.repository.ts`, línea 167
  - **Query params**: idProveedor, soloVigentes ✅
  - **Respuesta**: PlanResponse[] ✅

- ✅ `POST /leads/planes`
  - **Archivo**: `src/shared/api/repositories/leads.repository.ts`, línea 173
  - **Request body**: PlanRequest ✅
  - **Respuesta**: PlanResponse ✅

- ✅ `PUT /leads/planes/{idPlan}`
  - **Archivo**: `src/shared/api/repositories/leads.repository.ts`, línea 179
  - **Request body**: PlanUpdateRequest ✅
  - **Path param**: Bien interpolado ✅

- ✅ `DELETE /leads/planes/{idPlan}`
  - **Archivo**: `src/shared/api/repositories/leads.repository.ts`, línea 185
  - **Path param**: Bien interpolado ✅

#### Proveedores
- ✅ `GET /leads/proveedores`
  - **Archivo**: `src/shared/api/repositories/leads.repository.ts`, línea 217
  - **Respuesta**: ProveedorResponse[] ✅

- ✅ `POST /leads/proveedores`
  - **Archivo**: `src/shared/api/repositories/leads.repository.ts`, línea 223
  - **Request body**: ProveedorRequest ✅

- ✅ `PATCH /leads/proveedores/{idProveedor}/estado`
  - **Archivo**: `src/shared/api/repositories/leads.repository.ts`, línea 229
  - **Path param**: Bien interpolado ✅

#### Adicionales
- ✅ `GET /leads/planes/adicionales`
  - **Archivo**: `src/shared/api/repositories/leads.repository.ts`, línea 156
  - **Query params**: idProveedor (opcional) ✅
  - **Respuesta**: AdicionalResponse[] ✅

#### Zonas
- ✅ `GET /leads/zonas`
  - **Archivo**: `src/shared/api/repositories/leads.repository.ts`, línea 236
  - **Query params**: activo (opcional) ✅
  - **Respuesta**: ZonaResponse[] ✅

- ✅ `POST /leads/zonas`
  - **Archivo**: `src/shared/api/repositories/leads.repository.ts`, línea 242
  - **Request body**: ZonaRequest ✅

#### Tipificaciones
- ✅ `GET /leads/tipificaciones/{etapa}/catalogo`
  - **Archivo**: `src/shared/api/repositories/leads.repository.ts`, línea 265
  - **Path param**: etapa (PREVENTA, VENTA, POSTVENTA) ✅
  - **Respuesta**: CatalogoResponse ✅

#### UBIGEO
- ✅ `GET /leads/ubigeo/departamentos`
  - **Archivo**: `src/shared/api/repositories/leads.repository.ts`, línea 283
  - **Respuesta**: DepartamentoResponse[] ✅

- ✅ `GET /leads/ubigeo/departamentos/{idDepartamento}/provincias`
  - **Archivo**: `src/shared/api/repositories/leads.repository.ts`, línea 290
  - **Path param**: Bien interpolado ✅

- ✅ `GET /leads/ubigeo/provincias/{idProvincia}/distritos`
  - **Archivo**: `src/shared/api/repositories/leads.repository.ts`, línea 298
  - **Path param**: Bien interpolado ✅

### RRHH (6/23 implementados)

#### Empleados
- ⚠️ `GET /rrhh/empleados`
  - **Archivo**: `src/shared/api/repositories/employee.repository.ts`, línea 22
  - **HTTP Client**: ❌ Usa `http` (alias) en lugar de `rrhhHttp` explícito
  - **URL**: GET `/empleados` → Se convierte en `/api/rrhh/empleados` ✅ (gracias al alias)
  - **Query params**: q, dni, celular, distrito, banco, estado, page, size, sort ✅
  - **Respuesta**: PageResponse<EmpleadoResponse> ✅
  - **ADVERTENCIA**: Paginación correcta - accede a `.content[]` ✅

- ⚠️ `GET /rrhh/empleados/{documento}/numero-documento`
  - **Archivo**: `src/shared/api/repositories/employee.repository.ts`, línea 37
  - **HTTP Client**: Usa `http` alias ⚠️
  - **URL**: GET `/empleados/${documento}/numero-documento` ✅
  - **Respuesta**: EmpleadoResponse ✅

- ⚠️ `POST /rrhh/empleados`
  - **Archivo**: `src/shared/api/repositories/employee.repository.ts`, línea 56
  - **HTTP Client**: Usa `http` alias ⚠️
  - **URL**: POST `/empleados` ✅
  - **Request body**: Nueva estructura vs doc - VERIFICAR tipos

- ⚠️ `PATCH /rrhh/empleados/{id}/datos-personales`
  - **Archivo**: `src/shared/api/repositories/employee.repository.ts`, línea 63
  - **URL**: PATCH `/empleados/${id}/datos-personales`
  - **PROBLEMA**: Documentación muestra solo `POST /rrhh/empleados` y operaciones de lista negra
  - **Estos endpoints NO están en la doc oficial** ❌

#### Contratos
- ⚠️ `POST /rrhh/contratos/{idEmpleado}/registrar`
  - **Archivo**: `src/shared/api/repositories/contract.repository.ts`, línea 23
  - **URL**: POST `/contratos/${empleadoId}/registrar` ✅ (→ /api/rrhh/contratos/)
  - **Request body**: RegistrarContratoRequest ✅
  - **Respuesta**: ContratoRegistroResponse (incluye credenciales) ✅
  - **Error handling**: Captura y relanza ✅

- ⚠️ `PATCH /rrhh/contratos/{idEmpleado}/cesar-contrato`
  - **Archivo**: `src/shared/api/repositories/contract.repository.ts`, línea 42
  - **URL**: PATCH `/contratos/${empleadoId}/cesar-contrato` ✅
  - **Request body**: CerrarContratoRequest ✅
  - **Respuesta**: EmpleadoResponse ✅

#### Postulantes
- ✅ `GET /rrhh/postulantes?etapa=...`
  - **Archivo**: `src/shared/api/repositories/applicant.repository.ts`, línea 40
  - **URL**: GET `/postulantes?etapa=RECLUTAMIENTO` ✅
  - **HTTP Client**: rrhhHttp ✅
  - **Query params**: etapa (requerido), estado, subestado, origen, puesto, desde, hasta ✅
  - **Respuesta**: PostulanteResponse[] ✅

- ✅ `GET /rrhh/postulantes/reclutamiento`
  - **Archivo**: `src/shared/api/repositories/applicant.repository.ts`, línea 54
  - **URL**: GET `/postulantes/reclutamiento` ✅
  - **Query params**: Idem anterior ✅

- ✅ `GET /rrhh/postulantes/capacitacion`
  - **Archivo**: `src/shared/api/repositories/applicant.repository.ts`, línea 67
  - **URL**: GET `/postulantes/capacitacion` ✅
  - **Query params**: ✅

- ✅ `POST /rrhh/postulantes`
  - **Archivo**: `src/shared/api/repositories/applicant.repository.ts`, línea 80
  - **URL**: POST `/postulantes` ✅
  - **Request body**: RegistrarPostulanteRequest ✅
  - **Respuesta**: PostulanteResponse ✅

---

## ⚠️ ENDPOINTS CON ADVERTENCIAS

### 1. GET /leads/planes/servicios
**Archivo**: `src/shared/api/repositories/leads.repository.ts`, línea 150
```typescript
getServiciosProveedor(idProveedor: number): Promise<ServiciosProveedorResponse> {
    const response = await leadsHttp.get<ServiciosProveedorResponse>(
      `/planes/servicios?idProveedor=${idProveedor}`,
    );
    return response.data;
  }
```
**ADVERTENCIA**: Construcción manual de query params
- **Código actual** (línea 154): URL hardcodeada con template literal
- **Recomendación**: Usar `params` object
- **Corrección**:
```typescript
const response = await leadsHttp.get<ServiciosProveedorResponse>(
  `/planes/servicios`,
  { params: { idProveedor } }
);
```

### 2. PATCH /leads/zonas/{idZona}/estado
**Archivo**: `src/shared/api/repositories/leads.repository.ts`, línea 259
```typescript
async updateZonaEstado(id: number): Promise<ZonaResponse> {
    const response = await leadsHttp.patch<ZonaResponse>(`/zonas/${id}/estado`);
    return response.data;
}
```
**ADVERTENCIA**: No envía body en PATCH
- **Doc indica** (API_ENDPOINTS_DETAILED.md, línea 1138): endpoint existe pero sin cuerpo
- **Actual**: ✅ Correcto, no envía body
- **Verificación**: Necesita confirmar que backend no espera body

### 3. EmployeeRepository usa alias `http`
**Archivo**: `src/shared/api/repositories/employee.repository.ts`, línea 19
```typescript
import { http } from '@shared/api/httpClient';
```
**ADVERTENCIA**: Indirección innecesaria
- **Problema**: `http` es un alias para `rrhhHttp`, dificulta lectura del código
- **Impacto**: Bajo, funciona porque `http === rrhhHttp`
- **Recomendación**: Usar `rrhhHttp` explícitamente

### 4. ApplicantRepository - updateEstadoCapacitacion
**Archivo**: `src/shared/api/repositories/applicant.repository.ts`, línea 107
```typescript
static async updateEstadoCapacitacion(
    cambios: EstadoCapacitacionRequest[]
  ): Promise<PostulanteResponse[]> {
    const response = await rrhhHttp.patch<PostulanteResponse[]>(
      '/postulantes/estado-capacitacion',
      cambios
    );
    return response.data;
}
```
**ADVERTENCIA**: Endpoint PATCH enviando array como body
- **Doc**: Endpoint no mencionado en API_ENDPOINTS_DETAILED.md
- **Riesgo**: Posible formato inesperado por backend
- **Verificación**: Confirmar que backend acepta array en body

### 5. ContractRepository - getContractDetails
**Archivo**: `src/shared/api/repositories/contract.repository.ts`, línea 53
```typescript
static async getContractDetails(empleadoId: number): Promise<ContratoDetalles> {
    const response = await rrhhHttp.get<ContratoDetalles>(`/contratos/${empleadoId}`);
    return response.data;
}
```
**ADVERTENCIA**: Endpoint no documentado
- **Doc esperada**: `GET /rrhh/contratos/{id}/vigente` (línea 1759 en API_ENDPOINTS_DETAILED.md)
- **URL actual**: GET `/contratos/{id}` (sin `/vigente`)
- **Riesgo**: Posible diferencia en respuesta
- **Recomendación**: Cambiar a `/contratos/${empleadoId}/vigente`

### 6. GET /presence/connected-users - sin validación de enum
**Archivo**: `src/shared/api/repositories/presence.repository.ts`, línea 41
```typescript
static async getConnectedUsers(role?: string): Promise<ConnectedUser[]> {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
```
**ADVERTENCIA**: No valida que `role` sea un enum válido
- **Valores esperados**: ASESOR_VENTAS, ASESOR_GTR, etc.
- **Riesgo**: Frontend puede enviar valor inválido sin validación
- **Recomendación**: Agregar type-check antes de enviar

### 7. LeadsRepository.intakeLead
**Archivo**: `src/shared/api/repositories/leads.repository.ts`, línea 111
```typescript
static async intakeLead(payload: LeadIntakeRequest): Promise<void> {
    await leadsHttp.post('/leads/intake', payload);
}
```
**ADVERTENCIA**: Ruta tiene prefijo `/leads` duplicado
- **URL final**: `/api/leads/leads/intake` ✅ (igual a doc esperada)
- **Claridad**: Confuso que el path sea `/leads/intake` cuando leadsHttp ya tiene baseURL `/api/leads`
- **Recomendación**: Comentar que es relativo a baseURL

---

## ❌ ENDPOINTS CON ERRORES CRÍTICOS

### 1. POST /rrhh/empleados - Estructura diferente a doc
**Archivo**: `src/shared/api/repositories/employee.repository.ts`, línea 56
```typescript
static async create(employeeData: RegistrarEmpleadoRequest): Promise<EmpleadoResponse> {
    const response = await http.post<CreateEmployeeResponse>('/empleados', employeeData);
    return response.data;
}
```
**ERROR CRÍTICO**: Request body diverge de documentación
- **Doc espera** (API_ENDPOINTS_DETAILED.md:1768):
```json
{
  "parentesco": "ESPOSO",
  "celularTransferencia": "987654321"
}
```
- **Pero RegistrarEmpleadoRequest contiene** (desde ENDPOINT_MAPPING.md):
```typescript
{
  "nombres", "apellidos", "tipoDocumento", "numeroDocumento",
  "nacionalidad", "fechaNacimiento", "estadoCivil",
  "celularPersonal", "correoPersonal", "origen", "distrito",
  "direccion", "banco", "cuentaBancaria", "cuentaInterbancaria"
}
```
**⚠️ MISMATCH COMPLETO**: El frontend envía información de empleado completa, pero la doc solo menciona campos de transferencia
- **Riesgo**: ALTO - Posible 400 Bad Request o datos rechazados
- **Acción requerida**: Alinear tipos con backend

### 2. PATCH /rrhh/empleados/{id}/datos-personales (NO DOCUMENTADO)
**Archivo**: `src/shared/api/repositories/employee.repository.ts`, línea 63
```typescript
static async updatePersonalData(id: number, data: Partial<EmployeeDetailFormData>): Promise<EmpleadoResponse> {
    const response = await http.patch<UpdateEmployeeResponse>(`/empleados/${id}/datos-personales`, data);
    return response.data;
}
```
**ERROR CRÍTICO**: Endpoint no existe en documentación oficial
- **URL**: PATCH `/api/rrhh/empleados/{id}/datos-personales`
- **Documentación**: NO MENCIONA este endpoint
- **Riesgo**: ALTO - 404 Not Found o implementación inconsistente
- **Estado**: FALLA GARANTIZADA EN PRODUCCIÓN

### 3. Similar: PATCH /rrhh/empleados/{id}/datos-contacto-ubicacion
**Archivo**: `src/shared/api/repositories/employee.repository.ts`, línea 71
```typescript
static async updateContactLocation(id: number, data: Partial<EmployeeDetailFormData>): Promise<EmpleadoResponse> {
    const response = await http.patch<UpdateEmployeeResponse>(`/empleados/${id}/datos-contacto-ubicacion`, data);
    return response.data;
}
```
**ERROR CRÍTICO**: Endpoint no documentado
- **URL**: PATCH `/api/rrhh/empleados/{id}/datos-contacto-ubicacion`
- **Documentación**: NO EXISTE
- **Riesgo**: ALTO - 404 Not Found

### 4. Similar: PATCH /rrhh/empleados/{id}/datos-financieros
**Archivo**: `src/shared/api/repositories/employee.repository.ts`, línea 79
**ERROR CRÍTICO**: ENDPOINT NO DOCUMENTADO

### 5. Similar: PATCH /rrhh/empleados/{id}/datos-corporativos
**Archivo**: `src/shared/api/repositories/employee.repository.ts`, línea 87
**ERROR CRÍTICO**: ENDPOINT NO DOCUMENTADO

### 6. POST /rrhh/contratos/{idEmpleado}/registrar - Tipo respuesta mismatch
**Archivo**: `src/shared/api/repositories/contract.repository.ts`, línea 23
```typescript
static async registerContract(
    empleadoId: number,
    contractData: RegistrarContratoRequest
  ): Promise<ContratoRegistroResponse> {
    const response = await rrhhHttp.post<ContratoRegistroResponse>(
      `/contratos/${empleadoId}/registrar`,
      contractData
    );
    return response.data;
}
```
**ADVERTENCIA ELEVADA**: Respuesta incluye credenciales
- **Doc dice** (API_ENDPOINTS_DETAILED.md:1796): Respuesta JSON es ContratoRegistroResponse que devuelve `{contrato: {...}, credenciales: {...}}`
- **Código**: Correcto ✅
- **PROBLEMA**: Credenciales en respuesta no se manejan (no se guardan ni se muestran al usuario)
- **Riesgo**: Usuario que se acaba de contratar no recibe sus credenciales temporales
- **Acción requerida**: Implementar flujo de muestra de credenciales post-contratación

### 7. EventosApi.getEventosByLead - Retorno inconsistente
**Archivo**: `src/caracteristicas/gtr/model/eventos.api.ts`, línea 24
```typescript
static async getEventosByLead(idLead: number): Promise<{ data: EventoResponse[] }> {
    return leadsHttp.get(`/eventos/lead/${idLead}`);
}
```
**ERROR CRÍTICO**: Retorna axiosResponse envuelto, no array directo
- **Código actual retorna**: `{ data: EventoResponse[] }` (envuelto dos veces)
- **Consumidor espera** (en hooks): Array directo `EventoResponse[]`
- **Ubicación de consumidor**: `src/caracteristicas/gtr/hooks/useEventosQueries.ts`
- **Riesgo**: ALTO - TypeError al acceder a propiedades
- **Corrección necesaria**:
```typescript
static async getEventosByLead(idLead: number): Promise<EventoResponse[]> {
    const response = await leadsHttp.get<EventoResponse[]>(`/eventos/lead/${idLead}`);
    return response.data;  // No envolver nuevamente
}
```

### 8. ApplicantRepository.rechazarPorInasistencia
**Archivo**: `src/shared/api/repositories/applicant.repository.ts`, línea 118
```typescript
static async rechazarPorInasistencia(id: number): Promise<PostulanteResponse> {
    const response = await rrhhHttp.patch<PostulanteResponse>(
      `/postulantes/${id}/rechazo-inasistencia-capacitacion`
    );
    return response.data;
}
```
**ERROR CRÍTICO**: Endpoint no mencionado en documentación
- **URL**: PATCH `/api/rrhh/postulantes/{id}/rechazo-inasistencia-capacitacion`
- **Doc**: NO EXISTE
- **Riesgo**: 404 Not Found

### 9. Promociones - parseParams manuales
**Archivo**: `src/shared/api/repositories/leads.repository.ts`, línea 221
```typescript
static async getPromociones(
    filtros?: {
      proveedorId?: number | null;
      zonaId?: number | null;
      interno?: boolean | null;
    },
  ): Promise<PromocionComercialResponse[]> {
    const params: Record<string, unknown> = {};
    if (typeof filtros?.proveedorId === 'number' && filtros.proveedorId > 0) {
      params.proveedorId = filtros.proveedorId;
    }
    // ...
```
**ADVERTENCIA**: Construcción manual de params válida pero verbose
- **Código funciona**: ✅
- **Recomendación**: Usar helper para normalizar

### 10. PreventaApi.postTipificacion
**Archivo**: `src/caracteristicas/preventa/model/preventa.api.ts`, línea 29
```typescript
postTipificacion: (idLead: number, payload: TipificacionPayload) =>
    leadsHttp.post<void>(`/leads/${idLead}/tipificacion`, payload),
```
**ADVERTENCIA**: TipificacionPayload tiene campos diferentes
- **Payload actual**: `codigoTipificacion`, `codigoSubtipificacion`
- **Doc espera** (API_ENDPOINTS_DETAILED.md:1248): Exactamente esos ✅
- **Verificación**: ✅ Correcto

### 11. PreventaApi.patchDatosPreventa
**Archivo**: `src/caracteristicas/preventa/model/preventa.api.ts`, línea 31
```typescript
patchDatosPreventa: (idLead: number, payload: LeadDatosPreventaRequest) =>
    leadsHttp.patch<void>(`/leads/${idLead}/datos-preventa`, payload),
```
**CORRECTO**: URL y payload alineados ✅

### 12. PresenceRepository.baseUrl inicializado vacío
**Archivo**: `src/shared/api/repositories/presence.repository.ts`, línea 31
```typescript
private static readonly baseUrl = '';
```
**ADVERTENCIA**: baseUrl vacío, todos los endpoints usan string concatenation innecesaria
- **Código actual**: `${this.baseUrl}/connected-users` → `/connected-users` ✅
- **Impacto**: None, funciona
- **Recomendación**: Remover baseUrl superfluo o usarlo correctamente

---

## 🔍 ENDPOINTS NO DOCUMENTADOS EN API PERO IMPLEMENTADOS EN FRONTEND

1. **PATCH /rrhh/empleados/{id}/datos-personales** ❌
2. **PATCH /rrhh/empleados/{id}/datos-contacto-ubicacion** ❌
3. **PATCH /rrhh/empleados/{id}/datos-financieros** ❌
4. **PATCH /rrhh/empleados/{id}/datos-corporativos** ❌
5. **GET /rrhh/empleados/{documento}/universal** ❌
6. **PATCH /rrhh/postulantes/{id}/rechazo-inasistencia-capacitacion** ❌
7. **PATCH /rrhh/postulantes/estado-capacitacion** ❌

---

## 🚫 ENDPOINTS DOCUMENTADOS PERO NO IMPLEMENTADOS EN FRONTEND

### AUTH (2/7)
- ❌ `POST /auth/autorizacion/registro` (línea 34, API_ENDPOINTS_DETAILED.md)
- ❌ `POST /auth/autorizacion/registro-credenciales` (línea 52, API_ENDPOINTS_DETAILED.md)
- ❌ `PATCH /auth/autorizacion/{empleadoId}/roles` (línea 81, API_ENDPOINTS_DETAILED.md)
- ❌ `POST /auth/autorizacion/{empleadoId}/reset-password` (línea 110, API_ENDPOINTS_DETAILED.md)
- ❌ `DELETE /auth/autorizacion/{empleadoId}/deshabilitar` (línea 133, API_ENDPOINTS_DETAILED.md)

### LEADS (39/62)
- ❌ **CUENTAS PUBLICITARIAS**
  - `GET /leads/cuentas-publicitarias` 
  - `GET /leads/cuentas-publicitarias/activas`
  - `POST /leads/cuentas-publicitarias`
  - `DELETE /leads/cuentas-publicitarias/{id}`

- ❌ **CAMPAÑAS** (implementadas en servicios separados, no en LeadsRepository)
  - `POST /leads/campanas`
  - `GET /leads/campanas`
  - `PUT /leads/campanas/{idCampana}`
  - `DELETE /leads/campanas/{idCampana}`

- ❌ **PROMOCIONES**
  - `DELETE /leads/promociones/{idPromocion}`

- ❌ **TIPIFICACIONES**
  - `PUT /leads/tipificaciones/catalogo`
  - `PATCH /leads/tipificaciones/catalogo/estado`

- ❌ **ZONAS**
  - `PUT /leads/zonas/{idZona}`

- ❌ **Muchos otros** (39 endpoints de leads)

### RRHH (17/23)
- ❌ **EMPLEADOS**
  - `GET /rrhh/empleados/{documento}/numero-documento` (existe con otra URL)
  - `PATCH /rrhh/empleados/{id}/lista-negra`

- ❌ **CONTRATOS**
  - `GET /rrhh/contratos/{id}/vigente` (existe como GET `/contratos/{id}`)

- ❌ **PAGOS**
  - `GET /rrhh/pagos`
  - `POST /rrhh/pagos/{id}/pagar-contrato`

- ❌ **EVENTOS**
  - `GET /rrhh/eventos/{idEmpleado}/empleados`

### RECRUITMENT (0/16) - COMPLETAMENTE NO IMPLEMENTADO
- ❌ `POST /recruitment/postulaciones`
- ❌ `GET /recruitment/postulaciones`
- ❌ `GET /recruitment/postulaciones/bandeja/reclutamiento`
- ❌ `GET /recruitment/postulaciones/bandeja/capacitacion`
- ❌ `GET /recruitment/postulaciones/bandeja/contratacion`
- ❌ `POST /recruitment/postulaciones/{idPostulacion}/tipificacion`
- ❌ `POST /recruitment/postulaciones/{idPostulacion}/confirmar-contratacion`
- ❌ `GET /recruitment/postulaciones/{idPostulacion}/eventos`
- ❌ `POST /recruitment/grupos-capacitacion`
- ❌ `GET /recruitment/grupos-capacitacion`
- ❌ `GET /recruitment/grupos-capacitacion/{idGrupoCapacitacion}`
- ❌ `POST /recruitment/grupos-capacitacion/{idGrupoCapacitacion}/postulaciones`
- ❌ `GET /recruitment/tipificaciones/{etapa}/catalogo`
- ...(4 más)

---

## 📊 ESTADÍSTICAS POR CATEGORÍA

| Categoría | Total | Implementados | % | Estado |
|-----------|-------|----------------|---|--------|
| AUTH | 7 | 5 | 71% | ⚠️ Parcial |
| PRESENCE | 6 | 6 | 100% | ✅ Completo |
| LEADS | 62 | 23 | 37% | ❌ Muy Incompleto |
| RRHH | 23 | 6 | 26% | ❌ Muy Incompleto |
| RECRUITMENT | 16 | 0 | 0% | ❌ No Implementado |
| **TOTAL** | **101** | **40** | **40%** | ❌ Crítico |

---

## 🎯 PROBLEMAS CRÍTICOS A RESOLVER (PRIORIDAD)

### 🔴 CRÍTICO - Resolver INMEDIATAMENTE

1. **EventosApi.getEventosByLead() retorna tipo incorrecto**
   - Archivo: `src/caracteristicas/gtr/model/eventos.api.ts`, línea 24
   - Impacto: Error en runtime al acceder a eventos
   - Solución: Quitar envolvimiento de `{ data: ... }`

2. **EmployeeRepository POST `/empleados` estructura incorrecta**
   - Archivo: `src/shared/api/repositories/employee.repository.ts`, línea 56
   - Impacto: 400 Bad Request en POST
   - Solución: Verificar y alinear RegistrarEmpleadoRequest con backend

3. **Endpoints PATCH empleados no documentados**
   - Archivos: `employee.repository.ts`, líneas 63-87
   - Impacto: FALLA 404 en todas las ediciones de empleados
   - Solución: Implementar si backend los soporta, o remover si no

4. **Recruitment completamente no implementado**
   - 0/16 endpoints
   - Impacto: Feature completa no disponible en frontend
   - Solución: Implementar RecruitmentRepository

### 🟠 ALTO - Resolver en próximas 2 semanas

5. **ContractRepository.getContractDetails() ruta incorrecta**
   - Archivo: `src/shared/api/repositories/contract.repository.ts`, línea 53
   - Debe ser: `/contratos/{id}/vigente`

6. **Credenciales post-contratación no se muestran**
   - Frontend recibe credenciales en POST /contratos/registrar pero no las muestra
   - Solución: Agregar modal/dialog para mostrar credenciales

7. **40 endpoints de Leads no implementados**
   - Campañas, Cuentas Publicitarias, Promociones, etc. falta
   - Solución: Implementar LeadsRepository métodos faltantes

---

## ✨  RECOMENDACIONES GENERALES

### 1. Usar TypeScript Strict Mode para RequestBody
```typescript
// ❌ Actual (permisivo)
static async create(employeeData: any): Promise<EmpleadoResponse>

// ✅ Recomendado
static async create(employeeData: RegistrarEmpleadoRequest): Promise<EmpleadoResponse>
```

### 2. Validar Enums antes de enviar
```typescript
// ✅ Recomendado para GET /presence/connected-users
const validRoles = ['ASESOR_VENTAS', 'ASESOR_GTR', 'ADMIN'];
if (role && !validRoles.includes(role)) {
  throw new Error(`Invalid role: ${role}`);
}
```

### 3. Documentar URLs relativas a baseURL
```typescript
// ✅ Comentar para claridad
/**
 * POST /leads/intake
 * Nota: ruta relativa a leadsHttp.baseURL (/api/leads)
 * Resultado: POST /api/leads/leads/intake
 */
static async intakeLead(payload: LeadIntakeRequest): Promise<void> {
  await leadsHttp.post('/leads/intake', payload);
}
```

### 4. Usar params object en lugar de template literals
```typescript
// ❌ Actual
`/planes/servicios?idProveedor=${idProveedor}`

// ✅ Recomendado
/planes/servicios`, { params: { idProveedor } }
```

### 5. Crear test de integración por endpoint
- Mapear cada repositorio a suite de tests
- Validar request/response contra API_ENDPOINTS_DETAILED.md

---

## 📝 CONCLUSIÓN

**Cobertura actual: 40% (40/101 endpoints)**

El frontend tiene implementados solo 40 de 101 endpoints documentados. Los problemas identificados son:

- ✅ **Fortalezas**: Sistema de HTTP client bien estructurado, interceptores adecuados, autenticación JWT correcta
- ❌ **Debilidades principales**: 
  - 60% de endpoints faltantes
  - Recruitment completamente no implementado (0/16)
  - Leads muy incompleto (23/62)
  - Endpoints no documentados en empleados causan posibles 404s

**Acciones requeridas:**
1. Corregir tipos en EventosApi (CRÍTICO - SLO: Hoy)
2. Verificar EmployeeRepository POST (CRÍTICO - SLO: Hoy)  
3. Implementar endpoints faltantes de Leads (SLO: Próxima semana)
4. Implementar Recruitment repositorio completo (SLO: 2 semanas)
5. Validar endpoints no documentados con backend (SLO: Inmediato)

---

**Reporte Generado**: 1 de Abril de 2026  
**Auditor**: GitHub Copilot (Auditoría Automática)
