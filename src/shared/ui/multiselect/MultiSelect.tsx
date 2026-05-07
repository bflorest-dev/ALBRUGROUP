/**
 * @file MultiSelect.tsx
 * @description Componente MultiSelect reutilizable
 * @layer shared/ui
 */

import React from 'react';

export interface MultiSelectOption {
  id: string;
  label: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  placeholder?: string;
  loading?: boolean;
  error?: string;
  required?: boolean;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedIds,
  onChange,
  placeholder = 'Selecciona opciones...',
  loading = false,
  error = '',
  required = false,
}) => {
  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          border: error ? '2px solid #dc3545' : '1px solid #ccc',
          borderRadius: 4,
          padding: 8,
          minHeight: 100,
          maxHeight: 200,
          overflowY: 'auto',
          background: loading ? '#f9f9f9' : '#fff',
        }}
      >
        {loading ? (
          <p style={{ margin: 0, color: '#666' }}>Cargando...</p>
        ) : options.length === 0 ? (
          <p style={{ margin: 0, color: '#999' }}>No hay opciones disponibles</p>
        ) : (
          <div>
            {options.map((option) => (
              <label key={option.id} style={{ display: 'block', marginBottom: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(option.id)}
                  onChange={() => toggleSelection(option.id)}
                  style={{ marginRight: 8 }}
                />
                {option.label}
              </label>
            ))}
          </div>
        )}
      </div>
      {error && <p style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: 4 }}>{error}</p>}
      {required && selectedIds.length === 0 && (
        <p style={{ color: '#856404', fontSize: '0.875rem', marginTop: 4 }}>Selecciona al menos uno</p>
      )}
    </div>
  );
};
