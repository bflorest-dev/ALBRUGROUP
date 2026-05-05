/**
 * Página para crear ampliación de oferta laboral
 * Ruta: /rrhh/ofertas-laborales/{id}/ampliacion
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAmpliarOfertaLaboral } from '@features/hr/job-offers';
import { OfertaLaboralService } from '@entities/job-offer/api/ofertaLaboralService';
import { Button, Spinner } from '@shared/ui';
import { FlatpickrDateInput } from '@shared/ui/date-picker';
import { DsInlineMessage, DsPageShell, DsSectionCard, DsStatusBadge } from '@shared/ui/design-system';
import type { OfertaLaboralResponse } from '@shared/types';
import styles from './PaginaAmpliacionOferta.module.css';

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
      <DsPageShell
        eyebrow="Recursos Humanos"
        title="Ampliar Oferta Laboral"
        subtitle="Cargando información de la oferta."
      >
        <DsSectionCard>
          <div className={styles.centerState}>
            <Spinner size="large" text="Cargando oferta..." />
          </div>
        </DsSectionCard>
      </DsPageShell>
    );
  }

  // Estado: Error
  if (pageState === 'error') {
    return (
      <DsPageShell
        eyebrow="Recursos Humanos"
        title="Ampliar Oferta Laboral"
        subtitle="No se pudo cargar la oferta solicitada."
      >
        <DsSectionCard>
          <DsInlineMessage tone="danger">{error}</DsInlineMessage>
          <div className={styles.actionsRow}>
            <Button onClick={() => navigate('/rrhh')} variant="danger">
              Volver a ofertas
            </Button>
          </div>
        </DsSectionCard>
      </DsPageShell>
    );
  }

  // Estado: Éxito
  if (pageState === 'success') {
    return (
      <DsPageShell
        eyebrow="Recursos Humanos"
        title="Ampliar Oferta Laboral"
        subtitle="La solicitud se registró correctamente."
      >
        <DsSectionCard>
          <DsInlineMessage tone="success">
            Se ha solicitado una ampliación de {form.cantidad} posiciones con plazo {form.plazo}.
          </DsInlineMessage>
          <p className={styles.redirectMessage}>Redirigiendo...</p>
        </DsSectionCard>
      </DsPageShell>
    );
  }

  // Estado: Formulario
  return (
    <DsPageShell
      eyebrow="Recursos Humanos"
      title="Ampliar Oferta Laboral"
      subtitle="Solicita más posiciones para esta oferta."
    >
      {oferta && (
        <DsSectionCard title="Detalle de la oferta">
          <div className={styles.offerGrid}>
            <div>
              <p className={styles.metaLabel}>Código</p>
              <p className={styles.metaValue}>{oferta.codigo}</p>
            </div>
            <div>
              <p className={styles.metaLabel}>Puesto</p>
              <p className={styles.metaValue}>{oferta.puestoObjetivo}</p>
            </div>
            <div>
              <p className={styles.metaLabel}>Cantidad actual</p>
              <DsStatusBadge
                tone="info"
                label={
                  oferta.cantidadInicial +
                  oferta.ampliaciones.reduce((sum, a) => sum + a.cantidad, 0)
                }
              />
            </div>
          </div>
        </DsSectionCard>
      )}

      <DsSectionCard title="Formulario de ampliación">
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <DsInlineMessage tone="danger">{error}</DsInlineMessage>}

          <div className={styles.fieldGroup}>
            <label htmlFor="cantidad" className={styles.fieldLabel}>
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
              className={styles.numberInput}
              disabled={isSubmitting}
              required
            />
            <p className={styles.fieldHint}>Mínimo 1 posición</p>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="plazo" className={styles.fieldLabel}>
              Plazo
            </label>
            <FlatpickrDateInput
              id="plazo"
              name="plazo"
              value={form.plazo}
              onChange={(value) => setForm((prev) => ({ ...prev, plazo: value }))}
              disabled={isSubmitting}
              required
              showRequiredMessage={false}
            />
          </div>

          <div className={styles.actionsRow}>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Crear Ampliación
            </Button>
            <Button
              type="button"
              onClick={() => navigate('/rrhh')}
              disabled={isSubmitting}
              variant="secondary"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DsSectionCard>
    </DsPageShell>
  );
};

export default PaginaAmpliacionOferta;
