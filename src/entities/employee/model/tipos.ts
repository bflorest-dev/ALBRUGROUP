/**
 * POST /rrhh/empleados
 * Registra un nuevo empleado con todos sus datos personales,
 * de contacto, financieros y de empresa en una sola petición.
 * Documentación oficial actualizada: 1 de abril de 2026
 */

export interface RegistrarEmpleadoRequest {
  // Datos personales (requeridos)
  nombres: string;
  apellidos: string;
  tipoDocumento: 'DNI' | 'CE';
  numeroDocumento: string;
  nacionalidad: 'PERUANO' | 'EXTRANJERO';
  fechaNacimiento: string;
  estadoCivil: 'SOLTERO' | 'CASADO' | 'VIUDO' | 'DIVORCIADO';
  tieneHijos: boolean;
  
  // Datos de contacto (requeridos)
  celularPersonal: string;
  correoPersonal: string;
  origen: 'COMPUTRABAJO' | 'INDEED' | 'TIKTOK' | 'FACEBOOK' | 'LINKEDIN' | 'REFERIDO';
  
  // Ubicación (requeridos)
  distrito: string;
  direccion: string;
  
  // Datos financieros (requeridos para empleado "completo")
  banco: 'BCP' | 'BBVA' | 'INTERBANK' | 'SCOTIABANK' | 'BANCO_DE_LA_NACION';
  cuentaBancaria: string;
  cuentaInterbancaria: string;
  cuentaPropia: boolean;
  parentesco: 'PADRE' | 'MADRE' | 'TIO' | 'ESPOSO' | 'HERMANO' | 'ABUELO' | 'PAREJA' | 'OTRO';
  celularTransferencia: string;
  idEmpresaContratista: number;
}
