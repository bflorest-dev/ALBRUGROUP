import React, { useEffect, useMemo, useState } from 'react';
import type { AxiosError } from 'axios';
import { Modal } from '@shared/ui/modal';
import { PreventaApi, Tipificacion } from '../model/preventa.api';
import { useQuery } from '@tanstack/react-query';
import type {
  LeadDatosPreventaRequest,
  LeadDireccionRequest,
  LeadOfertaComercialRequest,
  LeadTipificacionRequest,
} from '@entidades/lead/types';
import { DocumentoEnum, TipoViaEnum, TipoDomicilioEnum } from '@shared/types/backendEnums';
import { enumToOptions } from '@shared/utils/enumToOptions';

interface PreventaLeadModalProps {
  idLead: number;
  isOpen: boolean;
  onClose: () => void;
}

type Step = 1 | 2 | 3;

const isNonEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

const buildErrorMessage = (error: unknown): string => {
  if (!error) return 'Error desconocido';
  if ((error as AxiosError).isAxiosError) {
    const axiosError = error as AxiosError;
    const responseData = axiosError.response?.data as { message?: string } | undefined;
    return responseData?.message || axiosError.response?.statusText || axiosError.message;
  }
  if (error instanceof Error) return error.message;
  return String(error);
};

export const PreventaLeadModal: React.FC<PreventaLeadModalProps> = ({ idLead, isOpen, onClose }) => {
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [selectedTipificacionId, setSelectedTipificacionId] = useState<number | ''>('');
  const [selectedSubtipificacionId, setSelectedSubtipificacionId] = useState<number | ''>('');

  const [datosPreventa, setDatosPreventa] = useState<LeadDatosPreventaRequest>({
    tipoDocumento: '',
    numeroDocumentoTitularServicio: '',
    nombreTitular: '',
    celularRegistro: '',
    correo: '',
  });

  const [direccion, setDireccion] = useState<LeadDireccionRequest>({
    tipoDomicilio: '',
    tipoVia: '',
    via: '',
    numero: '',
    direccion: '',
    referencia: '',
  });

  const [oferta, setOferta] = useState<LeadOfertaComercialRequest>({
    idPlan: 0,
    idPromocion: undefined,
    adicionales: [],
  });

  const {
    data: catalogo = { etapa: 'PREVENTA', tipificaciones: [] },
    isLoading: loadingTipificaciones,
    isError: tipificacionesError,
  } = useQuery<import('@shared/types').CatalogoResponse>({
    queryKey: ['tipificaciones', 'PREVENTA'],
    queryFn: () => PreventaApi.getCatalogo().then((r) => r.data),
    enabled: isOpen,
    staleTime: 1000 * 60 * 3,
    retry: 1,
  });

  const tipificaciones = catalogo.tipificaciones || [];

  const sortedTipificaciones = useMemo(() => {
    const sorted = [...tipificaciones]
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      .map((t) => ({
        ...t,
        subtipificaciones: (t.subtipificaciones || []).slice().sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)),
      }));

    console.log('Catalogo recibido:', catalogo);
    console.log('Tipificaciones:', tipificaciones);
    console.log('Tipificaciones final para render:', sorted);

    return sorted;
  }, [catalogo, tipificaciones]);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setApiError(null);
      setSelectedTipificacionId('');
      setSelectedSubtipificacionId('');
    }
  }, [isOpen]);

  const subtipificacionesDisponibles: Array<{
    id: number;
    codigo: string;
    descripcion: string;
    orden: number;
  }> = useMemo(() => {
    const tip = sortedTipificaciones.find((t) => t.id === selectedTipificacionId);
    const result = tip?.subtipificaciones || [];
    console.log('Subtipificaciones disponibles para tipificacionId', selectedTipificacionId, ':', result);
    return result;
  }, [sortedTipificaciones, selectedTipificacionId]);

  const validTipificacion = () => {
    if (!isNonEmpty(selectedTipificacionId)) return 'Elija una tipificación';
    if (!isNonEmpty(selectedSubtipificacionId)) return 'Elija una subtipificación';
    return null;
  };

  const handleGuardarTipificacion = async () => {
    const validation = validTipificacion();
    if (validation) {
      setApiError(validation);
      return;
    }

    const tip = sortedTipificaciones.find((t) => t.id === selectedTipificacionId);
    const sub = subtipificacionesDisponibles.find((s) => s.id === selectedSubtipificacionId);

    if (!tip || !sub) {
      setApiError('Tipificación o subtipificación inválida');
      return;
    }

    const payload: LeadTipificacionRequest = {
      codigoTipificacion: tip.codigo,
      codigoSubtipificacion: sub.codigo,
    };

    console.log('payload', payload);
    setIsSubmitting(true);
    setApiError(null);
    try {
      await PreventaApi.postTipificacion(idLead, payload);
      setApiError('Tipificación guardada correctamente');
    } catch (error) {
      setApiError(buildErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitPaso1 = async () => {
    const required = ['tipoDocumento', 'numeroDocumentoTitularServicio', 'nombreTitular', 'celularRegistro', 'correo'];
    const missing = required.filter((key) => !isNonEmpty(datosPreventa[key as keyof LeadDatosPreventaRequest]));
    if (missing.length > 0) {
      setApiError(`Complete los campos: ${missing.join(', ')}`);
      return;
    }

    console.log('payload', datosPreventa);
    setIsSubmitting(true);
    setApiError(null);
    try {
      await PreventaApi.patchDatosPreventa(idLead, datosPreventa);
      setStep(2);
    } catch (error) {
      setApiError(buildErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitPaso2 = async () => {
    const required = ['tipoDomicilio', 'tipoVia', 'via', 'numero', 'direccion'];
    const missing = required.filter((key) => !isNonEmpty(direccion[key as keyof LeadDireccionRequest]));
    if (missing.length > 0) {
      setApiError(`Complete los campos: ${missing.join(', ')}`);
      return;
    }

    console.log('payload', direccion);
    setIsSubmitting(true);
    setApiError(null);
    try {
      await PreventaApi.patchDireccion(idLead, direccion);
      setStep(3);
    } catch (error) {
      setApiError(buildErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitPaso3 = async () => {
    if (!oferta.idPlan || oferta.idPlan <= 0) {
      setApiError('Seleccione un plan válido');
      return;
    }

    console.log('payload', oferta);
    setIsSubmitting(true);
    setApiError(null);
    try {
      await PreventaApi.patchOfertaComercial(idLead, oferta);
      setApiError('Flujo completado con éxito');
      onClose();
    } catch (error) {
      setApiError(buildErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestión Lead PREVENTA" className="max-w-3xl">
      <div className="space-y-4">
        {tipificacionesError && <p className="text-red-600">No se pudo cargar tipificaciones</p>}
        <div className="p-3 bg-gray-50 rounded border">
          <h3 className="font-semibold mb-2">Tipificación</h3>
          {loadingTipificaciones ? (
            <p>Cargando tipificaciones...</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <label>
                  Tipificación
                  <select
                    value={selectedTipificacionId}
                    onChange={(e) => {
                      setSelectedTipificacionId(Number(e.target.value) || '');
                      setSelectedSubtipificacionId('');
                    }}
                    className="w-full border rounded px-2 py-1"
                  >
                    <option value="" disabled>
                      Seleccione una tipificación
                    </option>
                    {sortedTipificaciones.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.codigo}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Subtipificación
                  <select
                    value={selectedSubtipificacionId}
                    onChange={(e) => setSelectedSubtipificacionId(Number(e.target.value) || '')}
                    className="w-full border rounded px-2 py-1"
                    disabled={!selectedTipificacionId}
                  >
                    <option value="" disabled>
                      Seleccione una subtipificación
                    </option>
                    {subtipificacionesDisponibles.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.codigo}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button
                onClick={handleGuardarTipificacion}
                className="bg-blue-600 text-white px-4 py-2 rounded"
                disabled={isSubmitting}
              >
                Guardar tipificación
              </button>
            </>
          )}
        </div>

        <div className="border rounded p-3">
          <div className="mb-3 font-semibold">Flujo PREVENTA (Paso {step} de 3)</div>

          {step === 1 && (
            <div className="space-y-3">
              <label>
                Tipo Documento*:
                <select
                  className="w-full border rounded px-2 py-1"
                  value={datosPreventa.tipoDocumento ?? ''}
                  onChange={(e) => setDatosPreventa((v) => ({ ...v, tipoDocumento: e.target.value }))}
                >
                  <option value="">Seleccione un tipo de documento</option>
                  {enumToOptions(DocumentoEnum).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Número Documento*:
                <input
                  className="w-full border rounded px-2 py-1"
                  value={datosPreventa.numeroDocumentoTitularServicio ?? ''}
                  onChange={(e) =>
                    setDatosPreventa((v) => ({ ...v, numeroDocumentoTitularServicio: e.target.value }))
                  }
                />
              </label>
              <label>
                Nombre Titular*:
                <input
                  className="w-full border rounded px-2 py-1"
                  value={datosPreventa.nombreTitular ?? ''}
                  onChange={(e) => setDatosPreventa((v) => ({ ...v, nombreTitular: e.target.value }))}
                />
              </label>
              <label>
                Celular*:
                <input
                  className="w-full border rounded px-2 py-1"
                  value={datosPreventa.celularRegistro ?? ''}
                  onChange={(e) => setDatosPreventa((v) => ({ ...v, celularRegistro: e.target.value }))}
                />
              </label>
              <label>
                Correo*:
                <input
                  className="w-full border rounded px-2 py-1"
                  value={datosPreventa.correo ?? ''}
                  onChange={(e) => setDatosPreventa((v) => ({ ...v, correo: e.target.value }))}
                />
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <label>
                Tipo Domicilio*:
                <select
                  className="w-full border rounded px-2 py-1"
                  value={direccion.tipoDomicilio ?? ''}
                  onChange={(e) => setDireccion((v) => ({ ...v, tipoDomicilio: e.target.value }))}
                >
                  <option value="">Seleccione un tipo de domicilio</option>
                  {enumToOptions(TipoDomicilioEnum).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tipo Vía*:
                <select
                  className="w-full border rounded px-2 py-1"
                  value={direccion.tipoVia ?? ''}
                  onChange={(e) => setDireccion((v) => ({ ...v, tipoVia: e.target.value }))}
                >
                  <option value="">Seleccione un tipo de vía</option>
                  {enumToOptions(TipoViaEnum).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Vía*:
                <input
                  className="w-full border rounded px-2 py-1"
                  value={direccion.via ?? ''}
                  onChange={(e) => setDireccion((v) => ({ ...v, via: e.target.value }))}
                />
              </label>
              <label>
                Número*:
                <input
                  className="w-full border rounded px-2 py-1"
                  value={direccion.numero ?? ''}
                  onChange={(e) => setDireccion((v) => ({ ...v, numero: e.target.value }))}
                />
              </label>
              <label>
                Dirección*:
                <input
                  className="w-full border rounded px-2 py-1"
                  value={direccion.direccion ?? ''}
                  onChange={(e) => setDireccion((v) => ({ ...v, direccion: e.target.value }))}
                />
              </label>
              <label>
                Referencia (opcional):
                <input
                  className="w-full border rounded px-2 py-1"
                  value={direccion.referencia ?? ''}
                  onChange={(e) => setDireccion((v) => ({ ...v, referencia: e.target.value }))}
                />
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <label>
                ID Plan*:
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1"
                  value={oferta.idPlan}
                  onChange={(e) => setOferta((v) => ({ ...v, idPlan: Number(e.target.value) }))}
                />
              </label>
              <label>
                ID Promoción:
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1"
                  value={oferta.idPromocion ?? ''}
                  onChange={(e) =>
                    setOferta((v) => ({ ...v, idPromocion: e.target.value ? Number(e.target.value) : undefined }))
                  }
                />
              </label>
              <label>
                Adicionales (IDs separados por coma):
                <input
                  type="text"
                  value={(oferta.adicionales ?? []).join(',')}
                  onChange={(e) =>
                    setOferta((v) => ({
                      ...v,
                      adicionales: e.target.value
                        .split(',')
                        .map((n) => Number(n.trim()))
                        .filter((n) => !Number.isNaN(n)),
                    }))
                  }
                  className="w-full border rounded px-2 py-1"
                />
              </label>
            </div>
          )}

          <div className="flex justify-between mt-5 gap-2">
            <button
              disabled={step === 1 || isSubmitting}
              onClick={() => setStep((prev) => (prev === 1 ? 1 : (prev - 1) as Step))}
              className="px-4 py-2 border rounded bg-gray-100"
            >
              Anterior
            </button>

            {step < 3 ? (
              <button
                onClick={step === 1 ? handleSubmitPaso1 : handleSubmitPaso2}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={handleSubmitPaso3}
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
              >
                Finalizar
              </button>
            )}
          </div>

          {apiError && <p className="text-red-600 mt-3">{apiError}</p>}
          {isSubmitting && <p className="text-gray-600 mt-1">Enviando...</p>}
        </div>
      </div>
    </Modal>
  );
};
