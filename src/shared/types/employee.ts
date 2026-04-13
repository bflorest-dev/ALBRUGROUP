export interface RegistrarEmpleadoRequest {
  nombres: string;
  apellidos: string;
  tipoDocumento: 'DNI' | 'CE';
  numeroDocumento: string;
  celularPersonal: string;
  correoPersonal?: string | null;
  distrito: string;
  direccion: string;
  puesto: string;
  compania: 'ALBRU' | 'WIN' | 'CLARO';
  banco: string;
  cuentaBancaria: string;
  cuentaInterbancaria: string;
  nacionalidad?: string | null;
  fechaNacimiento?: string | null;
  estadoCivil?: string | null;
  tieneHijos?: boolean;
  parentesco?: string | null;
  celularTransferencia?: string | null;
  cuentaPropia?: boolean | null;
}
