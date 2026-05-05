export interface RegistrarEmpleadoRequest {
  nombres: string;
  apellidos: string;
  tipoDocumento: 'DNI' | 'CE';
  numeroDocumento: string;
  nacionalidad: 'PERUANO' | 'EXTRANJERO';
  fechaNacimiento: string;
  estadoCivil: 'SOLTERO' | 'CASADO' | 'VIUDO' | 'DIVORCIADO';
  tieneHijos: boolean;
  celularPersonal: string;
  correoPersonal: string;
  origen: 'COMPUTRABAJO' | 'INDEED' | 'TIKTOK' | 'FACEBOOK' | 'LINKEDIN' | 'REFERIDO';
  distrito: string;
  direccion: string;
  banco: 'BCP' | 'BBVA' | 'INTERBANK' | 'SCOTIABANK' | 'BANCO_DE_LA_NACION';
  cuentaBancaria: string;
  cuentaInterbancaria: string;
  cuentaPropia: boolean;
  parentesco: 'PADRE' | 'MADRE' | 'TIO' | 'ESPOSO' | 'HERMANO' | 'ABUELO' | 'PAREJA' | 'OTRO';
  celularTransferencia: string;
  idEmpresaContratista: number;
}
