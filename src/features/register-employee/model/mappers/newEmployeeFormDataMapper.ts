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
  if (!formData.celularTransferencia?.trim()) {
    throw new Error('Celular de transferencia es requerido');
  }
  if (formData.idEmpresaContratista === '' || Number(formData.idEmpresaContratista) <= 0) {
    throw new Error('ID empresa contratista es requerido');
  }

  const onlyDigits = (value: string): string => value.replace(/\D/g, '');

  // Debug: Log de datos de entrada
  console.log('[mapFormToRegistrarEmpleadoRequest] Datos de entrada:', {
    fechaNacimiento: formData.fechaNacimiento,
    distrito: formData.distrito,
    parentesco: formData.parentesco,
    idEmpresaContratista: formData.idEmpresaContratista,
  });

  // Mapeo explicito: UI -> Backend DTO
  // Usamos array de pares clave-valor para garantizar el orden exacto
  const orderedEntries: [string, any][] = [
    ['nombres', formData.nombres.trim()],
    ['apellidos', formData.apellidos.trim()],
    ['tipoDocumento', formData.tipoDocumento],
    ['numeroDocumento', onlyDigits(formData.numeroDocumento)],
    ['nacionalidad', formData.nacionalidad],
    ['fechaNacimiento', formData.fechaNacimiento || ''],
    ['estadoCivil', formData.estadoCivil],
    ['tieneHijos', Boolean(formData.tieneHijos)],
    ['celularPersonal', onlyDigits(formData.celularPersonal)],
    ['correoPersonal', formData.correoPersonal.trim()],
    ['origen', formData.origen],
    ['distrito', formData.distrito.trim()],
    ['direccion', formData.direccion.trim()],
    ['banco', formData.banco],
    ['cuentaBancaria', onlyDigits(formData.cuentaBancaria)],
    ['cuentaInterbancaria', onlyDigits(formData.cuentaInterbancaria)],
    ['cuentaPropia', Boolean(formData.cuentaPropia)],
    ['parentesco', formData.parentesco?.trim() || undefined],
    ['celularTransferencia', onlyDigits(formData.celularTransferencia)],
    ['idEmpresaContratista', Number(formData.idEmpresaContratista)],
  ];

  // Filtrar entradas con valores undefined y Object.fromEntries mantiene el orden de inserción
  const filteredEntries = orderedEntries.filter(([_, value]) => value !== undefined);
  const result = Object.fromEntries(filteredEntries) as RegistrarEmpleadoRequest;
  
  // Debug: Log de datos de salida
  console.log('[mapFormToRegistrarEmpleadoRequest] Datos de salida:', result);
  console.log('[mapFormToRegistrarEmpleadoRequest] Orden de campos:', Object.keys(result));
  
  return result;
}

