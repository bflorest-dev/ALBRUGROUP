import React, { useMemo, useState } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { Alert, Modal } from '@shared/ui';
import { useBandejaReclutamiento, useCatalogoTipificaciones } from '@features/rrhh/postulaciones/hooks';
import { FormTipificarPostulacion } from '@features/rrhh/postulaciones/ui/FormTipificarPostulacion';
import type { PostulacionResponse } from '@features/rrhh/postulaciones/model';
import { ReclutamientoSummary } from '@features/reclutamiento/components/ReclutamientoSummary';
import { KanbanBoard } from '@features/reclutamiento/components/KanbanBoard';
import { useKanbanLogic } from '@features/reclutamiento/hooks/useKanbanLogic';
import { getUltimaTipificacion } from '@features/reclutamiento/hooks/useUltimaTipificacion';

const BandejaReclutamiento: React.FC = () => {
  const { data, loading, error, refetch } = useBandejaReclutamiento();
  const catalogoHook = useCatalogoTipificaciones('RECLUTAMIENTO');
  const queryClient = useQueryClient();

  const [postulacionSeleccionada, setPostulacionSeleccionada] =
    useState<PostulacionResponse | null>(null);
  const [columnaSeleccionada, setColumnaSeleccionada] = useState<string | null>(null);
  const [isModalTipificarOpen, setIsModalTipificarOpen] = useState(false);

  const postulaciones = useMemo(() => data ?? [], [data]);

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
    <section className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-brand-600">
          Reclutamiento
        </p>
        <h2 className="mt-3 text-2xl font-bold text-slate-900">Bandeja de Reclutamiento</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Revisa postulaciones, tipifica y monitorea el avance en el tablero Kanban.
        </p>
      </div>

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

      <ReclutamientoSummary postulaciones={postulacionesEnriquecidas} />

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-slate-900">Tablero Kanban</h3>
          <p className="mt-1 text-sm text-slate-600">
            Cambia estado mediante tipificación y revisa historial de eventos por postulante.
          </p>
        </div>
        <KanbanBoard
          postulaciones={postulacionesEnriquecidas}
          tipificaciones={catalogo}
          loading={loading || catalogoHook.loading}
          onTipificar={abrirModalTipificar}
          onUpdatePostulacion={updatePostulacionEstado}
        />
      </div>

      <Modal
        isOpen={isModalTipificarOpen && !!postulacionSeleccionada}
        onClose={cerrarModalTipificar}
        title="Tipificar Postulación"
        size="md"
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
