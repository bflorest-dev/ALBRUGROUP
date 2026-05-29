export function normalizePhoneNumber(prefix?: string | null, lead?: string | null): string {
  const prefixDigits = (prefix ?? '').replace(/\D/g, '');
  const leadDigits = (lead ?? '').replace(/\D/g, '');
  return `${prefixDigits}${leadDigits}`.trim();
}

export function buildTelUrl(prefix?: string | null, lead?: string | null): string | null {
  const phone = normalizePhoneNumber(prefix, lead);
  return phone ? `tel:${phone}` : null;
}

export function buildWhatsAppUrl(prefix?: string | null, lead?: string | null): string | null {
  const phone = normalizePhoneNumber(prefix, lead);
  return phone ? `https://wa.me/${phone}` : null;
}
