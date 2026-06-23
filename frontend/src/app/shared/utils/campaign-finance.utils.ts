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
  costoPorLead: string;
  costoPorLeadReal: string;
  costoPorVenta: string;
  conversionLeads: string;
  conversionLeadsReales: string;
};

export type SnapshotFinanceRow = FinanceRow & {
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
    { label: 'Leads', value: String(summary?.leads ?? 0), tone: 'blue' },
    { label: 'Leads reales', value: String(summary?.leadsReales ?? 0), tone: 'green' },
    { label: 'Ventas cerradas', value: String(summary?.ventasCerradas ?? 0), tone: 'violet' },
    { label: 'Costo total', value: formatFinanceMoney(summary?.costoTotal ?? 0), tone: 'amber' },
    { label: 'Ultimo registro', value: formatFinanceDateTime(summary?.ultimoRegistroAt), tone: 'slate' }
  ];
}

export function toFinanceRow(row: CampanaGastoCampanaResumenResponse | CampanaGastoResponse): FinanceRow {
  const ultimoRegistroAt = (row as CampanaGastoResponse).createdAt ?? (row as CampanaGastoCampanaResumenResponse).ultimoRegistroAt;
  return {
    ...row,
    ultimoRegistroAt,
    costoPorLead: formatCostPerResult(row.costoTotal, row.leads),
    costoPorLeadReal: formatCostPerResult(row.costoTotal, row.leadsReales),
    costoPorVenta: formatCostPerResult(row.costoTotal, row.ventasCerradas),
    conversionLeads: formatPercentage(row.ventasCerradas, row.leads),
    conversionLeadsReales: formatPercentage(row.ventasCerradas, row.leadsReales)
  };
}

export function toSnapshotFinanceRows(rows: CampanaGastoResponse[]): SnapshotFinanceRow[] {
  const mappedRows = rows.map((row) => toFinanceRow(row));
  return mappedRows.map((row, index) => ({
    ...row,
    deltaLeads: index === 0 ? null : row.leads - (mappedRows[index - 1]?.leads ?? 0),
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
