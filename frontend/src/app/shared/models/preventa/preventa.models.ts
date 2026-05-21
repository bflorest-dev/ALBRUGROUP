import { PageResponse } from '../common/page-response';

export type Direction = 'asc' | 'desc';
export type Etapa = 'PREVENTA' | 'VENTA' | 'POSTVENTA' | 'COBRANZA';
export type EstadoSeguimiento = 'NUEVO' | 'ASIGNADO' | 'EN_GESTION' | 'AGENDADO' | 'GESTIONADO';
export type BaseLead =
  | 'WHATSAPP'
  | 'MESSENGER'
  | 'RECONTACTO'
  | 'PREDICTIVO'
  | 'REFERIDO'
  | 'MASIVO';

export interface PageQuery {
  pageNumber: number;
  pageSize: number;
  sortBy: string;
  direction: Direction;
}

export interface LeadGtrResponse {
  id: number;
  createdAt: string;
  prefijo: string;
  lead: string;
  nombreCampana?: string | null;
  nombreProveedorCampana?: string | null;
  numeroWhatsappEmpresa?: string | null;
  base?: BaseLead | string | null;
  nombreTitular?: string | null;
  numeroDocumentoTitularServicio?: string | null;
  primeraCodigoTipificacion?: string | null;
  primeraCodigoSubtipificacion?: string | null;
  codigoTipificacion?: string | null;
  codigoSubtipificacion?: string | null;
  nombrePlanOfrecido?: string | null;
  nombreAsesorAsignado?: string | null;
  estadoSeguimiento?: EstadoSeguimiento | string | null;
  reasignaciones: number;
}

export interface LeadAsesorVentasResponse {
  id: number;
  fechaAsignacion?: string | null;
  prefijo: string;
  lead: string;
  nombreTitular?: string | null;
  correo?: string | null;
  estadoSeguimiento?: EstadoSeguimiento | string | null;
}

export interface LeadGtrMetricasResponse {
  nuevos: number;
  sinGestionar: number;
  gestionados: number;
  preventas: number;
}

export interface LeadDetalleResponse extends LeadAsesorVentasResponse {
  lastEntryAt?: string | null;
  nombreCampana?: string | null;
  nombreProveedorCampana?: string | null;
  base?: string | null;
  idAsesorAsignado?: number | null;
  nombreAsesorAsignado?: string | null;
  tipoDocumento?: string | null;
  numeroDocumentoTitularServicio?: string | null;
  celularRegistro?: string | null;
  celularReferencia?: string | null;
  nombreMadre?: string | null;
  nombrePadre?: string | null;
  numeroDocumentoTitularCelularRegistro?: string | null;
  nombreTitularCelularRegistro?: string | null;
  ubigeoNacimiento?: string | null;
  ubigeoDomicilio?: string | null;
  tipoDomicilio?: string | null;
  tipoVia?: string | null;
  via?: string | null;
  direccion?: string | null;
  referencia?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  urbanizacion?: string | null;
  numero?: string | null;
  manzana?: string | null;
  lote?: string | null;
  nombreEdificio?: string | null;
  nombreCondominio?: string | null;
  plano?: string | null;
  piso?: string | null;
  interior?: string | null;
  idPlan?: number | null;
  nombrePlan?: string | null;
  nombreProveedorPlan?: string | null;
  precioPlan?: number | null;
  idPromocionInterna?: number | null;
  nombrePromocionInterna?: string | null;
  precioAdicionales?: number | null;
  precioFinal?: number | null;
}

export interface LeadRealtimeEvent {
  tipo: string;
  idLead: number;
  etapa?: Etapa | string | null;
  etapaAnterior?: Etapa | string | null;
  estado?: EstadoSeguimiento | string | null;
  idAsesorAsignado?: number | null;
  idAsesorAnterior?: number | null;
  codigoTipificacion?: string | null;
  codigoSubtipificacion?: string | null;
  occurredAt?: string | null;
}

