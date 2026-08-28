import { describe, expect, it } from 'vitest';
import {
  isValidPersonName,
  normalizePersonNameFinal,
  normalizePersonNameInput
} from './person-name';

describe('person-name utils', () => {
  it('elimina numeros y simbolos al escribir o pegar', () => {
    expect(normalizePersonNameInput('JUAN   PEREZ123')).toBe('JUAN PEREZ');
    expect(normalizePersonNameInput('Maria@@ Lopez!!')).toBe('Maria Lopez');
  });

  it('permite tildes y enie', () => {
    expect(normalizePersonNameInput('Ángela Núñez Peña')).toBe('Ángela Núñez Peña');
  });

  it('evita espacios iniciales y colapsa espacios repetidos', () => {
    expect(normalizePersonNameInput('   Luis     Alberto   ')).toBe('Luis Alberto ');
    expect(normalizePersonNameFinal('   Luis     Alberto   ')).toBe('Luis Alberto');
  });

  it('valida solo letras separadas por un espacio', () => {
    expect(isValidPersonName('Ana Maria')).toBe(true);
    expect(isValidPersonName('Ana  Maria')).toBe(false);
    expect(isValidPersonName('Ana2')).toBe(false);
    expect(isValidPersonName('')).toBe(true);
  });
});
