import {
  LeadDatosPreventaRequest,
  LeadDetalleResponse,
  LeadDireccionRequest,
  CampoConfigItem
} from '../../../shared/models/preventa/preventa.models';

export interface FreelanceProveedorOpcion {
  id: number;
  nombre: string;
  requiereSecSotVenta: boolean;
  camposCaptura: CampoConfigItem[];
}

export interface FreelancePlanOpcion {
  id: number;
  nombre: string;
  precio?: number | null;
  idProveedor: number;
  proveedor: string;
  vigenciaDesde?: string | null;
  vigenciaHasta?: string | null;
}

export interface FreelanceOpciones {
  idEquipo: number;
  proveedores: FreelanceProveedorOpcion[];
  planes: FreelancePlanOpcion[];
}

export interface FreelanceIdentidadDisponibilidad {
  telefonoDisponible: boolean;
  usermetaDisponible: boolean;
  mensaje?: string | null;
}

export interface FreelanceVentaCrearRequest {
  requestId: string;
  prefijo: string;
  lead: string;
  usermeta?: string | null;
  idPlan: number;
  datosPreventa: LeadDatosPreventaRequest;
  direccion: LeadDireccionRequest;
}

export interface FreelanceVentaReenvioRequest {
  requestId: string;
  idPlan: number;
  datosPreventa: LeadDatosPreventaRequest;
  direccion: LeadDireccionRequest;
}

export interface FreelanceVentaResponse {
  idOrigen: number;
  requestId: string;
  idLead: number;
  etapa: string;
  numeroIntento: number;
  registradoAt: string;
}

export interface FreelanceVentaPreparacion {
  idLead: number;
  detalle: LeadDetalleResponse;
  motivoVenta?: string | null;
  submotivoVenta?: string | null;
  comentarioVenta?: string | null;
  retornadoAt?: string | null;
  puedeCorregir: boolean;
}

export interface FreelanceContadores {
  registradas: number;
  subidas: number;
  instaladas: number;
  retornadas: number;
}

export interface FreelanceEstadoFila {
  clave: string;
  cantidad: number;
}

export interface FreelanceProveedorFila {
  idProveedor?: number | null;
  proveedor?: string | null;
  registradas: number;
  subidas: number;
  instaladas: number;
  retornadas: number;
}

export interface FreelanceSeguimientoDetalle {
  idLead: number;
  lead: string;
  fechaRegistro: string;
  clasificacion: string;
  tipificacionVenta?: string | null;
  subtipificacionVenta?: string | null;
  asesorVenta?: string | null;
  fechaRelevante?: string | null;
  fechaGestion?: string | null;
  comentario?: string | null;
  tipoDocumento?: string | null;
  numeroDocumento?: string | null;
  cliente?: string | null;
  celularRegistro?: string | null;
  celularReferencia?: string | null;
  departamento?: string | null;
  distrito?: string | null;
  idProveedor?: number | null;
  proveedor?: string | null;
  idPlan?: number | null;
  plan?: string | null;
  etapaActual: string;
  numeroIntentos: number;
  requiereCorreccion: boolean;
  puedeCorregir: boolean;
}

export interface FreelanceSeguimiento {
  contadores: FreelanceContadores;
  estados: FreelanceEstadoFila[];
  proveedores: FreelanceProveedorFila[];
  detalle: FreelanceSeguimientoDetalle[];
}
