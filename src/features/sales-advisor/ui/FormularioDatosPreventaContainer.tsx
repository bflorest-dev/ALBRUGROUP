import React, { FormEvent, useState } from 'react';
import { FormularioDatosPreventa } from './FormularioDatosPreventa';
import { useActualizarDatosPreventaMutation } from '../hooks';
import type { UpdatePreventaPayload } from '@shared/types';

interface FormularioDatosPreventaContainerProps {
  idLead: number;
  onSuccess: () => void;
}

/**
 * Container para FormularioDatosPreventa que maneja la lógica
 */
export const FormularioDatosPreventaContainer: React.FC<FormularioDatosPreventaContainerProps> = ({
  idLead,
  onSuccess,
}) => {
  const [values, setValues] = useState<UpdatePreventaPayload>({
    nombres: '',
    apellidos: '',
    tipoDocumento: '',
    numeroDocumento: '',
    celular: '',
    email: '',
  });

  const { mutate, isPending } = useActualizarDatosPreventaMutation();

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    mutate(
      { idLead, payload: values },
      {
        onSuccess: () => {
          alert('Datos de preventa actualizados exitosamente');
          onSuccess();
        },
        onError: (error: Error) => {
          alert(`Error al actualizar datos: ${error.message}`);
        },
      }
    );
  };

  return (
    <FormularioDatosPreventa
      values={values}
      onChange={handleChange}
      onSubmit={handleSubmit}
      loading={isPending}
    />
  );
};
