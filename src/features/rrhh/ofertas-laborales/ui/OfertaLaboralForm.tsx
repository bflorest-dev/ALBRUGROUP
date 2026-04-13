'use client';

/**
 * OfertaLaboralForm Component
 * Formulario para crear nuevas ofertas laborales
 * FSD Layer: features > ui (presentational component)
 */

import React, { useState } from 'react';
import type { CreateOfertaLaboralRequest, OfertaLaboralResponse } from '@shared/types';
import {
  useOfertaLaboralForm,
  type OfertaLaboralFormData,
} from '../model/useOfertaLaboralForm';
import { useCrearOfertaLaboral } from '../model/useOfertasActivas';

// ============================================================================
// TIPOS
// ============================================================================

export interface OfertaLaboralFormProps {
  onSuccess?: (id: number) => void;
  onCancel?: () => void;
  className?: string;
  isModal?: boolean;
}

type FormState = 'idle' | 'loading' | 'success' | 'error';

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

/**
 * Wrapper para field label + input + error
 */
function FormField({
  label,
  error,
  children,
  required = false,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

/**
 * Alert de éxito
 */
function SuccessAlert({
  id,
  onClose,
}: {
  id: number;
  onClose: () => void;
}) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
      <p className="font-semibold">✓ Oferta creada exitosamente</p>
      <p className="text-sm">ID: {id}</p>
    </div>
  );
}

/**
 * Alert de error
 */
