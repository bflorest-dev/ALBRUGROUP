/**
 * @molecule FormCrearPostulacion — Formulario para crear/editar postulación
 * Integra SelectInput, FormInput, Button, Spinner
 * FSD: caracteristicas/rrhh/postulaciones/ui
 */

import React, { useState } from 'react';
import { FormInput, SelectInput, Button } from '@shared/ui';
import { Origen, TipoDocumento } from '@shared/types/backendEnums/rrhh';
import { useOfertasActivas } from '@features/hr/job-offers';
import {
  useCrearPostulacion,
  useActualizarPostulacion,
} from '../hooks';
import type {
  CrearPostulacionRequest,
  PostulacionResponse,
  PostulanteInput,
  OfertaLaboralSimple,
} from '../model';

interface FormCrearPostulacionProps {
  onSuccess: (postulacion: PostulacionResponse) => void;
  onCancel: () => void;
  ofertasDisponibles?: OfertaLaboralSimple[];
  postulacionExistente?: PostulacionResponse;
}

interface FormState {
  idOfertaLaboral: string;
  origen: string;
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  documento: string;
  celular: string;
  fechaNacimiento: string;
}

interface FormErrors {
  [key: string]: string;
}

const INITIAL_FORM_STATE: FormState = {
  idOfertaLaboral: '',
  origen: '',
  nombres: '',
  apellidos: '',
  tipoDocumento: '',
  documento: '',
  celular: '',
  fechaNacimiento: '',
};

function toFormState(postulacionExistente?: PostulacionResponse): FormState {
  if (!postulacionExistente) {
    return INITIAL_FORM_STATE;
  }

  return {
    idOfertaLaboral: postulacionExistente.idOfertaLaboral.toString(),
    origen: postulacionExistente.origen,
    nombres: postulacionExistente.postulante.nombres,
    apellidos: postulacionExistente.postulante.apellidos,
    tipoDocumento: postulacionExistente.postulante.tipoDocumento,
    documento: postulacionExistente.postulante.documento,
    celular: postulacionExistente.postulante.celular,
    fechaNacimiento: postulacionExistente.postulante.fechaNacimiento,
  };
}

/**
 * Validar que el campo celular tenga solo números y mín 9 dígitos
 */
function validateCelular(celular: string): string | undefined {
  const cleaned = celular.replace(/\D/g, '');
  if (cleaned.length < 9) {
    return 'El celular debe tener al menos 9 dígitos';
  }
  return undefined;
}

/**
 * Validar documento
 */
function validateDocumento(documento: string): string | undefined {
  if (documento.length < 8) {
    return 'El documento debe tener al menos 8 caracteres';
  }
  return undefined;
}

