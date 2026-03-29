import React, { ReactNode } from 'react';

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
  if (loading) {
    return <div className="table-loading">Cargando...</div>;
  }

  return (
    <table className="table table-striped table-hover">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={String(col.key)}>{col.label}</th>
          ))}
          {actions && <th>Acciones</th>}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center">
              No hay datos
            </td>
          </tr>
        ) : (
          data.map((item) => (
            <tr
              key={item.id}
              onClick={() => onRowClick?.(item)}
              style={{ cursor: onRowClick ? 'pointer' : undefined }}
            >
              {columns.map((col) => (
                <td key={String(col.key)}>
                  {col.render ? col.render(item[col.key], item) : String(item[col.key])}
                </td>
              ))}
              {actions && (
                <td>
                  {actions.map((action, idx) => (
                    <button
                      key={idx}
                      className={`btn btn-sm ${action.danger ? 'btn-danger' : 'btn-primary'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick(item);
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </td>
              )}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};
