import React, { ReactNode } from 'react';
import { DsDataTable, type DsDataTableColumn } from './design-system';

interface TableColumn<T> {
  key: keyof T;
  label: string;
  render?: (value: any, item: T) => ReactNode;
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  actions?: Array<{
    label: string;
    onClick: (item: T) => void;
    danger?: boolean;
  }>;
}

/**
 * Componente de tabla genérico reutilizable
 * Acepta datos y columnas configurables
 */
export const Table = <T extends { id: number | string }>({
  data,
  columns,
  loading = false,
  onRowClick,
  actions,
}: TableProps<T>) => {
  const dsColumns: DsDataTableColumn<T>[] = columns.map((col) => ({
    key: String(col.key),
    label: col.label,
    render: (item) => (col.render ? col.render(item[col.key], item) : String(item[col.key] ?? '-')),
  }));

  const dsActions = actions?.map((action) => ({
    label: action.label,
    variant: action.danger ? ('danger' as const) : ('primary' as const),
    onClick: action.onClick,
  }));

  return (
    <DsDataTable
      rows={data}
      columns={dsColumns}
      loading={loading}
      onRowClick={onRowClick}
      actions={dsActions}
      emptyMessage="No hay datos"
      rowKey={(item) => item.id}
    />
  );
};
