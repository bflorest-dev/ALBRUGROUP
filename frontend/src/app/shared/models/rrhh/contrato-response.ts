export interface ContratoResponse {
  id: number;
  idEmpleado: number;
  puestoTrabajo: string;
  regimen: string;
  modalidad: string;
  seguroSalud?: string | null;
  sistemaPensiones?: string | null;
  sueldoBase: number;
  fechaInicio: string;
  fechaFin?: string | null;
  createdAt: string;
  updatedAt: string;
}
