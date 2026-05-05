import React from 'react';
import { Form } from '@shared/ui/Form';
import type { PlanResponse } from '@shared/types';

interface Props {
  planes: PlanResponse[];
  values: { idPlan: string; idPromocion: string };
  onChange: (name: string, value: string) => void;
  loading: boolean;
}

export const FormularioOfertaComercial: React.FC<Props> = ({
  planes,
  values,
  onChange,
  loading,
}) => {
  return (
    <div className="card">
      <div className="card-header">
        <h5>Oferta Comercial</h5>
      </div>
      <div className="card-body">
        <Form
          fields={[
            {
              name: 'idPlan',
              label: 'Plan',
              type: 'select',
              required: true,
              options: planes.map((p) => ({ value: String(p.id), label: p.nombre })),
            },
          ]}
          values={values}
          onChange={onChange}
          onSubmit={(e) => e.preventDefault()}
          loading={loading}
          submitLabel="Guardar Oferta"
        />
      </div>
    </div>
  );
};
