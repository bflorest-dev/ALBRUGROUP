import React from 'react';
import '../../../styles/atoms.css'; // ensure utilities available
import './DataTable.css';

export type DataTableColumn<T> = {
  header: string;
  accessor: (row: T) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
};

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowClassName?: string;
  className?: string;
}

export const DataTable = <T extends unknown>({ columns, data, rowClassName = '', className = '' }: DataTableProps<T>) => {
  return (
    <div className={`table-wrapper ${className}`}> 
      <table className="table-custom">
        <thead>
          <tr className="table-header-row">
            {columns.map((col, idx) => (
              <th key={idx} className={col.headerClassName || 'table-header-cell'}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ridx) => (
            <tr key={ridx} className={rowClassName}>
              {columns.map((col, cidx) => (
                <td key={cidx} className={col.cellClassName || 'table-cell'}>{col.accessor(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
