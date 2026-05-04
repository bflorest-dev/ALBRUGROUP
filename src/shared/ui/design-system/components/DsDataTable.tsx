import React from 'react';
import { dsTokens } from '../tokens';
import { cn } from './cn';
import { DsButton, type DsButtonVariant } from './DsButton';
import styles from './dsPrimitives.module.css';

export interface DsDataTableColumn<T> {
  key: keyof T | string;
  label: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  headerClassName?: string;
  cellClassName?: string;
}

export interface DsDataTableAction<T> {
  label: string;
  onClick: (row: T) => void;
  variant?: DsButtonVariant;
  isVisible?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
}

interface DsDataTableProps<T> {
  rows: T[];
  columns: Array<DsDataTableColumn<T>>;
  rowKey?: (row: T, rowIndex: number) => React.Key;
  loading?: boolean;
  emptyMessage?: string;
  actions?: Array<DsDataTableAction<T>>;
  actionsLabel?: string;
  onRowClick?: (row: T) => void;
  className?: string;
  stripedRows?: boolean;
  rowClassName?: (row: T, rowIndex: number) => string | undefined;
}

const alignClassMap = {
  left: styles.alignLeft,
  center: styles.alignCenter,
  right: styles.alignRight,
} as const;

export const DsDataTable = <T,>({
  rows,
  columns,
  rowKey,
  loading = false,
  emptyMessage = 'No hay datos para mostrar',
  actions,
  actionsLabel = 'Acciones',
  onRowClick,
  className,
  stripedRows = true,
  rowClassName,
}: DsDataTableProps<T>): React.ReactElement => {
  const normalizedRows = Array.isArray(rows) ? rows : [];

  if (!Array.isArray(rows)) {
    console.warn('[DsDataTable] Invalid rows prop, expected array but received:', rows);
  }
  const c = dsTokens.color;
  const tableVars: React.CSSProperties & Record<string, string> = {
    '--ds-table-border': c.border,
    '--ds-table-bg': c.surface,
    '--ds-table-head-bg': c.primarySoft,
    '--ds-table-head-border': c.borderSoft,
    '--ds-table-head-fg': c.textStrong,
    '--ds-table-row-border': c.borderSoft,
    '--ds-table-row-striped-bg': c.surfaceMuted,
    '--ds-table-row-hover-bg': c.primarySoft,
    '--ds-table-cell-fg': c.textDefault,
    '--ds-table-state-fg': c.textMuted,
  };

  const colSpan = columns.length + (actions && actions.length > 0 ? 1 : 0);

  return (
    <div className={cn(styles.tableWrap, className)} style={tableVars}>
      <table className={styles.table}>
        <thead className={styles.tableHead}>
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={cn(
                  styles.tableHeadCell,
                  alignClassMap[column.align ?? 'left'],
                  column.headerClassName
                )}
              >
                {column.label}
              </th>
            ))}
            {actions && actions.length > 0 ? (
              <th className={cn(styles.tableHeadCell, styles.alignLeft)}>
                {actionsLabel}
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={colSpan} className={styles.tableStateCell}>
                Cargando datos...
              </td>
            </tr>
          ) : normalizedRows.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className={styles.tableStateCell}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            normalizedRows.map((row, rowIndex) => {
              const computedKey = rowKey
                ? rowKey(row, rowIndex)
                : (((row as { id?: React.Key }).id ?? rowIndex) as React.Key);
              const visibleActions = (actions ?? []).filter((action) =>
                action.isVisible ? action.isVisible(row) : true
              );

              return (
                <tr
                  key={computedKey}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    styles.tableRow,
                    stripedRows && rowIndex % 2 === 1 ? styles.tableRowStriped : '',
                    onRowClick ? styles.tableRowClickable : '',
                    rowClassName?.(row, rowIndex)
                  )}
                >
                  {columns.map((column) => {
                    const value = (row as Record<string, unknown>)[String(column.key)];
                    const cell = column.render ? column.render(row) : String(value ?? '-');

                    return (
                      <td
                        key={String(column.key)}
                        className={cn(
                          styles.tableCell,
                          alignClassMap[column.align ?? 'left'],
                          column.cellClassName
                        )}
                      >
                        {cell}
                      </td>
                    );
                  })}

                  {actions && actions.length > 0 ? (
                    <td className={styles.tableCell}>
                      <div className={styles.actionList}>
                        {visibleActions.map((action) => (
                          <DsButton
                            key={action.label}
                            type='button'
                            size='sm'
                            variant={action.variant ?? 'secondary'}
                            onClick={(event) => {
                              event.stopPropagation();
                              action.onClick(row);
                            }}
                            disabled={action.disabled ? action.disabled(row) : false}
                          >
                            {action.label}
                          </DsButton>
                        ))}
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
