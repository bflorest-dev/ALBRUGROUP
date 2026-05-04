/**
 * @molecule FormConfirmarContratacion — Formulario para confirmar contratación
 * FSD: caracteristicas/rrhh/postulaciones/ui
 */

import React, { useState } from 'react';
import { FormInput, Button } from '@shared/ui';
import { FlatpickrDateInput } from '@shared/ui/date-picker';
import { useConfirmarContratacion, useEventosPostulacion } from '../hooks';
import type { ConfirmarContratacionRequest } from '../model';

interface FormConfirmarContratacionProps {
  idPostulacion: number;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormState {
  idEmpleadoContratado: string;
  fechaContratacion: string;
}

interface FormErrors {
  [key: string]: string;
}

const INITIAL_FORM_STATE: FormState = {
  idEmpleadoContratado: '',
  fechaContratacion: '',
};

export const FormConfirmarContratacion: React.FC<
  FormConfirmarContratacionProps
> = ({ idPostulacion, onSuccess, onCancel }) => {
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<FormErrors>({});

  const confirmarHook = useConfirmarContratacion();
  const eventosHook = useEventosPostulacion(idPostulacion);

  // Manejadores
  const handleChange = (field: keyof FormState) => (value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validar
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formState.idEmpleadoContratado) {
      newErrors.idEmpleadoContratado = 'Ingresa el ID del empleado';
    }
    if (!formState.fechaContratacion) {
      newErrors.fechaContratacion = 'Selecciona la fecha de contratación';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const body: ConfirmarContratacionRequest = {
      idEmpleadoContratado: parseInt(formState.idEmpleadoContratado, 10),
      fechaContratacion: formState.fechaContratacion,
    };

    try {
      await confirmarHook.execute(idPostulacion, body);
      onSuccess();
    } catch (err) {
      console.error('Error al confirmar contratación:', err);
    }
  };

  const isLoading = confirmarHook.loading;
  const apiError = confirmarHook.error || eventosHook.error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {apiError && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
          {apiError}
        </div>
      )}

      {Array.isArray(eventosHook.data) && eventosHook.data.length > 0 && (
        <div className="rounded-md border border-gray-200 dark:border-gray-700 p-3">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Eventos recientes
          </p>
          <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
            {eventosHook.data.slice(0, 3).map((evento) => (
              <li key={evento.id} className="flex justify-between gap-3">
                <span>{evento.descripcion}</span>
                <span>{new Date(evento.fecha).toLocaleDateString('es-PE')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <FormInput
        label="ID del Empleado Contratado"
        name="idEmpleadoContratado"
        type="number"
        value={formState.idEmpleadoContratado}
        onChange={handleChange('idEmpleadoContratado')}
        error={errors.idEmpleadoContratado}
        hint="Ingresa el ID del empleado registrado en el sistema"
        required
        disabled={isLoading}
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Fecha de Contratación
          <span className="text-red-500 ml-1">*</span>
        </label>
        <FlatpickrDateInput
          name="fechaContratacion"
          value={formState.fechaContratacion}
          onChange={handleChange('fechaContratacion')}
          required
          disabled={isLoading}
          hasError={Boolean(errors.fechaContratacion)}
          showRequiredMessage={false}
        />
        {errors.fechaContratacion && (
          <p className="text-xs text-red-600 dark:text-red-400">{errors.fechaContratacion}</p>
        )}
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
        >
          Confirmar Contratación
        </Button>
      </div>
    </form>
  );
};
