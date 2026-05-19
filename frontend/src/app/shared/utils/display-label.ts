const LABEL_OVERRIDES: Record<string, string> = {
  RRHH: 'RRHH',
  ASESOR_VENTAS: 'Asesor de Ventas',
  SUPERVISOR_VENTAS: 'Supervisor de Ventas',
  ASESOR_BACKOFFICE: 'Backoffice',
  SUPERVISOR_BACKOFFICE: 'Supervisor Backoffice',
  ASESOR_GTR: 'GTR',
  SUPERVISOR_GTR: 'Supervisor GTR',
  ASESOR_POSTVENTA: 'Postventa',
  SUPERVISOR_POSTVENTA: 'Supervisor Postventa',
  ONP: 'ONP',
  AFP: 'AFP',
  AFP_INTEGRA: 'AFP Integra',
  AFP_PROFUTURO: 'AFP Profuturo',
  AFP_HABITAT: 'AFP Habitat',
  PRIMA_AFP: 'Prima AFP'
};

export function formatLabel(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  const normalized = value.toUpperCase();
  const override = LABEL_OVERRIDES[normalized];
  if (override) {
    return override;
  }

  return normalized
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
