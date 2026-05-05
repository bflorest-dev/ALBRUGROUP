/**
 * @molecule FormTipificarPostulacion — Flujo de tipificación + transición + asignación
 * Paso 1: Tipificar en RECLUTAMIENTO
 * Paso 2: Confirmar avance a CAPACITACION
 * Paso 3: Asignar a grupo de capacitación
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SelectInput, Button, Spinner, ErrorState } from '@shared/ui';
import { ModalidadContacto } from '@shared/types/backendEnums/rrhh';
import {
  useAsignarPostulacionesAGrupo,
  useCatalogoTipificaciones,
  useDetallePostulacion,
  useTipificarPostulacion,
} from '../hooks';
import { obtenerGrupoCapacitacionPorId } from '../api';
import type {
  GrupoCapacitacionResponse,
  PostulacionResponse,
  TipificarPostulacionRequest,
  TipificacionCatalogo,
} from '../model';

interface FormTipificarPostulacionProps {
  idPostulacion: number;
  etapa: string;
  estadoBandejaActual?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormState {
  tipificacion: string;
  subtipificacion: string;
  modalidadContacto: string;
  observacion: string;
}

interface FormErrors {
  [key: string]: string;
}

const CREATED_GROUP_IDS_KEY = 'recruitment.created-group-ids';

const loadCreatedGroupIds = (): number[] => {
  try {
    const raw = localStorage.getItem(CREATED_GROUP_IDS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => Number(item))
      .filter((id) => Number.isFinite(id) && id > 0);
  } catch {
    return [];
  }
};

const getTodayIso = (): string => {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffset).toISOString().split('T')[0] ?? '';
};

const INITIAL_FORM_STATE: FormState = {
  tipificacion: '',
  subtipificacion: '',
  modalidadContacto: '',
  observacion: '',
};

export const FormTipificarPostulacion: React.FC<
  FormTipificarPostulacionProps
> = ({ idPostulacion, etapa, estadoBandejaActual, onSuccess, onCancel }) => {
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<FormErrors>({});
  const [stepTipificadaReclutado, setStepTipificadaReclutado] = useState(false);
  const [stepAvanzoCapacitacion, setStepAvanzoCapacitacion] = useState(false);
  const [idGrupoSeleccionado, setIdGrupoSeleccionado] = useState('');
  const [gruposDisponibles, setGruposDisponibles] = useState<GrupoCapacitacionResponse[]>([]);
  const [gruposLoading, setGruposLoading] = useState(false);
  const [asignacionMensaje, setAsignacionMensaje] = useState<string>('');
  const [asignacionErrorUi, setAsignacionErrorUi] = useState<string>('');

  // Cargar catálogo
  const catalogoHook = useCatalogoTipificaciones(etapa);
  const tipificarHook = useTipificarPostulacion();
  const detalleHook = useDetallePostulacion();
  const asignarHook = useAsignarPostulacionesAGrupo();

  // Opciones de modalidad contacto
  const modalidadOptions = [
    { label: 'LLAMADA', value: 'LLAMADA' },
    { label: 'MEET', value: 'MEET' },
    { label: 'PRESENCIAL', value: 'PRESENCIAL' },
  ];
  const catalogo = Array.isArray(catalogoHook.data) ? catalogoHook.data : [];
  const estadoBandeja = String(estadoBandejaActual ?? '').trim().toUpperCase();
  const shouldShowModalidadContacto = estadoBandeja === 'SIN_CLASIFICAR';

  const allowedTipificacionIds = useMemo(() => {
    if (estadoBandeja === 'SIN_CLASIFICAR') {
      return new Set([1, 2, 3]);
    }
    if (estadoBandeja === 'SIN_CONTACTO') {
      return new Set([2, 3]);
    }
    if (estadoBandeja === 'INTERESADO') {
      return new Set([4, 5]);
    }
    if (estadoBandeja === 'NO_INTERESADO') {
      return new Set<number>();
    }
    return null;
  }, [estadoBandeja]);

  const isTerminalNoInteresado = estadoBandeja === 'NO_INTERESADO';

  useEffect(() => {
    detalleHook.execute(idPostulacion).catch(() => undefined);
  }, [detalleHook.execute, idPostulacion]);

  const tipificacionesDisponibles = useMemo(
    () =>
      allowedTipificacionIds
        ? catalogo.filter((tip) => allowedTipificacionIds.has(Number(tip.id)))
        : catalogo,
    [catalogo, allowedTipificacionIds]
  );

  useEffect(() => {
    if (!shouldShowModalidadContacto) {
      setFormState((prev) =>
        prev.modalidadContacto ? { ...prev, modalidadContacto: '' } : prev
      );
    }
  }, [shouldShowModalidadContacto]);

  useEffect(() => {
    if (!stepTipificadaReclutado && !stepAvanzoCapacitacion) return;

    const timer = window.setTimeout(() => {
      setStepTipificadaReclutado(false);
      setStepAvanzoCapacitacion(false);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [stepTipificadaReclutado, stepAvanzoCapacitacion]);

  // Opciones de tipificación
  const tipificacionOptions = tipificacionesDisponibles.map((tip) => ({
    label: `${tip.codigo} - ${tip.descripcion}`,
    value: tip.id.toString(),
  }));

  const subtipificaciones = useMemo<TipificacionCatalogo['subtipificaciones']>(
    () => {
      if (!formState.tipificacion) return [];

      const selected = tipificacionesDisponibles.find(
        (t) => t.id.toString() === formState.tipificacion
      );

      return selected?.subtipificaciones ?? [];
    },
    [formState.tipificacion, tipificacionesDisponibles]
  );

  const selectedTipificacion = useMemo(
    () =>
      tipificacionesDisponibles.find(
        (tip) => tip.id.toString() === formState.tipificacion
      ),
    [formState.tipificacion, tipificacionesDisponibles]
  );

  const selectedSubtipificacion = useMemo(
    () =>
      subtipificaciones.find(
        (sub) => sub.id.toString() === formState.subtipificacion
      ),
    [formState.subtipificacion, subtipificaciones]
  );

  const isTipificacionReclutadoSeleccionada =
    String(selectedTipificacion?.codigo ?? '').trim().toUpperCase() === 'RECLUTADO';

  // Manejadores
  const handleChange = (field: keyof FormState) => (value: string) => {
    setFormState((prev) => {
      if (field === 'tipificacion') {
        return {
          ...prev,
          tipificacion: value,
          subtipificacion: '',
        };
      }
      return { ...prev, [field]: value };
    });
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    if (field === 'tipificacion' || field === 'subtipificacion') {
      setStepTipificadaReclutado(false);
      setStepAvanzoCapacitacion(false);
      setIdGrupoSeleccionado('');
      setAsignacionMensaje('');
      setAsignacionErrorUi('');
    }
  };

  const postulacionActual: PostulacionResponse | null =
    detalleHook.data ?? null;

  const etapaActual = String(postulacionActual?.etapaProceso ?? etapa)
    .trim()
    .toUpperCase();
  const puestoObjetivoActual = String(
    postulacionActual?.ofertaLaboral?.puestoObjetivo ?? ''
  )
    .trim()
    .toUpperCase();
  const yaTieneGrupo = Boolean(postulacionActual?.idGrupoCapacitacion);

  const shouldShowSelectorGrupoPreConfirmacion =
    isTipificacionReclutadoSeleccionada && 
    !!formState.subtipificacion &&
    puestoObjetivoActual === 'ASESOR_VENTAS'; // Solo mostrar si es ASESOR_VENTAS

  const reglasNoAsignable = useMemo(() => {
    const razones: string[] = [];

    if (etapaActual !== 'CAPACITACION') {
      razones.push('La postulación no está en etapa CAPACITACION.');
    }

    if (puestoObjetivoActual !== 'ASESOR_VENTAS') {
      razones.push('La postulación no es ASESOR_VENTAS.');
    }

    if (yaTieneGrupo) {
      razones.push('La postulación ya tiene grupo de capacitación asignado.');
    }

    return razones;
  }, [etapaActual, puestoObjetivoActual, yaTieneGrupo]);

  const canAsignarBase = reglasNoAsignable.length === 0;

  const reglasNoAsignablePreConfirmacion = useMemo(() => {
    const razones: string[] = [];

    if (puestoObjetivoActual !== 'ASESOR_VENTAS') {
      razones.push('La postulación no es ASESOR_VENTAS.');
    }

    if (yaTieneGrupo) {
      razones.push('La postulación ya tiene grupo de capacitación asignado.');
    }

    return razones;
  }, [puestoObjetivoActual, yaTieneGrupo]);

  const canAsignarPreConfirmacion = reglasNoAsignablePreConfirmacion.length === 0;

  const loadGruposDisponibles = useCallback(async () => {
    const ids = loadCreatedGroupIds();
    if (ids.length === 0) {
      setGruposDisponibles([]);
      return;
    }

    setGruposLoading(true);
    try {
      const results = await Promise.allSettled(
        ids.map((idGrupo) => obtenerGrupoCapacitacionPorId(idGrupo))
      );

      const grupos = results
        .filter(
          (
            item
          ): item is PromiseFulfilledResult<GrupoCapacitacionResponse> =>
            item.status === 'fulfilled'
        )
        .map((item) => item.value);

      setGruposDisponibles(grupos);
    } finally {
      setGruposLoading(false);
    }
  }, []);

  useEffect(() => {
    if (etapaActual === 'CAPACITACION' || shouldShowSelectorGrupoPreConfirmacion) {
      loadGruposDisponibles().catch(() => undefined);
    }
  }, [etapaActual, shouldShowSelectorGrupoPreConfirmacion, loadGruposDisponibles]);

  const gruposAsignables = useMemo(
    () =>
      gruposDisponibles.filter((grupo) => {
        const estado = String(grupo.estado ?? '')
          .trim()
          .toUpperCase();
        return estado !== 'CERRADO' && estado !== 'ANULADO';
      }),
    [gruposDisponibles]
  );

  const gruposOptions = gruposAsignables.map((grupo) => {
    const nombreGrupo = String(
      grupo.nombre ?? (grupo as { codigo?: string }).codigo ?? `Grupo #${grupo.id}`
    );
    return {
      label: `${nombreGrupo}`,
      value: grupo.id.toString(),
    };
  });

  // Validar
  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formState.tipificacion)
      newErrors.tipificacion = 'Selecciona una tipificación';
    if (!formState.subtipificacion)
      newErrors.subtipificacion = 'Selecciona una subtipificación';
    if (shouldShowModalidadContacto && !formState.modalidadContacto)
      newErrors.modalidadContacto = 'Selecciona modalidad de contacto';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isTerminalNoInteresado) {
      return;
    }

    if (!validate()) return;

    // Solo requerir grupo si es ASESOR_VENTAS
    const requiereGrupoAntesDeConfirmar =
      shouldShowSelectorGrupoPreConfirmacion && 
      canAsignarPreConfirmacion &&
      puestoObjetivoActual === 'ASESOR_VENTAS';

    if (requiereGrupoAntesDeConfirmar && !idGrupoSeleccionado) {
      setAsignacionErrorUi('Selecciona un grupo de capacitación antes de confirmar.');
      return;
    }

    setAsignacionErrorUi('');
    setAsignacionMensaje('');

    const body: TipificarPostulacionRequest = {
      idTipificacion: parseInt(formState.tipificacion, 10),
      idSubtipificacion: parseInt(formState.subtipificacion, 10),
      observacion: formState.observacion,
    };

    if (formState.modalidadContacto) {
      body.modalidadContacto = formState.modalidadContacto;
    }

    try {
      console.log('[FormTipificarPostulacion] Enviando tipificación:', { idPostulacion, body });
      
      // Usar mutateAsync para obtener el resultado
      const detalle = await tipificarHook.mutateAsync({ id: idPostulacion, body });
      
      console.log('[FormTipificarPostulacion] Tipificación exitosa:', detalle);

      const tipificadaReclutado =
        String(selectedTipificacion?.codigo ?? '')
          .trim()
          .toUpperCase() === 'RECLUTADO';
      setStepTipificadaReclutado(tipificadaReclutado);

      const subEtapaDestino = String(
        (selectedSubtipificacion as { etapaDestino?: string } | undefined)
          ?.etapaDestino ?? ''
      )
        .trim()
        .toUpperCase();

      const etapaResultante = String(detalle?.etapaProceso ?? '')
        .trim()
        .toUpperCase();

      const avanzoCapacitacion =
        subEtapaDestino === 'CAPACITACION' || etapaResultante === 'CAPACITACION';

      setStepAvanzoCapacitacion(avanzoCapacitacion);

      // Si avanzó a capacitación y requiere grupo (ASESOR_VENTAS), asignar automáticamente
      if (avanzoCapacitacion && requiereGrupoAntesDeConfirmar) {
        console.log('[FormTipificarPostulacion] ✅ Asignando a grupo:', idGrupoSeleccionado);
        
        try {
          await asignarHook.mutateAsync({
            idGrupoCapacitacion: Number(idGrupoSeleccionado),
            body: { idPostulacion, fechaAsignacion: getTodayIso() }
          });
          
          console.log('[FormTipificarPostulacion] ✅ Asignación exitosa, cerrando modal');
          setAsignacionMensaje('Postulación tipificada y asignada correctamente al grupo de capacitación.');
          
          // Esperar un momento para que el usuario vea el mensaje de éxito
          await new Promise(resolve => setTimeout(resolve, 500));
          onSuccess();
        } catch (err: any) {
          console.error('[FormTipificarPostulacion] ❌ Error al asignar grupo:', err);
          setAsignacionErrorUi(err.message || 'Error al asignar al grupo de capacitación');
        }
        return;
      }

      // Si avanzó a capacitación pero NO es ASESOR_VENTAS, cerrar modal inmediatamente
      if (avanzoCapacitacion && puestoObjetivoActual !== 'ASESOR_VENTAS') {
        console.log('[FormTipificarPostulacion] ✅ Postulación tipificada como RECLUTADO (no ASESOR_VENTAS), cerrando modal');
        await new Promise(resolve => setTimeout(resolve, 500));
        onSuccess();
        return;
      }

      // Si avanzó a capacitación y es ASESOR_VENTAS pero ya tiene grupo, cerrar modal
      if (avanzoCapacitacion && yaTieneGrupo) {
        console.log('[FormTipificarPostulacion] ✅ Postulación tipificada como RECLUTADO (ya tiene grupo), cerrando modal');
        await new Promise(resolve => setTimeout(resolve, 500));
        onSuccess();
        return;
      }

      // Si avanzó a capacitación y es ASESOR_VENTAS sin grupo, mostrar selector
      if (avanzoCapacitacion) {
        console.log('[FormTipificarPostulacion] 📍 Mostrando selector de grupo (ASESOR_VENTAS sin grupo)');
        loadGruposDisponibles();
      } else {
        // Si no avanzó a capacitación, cerrar modal
        console.log('[FormTipificarPostulacion] ✅ Tipificación completada (no RECLUTADO), cerrando modal');
        await new Promise(resolve => setTimeout(resolve, 500));
        onSuccess();
      }
    } catch (err: any) {
      console.error('[FormTipificarPostulacion] Error al tipificar:', err);
      // El error ya se muestra a través del estado del hook
    }
  };

  const handleAsignarGrupo = async () => {
    setAsignacionErrorUi('');
    setAsignacionMensaje('');

    if (!canAsignarBase) {
      setAsignacionErrorUi(reglasNoAsignable[0] ?? 'No se puede asignar esta postulación.');
      return;
    }

    if (!idGrupoSeleccionado) {
      setAsignacionErrorUi('Selecciona un grupo de capacitación.');
      return;
    }

    const idGrupo = Number(idGrupoSeleccionado);
    const grupo = gruposDisponibles.find((item) => item.id === idGrupo);
    const estadoGrupo = String(grupo?.estado ?? '')
      .trim()
      .toUpperCase();

    if (estadoGrupo === 'CERRADO' || estadoGrupo === 'ANULADO') {
      setAsignacionErrorUi('El grupo seleccionado está CERRADO o ANULADO.');
      return;
    }

    try {
      console.log('[FormTipificarPostulacion] Asignando a grupo:', idGrupo);
      
      await asignarHook.mutateAsync({
        idGrupoCapacitacion: idGrupo,
        body: { idPostulacion, fechaAsignacion: getTodayIso() }
      });
      
      console.log('[FormTipificarPostulacion] Asignación exitosa');
      setAsignacionMensaje('Postulación asignada correctamente al grupo de capacitación.');
      onSuccess();
    } catch (err: any) {
      console.error('[FormTipificarPostulacion] Error al asignar a grupo:', err);
      setAsignacionErrorUi(err.message || 'Error al asignar al grupo de capacitación');
    }
  };

  const isLoading =
    catalogoHook.loading || tipificarHook.isPending || detalleHook.loading || asignarHook.isPending;
  const error =
    catalogoHook.error || tipificarHook.error?.message || detalleHook.error || asignarHook.error?.message;
  const subtipificacionOptions = subtipificaciones.map((sub) => ({
    label: `${sub.codigo} - ${sub.descripcion}`,
    value: sub.id.toString(),
  }));

  const mostrarSeccionGrupos =
    (shouldShowSelectorGrupoPreConfirmacion || stepAvanzoCapacitacion || etapaActual === 'CAPACITACION') &&
    puestoObjetivoActual === 'ASESOR_VENTAS'; // Solo mostrar si es ASESOR_VENTAS
  const flujoPreConfirmacionActivo = shouldShowSelectorGrupoPreConfirmacion && !stepAvanzoCapacitacion;
  const reglasNoAsignableActivas = flujoPreConfirmacionActivo
    ? reglasNoAsignablePreConfirmacion
    : reglasNoAsignable;
  const canAsignarActivo = flujoPreConfirmacionActivo
    ? canAsignarPreConfirmacion
    : canAsignarBase;
  const isFormComplete =
    !!formState.tipificacion &&
    !!formState.subtipificacion &&
    (!shouldShowModalidadContacto || !!formState.modalidadContacto) &&
    // Solo requerir grupo si es ASESOR_VENTAS y está en flujo pre-confirmación
    (!flujoPreConfirmacionActivo || !canAsignarActivo || !!idGrupoSeleccionado || puestoObjetivoActual !== 'ASESOR_VENTAS');
  const disableConfirmButton =
    isLoading ||
    isTerminalNoInteresado ||
    !isFormComplete;

  // Mostrar error al cargar catálogo
  if (catalogoHook.error) {
    return (
      <ErrorState
        message={catalogoHook.error}
        onRetry={catalogoHook.refetch}
      />
    );
  }

  // Cargando catálogo
  if (catalogoHook.loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="medium" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {stepTipificadaReclutado && (
        <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
          Postulación tipificada como RECLUTADO.
        </div>
      )}

      {stepAvanzoCapacitacion && (
        <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
          La postulación avanzó a CAPACITACIÓN.
        </div>
      )}

      {stepAvanzoCapacitacion && canAsignarBase && (
        <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
          Ya puedes asignar al grupo de capacitación.
        </div>
      )}

      {stepAvanzoCapacitacion && puestoObjetivoActual !== 'ASESOR_VENTAS' && (
        <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
          La postulación no es ASESOR_VENTAS, no requiere asignación a grupo de capacitación.
        </div>
      )}

      {isTerminalNoInteresado && (
        <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          Esta postulación está en NO_INTERESADO y no admite más tipificación.
        </div>
      )}

      <SelectInput
        label="Tipificación"
        name="tipificacion"
        value={formState.tipificacion}
        onChange={handleChange('tipificacion')}
        options={tipificacionOptions}
        error={errors.tipificacion}
        required
        placeholder="Selecciona tipificación"
        disabled={isLoading || isTerminalNoInteresado}
      />

      <SelectInput
        label="Subtipificación"
        name="subtipificacion"
        value={formState.subtipificacion}
        onChange={handleChange('subtipificacion')}
        options={subtipificacionOptions}
        error={errors.subtipificacion}
        required
        placeholder="Selecciona subtipificación"
        disabled={isLoading || !formState.tipificacion || isTerminalNoInteresado}
      />

      {shouldShowModalidadContacto && (
        <SelectInput
          label="Modalidad de Contacto"
          name="modalidadContacto"
          value={formState.modalidadContacto}
          onChange={handleChange('modalidadContacto')}
          options={modalidadOptions}
          error={errors.modalidadContacto}
          placeholder="Selecciona modalidad"
          disabled={isLoading || isTerminalNoInteresado}
        />
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Observación
        </label>
        <textarea
          name="observacion"
          value={formState.observacion}
          onChange={(e) => handleChange('observacion')(e.target.value)}
          rows={4}
          placeholder="Ingresa observaciones..."
          disabled={isLoading || isTerminalNoInteresado}
          className={`
            w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400
            ${errors.observacion ? 'border-red-500 dark:border-red-400' : ''}
          `}
        />
        {errors.observacion && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            {errors.observacion}
          </p>
        )}
      </div>

      {mostrarSeccionGrupos && (
        <div className="mt-6 rounded-md border border-gray-200 bg-gray-50 p-4">
          <h4 className="mb-2 text-sm font-semibold text-slate-900">
            {flujoPreConfirmacionActivo
              ? 'Selecciona grupo de capacitación antes de confirmar'
              : 'Paso 3: Asignación a grupo de capacitación'}
          </h4>

          {!canAsignarActivo && (
            <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              {reglasNoAsignableActivas.map((razon) => (
                <p key={razon}>{razon}</p>
              ))}
            </div>
          )}

          {canAsignarActivo && (
            <div className="space-y-3">
              {gruposLoading ? (
                <div className="flex justify-center py-2">
                  <Spinner size="small" />
                </div>
              ) : (
                <>
                  <SelectInput
                    label="Grupo de capacitación"
                    name="idGrupoCapacitacion"
                    value={idGrupoSeleccionado}
                    onChange={setIdGrupoSeleccionado}
                    options={gruposOptions}
                    placeholder="Selecciona grupo"
                    disabled={isLoading || gruposOptions.length === 0}
                  />

                  {gruposOptions.length === 0 && (
                    <p className="text-sm text-amber-700">
                      No hay grupos disponibles para asignación.
                    </p>
                  )}

                  {asignacionErrorUi && (
                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                      {asignacionErrorUi}
                    </div>
                  )}

                  {asignacionMensaje && (
                    <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
                      {asignacionMensaje}
                    </div>
                  )}

                  {gruposOptions.length > 0 && !flujoPreConfirmacionActivo && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAsignarGrupo}
                        disabled={isLoading || !idGrupoSeleccionado}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Asignar a grupo
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

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
          variant="default"
          disabled={disableConfirmButton}
          className="min-w-[120px]"
        >
          {isLoading ? 'Guardando...' : 'Confirmar'}
        </Button>
      </div>
    </form>
  );
};
