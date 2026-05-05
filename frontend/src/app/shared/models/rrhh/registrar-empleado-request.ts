export interface RegistrarEmpleadoRequest {
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nacionalidad: string;
  fechaNacimiento: string;
  estadoCivil: string;
  tieneHijos: boolean;
  celularPersonal: string;
  correoPersonal: string;
  origen: string;
  distrito: string;
  direccion: string;
  banco: string;
  cuentaBancaria: string;
  cuentaInterbancaria: string;
  cuentaPropia: boolean;
  parentesco?: string | null;
  celularTransferencia?: string | null;
  idEmpresaContratista?: number | null;
}
