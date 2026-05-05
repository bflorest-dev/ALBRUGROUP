import type { NewEmployeeFormData } from '@shared/types';
import type { RegistrarEmpleadoRequest } from '@entities/employee/model';

/**
 * Mapper de UI → DTO Backend
 * 
 * Responsabilidad: convertir nombres de UI a nombres de backend
 * NO usar spread, NO usar ??
 * Mapeo explícito 1:1 para ensure integridad de datos
 * 
 * FSD Layer: features/registrar-empleado/model
 */
export function mapFormToRegistrarEmpleadoRequest(
  formData: NewEmployeeFormData
): RegistrarEmpleadoRequest {
  // Validar campos criticos antes de mapear
  if (!formData.nombres?.trim()) {
    throw new Error('Nombres es requerido');
  }
  if (!formData.apellidos?.trim()) {
    throw new Error('Apellidos es requerido');
  }
  if (!formData.tipoDocumento) {
    throw new Error('Tipo de documento es requerido');
  }
  if (!formData.numeroDocumento?.trim()) {
    throw new Error('Número de documento es requerido');
  }
  if (!formData.fechaNacimiento?.trim()) {
    throw new Error('Fecha de nacimiento es requerida');
  }
  if (!formData.celularPersonal?.trim()) {
    throw new Error('Celular personal es requerido');
  }
  if (!formData.correoPersonal?.trim()) {
    throw new Error('Correo personal es requerido');
  }
  if (!formData.origen) {
    throw new Error('Origen es requerido');
  }
  if (!formData.distrito?.trim()) {
    throw new Error('Distrito es requerido');
  }
  if (!formData.direccion?.trim()) {
    throw new Error('Dirección es requerida');
  }
  if (!formData.banco?.trim()) {
    throw new Error('Banco es requerido');
  }
  if (!formData.cuentaBancaria?.trim()) {
    throw new Error('Cuenta bancaria es requerida');
  }
  if (!formData.cuentaInterbancaria?.trim()) {
    throw new Error('Cuenta interbancaria es requerida');
  }
  if (formData.idEmpresaContratista === '' || Number(formData.idEmpresaContratista) <= 0) {
    throw new Error('ID empresa contratista es requerido');
  }

  const onlyDigits = (value: string): string => value.replace(/\D/g, '');

  // Mapeo explicito: UI -> Backend DTO
  return {
    nombres: formData.nombres.trim(),
    apellidos: formData.apellidos.trim(),
    tipoDocumento: formData.tipoDocumento,
    numeroDocumento: onlyDigits(formData.numeroDocumento),
    nacionalidad: formData.nacionalidad,
    fechaNacimiento: formData.fechaNacimiento,
    estadoCivil: formData.estadoCivil,
    tieneHijos: formData.tieneHijos,
    celularPersonal: onlyDigits(formData.celularPersonal),
    correoPersonal: formData.correoPersonal.trim(),
    origen: formData.origen,
    distrito: formData.distrito,
    direccion: formData.direccion.trim(),
    banco: formData.banco,
    cuentaBancaria: onlyDigits(formData.cuentaBancaria),
    cuentaInterbancaria: onlyDigits(formData.cuentaInterbancaria),
    cuentaPropia: formData.cuentaPropia,
    parentesco: formData.parentesco,
    celularTransferencia: onlyDigits(formData.celularTransferencia || ''),
    idEmpresaContratista: Number(formData.idEmpresaContratista),
  };
}