function ErrorAlert({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
      <p className="font-semibold">✗ Error al crear oferta</p>
      <p className="text-sm">{message}</p>
      <button
        onClick={onClose}
        className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
      >
        Cerrar
      </button>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function OfertaLaboralForm({
  onSuccess,
  onCancel,
  className = '',
  isModal = false,
}: OfertaLaboralFormProps) {
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [createdId, setCreatedId] = useState<number | null>(null);

  const form = useOfertaLaboralForm();
  const crearOfertaMutation = useCrearOfertaLaboral();
  const {
    register,
    handleSubmit,
    formState: formStateHook,
    watch,
    isLoading,
    regenerateCodigo,
    reset,
  } = form;

  /**
   * Manejador de envío del formulario
   */
  const normalizeFecha = (dateValue: string): string => {
    const ddmmyyyy = /^\s*(\d{2})-(\d{2})-(\d{4})\s*$/;
    const match = dateValue.match(ddmmyyyy);
    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month}-${day}`;
    }
    return dateValue;
  };

  const onSubmit = async (data: OfertaLaboralFormData) => {
    try {
      setFormState('loading');
      setErrorMessage('');

      // Preparar datos para API
      const payload: CreateOfertaLaboralRequest = {
        codigo: data.codigo,
        negocio: data.negocio,
        puestoObjetivo: data.puestoObjetivo,
        horario: data.horario,
        cantidadInicial: data.cantidadInicial,
        plazoInicial: normalizeFecha(data.plazoInicial),
      };

      // Llamar API
      const response: OfertaLaboralResponse = await crearOfertaMutation.mutateAsync(payload);

      // Éxito
      setCreatedId(response.id);
      setFormState('success');
      reset();
      regenerateCodigo();

      // Callback opcional
      if (onSuccess) {
        setTimeout(() => onSuccess(response.id), 1000);
      }

      // Cerrar modal si viene callback
      if (onCancel) {
        setTimeout(onCancel, 1500);
      }
    } catch (error) {
      // Error
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      setErrorMessage(errorMsg);
      setFormState('error');
    } finally {
      // No volver a 'idle' para mantener visual de error/éxito
    }
  };

  /**
   * Manejar cierre de alert de éxito
   */
  const handleSuccessClose = () => {
    if (onCancel) onCancel();
  };

  /**
   * Manejar cierre de alert de error
   */
  const handleErrorClose = () => {
    setFormState('idle');
    setErrorMessage('');
  };

  /**
   * Manejar cancelación
   */
  const handleCancel = () => {
    form.reset();
    if (onCancel) onCancel();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`w-full ${isModal ? '' : 'max-w-2xl mx-auto p-6'} bg-white rounded ${isModal ? '' : 'shadow'} ${className}`}
    >
      {!isModal && <h2 className="text-2xl font-bold mb-6 text-gray-800">Nueva Oferta Laboral</h2>}

      {/* Alert de éxito */}
      {formState === 'success' && createdId && (
        <SuccessAlert id={createdId} onClose={handleSuccessClose} />
      )}

      {/* Alert de error */}
      {formState === 'error' && (
        <ErrorAlert message={errorMessage} onClose={handleErrorClose} />
      )}

      {/* CÓDIGO (auto-generado, pero editable) */}
      <FormField
        label="Código de Oferta"
        error={formStateHook.errors.codigo?.message as string | undefined}
        required
      >
        <div className="flex gap-2">
          <input
            type="text"
            {...register('codigo')}
            placeholder="OF-202501-00001"
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={regenerateCodigo}
            disabled={isLoading}
            className="px-3 py-2 bg-gray-100 border border-gray-300 rounded text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Regenerar
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">Auto-generado, pero puedes editarlo</p>
      </FormField>

      {/* NEGOCIO */}
      <FormField
        label="Negocio"
        error={formStateHook.errors.negocio?.message as string | undefined}
        required
      >
        <select
          {...register('negocio')}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          <option value="">Selecciona un negocio</option>
          <option value="FIBRA_MIXTO">Fibra Mixta</option>
          <option value="CLARO">Claro</option>
        </select>
      </FormField>

      {/* PUESTO OBJETIVO */}
      <FormField
        label="Puesto Objetivo"
        error={formStateHook.errors.puestoObjetivo?.message as string | undefined}
        required
      >
        <select
          {...register('puestoObjetivo')}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          <option value="">Selecciona un puesto</option>
          <option value="RRHH">RRHH</option>
          <option value="RECLUTADOR">Reclutador</option>
          <option value="CAPACITADOR">Capacitador</option>
          <option value="DESARROLLADOR">Desarrollador</option>
          <option value="CONTADOR">Contador</option>
          <option value="COMMUNITY">Community</option>
          <option value="MONITOR">Monitor</option>
          <option value="SUPERVISOR_VENTAS">Supervisor de Ventas</option>
          <option value="ASESOR_VENTAS">Asesor de Ventas</option>
          <option value="SUPERVISOR_BACKOFFICE">Supervisor Backoffice</option>
          <option value="ASESOR_BACKOFFICE">Asesor Backoffice</option>
          <option value="SUPERVISOR_GTR">Supervisor GTR</option>
          <option value="ASESOR_GTR">Asesor GTR</option>
          <option value="SUPERVISOR_POSTVENTA">Supervisor Postventa</option>
          <option value="ASESOR_POSTVENTA">Asesor Postventa</option>
        </select>
      </FormField>

      {/* HORARIO */}
      <FormField
        label="Horario"
        error={formStateHook.errors.horario?.message as string | undefined}
        required
      >
        <select
          {...register('horario')}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          <option value="">Selecciona un horario</option>
          <option value="MORNING">Mañana</option>
          <option value="AFTERNOON">Tarde</option>
        </select>
      </FormField>

      {/* CANTIDAD INICIAL */}
      <FormField
        label="Cantidad Inicial de Puestos"
        error={formStateHook.errors.cantidadInicial?.message as string | undefined}
        required
      >
        <input
          type="number"
          {...register('cantidadInicial', { valueAsNumber: true })}
          placeholder="1"
          min="1"
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </FormField>

      {/* PLAZO INICIAL */}
      <FormField
        label="Plazo Inicial (Fecha)"
        error={formStateHook.errors.plazoInicial?.message as string | undefined}
        required
      >
        <input
          type="date"
          {...register('plazoInicial')}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </FormField>

      {/* BOTONES */}
      <div className="flex gap-4 mt-8">
        <button
          type="submit"
          disabled={isLoading || formState === 'success'}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
        >
          {isLoading ? 'Creando...' : 'Crear Oferta'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:cursor-not-allowed font-semibold"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
