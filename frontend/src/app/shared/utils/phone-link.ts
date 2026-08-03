export function normalizePhoneNumber(prefix?: string | null, lead?: string | null): string {
  const prefixDigits = (prefix ?? '').replace(/\D/g, '');
  const leadDigits = (lead ?? '').replace(/\D/g, '');
  return prefixDigits && leadDigits ? `${prefixDigits}${leadDigits}` : '';
}

export function normalizeUsermeta(usermeta?: string | null): string {
  return (usermeta ?? '').trim().replace(/^@+/, '');
}

export function formatLeadIdentity(row: {
  prefijo?: string | null;
  lead?: string | null;
  usermeta?: string | null;
}): string {
  const phone = row.prefijo && row.lead ? `${row.prefijo} ${row.lead}`.trim() : '';
  if (phone) {
    return phone;
  }

  const meta = normalizeUsermeta(row.usermeta);
  return meta ? `@${meta}` : '-';
}

export function buildTelUrl(prefix?: string | null, lead?: string | null): string | null {
  const phone = normalizePhoneNumber(prefix, lead);
  return phone ? `tel:${phone}` : null;
}

export function buildWhatsAppUrl(
  prefix?: string | null,
  lead?: string | null,
  usermeta?: string | null
): string | null {
  const phone = normalizePhoneNumber(prefix, lead);
  if (phone) {
    return `https://wa.me/${phone}`;
  }

  const meta = normalizeUsermeta(usermeta);
  return meta ? `https://web.whatsapp.com/search?q=${encodeURIComponent(`@${meta}`)}` : null;
}
