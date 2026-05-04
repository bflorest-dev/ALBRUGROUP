import React, { FormEvent, useState } from 'react';
import { FormularioTipificacion } from './FormularioTipificacion';
import { useTipificarLeadMutation } from '../hooks';
import { useCatalogoTipificacion } from '@features/sales-advisor/hooks/useAsesorVentasQueries';
import type { TipificarLeadPayload } from '@shared/types';

interface FormularioTipificacionContainerProps {
  idLead: number;
  onSuccess: () => void;
}

/**
 * Container para FormularioTipificacion que maneja la lógica
 */
export const FormularioTipificacionContainer: React.FC<FormularioTipificacionContainerProps> = ({
  idLead,
  onSuccess,
}) => {
  const [values, setValues] = useState<TipificarLeadPayload>({
    codigoTipificacion: '',
  });

  const { data: catalogo, isLoading: loadingCatalogo } = useCatalogoTipificacion('TIPIFICACION');
  const { mutate, isPending } = useTipificarLeadMutation();

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!values.codigoTipificacion) {
      alert('Seleccione una tipificación');
      return;
    }

    mutate(
      { idLead, payload: values },
      {
        onSuccess: () => {
          alert('Lead tipificado exitosamente');
          onSuccess();
        },
        onError: (error: Error) => {
          alert(`Error al tipificar: ${error.message}`);
        },
      }
    );
  };

  if (loadingCatalogo) {
    return <div>Cargando catálogo...</div>;
  }

  return (
    <FormularioTipificacion
      tipificaciones={catalogo?.tipificaciones ?? []}
      values={values}
      onChange={handleChange}
      onSubmit={handleSubmit}
      loading={isPending}
    />
  );
};
