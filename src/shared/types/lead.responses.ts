/**
 * Lead Service Response Interfaces
 * Basadas en BACKEND_ENDPOINTS_FSD.md - Sección 2
 */

import type {
  CampanaResponse,
  CuentaPublicitariaResponse,
  EventoResponse,
  PlanResponse,
  PromocionComercialResponse,
  AdicionalResponse,
  ServiciosProveedorResponse,
  ProveedorResponse,
} from './backend';

// ============================================================================
// Lead - Operaciones principales
// ============================================================================

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

// ============================================================================
// Ubigeo (Departamentos, Provincias, Distritos)
// ============================================================================

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

// ============================================================================
// Zonas e impacto en Leads
// ============================================================================

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

// ============================================================================
// Tipificaciones
// ============================================================================

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

// ============================================================================
// Cuentas Publicitarias (extendidas)
// ============================================================================

export interface CuentaPublicitariaRequest {
  numeroCuenta: string;
  nombreCuenta: string;
  activo?: boolean;
}

// ============================================================================
// Campañas (extendidas)
// ============================================================================

export interface CampanaRequest {
  nombre: string;
  numeroWhatsappEmpresa: string;
  idCuentaPublicitaria: number;
  idProveedor: number;
  activo?: boolean;
}

// ============================================================================
// Planes (extendidas)
// ============================================================================

export interface PlanRequest {
  nombre: string;
  precio: number;
  vigenciaDesde: string;
  vigenciaHasta: string;
  idProveedor: number;
  internet?: {
    velocidad: number;
    unidad: string;
    tecnologia: string;
  };
  television?: {
    nombre: string;
    cantidadCanales: number;
  };
  telefono?: {
    minutos: number;
    descripcion: string;
  };
  adicionales?: Array<{
    idAdicional: number;
    cantidadIncluida: number;
    permiteCompraAdicional: boolean;
    cantidadMaximaAdicional: number;
  }>;
  activo?: boolean;
}

export interface PlanUpdateRequest extends Partial<PlanRequest> {}

// ============================================================================
// Promociones (extendidas)
// ============================================================================

export interface PromocionComercialRequest {
  nombre: string;
  interno: boolean;
  idProveedor: number;
  idZona: number;
  descuento: boolean;
  cantidadMeses: number;
  vigenciaDesde: string;
  vigenciaHasta: string;
  activo?: boolean;
}

// ============================================================================
// Proveedores (extendidas)
// ============================================================================

export interface ProveedorRequest {
  nombre: string;
  activo?: boolean;
}

// ============================================================================
// Leads - Requests
// ============================================================================

export interface LeadIntakeRequest {
  numTelefono: string;
  idCampana: number;
  idCuentaPublicitaria: number;
  tipoDocumento?: string;
  numeroDocumento?: string;
  nombreTitular?: string;
  base?: string;
  tipoVenta?: string;
}

export interface LeadAsignacionRequest {
  idAsesorAsignado: number;
}

export interface LeadDatosPreventaRequest {
  nombreTitular?: string;
  celularRegistro?: string;
  celularReferencia?: string;
  correo?: string;
}

export interface LeadDireccionRequest {
  tipoVia?: string;
  via?: string;
  direccion?: string;
  numero?: string;
  referencia?: string;
  latitud?: number;
  longitud?: number;
  tipoDomicilio?: string;
  urbanizacion?: string;
  manzana?: string;
  lote?: string;
  piso?: string;
  interior?: string;
}

export interface LeadOfertaComercialRequest {
  idPlan: number;
  idPromocion?: number;
  planUsb?: boolean;
  planTv?: boolean;
  planWifi?: boolean;
}

export interface LeadTipificacionRequest {
  codigoTipificacion: string;
  codigoSubtipificacion: string;
}

export interface LeadContactoRequest {
  fecha?: string;
  hora?: string;
}

// ============================================================================
// Zonas - Requests
// ============================================================================

export interface ZonaRequest {
  nombre: string;
  activo?: boolean;
  reglas: Array<{
    nivelGeografico: string;
    geoId: number;
    criterio: string;
  }>;
}

// ============================================================================
// Tipificaciones - Requests
// ============================================================================

export interface CatalogoRequest {
  etapa: string;
  tipificaciones: Array<{
    codigo: string;
    descripcion: string;
    orden: number;
    subtipificaciones?: Array<{
      codigo: string;
      descripcion: string;
      orden: number;
    }>;
  }>;
}

export interface CatalogoEstadoRequest {
  id: number;
  activo: boolean;
}

// ============================================================================
// Adicionales - Requests
// ============================================================================

export interface AdicionalRequest {
  nombre: string;
  precioUnitario: number;
  idProveedor: number;
  activo?: boolean;
}

// ============================================================================
// Re-exports de tipos base
// ============================================================================

export type {
  CampanaResponse,
  CuentaPublicitariaResponse,
  EventoResponse,
  PlanResponse,
  PromocionComercialResponse,
  AdicionalResponse,
  ServiciosProveedorResponse,
  ProveedorResponse,
};
