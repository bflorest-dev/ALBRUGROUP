/** Contrato de respuesta del backend para un lead ingresado en el día (evento REGISTRO). */
export interface LeadDiarioResponse {
  idLead: number;
  prefijo: string | null;
  lead: string | null;
  nombreActor: string | null;
  rolActor: string | null;
  accion: string;
  createdAt: string;
  idEquipo?: number | null;
  nombreCampana?: string | null;
  primeraCodigoTipificacion?: string | null;
  primeraCodigoSubtipificacion?: string | null;
  codigoTipificacion?: string | null;
  codigoSubtipificacion?: string | null;
}

/** Modelo de vista listo para render: textos precomputados, sin lógica en el template. */
export interface DailyLeadRowView {
  idLead: number;
  prefijo: string | null;
  lead: string | null;
  leadDisplay: string;
  asesor: string;
  rolLabel: string;
  accionLabel: string;
  hora: string;
  campana: string;
  primeraCodigoTipificacion?: string | null;
  primeraCodigoSubtipificacion?: string | null;
  codigoTipificacion?: string | null;
  codigoSubtipificacion?: string | null;
}

export type DailyLeadGroupType =
  | 'ASESOR'
  | 'CAMPANA'
  | 'EQUIPO'
  | 'PRIMERA_TIPIFICACION'
  | 'ULTIMA_TIPIFICACION';

export type DailyLeadGroupMode = 'SIN_AGRUPAR' | DailyLeadGroupType;

export interface DailyLeadGroupItem {
  idGrupo: number | null;
  codigoTipificacion: string | null;
  codigoSubtipificacion: string | null;
  etiqueta: string;
  cantidad: number;
  sinValor: boolean;
}

export interface DailyLeadGroupsResponse {
  asesores: DailyLeadGroupItem[];
  campanas: DailyLeadGroupItem[];
  equipos: DailyLeadGroupItem[];
  primerasTipificaciones: DailyLeadGroupItem[];
  ultimasTipificaciones: DailyLeadGroupItem[];
}

export interface DailyLeadGroupFilter {
  tipoGrupo?: DailyLeadGroupType;
  idGrupo?: number;
  codigoTipificacion?: string;
  codigoSubtipificacion?: string;
  sinValor?: boolean;
}
