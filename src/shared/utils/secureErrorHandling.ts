export const SafeErrorMessages = {
  GENERIC: 'Ocurrió un error',
  NETWORK: 'Error de red',
  INVALID_INPUT: 'Entrada inválida',
  CREATE_FAILED: 'No se pudo crear el registro',
} as const;

export const getSafeErrorMessage = (error: unknown, fallback?: string): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return fallback ?? SafeErrorMessages.GENERIC;
};
