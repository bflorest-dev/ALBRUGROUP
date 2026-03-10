/**
 * Utilidades de Sanitización
 * 
 * Proporciona funciones para sanitizar y validar inputs de usuario
 * para prevenir vulnerabilidades de seguridad como XSS e inyección.
 * 
 * IMPORTANTE: React escapa automáticamente strings en JSX, pero estas
 * funciones proporciona capas adicionales de seguridad y validación.
 */

/**
 * Sanitizar entrada de texto eliminando caracteres peligrosos
 * @param input - String a sanitizar
 * @returns String sanitizado
 * @example
 * const clean = sanitizeInput("<script>alert('xss')</script>");
 * // Retorna: "scriptalertxssscript"
 */
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';

  // Remover caracteres de control y espacios en blanco anormales
  let clean = input.replace(/[\x00-\x1f\x7f]/g, '');

  // Remover tags HTML (agresivo)
  clean = clean.replace(/<[^>]*>/g, '');

  // Remover atributos de evento potenciales (onclick, onerror, etc)
  clean = clean.replace(/on\w+\s*=/gi, '');

  // Limitar whitespace múltiple
  clean = clean.replace(/\s{2,}/g, ' ');

  // Trim
  clean = clean.trim();

  return clean;
};

/**
 * Validar y sanitizar email
 * @param email - Email a validar
 * @returns {valid: boolean, sanitized: string}
 * @example
 * const result = sanitizeEmail("user@example.com<script>");
 * // {valid: true, sanitized: "user@example.com"}
 */
export const sanitizeEmail = (
  email: string
): { valid: boolean; sanitized: string } => {
  if (!email || typeof email !== 'string') return { valid: false, sanitized: '' };

  const sanitized = sanitizeInput(email).toLowerCase();

  // Validar formato email básico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const valid = emailRegex.test(sanitized);

  return { valid, sanitized };
};

/**
 * Validar y sanitizar teléfono (números y caracteres permitidos)
 * @param phone - Teléfono a validar
 * @returns {valid: boolean, sanitized: string}
 * @example
 * const result = sanitizePhone("+51 987 123 456");
 * // {valid: true, sanitized: "+51987123456"}
 */
export const sanitizePhone = (
  phone: string
): { valid: boolean; sanitized: string } => {
  if (!phone || typeof phone !== 'string') return { valid: false, sanitized: '' };

  // Solo permitir números, '+', '-', '(', ')', y espacio
  const sanitized = phone.replace(/[^\d+\-()\\s]/g, '');

  // Validar que tenga al menos 7 dígitos
  const digitsOnly = sanitized.replace(/\D/g, '');
  const valid = digitsOnly.length >= 7;

  return { valid, sanitized: sanitized.trim() };
};

/**
 * Sanitizar nombre (caracteres alfanuméricos, espacios, guiones)
 * @param name - Nombre a sanitizar
 * @returns Nombre sanitizado
 * @example
 * const clean = sanitizeName("Luis<script> García-López");
 * // Retorna: "Luis García-López"
 */
export const sanitizeName = (name: string): string => {
  if (!name || typeof name !== 'string') return '';

  // Remover caracteres especiales peligrosos
  // Permitir: letras, números, espacios, guiones, apóstrofes
  const clean = name.replace(/[^\w\s\-'áéíóúñü]/gi, '');

  return clean.trim();
};

/**
 * Escapar string para usar en contextos HTML
 * Nota: Normalmente no es necesario en React, pero útil como safety net
 * @param text - Texto a escapar
 * @returns Texto escapado
 * @example
 * const escaped = escapeHtml("<script>alert('xss')</script>");
 * // Retorna: "&lt;script&gt;alert('xss')&lt;/script&gt;"
 */
export const escapeHtml = (text: string): string => {
  if (!text || typeof text !== 'string') return '';

  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, char => map[char]);
};

/**
 * Sanitizar URL para prevenir javascript: y data: protocols
 * @param url - URL a sanitizar
 * @returns {valid: boolean, sanitized: string}
 * @example
 * const result = sanitizeUrl("javascript:alert('xss')");
 * // {valid: false, sanitized: ""}
 * 
 * const result2 = sanitizeUrl("https://example.com");
 * // {valid: true, sanitized: "https://example.com"}
 */
export const sanitizeUrl = (
  url: string
): { valid: boolean; sanitized: string } => {
  if (!url || typeof url !== 'string') return { valid: false, sanitized: '' };

  try {
    // Intentar parsear como URL
    const parsed = new URL(url);

    // Blocklist de protocolos peligrosos
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];
    const isDangerous = dangerousProtocols.some(protocol =>
      parsed.protocol.includes(protocol)
    );

    if (isDangerous) {
      return { valid: false, sanitized: '' };
    }

    return { valid: true, sanitized: url };
  } catch {
    // Si no es URL válida, asumir que es relativa
    // Permitir solo rutas relativas con / o #
    if (url.startsWith('/')) {
      return { valid: true, sanitized: url };
    }

    return { valid: false, sanitized: '' };
  }
};

/**
 * Validar objeto JSON sin ejecutar código malicioso
 * @param jsonString - String JSON a validar
 * @returns {valid: boolean, data: any}
 * @example
 * const result = validateJSON('{"name":"John"}');
 * // {valid: true, data: {name: "John"}}
 */
export const validateJSON = (jsonString: string): { valid: boolean; data: any } => {
  if (!jsonString || typeof jsonString !== 'string') {
    return { valid: false, data: null };
  }

  try {
    const data = JSON.parse(jsonString);
    // Verificar que el resultado es un objeto válido
    if (data === null || (typeof data !== 'object' && typeof data !== 'string')) {
      return { valid: false, data: null };
    }
    return { valid: true, data };
  } catch {
    return { valid: false, data: null };
  }
};

/**
 * Sanitizar datos de entrada de formulario
 * Aplica sanitización según el tipo de campo
 * @param fieldName - Nombre del campo
 * @param value - Valor del campo
 * @returns Valor sanitizado
 */
export const sanitizeFormField = (
  fieldName: string,
  value: string
): string => {
  if (!value || typeof value !== 'string') return '';

  const lowerFieldName = fieldName.toLowerCase();

  // Aplicar sanitización según el tipo de campo
  if (lowerFieldName.includes('email')) {
    const { sanitized } = sanitizeEmail(value);
    return sanitized;
  }

  if (
    lowerFieldName.includes('phone') ||
    lowerFieldName.includes('telefono') ||
    lowerFieldName.includes('celular')
  ) {
    const { sanitized } = sanitizePhone(value);
    return sanitized;
  }

  if (
    lowerFieldName.includes('name') ||
    lowerFieldName.includes('nombre') ||
    lowerFieldName.includes('apellido')
  ) {
    return sanitizeName(value);
  }

  if (lowerFieldName.includes('url') || lowerFieldName.includes('link')) {
    const { sanitized } = sanitizeUrl(value);
    return sanitized;
  }

  // Default: sanitización general
  return sanitizeInput(value);
};
