/** Contrato de respuesta del backend para un lead ingresado en el día (evento REGISTRO). */
export interface LeadDiarioResponse {
  idLead: number;
  prefijo: string | null;
  lead: string | null;
  usermeta?: string | null;
  nombreActor: string | null;
  rolActor: string | null;
  accion: string;
  createdAt: string;
  idEquipo?: number | null;
  nombreCampana?: string | null;
  primeraCodigoTipificacion?: string | null;
  primeraCodigoSubtipificacion?: string | null;
  mayorRangoCodigoTipificacion?: string | null;
  mayorRangoCodigoSubtipificacion?: string | null;
  codigoTipificacion?: string | null;
  codigoSubtipificacion?: string | null;
  ultimoNombreAsesorAsignado?: string | null;
  ultimoNombreAsesorAsignacion?: string | null;
  totalAsignacionesDia?: number | null;
  /** Cantidad de eventos REGISTRO del lead en el día (>= 1). La fila es el registro más temprano. */
  totalRegistrosDia?: number | null;
}

/** Contrato del backend para un evento REGISTRO del lead en el día (despliegue de repeticiones). */
export interface RegistroDiarioLeadResponse {
  createdAt: string;
  nombreActor: string | null;
  nombreCampana: string | null;
}

/** Un registro adicional del mismo lead en el día, listo para render (alineado a las columnas). */
export interface DailyLeadRegistroView {
  hora: string;
  asesor: string;
  campana: string;
}

/** Modelo de vista listo para render: textos precomputados, sin lógica en el template. */
export interface DailyLeadRowView {
  idLead: number;
  prefijo: string | null;
  lead: string | null;
  usermeta?: string | null;
  leadDisplay: string;
  asesor: string;
  asesorDisplay: string;
  rolLabel: string;
  accionLabel: string;
  hora: string;
  campana: string;
  ultimoAsesor: string;
  ultimoAsesorDisplay: string;
  ultimaAsignacion: string;
  ultimaAsignacionDisplay: string;
  totalAsignacionesDia: number;
  /** Cantidad de registros del lead en el día; > 1 habilita el despliegue de repeticiones. */
  totalRegistrosDia: number;
  primeraCodigoTipificacion?: string | null;
  primeraCodigoSubtipificacion?: string | null;
  mayorRangoCodigoTipificacion?: string | null;
  mayorRangoCodigoSubtipificacion?: string | null;
  codigoTipificacion?: string | null;
  codigoSubtipificacion?: string | null;
  isPlaceholder?: boolean;
}

export type DailyLeadGroupType =
  | 'ASESOR'
  | 'CAMPANA'
  | 'EQUIPO'
  | 'PRIMERA_TIPIFICACION'
  | 'MAYOR_TIPIFICACION'
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
  mayoresTipificaciones: DailyLeadGroupItem[];
  ultimasTipificaciones: DailyLeadGroupItem[];
  /** Total de eventos REGISTRO del día (incluye repeticiones). Leads únicos = suma de agrupación por asesor. */
  totalRegistros?: number | null;
}

/** Métricas del día (backend). C y E se derivan en el frontend. */
export interface LeadsDiariosMetricas {
  registros: number; // A
  leadsUnicos: number; // B
  leadsRepetidos: number; // D
  leadsTipificados: number; // F
  bloqueOrden1: number; // G orden 1-3
  bloqueOrden2: number; // G orden 4-6
  bloqueOrden3: number; // G orden 7-8
  leadsVentaCerrada: number; // H
}

export interface LeadsDiariosMetricasEquipo extends LeadsDiariosMetricas {
  idEquipo: number | null;
}

/** Modelo de vista de la barra de métricas (incluye C y E ya calculados). */
export interface DailyLeadsMetricsView {
  registros: number; // A
  leadsUnicos: number; // B
  repetidos: number; // C = A - B
  porcentajeValidos: number; // E = B / A (0-100)
  leadsRepetidos: number; // D
  leadsTipificados: number; // F
  bloque1: number;
  bloque2: number;
  bloque3: number; // G
  ventaCerrada: number; // H
}

export interface DailyLeadGroupFilter {
  tipoGrupo?: DailyLeadGroupType;
  idGrupo?: number;
  codigoTipificacion?: string;
  codigoSubtipificacion?: string;
  sinValor?: boolean;
}
