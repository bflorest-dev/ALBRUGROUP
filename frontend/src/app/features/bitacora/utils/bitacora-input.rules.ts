import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function soloDigitos(value: unknown, maxLength?: number): string {
  const limpio = String(value ?? '').replace(/\D/g, '');
  return maxLength ? limpio.slice(0, maxLength) : limpio;
}

export function limpiarPrefijo(value: unknown): string {
  return soloDigitos(value, 3);
}

export function limpiarTelefono(value: unknown): string {
  return soloDigitos(value, 15);
}

export function limpiarTelefonoPorPrefijo(value: unknown, prefijo: unknown): string {
  const digitos = limpiarTelefono(value);
  if (String(prefijo ?? '').replace(/\D/g, '') !== '51') return digitos;
  if (!digitos) return '';
  return digitos.startsWith('9') ? digitos.slice(0, 9) : '';
}

export function limpiarDocumento(value: unknown): string {
  return soloDigitos(value, 12);
}

export function limpiarUsermeta(value: unknown): string {
  return String(value ?? '')
    .replace(/^@+/, '')
    .replace(/\s+/g, '')
    .replace(/[^A-Za-z0-9._-]/g, '')
    .slice(0, 80);
}

export function limpiarNombrePersona(value: unknown): string {
  return String(value ?? '')
    .replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, 120);
}

export function limpiarTextoDireccion(value: unknown, maxLength = 160): string {
  return String(value ?? '')
    .replace(/[^\wÁÉÍÓÚÜÑáéíóúüñ .,#°º/()-]/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, maxLength);
}

export function limpiarCoordenada(value: unknown): string {
  return String(value ?? '')
    .replace(/[^\d.,-]/g, '')
    .replace(/(?!^)-/g, '')
    .slice(0, 24);
}

export function extraerParCoordenadas(value: unknown): [string, string] | null {
  const texto = String(value ?? '').trim();
  const match = texto.match(/(-?\d+(?:[.,]\d+)?)\s*,\s*(-?\d+(?:[.,]\d+)?)/);
  return match ? [match[1].replace(',', '.'), match[2].replace(',', '.')] : null;
}

export function prefijoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '');
    if (!value) return null;
    return /^\d{1,3}$/.test(value) ? null : { prefijo: true };
  };
}

export function telefonoValidator(prefijo: () => string | null | undefined): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '');
    if (!value) return null;
    if (!/^\d+$/.test(value)) return { soloDigitos: true };
    if (String(prefijo() ?? '').replace(/\D/g, '') === '51') {
      return /^9\d{8}$/.test(value) ? null : { telefonoPeru: true };
    }
    return value.length >= 6 && value.length <= 15 ? null : { telefonoInternacional: true };
  };
}

export function documentoValidator(tipoDocumento: () => string | null | undefined): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '');
    if (!value) return null;
    if (!/^\d+$/.test(value)) return { soloDigitos: true };
    const tipo = String(tipoDocumento() ?? '').toUpperCase();
    if (tipo === 'DNI') return value.length === 8 ? null : { dni: true };
    if (tipo === 'RUC') return value.length === 11 ? null : { ruc: true };
    if (tipo === 'CE') return value.length >= 6 && value.length <= 12 ? null : { ce: true };
    return value.length >= 6 && value.length <= 12 ? null : { documento: true };
  };
}

export function coordenadaValidator(tipo: 'latitud' | 'longitud', requerido = false): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').replace(',', '.');
    if (!value) return requerido ? { required: true } : null;
    if (!/^-?\d{1,3}(?:\.\d+)?$/.test(value)) return { coordenada: true };
    const numero = Number(value);
    if (!Number.isFinite(numero)) return { coordenada: true };
    const min = tipo === 'latitud' ? -90 : -180;
    const max = tipo === 'latitud' ? 90 : 180;
    return numero >= min && numero <= max ? null : { rangoCoordenada: true };
  };
}
