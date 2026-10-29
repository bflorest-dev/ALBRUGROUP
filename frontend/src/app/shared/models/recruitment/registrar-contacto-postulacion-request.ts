export interface RegistrarContactoPostulacionRequest {
  modalidadContacto: 'LLAMADA' | 'WHATSAPP';
  fechaHoraGestion?: string;
  observacion?: string | null;
}
