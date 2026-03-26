export const sanitizeInput = (value: string): string => value.trim().replace(/[<>]/g, '');
export const sanitizeFormField = (value: string): string => sanitizeInput(value);
