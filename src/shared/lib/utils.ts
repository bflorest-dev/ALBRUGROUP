/**
 * Utilidades generales del Design System
 * Incluye la función cn para combinar clases CSS
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clases CSS de forma inteligente
 * Usa clsx para condicionales y twMerge para resolver conflictos de Tailwind
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un número como moneda
 */
export function formatCurrency(amount: number, currency = 'PEN'): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Formatea una fecha de forma legible
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  };

  return dateObj.toLocaleDateString('es-ES', { ...defaultOptions, ...options });
}

/**
 * Capitaliza la primera letra de una cadena
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convierte snake_case a Title Case
 */
export function snakeToTitle(str: string): string {
  return str
    .split('_')
    .map(word => capitalize(word))
    .join(' ');
}

/**
 * Trunca un texto a una longitud específica
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Genera un ID único simple
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Debounce function para optimizar llamadas
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}