export interface LeadIntakeRequest {
  prefijo: string;
  lead: string;
  idCampana: number;
  base: string;
}

export interface LeadSnapshotsRequest {
  numeroDocumentoTitularServicio?: string | null;
  direccion?: string | null;
}

export interface LeadAsignacionRequest {
  idAsesorAsignado: number;
  nombreAsesorAsignado: string;
}

export interface LeadAsignacionMasivaRequest extends LeadAsignacionRequest {
  idsLead: number[];
}

export interface LeadAsignacionResultadoResponse {
  idLead: number;
  asignado: boolean;
  mensaje?: string | null;
}

export interface LeadAsignacionMasivaResponse {
  totalSolicitados: number;
  totalProcesados: number;
  totalAsignados: number;
  totalFallidos: number;
  resultados: LeadAsignacionResultadoResponse[];
}

export interface LeadDatosPreventaRequest {
  tipoDocumento: string;
  numeroDocumentoTitularServicio: string;
  ubigeoNacimiento?: string | null;
  nombreTitularServicio?: string | null;
  celularRegistro?: string | null;
  celularReferencia?: string | null;
  correo?: string | null;
  nombreMadre?: string | null;
  nombrePadre?: string | null;
  numeroDocumentoTitularCelularRegistro?: string | null;
  nombreTitularCelularRegistro?: string | null;
}

export interface LeadDireccionRequest {
  ubigeoDomicilio: string;
  tipoDomicilio?: string | null;
  tipoVia?: string | null;
  via?: string | null;
  direccion: string;
  referencia?: string | null;
  latitud: number;
  longitud: number;
  urbanizacion?: string | null;
  numero?: string | null;
  manzana?: string | null;
  lote?: string | null;
  nombreEdificio?: string | null;
  nombreCondominio?: string | null;
  plano?: string | null;
  piso?: string | null;
  interior?: string | null;
}

export interface LeadOfertaAdicionalRequest {
  idAdicional: number;
  cantidad: number;
}

export interface LeadOfertaComercialRequest {
  idPlan?: number | null;
  idPromocionInterna?: number | null;
  adicionales?: LeadOfertaAdicionalRequest[] | null;
}

export interface LeadTipificacionRequest {
  codigoTipificacion: string;
  codigoSubtipificacion: string;
  comentario?: string | null;
  horaProgramada?: string | null;
}

export interface CatalogoResponse {
  etapa: string;
  tipificaciones: TipificacionResponse[];
}

export interface TipificacionResponse {
  id: number;
  codigo: string;
  descripcion: string;
  orden: number;
  subtipificaciones: SubtipificacionResponse[];
}

export interface SubtipificacionResponse {
  id: number;
  codigo: string;
  descripcion: string;
  orden: number;
  etapaCambio?: string | null;
  estadoPostventaCambio?: string | null;
}

export interface CampanaResponse {
  id: number;
  nombre: string;
  numeroWhatsappEmpresa?: string;
  idProveedor?: number;
  nombreProveedor?: string;
  activo?: boolean;
}

export interface PlanResponse {
  id: number;
  nombre: string;
  precio?: number;
  precioPromocional?: number | null;
  idProveedor?: number;
  nombreProveedor?: string;
  idZona?: number | null;
  nombreZona?: string | null;
}

export interface PromocionComercialResponse {
  id: number;
  reglaComercial: string;
  idProveedor?: number;
  nombreProveedor?: string;
  idZona?: number | null;
  nombreZona?: string | null;
  idsPlanes?: number[];
  nombresPlanes?: string[];
}

export interface AdicionalResponse {
  id: number;
  nombre: string;
  precioUnitario?: number;
  idProveedor?: number;
  nombreProveedor?: string;
}

export interface ZonaResponse {
  id: number;
  nombre: string;
  activo?: boolean;
}

export interface UbigeoItem {
  id: number;
  nombre: string;
  codigo?: string;
}

export type LeadPage<T> = PageResponse<T>;
