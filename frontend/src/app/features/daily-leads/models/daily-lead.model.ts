/** Contrato de respuesta del backend para un lead ingresado en el día (evento REGISTRO). */
export interface LeadDiarioResponse {
  idLead: number;
  prefijo: string | null;
  lead: string | null;
  nombreActor: string | null;
  rolActor: string | null;
  accion: string;
  createdAt: string;
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
