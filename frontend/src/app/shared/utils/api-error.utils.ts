export function formatApiErrorMessage(errorBody: unknown, fallbackMessage: string): string {
  if (typeof errorBody === 'string') {
    const parsed = parseJsonObject(errorBody);
    return parsed ? formatApiErrorMessage(parsed, fallbackMessage) : fallbackMessage;
  }

  if (!isRecord(errorBody)) {
    return fallbackMessage;
  }

  // Angular wraps the API body in HttpErrorResponse.error and puts a technical transport
  // message in HttpErrorResponse.message. Prefer the backend's functional message first.
  if ('error' in errorBody && errorBody['error'] !== errorBody) {
    const nestedMessage = formatApiErrorMessage(errorBody['error'], '');
    if (nestedMessage) {
      return nestedMessage;
    }
  }

  const message = typeof errorBody['message'] === 'string' && errorBody['message'].trim()
    ? errorBody['message'].trim()
    : fallbackMessage;
  const details = formatApiErrorDetails(errorBody['details']);

  if (isTechnicalMessage(message)) {
    return fallbackMessage;
  }

  return details ? `${message}: ${details}` : message;
}

function isTechnicalMessage(message: string): boolean {
  return /^Http failure (response|during parsing) for /i.test(message)
    || /^Failed to fetch$/i.test(message)
    || /^NetworkError/i.test(message);
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

function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
