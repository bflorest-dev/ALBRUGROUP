/**
 * Convierte un enum a opciones reutilizables para selects
 * Transforma: LOS_OLIVOS → "Los Olivos", RECIBO_POR_HONORARIOS → "Recibo Por Honorarios"
 * 
 * @param enumObj - Enum a convertir
 * @returns Array de opciones con { value, label }
 */
export function enumToOptions(enumObj: Record<string, string>) {
  return Object.values(enumObj).map((value) => ({
    value,
    label: formatEnumLabel(value),
  }));
}

/**
 * Formatea un valor de enum para mostrar como label legible
 * LOS_OLIVOS → "Los Olivos"
 * RECIBO_POR_HONORARIOS → "Recibo Por Honorarios"
 * 
 * @param value - Valor del enum (ej: "LOS_OLIVOS")
 * @returns Label formateado (ej: "Los Olivos")
 */
export function formatEnumLabel(value: string): string {
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Convierte un valor de enum a un label legible
 * Usa directamente sin crear opciones
 * 
 * @param value - Valor del enum
 * @returns Label formateado
 */
export function getEnumLabel(value: string): string {
  return formatEnumLabel(value);
}
