/**
 * Type Guards Reutilizables
 * 
 * Colección de funciones de validación de tipos para usar con unknown
 * en lugar de any, proporcionando seguridad de tipos en runtime.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PRIMITIVOS
// ═══════════════════════════════════════════════════════════════════════════════

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isNull(value: unknown): value is null {
  return value === null;
}

export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

// ═══════════════════════════════════════════════════════════════════════════════
// OBJETOS Y ESTRUCTURAS
// ═══════════════════════════════════════════════════════════════════════════════

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDADORES DE PROPIEDADES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Verifica si un valor tiene una propiedad específica
 */
export function hasProperty<K extends string>(
  value: unknown,
  key: K
): value is Record<K, unknown> {
  return isObject(value) && key in value;
}

/**
 * Verifica si un valor tiene múltiples propiedades
 */
export function hasProperties<K extends string>(
  value: unknown,
  keys: K[]
): value is Record<K, unknown> {
  return isObject(value) && keys.every((key) => key in value);
}

/**
 * Verifica si un valor tiene una propiedad con un tipo específico
 */
export function hasPropertyOfType<K extends string, T>(
  value: unknown,
  key: K,
  typeGuard: (v: unknown) => v is T
): value is Record<K, T> {
  return hasProperty(value, key) && typeGuard(value[key]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDADORES DE COLECCIONES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Verifica si un valor es un Record con valores de un tipo específico
 */
export function isRecord<T>(
  value: unknown,
  validator: (v: unknown) => v is T
): value is Record<string, T> {
  return (
    isObject(value) &&
    Object.values(value).every((v) => validator(v))
  );
}

/**
 * Verifica si un valor es un array de un tipo específico
 */
export function isArrayOf<T>(
  value: unknown,
  validator: (v: unknown) => v is T
): value is T[] {
  return isArray(value) && value.every((v) => validator(v));
}

/**
 * Verifica si un valor es un array no vacío
 */
export function isNonEmptyArray<T>(value: unknown): value is [T, ...T[]] {
  return isArray(value) && value.length > 0;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDADORES DE FORMULARIOS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Valores válidos para campos de formulario
 */
export type FormValue = string | number | boolean;

/**
 * Verifica si un valor es un valor válido de formulario
 */
export function isFormValue(value: unknown): value is FormValue {
  return isString(value) || isNumber(value) || isBoolean(value);
}

/**
 * Verifica si un valor es un objeto de valores de formulario
 */
export function isFormValues(value: unknown): value is Record<string, FormValue> {
  return isRecord(value, isFormValue);
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDADORES DE OPCIONES
// ═══════════════════════════════════════════════════════════════════════════════

export interface SelectOption {
  label: string;
  value: string | number;
}

/**
 * Verifica si un valor es una opción de select válida
 */
export function isSelectOption(value: unknown): value is SelectOption {
  return (
    isObject(value) &&
    hasPropertyOfType(value, 'label', isString) &&
    hasProperty(value, 'value') &&
    (isString(value.value) || isNumber(value.value))
  );
}

/**
 * Verifica si un valor es un array de opciones de select
 */
export function isSelectOptions(value: unknown): value is SelectOption[] {
  return isArrayOf(value, isSelectOption);
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDADORES DE TABLAS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Verifica si un valor tiene una propiedad id
 */
export function hasId(value: unknown): value is { id: string | number } {
  return (
    isObject(value) &&
    hasProperty(value, 'id') &&
    (isString(value.id) || isNumber(value.id))
  );
}

/**
 * Verifica si un valor es una fila de tabla válida (tiene id)
 */
export function isTableRow<T extends { id: string | number }>(
  value: unknown,
  validator: (v: unknown) => v is T
): value is T {
  return hasId(value) && validator(value);
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDADORES DE RESPUESTAS HTTP
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Estructura básica de respuesta de API
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

/**
 * Verifica si un valor es una respuesta de API válida
 */
export function isApiResponse<T>(
  value: unknown,
  dataValidator: (v: unknown) => v is T
): value is ApiResponse<T> {
  return (
    isObject(value) &&
    hasProperty(value, 'data') &&
    dataValidator(value.data) &&
    hasPropertyOfType(value, 'status', isNumber) &&
    (!hasProperty(value, 'message') || isString(value.message))
  );
}

/**
 * Estructura de error de API
 */
export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

/**
 * Verifica si un valor es un error de API
 */
export function isApiError(value: unknown): value is ApiError {
  return (
    isObject(value) &&
    hasPropertyOfType(value, 'message', isString) &&
    hasPropertyOfType(value, 'status', isNumber) &&
    (!hasProperty(value, 'code') || isString(value.code))
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Combina múltiples type guards con OR lógico
 */
export function isOneOf<T extends unknown[]>(
  value: unknown,
  ...guards: { [K in keyof T]: (v: unknown) => v is T[K] }
): value is T[number] {
  return guards.some((guard) => guard(value));
}

/**
 * Combina múltiples type guards con AND lógico
 */
export function isAllOf<T>(
  value: unknown,
  ...guards: Array<(v: unknown) => v is T>
): value is T {
  return guards.every((guard) => guard(value));
}

/**
 * Crea un type guard para valores literales
 */
export function isLiteral<T extends string | number | boolean>(
  literal: T
): (value: unknown) => value is T {
  return (value: unknown): value is T => value === literal;
}

/**
 * Crea un type guard para uniones de literales
 */
export function isUnionOf<T extends string | number | boolean>(
  ...literals: T[]
): (value: unknown) => value is T {
  return (value: unknown): value is T => literals.includes(value as T);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EJEMPLOS DE USO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Ejemplo: Validar datos de usuario
 */
export interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
}

export function isUser(value: unknown): value is User {
  return (
    isObject(value) &&
    hasPropertyOfType(value, 'id', isNumber) &&
    hasPropertyOfType(value, 'name', isString) &&
    hasPropertyOfType(value, 'email', isString) &&
    (!hasProperty(value, 'age') || isNumber(value.age))
  );
}

/**
 * Ejemplo: Validar array de usuarios
 */
export function isUsers(value: unknown): value is User[] {
  return isArrayOf(value, isUser);
}
