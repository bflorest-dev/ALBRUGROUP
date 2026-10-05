export function formatApiErrorMessage(errorBody: unknown, fallbackMessage: string): string {
  if (typeof errorBody === 'string') {
    const parsed = parseJsonObject(errorBody);
    return parsed ? formatApiErrorMessage(parsed, fallbackMessage) : fallbackMessage;
  }

  if (!isRecord(errorBody)) {
    return fallbackMessage;
  }

  if (!hasReadableMessage(errorBody) && 'error' in errorBody) {
    return formatApiErrorMessage(errorBody['error'], fallbackMessage);
  }

  const message = typeof errorBody['message'] === 'string' && errorBody['message'].trim()
    ? errorBody['message'].trim()
    : fallbackMessage;
  const details = formatApiErrorDetails(errorBody['details']);

  return details ? `${message}: ${details}` : message;
}

function formatApiErrorDetails(details: unknown): string {
  if (Array.isArray(details)) {
    return details
      .map((item) => formatApiErrorDetailItem(item))
      .filter(Boolean)
      .join(', ');
  }

  return formatApiErrorDetailItem(details);
}

function formatApiErrorDetailItem(detail: unknown): string {
  if (typeof detail === 'string') {
    return detail.trim();
  }

  if (typeof detail === 'number' || typeof detail === 'boolean') {
    return String(detail);
  }

  if (isRecord(detail)) {
    return Object.entries(detail)
      .map(([key, value]) => `${toReadableKey(key)}: ${formatApiErrorDetailItem(value)}`)
      .filter((item) => !item.endsWith(': '))
      .join(', ');
  }

  return '';
}

function toReadableKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasReadableMessage(value: Record<string, unknown>): boolean {
  return typeof value['message'] === 'string' && value['message'].trim().length > 0;
}

function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
