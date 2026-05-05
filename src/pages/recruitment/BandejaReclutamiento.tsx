import React, { useCallback, useMemo, useState } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { Alert, Modal } from '@shared/ui';
import { DsEyebrow, DsSectionCard } from '@shared/ui/design-system';
import {
  useBandejaReclutamiento,
  useCatalogoTipificaciones,
} from '@features/hr/applications/hooks';
import { FormTipificarPostulacion } from '@features/hr/applications/ui/FormTipificarPostulacion';
import type { PostulacionResponse } from '@features/hr/applications/model';
import { ReclutamientoSummary } from '@features/recruitment/ui/ReclutamientoSummary';
import { KanbanBoard } from '@features/recruitment/ui/KanbanBoard';
import { useKanbanLogic } from '@features/recruitment/hooks/useKanbanLogic';
import { getUltimaTipificacion } from '@features/recruitment/hooks/useUltimaTipificacion';
import styles from './BandejaReclutamiento.module.css';

const BandejaReclutamiento: React.FC = () => {
  const bandejaReclutamientoHook = useBandejaReclutamiento({
    refetchIntervalMs: 3000,
    syncBetweenTabs: true,
  });
  const catalogoHook = useCatalogoTipificaciones('RECLUTAMIENTO');
  const queryClient = useQueryClient();

  const [postulacionSeleccionada, setPostulacionSeleccionada] =
    useState<PostulacionResponse | null>(null);
  const [columnaSeleccionada, setColumnaSeleccionada] = useState<string | null>(null);
  const [isModalTipificarOpen, setIsModalTipificarOpen] = useState(false);

  const postulaciones = useMemo(() => {
    const source = bandejaReclutamientoHook.data ?? [];
    return source.filter((post) => {
      const etapa = String(
        post.etapaProceso ??
          (post as any).etapa ??
          (post as any).etapa_proceso ??
          ''
      )
        .trim()
        .toUpperCase();
      return etapa === 'RECLUTAMIENTO';
    });
  }, [bandejaReclutamientoHook.data]);

  const loading = bandejaReclutamientoHook.loading;
  const error = bandejaReclutamientoHook.error;

  const refetch = useCallback(async () => {
    await bandejaReclutamientoHook.refetch();
  }, [bandejaReclutamientoHook]);

  const tipificacionesQueries = useQueries({
    queries: postulaciones.map((post) => ({
      queryKey: ['tipificacion', post.id],
      queryFn: () => getUltimaTipificacion(post.id),
      staleTime: 5 * 60 * 1000,
      enabled: post.id > 0,
    })),
  });

  const postulacionesEnriquecidas = useMemo(() => {
    return postulaciones.map((post, index) => {
      const tipificacionData = tipificacionesQueries[index]?.data;
      const idTipificacion = tipificacionData?.id ?? null;
      const codigoTipificacion = tipificacionData?.codigo ?? null;

      return {
        ...post,
        tipificacion: codigoTipificacion
          ? {
              id: idTipificacion,
              codigo: codigoTipificacion,
            }
          : post.tipificacion ?? null,
        idTipificacion: idTipificacion ?? post.idTipificacion ?? null,
        codigoTipificacion: codigoTipificacion ?? post.codigoTipificacion ?? null,
      };
    });
  }, [postulaciones, tipificacionesQueries]);

  const { updatePostulacionEstado } = useKanbanLogic({
    tipificaciones: Array.isArray(catalogoHook.data) ? catalogoHook.data : [],
    onSuccess: refetch,
  });

  const abrirModalTipificar = (post: PostulacionResponse, columnId?: string) => {
    setPostulacionSeleccionada(post);
    setColumnaSeleccionada(columnId ?? null);
    setIsModalTipificarOpen(true);
  };

  const cerrarModalTipificar = () => {
    setPostulacionSeleccionada(null);
    setColumnaSeleccionada(null);
    setIsModalTipificarOpen(false);
  };

  const handleTipificarExito = async () => {
    cerrarModalTipificar();
    await refetch();
    await queryClient.invalidateQueries({ queryKey: ['tipificacion'] });
  };

  const catalogo = Array.isArray(catalogoHook.data) ? catalogoHook.data : [];

  return (
    <section className={styles.pageSection}>
      <DsSectionCard className={styles.heroCard}>
        <DsEyebrow>Reclutamiento</DsEyebrow>
        <h2 className={styles.heroTitle}>Bandeja de Reclutamiento</h2>
        <p className={styles.heroDescription}>
          Revisa postulaciones, tipifica y monitorea el avance en el tablero Kanban.
        </p>
      </DsSectionCard>

      {error && (
        <Alert
          type="error"
          message="No se pudo cargar la bandeja de reclutamiento"
          onClose={() => refetch()}
        />
      )}

      {catalogoHook.error && (
        <Alert
          type="error"
          message="No se pudo cargar el catálogo de tipificaciones"
          onClose={() => catalogoHook.refetch()}
        />
      )}

      <ReclutamientoSummary
        postulaciones={postulacionesEnriquecidas}
        className={styles.summaryGrid}
      />

      <DsSectionCard
        title="Tablero Kanban"
        description="Cambia estado mediante tipificación y revisa historial de eventos por postulante."
        className={styles.kanbanCard}
      >
        <KanbanBoard
          postulaciones={postulacionesEnriquecidas}
          tipificaciones={catalogo}
          loading={loading || catalogoHook.loading}
          onTipificar={abrirModalTipificar}
          onUpdatePostulacion={updatePostulacionEstado}
        />
      </DsSectionCard>

      <Modal
        isOpen={isModalTipificarOpen && !!postulacionSeleccionada}
        onClose={cerrarModalTipificar}
        title="Tipificar Postulación"
        size="md"
        className="rrhh-modal-theme"
      >
        {postulacionSeleccionada && (
          <FormTipificarPostulacion
            idPostulacion={postulacionSeleccionada.id}
            etapa={postulacionSeleccionada.etapaProceso}
            estadoBandejaActual={
              columnaSeleccionada ?? postulacionSeleccionada.estadoBandeja
            }
            onSuccess={handleTipificarExito}
            onCancel={cerrarModalTipificar}
          />
        )}
      </Modal>
    </section>
  );
};

export default BandejaReclutamiento;
