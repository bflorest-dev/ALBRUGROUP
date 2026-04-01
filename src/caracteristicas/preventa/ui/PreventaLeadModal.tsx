import React, { useEffect, useMemo, useState } from 'react';
import type { AxiosError } from 'axios';
import { Modal } from '@shared/ui/modal';
import { PreventaApi, Tipificacion } from '../model/preventa.api';
import { useQuery } from '@tanstack/react-query';
import type {
  LeadDatosPreventaRequest,
  LeadDireccionRequest,
  LeadOfertaComercialRequest,
  LeadAdicionalOferta,
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
type CompletionLevel = 0 | 1 | 2 | 3; // 0: sin data, 1: preventa, 2:+dirección, 3: +oferta

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

/**
 * Verifica si los datos de preventa están completos (campos requeridos)
 * Requeridos: tipoDocumento, numeroDocumentoTitularServicio, nombreTitularServicio, celularRegistro, correo
 */
const isPreventaCompleta = (datos: LeadDatosPreventaRequest): boolean => {
  return (
    isNonEmpty(datos.tipoDocumento) &&
    isNonEmpty(datos.numeroDocumentoTitularServicio) &&
    isNonEmpty(datos.nombreTitularServicio) &&
    isNonEmpty(datos.celularRegistro) &&
    isNonEmpty(datos.correo)
  );
};

/**
 * Verifica si la dirección está completa (campos requeridos)
 */
const isDireccionCompleta = (dir: LeadDireccionRequest): boolean => {
  return (
    isNonEmpty(dir.ubigeoDomicilio) &&
    isNonEmpty(dir.tipoDomicilio) &&
    isNonEmpty(dir.tipoVia) &&
    isNonEmpty(dir.via) &&
    isNonEmpty(dir.numero) &&
    isNonEmpty(dir.direccion)
  );
};

/**
 * Verifica si la oferta es válida
 */
const isOfertaValida = (oferta: LeadOfertaComercialRequest): boolean => {
  return oferta.idPlan > 0;
};

/**
 * Deriva el nivel de completitud actual basado en los datos
 */
const deriveCompletionLevel = (
  preventa: LeadDatosPreventaRequest,
  direccion: LeadDireccionRequest,
  oferta: LeadOfertaComercialRequest,
): CompletionLevel => {
  if (isOfertaValida(oferta) && isDireccionCompleta(direccion) && isPreventaCompleta(preventa)) {
    return 3;
  }
  if (isDireccionCompleta(direccion) && isPreventaCompleta(preventa)) {
    return 2;
  }
  if (isPreventaCompleta(preventa)) {
    return 1;
  }
  return 0;
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
    ubigeoNacimiento: '',
    nombreTitularServicio: '',
    celularRegistro: '',
    celularReferencia: '',
    correo: '',
    numeroDocumentoTitularCelularRegistro: '',
    nombreTitularCelularRegistro: '',
  });

  const [direccion, setDireccion] = useState<LeadDireccionRequest>({
    ubigeoDomicilio: '',
    tipoDomicilio: '',
    tipoVia: '',
    via: '',
    numero: '',
    direccion: '',
    referencia: '',
    latitud: undefined,
    longitud: undefined,
    urbanizacion: '',
    manzana: '',
    lote: '',
    nombreEdificio: '',
    nombreCondominio: '',
    piso: '',
    interior: '',
  });

  const [oferta, setOferta] = useState<LeadOfertaComercialRequest>({
    idPlan: 0,
    idPromocionInterna: undefined,
    idPromocionProveedor: undefined,
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

  // Derivar el nivel de completitud automáticamente
  const completionLevel: CompletionLevel = useMemo(
    () => deriveCompletionLevel(datosPreventa, direccion, oferta),
    [datosPreventa, direccion, oferta]
  );

  const tipificaciones = catalogo.tipificaciones || [];

  // Códigos de tipificaciones permitidas dinámicamente según nivel de completitud
  const getTipificacionesPermitidas = (level: CompletionLevel): string[] => {
    if (level >= 1) {
      // Nivel 1+: SOLO tipificaciones avanzadas
      return ['RECHAZADO', 'NO_DESEA', 'NO_CALIFICA', 'ZONA_FRAUDE', 'VC_DESAPROBADA', 'CON_PROGRAMACION'];
    }
    // Nivel 0: Tipificaciones básicas
    return ['SIN_CONTACTO', 'SEGUIMIENTO', 'AGENDADO', 'REITERADO', 'LISTA_NEGRA'];
  };

  const sortedTipificaciones = useMemo(() => {
    const permitidas = getTipificacionesPermitidas(completionLevel);
    const sorted = [...tipificaciones]
      .filter((t) => permitidas.includes(t.codigo))
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      .map((t) => ({
        ...t,
        subtipificaciones: (t.subtipificaciones || []).slice().sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)),
      }));

    return sorted;
  }, [catalogo, tipificaciones, completionLevel]);

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
    return tip?.subtipificaciones || [];
  }, [sortedTipificaciones, selectedTipificacionId]);

  const handleGuardarTipificacion = async () => {
    // Validación de UI solo - sin errores
    if (!selectedTipificacionId || !selectedSubtipificacionId) return;

    const tip = sortedTipificaciones.find((t) => t.id === selectedTipificacionId);
    const sub = subtipificacionesDisponibles.find((s) => s.id === selectedSubtipificacionId);

    if (!tip || !sub) return;

    const payload: LeadTipificacionRequest = {
      codigoTipificacion: tip.codigo,
      codigoSubtipificacion: sub.codigo,
    };

    setIsSubmitting(true);
    setApiError(null);
    try {
      await PreventaApi.postTipificacion(idLead, payload);
      setApiError(null); // Éxito silencioso o mensaje positivo breve
      setSelectedTipificacionId('');
      setSelectedSubtipificacionId('');
    } catch (error) {
      setApiError(buildErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitPaso1 = async () => {
    // Solo proceder si está completo
    if (!isPreventaCompleta(datosPreventa)) return;

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
    // Solo proceder si dirección está completa
    if (!isDireccionCompleta(direccion)) return;

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
    // Solo proceder si oferta es válida
    if (!isOfertaValida(oferta)) return;

    setIsSubmitting(true);
    setApiError(null);
    try {
      await PreventaApi.patchOfertaComercial(idLead, oferta);
      setApiError(null);
      onClose();
    } catch (error) {
      setApiError(buildErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determinar si botón "Siguiente" está habilitado
  const isStep1Complete = isPreventaCompleta(datosPreventa);
  const isStep2Complete = isDireccionCompleta(direccion);
  const isStep3Complete = isOfertaValida(oferta);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestión Lead PREVENTA" className="max-w-3xl">
      <div className="space-y-4">
        {tipificacionesError && <p className="text-red-600">No se pudo cargar tipificaciones</p>}
        
        {/* Sección Tipificación - Siempre habilitada (independiente del flujo de pasos) */}
        <div className="p-3 rounded border bg-gray-50">
          <h3 className="font-semibold mb-2">Tipificación</h3>
          {loadingTipificaciones ? (
            <p className="text-gray-600">Cargando tipificaciones...</p>
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
                    disabled={!selectedTipificacionId}
                    className="w-full border rounded px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={!selectedTipificacionId || !selectedSubtipificacionId || isSubmitting}
                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar tipificación
              </button>
            </>
          )}
        </div>

        {/* Sección Flujo de Pasos */}
        <div className="border rounded p-3">
          <div className="mb-3 font-semibold">
            Flujo PREVENTA (Paso {step} de 3)
          </div>

          {step === 1 && (
            <div className="space-y-4">
              {/* Fila 1: Tipo y Número de Documento */}
              <div className="grid grid-cols-2 gap-4">
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
              </div>

              {/* Fila 2: Nombre Titular y Ubigeo Nacimiento */}
              <div className="grid grid-cols-2 gap-4">
                <label>
                  Nombre Titular*:
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={datosPreventa.nombreTitularServicio ?? ''}
                    onChange={(e) => setDatosPreventa((v) => ({ ...v, nombreTitularServicio: e.target.value }))}
                  />
                </label>
                <label>
                  Ubigeo Nacimiento (opcional):
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={datosPreventa.ubigeoNacimiento ?? ''}
                    onChange={(e) =>
                      setDatosPreventa((v) => ({ ...v, ubigeoNacimiento: e.target.value }))
                    }
                    placeholder="Código de ubigeo"
                  />
                </label>
              </div>

              {/* Fila 3: Celular Registro y Celular Referencia */}
              <div className="grid grid-cols-2 gap-4">
                <label>
                  Celular Registro*:
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={datosPreventa.celularRegistro ?? ''}
                    onChange={(e) => setDatosPreventa((v) => ({ ...v, celularRegistro: e.target.value }))}
                  />
                </label>
                <label>
                  Celular Referencia (opcional):
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={datosPreventa.celularReferencia ?? ''}
                    onChange={(e) =>
                      setDatosPreventa((v) => ({ ...v, celularReferencia: e.target.value }))
                    }
                  />
                </label>
              </div>

              {/* Fila 4: Correo */}
              <label>
                Correo*:
                <input
                  className="w-full border rounded px-2 py-1"
                  value={datosPreventa.correo ?? ''}
                  onChange={(e) => setDatosPreventa((v) => ({ ...v, correo: e.target.value }))}
                />
              </label>

              {/* Sección adicional: Datos del Titular del Celular de Registro */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold text-sm mb-3">Datos del Titular Celular Registro (opcional)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <label>
                    Número Documento:
                    <input
                      className="w-full border rounded px-2 py-1"
                      value={datosPreventa.numeroDocumentoTitularCelularRegistro ?? ''}
                      onChange={(e) =>
                        setDatosPreventa((v) => ({
                          ...v,
                          numeroDocumentoTitularCelularRegistro: e.target.value,
                        }))
                      }
                      placeholder="Ej: 1234567890"
                    />
                  </label>
                  <label>
                    Nombre Titular:
                    <input
                      className="w-full border rounded px-2 py-1"
                      value={datosPreventa.nombreTitularCelularRegistro ?? ''}
                      onChange={(e) =>
                        setDatosPreventa((v) => ({
                          ...v,
                          nombreTitularCelularRegistro: e.target.value,
                        }))
                      }
                      placeholder="Nombre del titular"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="space-y-3">
                <label>
                  Ubigeo Domicilio*:
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={direccion.ubigeoDomicilio ?? ''}
                    onChange={(e) => setDireccion((v) => ({ ...v, ubigeoDomicilio: e.target.value }))}
                    placeholder="Código de ubigeo"
                  />
                </label>
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
                    placeholder="Nombre de la vía"
                  />
                </label>
                <label>
                  Número*:
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={direccion.numero ?? ''}
                    onChange={(e) => setDireccion((v) => ({ ...v, numero: e.target.value }))}
                    placeholder="Número de vía"
                  />
                </label>
                <label>
                  Dirección*:
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={direccion.direccion ?? ''}
                    onChange={(e) => setDireccion((v) => ({ ...v, direccion: e.target.value }))}
                    placeholder="Dirección completa"
                  />
                </label>
                <label>
                  Referencia:
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={direccion.referencia ?? ''}
                    onChange={(e) => setDireccion((v) => ({ ...v, referencia: e.target.value }))}
                    placeholder="Referencias adicionales"
                  />
                </label>
                <label>
                  Latitud:
                  <input
                    type="number"
                    step="0.000001"
                    className="w-full border rounded px-2 py-1"
                    value={direccion.latitud ?? ''}
                    onChange={(e) => setDireccion((v) => ({ ...v, latitud: e.target.value ? Number(e.target.value) : undefined }))}
                    placeholder="Coordenada de latitud"
                  />
                </label>
                <label>
                  Longitud:
                  <input
                    type="number"
                    step="0.000001"
                    className="w-full border rounded px-2 py-1"
                    value={direccion.longitud ?? ''}
                    onChange={(e) => setDireccion((v) => ({ ...v, longitud: e.target.value ? Number(e.target.value) : undefined }))}
                    placeholder="Coordenada de longitud"
                  />
                </label>
                <label>
                  Urbanización:
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={direccion.urbanizacion ?? ''}
                    onChange={(e) => setDireccion((v) => ({ ...v, urbanizacion: e.target.value }))}
                    placeholder="Nombre de la urbanización"
                  />
                </label>
                <label>
                  Manzana:
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={direccion.manzana ?? ''}
                    onChange={(e) => setDireccion((v) => ({ ...v, manzana: e.target.value }))}
                    placeholder="Manzana"
                  />
                </label>
                <label>
                  Lote:
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={direccion.lote ?? ''}
                    onChange={(e) => setDireccion((v) => ({ ...v, lote: e.target.value }))}
                    placeholder="Lote"
                  />
                </label>
                <label>
                  Nombre Edificio:
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={direccion.nombreEdificio ?? ''}
                    onChange={(e) => setDireccion((v) => ({ ...v, nombreEdificio: e.target.value }))}
                    placeholder="Nombre del edificio"
                  />
                </label>
                <label>
                  Nombre Condominio:
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={direccion.nombreCondominio ?? ''}
                    onChange={(e) => setDireccion((v) => ({ ...v, nombreCondominio: e.target.value }))}
                    placeholder="Nombre del condominio"
                  />
                </label>
                <label>
                  Piso:
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={direccion.piso ?? ''}
                    onChange={(e) => setDireccion((v) => ({ ...v, piso: e.target.value }))}
                    placeholder="Número de piso"
                  />
                </label>
                <label>
                  Interior:
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={direccion.interior ?? ''}
                    onChange={(e) => setDireccion((v) => ({ ...v, interior: e.target.value }))}
                    placeholder="Número de interior"
                  />
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="space-y-3">
                <label>
                  ID Plan*:
                  <input
                    type="number"
                    className="w-full border rounded px-2 py-1"
                    value={oferta.idPlan}
                    onChange={(e) => setOferta((v) => ({ ...v, idPlan: Number(e.target.value) }))}
                    placeholder="ID del plan"
                  />
                </label>
                <label>
                  ID Promoción Interna:
                  <input
                    type="number"
                    className="w-full border rounded px-2 py-1"
                    value={oferta.idPromocionInterna ?? ''}
                    onChange={(e) =>
                      setOferta((v) => ({ ...v, idPromocionInterna: e.target.value ? Number(e.target.value) : undefined }))
                    }
                    placeholder="ID de la promoción interna"
                  />
                </label>
                <label>
                  ID Promoción Proveedor:
                  <input
                    type="number"
                    className="w-full border rounded px-2 py-1"
                    value={oferta.idPromocionProveedor ?? ''}
                    onChange={(e) =>
                      setOferta((v) => ({ ...v, idPromocionProveedor: e.target.value ? Number(e.target.value) : undefined }))
                    }
                    placeholder="ID de la promoción del proveedor"
                  />
                </label>
                <div className="border rounded p-3 bg-gray-50">
                  <div className="font-semibold mb-3">Adicionales</div>
                  <div className="space-y-2">
                    {(oferta.adicionales ?? []).map((adi, idx) => (
                      <div key={idx} className="flex gap-2 items-end">
                        <label className="flex-1">
                          ID Adicional:
                          <input
                            type="number"
                            className="w-full border rounded px-2 py-1"
                            value={adi.idAdicional}
                            onChange={(e) => {
                              const newAdis = [...(oferta.adicionales ?? [])];
                              if (newAdis[idx]) {
                                newAdis[idx].idAdicional = Number(e.target.value);
                                setOferta((v) => ({ ...v, adicionales: newAdis }));
                              }
                            }}
                            placeholder="ID del adicional"
                          />
                        </label>
                        <label className="flex-1">
                          Cantidad:
                          <input
                            type="number"
                            className="w-full border rounded px-2 py-1"
                            value={adi.cantidad}
                            onChange={(e) => {
                              const newAdis = [...(oferta.adicionales ?? [])];
                              if (newAdis[idx]) {
                                newAdis[idx].cantidad = Number(e.target.value);
                                setOferta((v) => ({ ...v, adicionales: newAdis }));
                              }
                            }}
                            placeholder="Cantidad"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const newAdis = (oferta.adicionales ?? []).filter((_, i) => i !== idx);
                            setOferta((v) => ({ ...v, adicionales: newAdis }));
                          }}
                          className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const newAdis = [...(oferta.adicionales ?? []), { idAdicional: 0, cantidad: 1 }];
                        setOferta((v) => ({ ...v, adicionales: newAdis }));
                      }}
                      className="w-full px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      + Agregar Adicional
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-5 gap-2">
            <button
              disabled={step === 1 || isSubmitting}
              onClick={() => setStep((prev) => (prev === 1 ? 1 : (prev - 1) as Step))}
              className="px-4 py-2 border rounded bg-gray-100 disabled:opacity-50"
            >
              Anterior
            </button>

            {step < 3 ? (
              <button
                onClick={step === 1 ? handleSubmitPaso1 : handleSubmitPaso2}
                disabled={isSubmitting || (step === 1 && !isStep1Complete) || (step === 2 && !isStep2Complete)}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={handleSubmitPaso3}
                disabled={isSubmitting || !isStep3Complete}
                className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Finalizar
              </button>
            )}
          </div>

          {/* Solo mostrar errores de API, no de validación */}
          {apiError && <p className="text-red-600 mt-3">{apiError}</p>}
          {isSubmitting && <p className="text-gray-600 mt-1">Enviando...</p>}
        </div>
      </div>
    </Modal>
  );
};
