import {
  BaseLead,
  LeadDatosPreventaRequest,
  LeadDetalleResponse,
  LeadDireccionRequest
} from '../../../shared/models/preventa/preventa.models';
import { BitacoraContactoCluster } from './bitacora.models';

export type SubsanacionModo = 'NUEVO' | 'EXISTENTE';

export interface SubsanacionImpacto {
  idLead: number;
  idContacto?: number | null;
  prefijo?: string | null;
  lead?: string | null;
  usermeta?: string | null;
  titular?: string | null;
  numeroDocumento?: string | null;
  idEquipo?: number | null;
  etapa?: string | null;
  campana?: string | null;
  proveedor?: string | null;
  plan?: string | null;
  createdAt?: string | null;
  lastEntryAt?: string | null;
  oportunidadesHermanas: number;
  eventos: number;
  resumenesEtapa: number;
  calendariosPostventa: number;
  periodosPostventa: number;
  pagosPostventa: number;
  encuestasPostventa: number;
  entregasCredenciales: number;
  dispositivosEntregados: number;
  requiereConfirmacionContacto: boolean;
  requiereConfirmacionPostventa: boolean;
}

export interface SubsanacionPreparacion {
  idLead: number;
  idContacto?: number | null;
  idEquipo?: number | null;
  idCampana?: number | null;
  idProveedor?: number | null;
  idPlan?: number | null;
  fechaInstalacionActual?: string | null;
  detalle: LeadDetalleResponse;
  contacto: BitacoraContactoCluster;
  impacto: SubsanacionImpacto;
}

export interface SubsanacionProveedorOpcion {
  id: number;
  nombre: string;
  activo: boolean;
  requiereSecSotVenta: boolean;
}

export interface SubsanacionCampanaOpcion {
  id: number;
  nombre: string;
  idProveedor: number;
  proveedor: string;
  activo: boolean;
}

export interface SubsanacionPlanOpcion {
  id: number;
  nombre: string;
  precio?: number | null;
  idProveedor: number;
  proveedor: string;
  vigenciaDesde?: string | null;
  vigenciaHasta?: string | null;
  activo: boolean;
  compatibleHistoricamente: boolean;
  razonIncompatibilidad?: string | null;
}

export interface SubsanacionTipificacionOpcion {
  idTipificacion: number;
  codigoTipificacion: string;
  descripcionTipificacion?: string | null;
  ordenTipificacion?: number | null;
  tipificacionActiva: boolean;
  idSubtipificacion: number;
  codigoSubtipificacion: string;
  descripcionSubtipificacion?: string | null;
  ordenSubtipificacion?: number | null;
  subtipificacionActiva: boolean;
  etapaCambio: string;
  comportamientos: string[];
}

export interface SubsanacionOpciones {
  idEquipo: number;
  proveedores: SubsanacionProveedorOpcion[];
  campanas: SubsanacionCampanaOpcion[];
  planes: SubsanacionPlanOpcion[];
  preventa: SubsanacionTipificacionOpcion[];
  venta: SubsanacionTipificacionOpcion[];
}

export interface SubsanacionRequest {
  requestId: string;
  modo: SubsanacionModo;
  idLead?: number | null;
  prefijo: string;
  lead: string;
  usermeta?: string | null;
  idEquipo: number;
  idCampana: number;
  idPlan: number;
  base: BaseLead | string;
  datosPreventa: LeadDatosPreventaRequest;
  direccion: LeadDireccionRequest;
  codigoTipificacionPreventa: string;
  codigoSubtipificacionPreventa: string;
  codigoTipificacionVenta: string;
  codigoSubtipificacionVenta: string;
  sec?: string | null;
  sot?: string | null;
  customerId?: string | null;
  fechaGestion: string;
  fechaInstalacion: string;
  motivo: string;
  confirmarRecreacionPostventa: boolean;
  confirmarImpactoContacto: boolean;
}

export interface SubsanacionHito {
  accion: string;
  etapa: string;
  fecha: string;
}

export interface SubsanacionResponse {
  idSubsanacion: number;
  requestId: string;
  idLead: number;
  modo: SubsanacionModo;
  idAdmin: number;
  nombreAdmin: string;
  rolAdmin: string;
  etapaFinal: string;
  fechaGestion: string;
  fechaInstalacion: string;
  ejecutadoAt: string;
  motivo: string;
  eventosReemplazados: number;
  resumenesReemplazados: number;
  artefactosPostventaReemplazados: number;
  oportunidadesHermanasAfectadas: number;
  lineaTiempo: SubsanacionHito[];
}

export interface SubsanacionActaResumen {
  idSubsanacion: number;
  requestId: string;
  idLead: number;
  modo: SubsanacionModo;
  idAdmin: number;
  nombreAdmin: string;
  rolAdmin: string;
  fechaGestion: string;
  fechaInstalacion: string;
  motivo: string;
  ejecutadoAt: string;
}
