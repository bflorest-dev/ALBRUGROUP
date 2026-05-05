export interface RegistrarContratoRequest {
  idPostulacion?: number | null;
  puestoTrabajo: string;
  regimen: string;
  modalidad: string;
  seguroSalud?: string | null;
  sistemaPensiones?: string | null;
  sueldoBase: number;
  fechaInicio: string;
  fechaFin?: string | null;
}
