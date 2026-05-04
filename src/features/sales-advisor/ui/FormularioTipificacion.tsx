import React, { FormEvent } from 'react';
import { Form } from '@shared/ui/Form';
import type { TipificacionResponse, TipificarLeadPayload } from '@shared/types';

interface Props {
  tipificaciones: TipificacionResponse[];
  values: TipificarLeadPayload;
  onChange: (name: string, value: string) => void;
  onSubmit: (e: FormEvent) => void;
  loading: boolean;
}

export const FormularioTipificacion: React.FC<Props> = ({
  tipificaciones,
  values,
  onChange,
  onSubmit,
  loading,
}) => {
  return (
    <div className="card">
      <div className="card-header">
        <h5>Tipificación (Cierre)</h5>
      </div>
      <div className="card-body">
        <Form
          fields={[
            {
              name: 'codigoTipificacion',
              label: 'Tipificación',
              type: 'select',
              required: true,
              options: tipificaciones.map((t) => ({
                value: t.codigo,
                label: t.descripcion,
              })),
            },
          ]}
          values={values as unknown as Record<string, unknown>}
          onChange={(name, value) => onChange(name, String(value))}
          onSubmit={onSubmit}
          loading={loading}
          submitLabel="Tipificar Lead"
        />
      </div>
    </div>
  );
};