export const FormCrearPostulacion: React.FC<FormCrearPostulacionProps> = ({
  onSuccess,
  onCancel,
  ofertasDisponibles,
  postulacionExistente,
}) => {
  const [formState, setFormState] = useState<FormState>(() => toFormState(postulacionExistente));
  const [errors, setErrors] = useState<FormErrors>({});
  const {
    data: ofertasActivas,
    isLoading: ofertasLoading,
    error: ofertasError,
  } = useOfertasActivas();

  // Hooks de API
  const crearHook = useCrearPostulacion();
  const actualizarHook = useActualizarPostulacion();

  // Opciones de selectores
  const origenOptions = Object.entries(Origen).map(([key, value]) => ({
    label: key.replace(/_/g, ' '),
    value,
  }));

  const tipoDocOptions = Object.entries(TipoDocumento).map(([key, value]) => ({
    label: key,
    value,
  }));

  const ofertasCargadas =
    ofertasActivas && ofertasActivas.length > 0
      ? ofertasActivas.map((oferta) => ({
          id: oferta.id,
          codigo: oferta.codigo,
          titulo: oferta.puestoObjetivo,
        }))
      : ofertasDisponibles || [];

  const ofertasOptions = ofertasCargadas.map((o) => ({
    label: `${o.codigo}${o.titulo ? ` - ${o.titulo}` : ''}`,
    value: o.id.toString(),
  }));

  // Manejadores
  const handleChange = (field: keyof FormState) => (value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validar antes de submit
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formState.idOfertaLaboral)
      newErrors.idOfertaLaboral = 'Selecciona una oferta laboral';
    if (!formState.origen) newErrors.origen = 'Selecciona un origen';
    if (!formState.nombres)
      newErrors.nombres = 'El nombre es requerido';
    if (!formState.apellidos)
      newErrors.apellidos = 'El apellido es requerido';
    if (!formState.tipoDocumento)
      newErrors.tipoDocumento = 'Selecciona un tipo de documento';
    if (!formState.documento) newErrors.documento = 'El documento es requerido';
    else {
      const docError = validateDocumento(formState.documento);
      if (docError) newErrors.documento = docError;
    }
    if (!formState.celular) newErrors.celular = 'El celular es requerido';
    else {
      const celError = validateCelular(formState.celular);
      if (celError) newErrors.celular = celError;
    }
    if (!formState.fechaNacimiento)
      newErrors.fechaNacimiento = 'La fecha de nacimiento es requerida';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const postulante: PostulanteInput = {
      nombres: formState.nombres,
      apellidos: formState.apellidos,
      tipoDocumento: formState.tipoDocumento,
      documento: formState.documento,
      celular: formState.celular,
      fechaNacimiento: formState.fechaNacimiento,
    };

    const body: CrearPostulacionRequest = {
      idOfertaLaboral: parseInt(formState.idOfertaLaboral, 10),
      origen: formState.origen,
      postulante,
    };

    try {
      if (postulacionExistente) {
        // Modo edición
        const result = await actualizarHook.execute(postulacionExistente.id, body);
        onSuccess(result);
      } else {
        // Modo crear
        const result = await crearHook.execute(body);
        onSuccess(result);
      }
    } catch (err) {
      console.error('Error al guardar postulación:', err);
    }
  };

  const isLoading = crearHook.loading || actualizarHook.loading;
  const apiError = crearHook.error || actualizarHook.error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {apiError && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
          {apiError}
        </div>
      )}

      <div className="space-y-2">
        <SelectInput
          label="Oferta Laboral"
          name="idOfertaLaboral"
          value={formState.idOfertaLaboral}
          onChange={handleChange('idOfertaLaboral')}
          options={ofertasOptions}
          error={errors.idOfertaLaboral}
          required
          placeholder={
            ofertasLoading
              ? 'Cargando ofertas activas...'
              : 'Selecciona una oferta'
          }
          disabled={isLoading || ofertasLoading}
        />
        {ofertasError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            No se pudieron cargar las ofertas activas: {ofertasError}
          </p>
        )}
      </div>

      <SelectInput
        label="Origen"
        name="origen"
        value={formState.origen}
        onChange={handleChange('origen')}
        options={origenOptions}
        error={errors.origen}
        required
        placeholder="Selecciona el origen"
        disabled={isLoading}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="Nombres"
          name="nombres"
          value={formState.nombres}
          onChange={handleChange('nombres')}
          error={errors.nombres}
          required
          disabled={isLoading}
        />
        <FormInput
          label="Apellidos"
          name="apellidos"
          value={formState.apellidos}
          onChange={handleChange('apellidos')}
          error={errors.apellidos}
          required
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SelectInput
          label="Tipo de Documento"
          name="tipoDocumento"
          value={formState.tipoDocumento}
          onChange={handleChange('tipoDocumento')}
          options={tipoDocOptions}
          error={errors.tipoDocumento}
          required
          placeholder="Selecciona tipo"
          disabled={isLoading}
        />
        <FormInput
          label="Documento"
          name="documento"
          value={formState.documento}
          onChange={handleChange('documento')}
          error={errors.documento}
          required
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="Celular"
          name="celular"
          type="tel"
          value={formState.celular}
          onChange={handleChange('celular')}
          error={errors.celular}
          required
          disabled={isLoading}
        />
        <FormInput
          label="Fecha de Nacimiento"
          name="fechaNacimiento"
          type="date"
          value={formState.fechaNacimiento}
          onChange={handleChange('fechaNacimiento')}
          error={errors.fechaNacimiento}
          required
          disabled={isLoading}
        />
      </div>

      {/* Botones */}
      <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full min-w-[180px] rounded-input border border-black bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed sm:w-auto"
          aria-label={postulacionExistente ? 'Actualizar postulación' : 'Crear postulación'}
        >
          {isLoading ? 'Guardando...' : postulacionExistente ? 'Actualizar' : 'Crear'} Postulación
        </button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
};
