import React, { FormEvent } from 'react';
import { Form } from '@shared/ui/Form';
import type { UpdatePreventaPayload } from '@shared/types';

interface Props {
  values: UpdatePreventaPayload;
  onChange: (name: string, value: string) => void;
  onSubmit: (e: FormEvent) => void;
  loading: boolean;
}

export const FormularioDatosPreventa: React.FC<Props> = ({
  values,
  onChange,
  onSubmit,
  loading,
}) => {
  return (
    <div className="card">
      <div className="card-header">
        <h5>Datos de Preventa</h5>
      </div>
      <div className="card-body">
        <Form
          fields={[
            { name: 'nombreTitular', label: 'Nombre del Titular', required: true },
            { name: 'celularRegistro', label: 'Celular de Registro', type: 'text' },
            { name: 'celularReferencia', label: 'Celular de Referencia', type: 'text' },
            { name: 'correo', label: 'Correo', type: 'email' },
          ]}
          values={values as unknown as Record<string, unknown>}
          onChange={(name, value) => onChange(name, String(value))}
          onSubmit={onSubmit}
          loading={loading}
          submitLabel="Guardar Preventa"
        />
      </div>
    </div>
  );
};