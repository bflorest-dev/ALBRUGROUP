export interface ActualizarContratoVigenteRequest {
  categoriaPersonal: 'ESTRUCTURAL' | 'OPERATIVO' | 'MANTENIMIENTO';
  puestoTrabajo?: string | null;
  regimen: string;
  modalidad: string;
  seguroSalud?: string | null;
  sistemaPensiones?: string | null;
  sueldoBase: number;
  fechaInicio: string;
  fechaFin?: string | null;
}
