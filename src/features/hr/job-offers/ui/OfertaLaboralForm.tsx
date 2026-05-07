'use client';

/**
 * OfertaLaboralForm Component
 * Formulario para crear nuevas ofertas laborales
 * FSD Layer: features > ui (presentational component)
 */

import React, { useState } from 'react';
import type { CreateOfertaLaboralRequest, OfertaLaboralResponse } from '@shared/types';
import { FlatpickrDateInput } from '@shared/ui/date-picker';
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
    <div className="space-y-2">
      <label className="block text-[0.95rem] font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
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
    <div className="mb-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
      <p className="font-semibold">Oferta creada exitosamente</p>
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
    <div className="mb-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
      <p className="font-semibold">Error al crear oferta</p>
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
    setValue,
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
        modalidad: data.modalidad,
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

  const controlClassName =
    'w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-[15px] text-slate-800 outline-none transition-all duration-150 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60';

  const selectClassName = `${controlClassName} pr-10`;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`w-full ${isModal ? 'space-y-4' : 'max-w-2xl mx-auto rounded-xl bg-white p-6 shadow space-y-4'} ${className}`}
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
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            {...register('codigo')}
            placeholder="OF-202501-00001"
            className={controlClassName}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={regenerateCodigo}
            disabled={isLoading}
            className="min-w-[128px] rounded-xl border border-slate-300 bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors duration-150 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Regenerar
          </button>
        </div>
        <p className="text-xs text-slate-500">Auto-generado, pero puedes editarlo</p>
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">

      {/* NEGOCIO */}
      <FormField
        label="Negocio"
        error={formStateHook.errors.negocio?.message as string | undefined}
        required
      >
        <select
          {...register('negocio')}
          className={selectClassName}
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
          className={selectClassName}
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
          className={selectClassName}
          disabled={isLoading}
        >
          <option value="">Selecciona un horario</option>
          <option value="MORNING">Mañana</option>
          <option value="AFTERNOON">Tarde</option>
        </select>
      </FormField>

      {/* MODALIDAD */}
      <FormField
        label="Modalidad"
        error={formStateHook.errors.modalidad?.message as string | undefined}
        required
      >
        <select
          {...register('modalidad')}
          className={selectClassName}
          disabled={isLoading}
        >
          <option value="">Selecciona una modalidad</option>
          <option value="PART_TIME">Part-Time</option>
          <option value="FULL_TIME">Full-Time</option>
          <option value="SEMI_FULL">Semi Full</option>
          <option value="SUPER_FULL">Super Full</option>
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
          className={controlClassName}
          disabled={isLoading}
        />
      </FormField>
      </div>

      {/* PLAZO INICIAL */}
      <FormField
        label="Plazo Inicial (Fecha)"
        error={formStateHook.errors.plazoInicial?.message as string | undefined}
        required
      >
        <FlatpickrDateInput
          value={watch('plazoInicial') || ''}
          onChange={(value) => {
            setValue('plazoInicial', value, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });
          }}
          inputClassName={controlClassName}
          disabled={isLoading}
          required
          hasError={Boolean(formStateHook.errors.plazoInicial)}
          showRequiredMessage={false}
        />
      </FormField>

      {/* BOTONES */}
      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="submit"
          disabled={isLoading || formState === 'success'}
          className="min-w-[180px] rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isLoading ? 'Creando...' : 'Crear Oferta'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isLoading}
          className="min-w-[180px] rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-blue-600 transition-colors duration-150 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
