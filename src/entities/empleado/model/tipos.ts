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
  
  // Datos de contacto (requeridos)
  celularPersonal: string;
  correoPersonal?: string | null;
  
  // Ubicación (requeridos)
  distrito: string;
  direccion: string;
  
  // Datos laborales (requeridos)
  puesto: string;
  compania: 'ALBRU' | 'WIN' | 'CLARO';
  
  // Datos financieros (requeridos para empleado "completo")
  banco: string;
  cuentaBancaria: string;
  cuentaInterbancaria: string;
  
  // Datos complementarios
  nacionalidad?: string | null;
  fechaNacimiento?: string | null;
  estadoCivil?: string | null;
  tieneHijos?: boolean;
  parentesco?: string | null;
  celularTransferencia?: string | null;
  cuentaPropia?: boolean | null;
}
