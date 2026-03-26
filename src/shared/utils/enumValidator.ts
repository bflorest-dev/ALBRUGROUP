/**
 * Validador genérico de enums
 * 
 * FSD Layer: shared/utils
 * Uso: Validar que valores de selects correspondan a enums válidos antes de enviar a backend
 */

/**
 * Valida que un valor pertenece a un enum
 * Lanza error si el valor no es válido
 * 
 * @param enumObj - Enum a validar contra
 * @param value - Valor a validar
 * @param fieldName - Nombre del campo (para mensaje de error)
 * @throws Error si el valor no es válido o está vacío
 */
export function validateEnumValue(
  enumObj: Record<string, string>,
  value: string | null | undefined,
  fieldName: string
): void {
  if (!value) {
    throw new Error(`${fieldName} es requerido`);
  }

  const validValues = Object.values(enumObj);
  if (!validValues.includes(value)) {
    throw new Error(
      `${fieldName} tiene valor inválido: "${value}". Valores válidos: ${validValues.join(', ')}`
    );
  }
}

/**
 * Valida múltiples campos enum a la vez
 * 
 * @param rules - Array de { enum, value, fieldName }
 * @throws Error si algún validador falla
 */
export function validateEnumValues(
  rules: Array<{ enum: Record<string, string>; value: string | null | undefined; fieldName: string }>
): void {
  for (const rule of rules) {
    validateEnumValue(rule.enum, rule.value, rule.fieldName);
  }
}

/**
 * Valida un enum de forma suave (no lanza error)
 * Retorna true si el valor es válido o vacío
 * 
 * @param enumObj - Enum a validar contra
 * @param value - Valor a validar
 * @returns true si es válido o vacío; false si no es válido
 */
export function isValidEnumValue(
  enumObj: Record<string, string>,
  value: string | null | undefined
): boolean {
  if (!value) {
    return true; // Vacío es válido
  }

  const validValues = Object.values(enumObj);
  return validValues.includes(value);
}

/**
 * Obtiene los valores válidos de un enum
 * Útil para debugging o mensajes de error
 * 
 * @param enumObj - Enum
 * @returns Array de valores válidos
 */
export function getEnumValues(enumObj: Record<string, string>): string[] {
  return Object.values(enumObj);
}
