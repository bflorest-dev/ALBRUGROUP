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
  ultimoNombreAsesorAsignado?: string | null;
  totalAsignacionesDia?: number | null;
  /** Cantidad de eventos REGISTRO del lead en el día (>= 1). La fila es el registro más temprano. */
  totalRegistrosDia?: number | null;
}

/** Un registro adicional del mismo lead en el día (para el despliegue de repeticiones). */
export interface DailyLeadRegistroView {
  hora: string;
  asesor: string;
  rolLabel: string;
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
  ultimoAsesor: string;
  totalAsignacionesDia: number;
  /** Cantidad de registros del lead en el día; > 1 habilita el despliegue de repeticiones. */
  totalRegistrosDia: number;
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

export type DailyLeadSortField =
  | 'createdAt'
  | 'nombreActor'
  | 'campana'
  | 'lead'
  | 'primeraTipificacion'
  | 'ultimaTipificacion';

export type DailyLeadSortDirection = 'asc' | 'desc';

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
  /** Total de eventos REGISTRO del día (incluye repeticiones). Leads únicos = suma de agrupación por asesor. */
  totalRegistros?: number | null;
}

export interface DailyLeadGroupFilter {
  tipoGrupo?: DailyLeadGroupType;
  idGrupo?: number;
  codigoTipificacion?: string;
  codigoSubtipificacion?: string;
  sinValor?: boolean;
}
