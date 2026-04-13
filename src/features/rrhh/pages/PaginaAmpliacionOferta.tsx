/**
 * Página para crear ampliación de oferta laboral
 * Ruta: /rrhh/ofertas-laborales/{id}/ampliacion
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAmpliarOfertaLaboral } from '@features/rrhh/ofertas-laborales';
import { OfertaLaboralService } from '@shared/services/ofertaLaboralService';
import { FormInput } from '@shared/ui/form-input/FormInput';
import type { OfertaLaboralResponse } from '@shared/types';

interface FormState {
  cantidad: number;
  plazo: string; // DD-MM-YYYY o YYYY-MM-DD
}

type PageState = 'loading' | 'error' | 'form' | 'success';

const PaginaAmpliacionOferta: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [oferta, setOferta] = useState<OfertaLaboralResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({
    cantidad: 1,
    plazo: '',
  });
  const ampliarMutation = useAmpliarOfertaLaboral();

  const ofertaId = id ? parseInt(id, 10) : null;

  /**
   * Cargar oferta al montar
   */
  useEffect(() => {
    if (!ofertaId) {
      setError('ID de oferta inválido');
      setPageState('error');
      return;
    }

    const loadOferta = async () => {
      try {
        const ofertas = await OfertaLaboralService.getOfertasActivas();
        const found = ofertas.find((o) => o.id === ofertaId);

        if (!found) {
          setError('No se encontró la oferta laboral');
          setPageState('error');
          return;
        }

        setOferta(found);
        setPageState('form');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setPageState('error');
      }
    };

    loadOferta();
  }, [ofertaId]);

  /**
   * Convertir fecha DD-MM-YYYY a YYYY-MM-DD
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

  /**
   * Manejar envío del formulario
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ofertaId || !oferta) return;

    // Validar campos
    if (!form.cantidad || form.cantidad <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }
    if (!form.plazo) {
      setError('El plazo es requerido');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const normalizedPlazo = form.plazo; // El date picker ya devuelve YYYY-MM-DD
      
      if (import.meta.env.DEV) {
        console.log('[PaginaAmpliacionOferta] Submitting ampliacion:', {
          ofertaId,
          cantidad: form.cantidad,
          plazo: form.plazo,
          normalizedPlazo
        });
      }

      await ampliarMutation.mutateAsync({
        ofertaId,
        body: {
          cantidad: form.cantidad,
          plazo: normalizedPlazo,
        },
      });

      setPageState('success');
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/rrhh', { state: { tab: 'listado' } });
      }, 2000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      if (import.meta.env.DEV) {
        console.error('[PaginaAmpliacionOferta] Error:', errorMsg);
      }
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // RENDERIZACIÓN
  // ============================================================================

  // Estado: Cargando
  if (pageState === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-gray-600">Cargando oferta...</p>
        </div>
      </div>
    );
  }

  // Estado: Error
  if (pageState === 'error') {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">❌</div>
            <div>
              <h2 className="mb-2 font-semibold text-red-900">Error</h2>
              <p className="mb-4 text-red-800">{error}</p>
              <button
                onClick={() => navigate('/rrhh')}
                className="rounded bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
              >
                Volver a ofertas
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estado: Éxito
  if (pageState === 'success') {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">✅</div>
            <div>
              <h2 className="mb-2 font-semibold text-green-900">Ampliación creada exitosamente</h2>
              <p className="mb-4 text-green-800">
                Se ha solicitado una ampliación de <strong>{form.cantidad} posiciones</strong> con
                plazo <strong>{form.plazo}</strong>.
              </p>
              <p className="text-sm text-green-700">Redirigiendo...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estado: Formulario
  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Ampliar Oferta Laboral</h1>
        <p className="text-gray-600">Solicita más posiciones para esta oferta.</p>
      </header>

      {/* Detalles de la oferta */}
      {oferta && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Código</p>
              <p className="text-lg font-mono font-bold text-gray-900">{oferta.codigo}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Puesto</p>
              <p className="text-lg font-semibold text-gray-900">{oferta.puestoObjetivo}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Cantidad Actual</p>
              <p className="text-lg font-bold text-blue-600">
                {oferta.cantidadInicial +
                  oferta.ampliaciones.reduce((sum, a) => sum + a.cantidad, 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de ampliación */}
      <form onSubmit={handleSubmit} className="max-w-md rounded-lg border border-gray-200 bg-white p-6">
        {/* Error */}
        {error && (
          <div className="mb-4 rounded bg-red-50 p-4 text-sm text-red-800">
            ⚠️ {error}
          </div>
        )}

        {/* Campo: Cantidad */}
        <div className="mb-4">
          <label htmlFor="cantidad" className="block text-sm font-medium text-gray-700">
            Cantidad de posiciones adicionales
          </label>
          <input
            id="cantidad"
            type="number"
            min="1"
            value={form.cantidad === 0 ? '' : form.cantidad}
            onChange={(e) => {
              const nextValue = e.target.value === '' ? 0 : Number(e.target.value);
              setForm((prev) => ({ ...prev, cantidad: Number.isNaN(nextValue) ? 0 : nextValue }));
            }}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            disabled={isSubmitting}
            required
          />
          <p className="mt-1 text-xs text-gray-500">Mínimo 1 posición</p>
        </div>

        {/* Campo: Plazo */}
        <div className="mb-6">
          <FormInput
            label="Plazo"
            name="plazo"
            type="date"
            value={form.plazo}
            onChange={(value) => setForm((prev) => ({ ...prev, plazo: value }))}
            disabled={isSubmitting}
            required
            className="mt-1"
          />
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSubmitting ? 'Enviando...' : 'Crear Ampliación'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/rrhh')}
            disabled={isSubmitting}
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:bg-gray-100"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaginaAmpliacionOferta;
