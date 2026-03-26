import type { NewEmployeeFormData } from '@shared/types';
import type { RegistrarEmpleadoRequest } from '@entidades/empleado/model';

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
  // Validar campos críticos antes de mapear
  if (!formData.nombres?.trim()) {
    throw new Error('Nombres es requerido');
  }
  if (!formData.apellidos?.trim()) {
    throw new Error('Apellidos es requerido');
  }
  if (!formData.numeroDocumento?.trim()) {
    throw new Error('Número de documento es requerido');
  }
  if (!formData.puesto?.trim()) {
    throw new Error('Puesto es requerido');
  }
  if (!formData.compania) {
    throw new Error('Compañía es requerida');
  }
  if (!formData.phoneMobile?.trim()) {
    throw new Error('Celular personal es requerido');
  }
  if (!formData.district?.trim()) {
    throw new Error('Distrito es requerido');
  }
  if (!formData.address?.trim()) {
    throw new Error('Dirección es requerida');
  }
  if (!formData.bank?.trim()) {
    throw new Error('Banco es requerido');
  }
  if (!formData.accountNumber?.toString().trim()) {
    throw new Error('Cuenta bancaria es requerida');
  }
  if (!formData.interbankNumber?.toString().trim()) {
    throw new Error('Cuenta interbancaria es requerida');
  }

  // Helper for optional strings, converts empty to null
  const parseNullableString = (value?: string): string | null => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  };

  // Mapeo explícito: UI → Backend DTO
  return {
    // Datos personales
    nombres: formData.nombres.trim(),
    apellidos: formData.apellidos.trim(),
    tipoDocumento: (formData.documentType as 'DNI' | 'CE') || 'DNI',
    numeroDocumento: formData.numeroDocumento.trim(),

    // Datos de contacto
    celularPersonal: formData.phoneMobile.trim(),
    correoPersonal: parseNullableString(formData.personalEmail),

    // Ubicación
    distrito: formData.district.trim(),
    direccion: formData.address?.trim() || '',

    // Datos laborales
    puesto: formData.puesto.trim(),
    compania: (formData.compania as 'ALBRU' | 'WIN' | 'CLARO'),

    // Datos financieros
    banco: formData.bank.trim(),
    cuentaBancaria: formData.accountNumber?.toString().trim() || '',
    cuentaInterbancaria: formData.interbankNumber?.toString().trim() || '',

    // Datos complementarios (opcionales)
    nacionalidad: parseNullableString(formData.nationality),
    fechaNacimiento: parseNullableString(formData.birthDate),
    estadoCivil: parseNullableString(formData.civilStatus),
    tieneHijos: formData.hasChildren,
    parentesco: parseNullableString(formData.contractKinship),
    celularTransferencia: parseNullableString(formData.contractCellularTransfer?.toString()),
    cuentaPropia:
      formData.contractOwnAccount === 'SI'
        ? true
        : formData.contractOwnAccount === 'NO'
        ? false
        : null,
  };
}

