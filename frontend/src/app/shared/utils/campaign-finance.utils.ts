import {
  CampanaGastoCampanaResumenResponse,
  CampanaGastoResponse,
  CampanaGastoResumenDiarioResponse,
  CampanaGastoResumenMensualResponse,
  CampanaGastoResumenPeriodoResponse
} from '../../features/community/services/community-lead.service';

const FINANCE_MONEY_FORMATTER = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const FINANCE_PERCENT_FORMATTER = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export type FinanceMetricCard = {
  label: string;
  value: string;
  tone: 'blue' | 'green' | 'amber' | 'violet' | 'slate';
};

export type FinanceRow = CampanaGastoCampanaResumenResponse & {
  ultimoRegistroAt?: string | null;
  costoPorPreventa: string;
  costoPorVenta: string;
  costoPorLead: string;
  costoPorLeadReal: string;
  conversionPreventas: string;
  conversionVentas: string;
  conversionPreventasReales: string;
  conversionVentasReales: string;
  conversionLeads: string;
  conversionLeadsReales: string;
};

export type SnapshotFinanceRow = FinanceRow & {
  id?: number;
  reportedAt?: string | null;
  deltaLeads: number | null;
  deltaLeadsReales: number | null;
};

export function buildFinanceCards(
  summary:
    | CampanaGastoResumenDiarioResponse
    | CampanaGastoResumenMensualResponse
    | CampanaGastoResumenPeriodoResponse
    | null
): FinanceMetricCard[] {
  return [
    { label: 'Leads reportados', value: String(summary?.leadsReportados ?? 0), tone: 'blue' },
    { label: 'Leads reales', value: String(summary?.leadsReales ?? 0), tone: 'green' },
    { label: 'Preventas', value: String(summary?.cantidadPreventas ?? 0), tone: 'violet' },
    { label: 'Ventas', value: String(summary?.cantidadVentas ?? 0), tone: 'violet' },
    { label: 'Costo total', value: formatFinanceMoney(summary?.costoTotal ?? 0), tone: 'amber' },
    { label: 'Ultimo reporte', value: formatFinanceDateTime(summary?.ultimoReportedAt), tone: 'slate' }
  ];
}

export function toFinanceRow(row: CampanaGastoCampanaResumenResponse | CampanaGastoResponse): FinanceRow {
  const leads = 'leadsReportados' in row ? row.leadsReportados : 0;
  const preventas = row.cantidadPreventas;
  const ventas = row.cantidadVentas;
  const ultimoRegistroAt = (row as CampanaGastoResponse).reportedAt ?? (row as CampanaGastoCampanaResumenResponse).ultimoReportedAt;
  return {
    ...row,
    ultimoRegistroAt,
    costoPorPreventa: formatCostPerResult(row.costoTotal, preventas),
    costoPorVenta: formatCostPerResult(row.costoTotal, ventas),
    costoPorLead: formatCostPerResult(row.costoTotal, leads),
    costoPorLeadReal: formatCostPerResult(row.costoTotal, row.leadsReales),
    conversionPreventas: formatPercentage(preventas, leads),
    conversionVentas: formatPercentage(ventas, leads),
    conversionPreventasReales: formatPercentage(preventas, row.leadsReales),
    conversionVentasReales: formatPercentage(ventas, row.leadsReales),
    conversionLeads: formatPercentage(ventas, leads),
    conversionLeadsReales: formatPercentage(ventas, row.leadsReales)
  };
}

export function toSnapshotFinanceRows(rows: CampanaGastoResponse[]): SnapshotFinanceRow[] {
  const mappedRows = rows.map((row) => toFinanceRow(row));
  return mappedRows.map((row, index) => ({
    ...row,
    deltaLeads: index === 0 ? null : row.leadsReportados - (mappedRows[index - 1]?.leadsReportados ?? 0),
    deltaLeadsReales: index === 0 ? null : row.leadsReales - (mappedRows[index - 1]?.leadsReales ?? 0)
  }));
}

export function formatFinanceMoney(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return '-';
  }

  return `S/ ${FINANCE_MONEY_FORMATTER.format(amount)}`;
}

export function formatFinanceDateTime(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function formatFinanceDisplay(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return String(value);
}

export function financeDeltaBadge(value: number | null | undefined): string | null {
  if (value === null || value === undefined || value === 0) {
    return null;
  }

  return value > 0 ? `+${value}` : `${value}`;
}

export function financeCurrentMonthValue(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
}

export function financeCurrentDateValue(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function financeCurrentDateTimeValue(): string {
  const now = new Date();
  const date = financeCurrentDateValue();
  const hours = `${now.getHours()}`.padStart(2, '0');
  const minutes = `${now.getMinutes()}`.padStart(2, '0');
  return `${date}T${hours}:${minutes}`;
}

export function financeMonthYear(value: string): number {
  return Number(value.slice(0, 4)) || new Date().getFullYear();
}

export function financeMonthMonth(value: string): number {
  return Number(value.slice(5, 7)) || new Date().getMonth() + 1;
}

function formatCostPerResult(costoTotal: number | null | undefined, denominator: number | null | undefined): string {
  if (!denominator || denominator <= 0) {
    return '-';
  }

  return formatFinanceMoney((costoTotal ?? 0) / denominator);
}

function formatPercentage(numerator: number | null | undefined, denominator: number | null | undefined): string {
  if (!denominator || denominator <= 0) {
    return '-';
  }

  const value = ((numerator ?? 0) / denominator) * 100;
  return `${FINANCE_PERCENT_FORMATTER.format(value)}%`;
}
