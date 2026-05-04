import { useEffect, useMemo, useState, type FormEvent, type ReactElement } from 'react';
import type { OfertaLaboralResponse } from '@shared/types';
import { Modal } from '@shared/ui';
import { FlatpickrDateInput } from '@shared/ui/date-picker';
import { useAmpliarOfertaLaboral } from '../model/useOfertasActivas';

interface AmpliarOfertaModalProps {
  oferta: OfertaLaboralResponse;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const formatTotalVacantes = (oferta: OfertaLaboralResponse): number =>
  oferta.cantidadInicial + oferta.ampliaciones.reduce((sum, amp) => sum + amp.cantidad, 0);

const normalizeFecha = (dateValue: string): string => {
  const ddmmyyyy = /^\s*(\d{2})\/(\d{2})\/(\d{4})\s*$/;
  const match = dateValue.match(ddmmyyyy);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  }
  return dateValue;
};

export function AmpliarOfertaModal({ oferta, isOpen, onClose, onSuccess }: AmpliarOfertaModalProps): ReactElement {
  const ampliarMutation = useAmpliarOfertaLaboral();
  const [cantidadAdicional, setCantidadAdicional] = useState<number>(1);
  const [plazo, setPlazo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalActual = useMemo(() => formatTotalVacantes(oferta), [oferta]);
  const totalDespues = useMemo(() => totalActual + cantidadAdicional, [totalActual, cantidadAdicional]);

  useEffect(() => {
    if (isOpen) {
      setCantidadAdicional(1);
      setPlazo('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (cantidadAdicional <= 0) {
      setError('La cantidad adicional debe ser mayor a 0.');
      return;
    }
    if (!plazo) {
      setError('El nuevo plazo es requerido.');
      return;
    }

    try {
      setIsSubmitting(true);
      const normalized = normalizeFecha(plazo);
      await ampliarMutation.mutateAsync({
        ofertaId: oferta.id,
        body: {
          cantidad: cantidadAdicional,
          plazo: normalized,
        },
      });
      onClose();
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ampliar Oferta" size="lg" className="rrhh-modal-theme">
      <div className="mx-auto w-full max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-400">Oferta</div>
          <div className="space-y-2">
            <p className="text-xl font-semibold text-slate-900">{oferta.puestoObjetivo}</p>
            <p className="text-sm text-slate-500">Código: <span className="font-mono font-semibold text-slate-700">#{oferta.codigo}</span></p>
            <p className="text-sm text-slate-500">Vacantes actuales: <span className="font-semibold text-slate-900">{totalActual}</span></p>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Cantidad Adicional <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={cantidadAdicional}
              onChange={(event) => setCantidadAdicional(Number(event.target.value))}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-2 text-xs text-slate-500">Total después de ampliar: {totalDespues} vacantes</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Nuevo Plazo <span className="text-red-500">*</span>
            </label>
            <FlatpickrDateInput
              value={plazo}
              onChange={setPlazo}
              required
              inputClassName="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition-all duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors duration-150 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Ampliando...' : 'Ampliar Oferta'}
          </button>
        </div>
      </form>
      </div>
    </Modal>
  );
}
