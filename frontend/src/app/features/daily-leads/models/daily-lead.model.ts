/** Contrato de respuesta del backend para un lead ingresado en el día (evento REGISTRO). */
export interface LeadDiarioResponse {
  idLead: number;
  prefijo: string | null;
  lead: string | null;
  nombreActor: string | null;
  rolActor: string | null;
  accion: string;
  createdAt: string;
}

/** Modelo de vista listo para render: textos precomputados, sin lógica en el template. */
export interface DailyLeadRowView {
  idLead: number;
  leadDisplay: string;
  asesor: string;
  rolLabel: string;
  accionLabel: string;
  fechaHora: string;
}
