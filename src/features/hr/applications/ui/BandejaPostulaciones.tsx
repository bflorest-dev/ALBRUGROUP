/**
 * @organism BandejaPostulaciones — Componente principal
 * Gestiona tabs (Reclutar, Contratar)
 * Integra modales para crear, tipificar y confirmar contratación
 * FSD: caracteristicas/rrhh/postulaciones/ui
 */

import React, { useState, useMemo, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Plus, Check } from 'lucide-react';
import { Modal, Button } from '@shared/ui';
import {
  useBandejaReclutamiento,
  useBandejaCapacitacion,
  useBandejaContratacion,
} from '../hooks';
import { getUltimaTipificacion } from '@features/recruitment/hooks/useUltimaTipificacion';
import type { PostulacionResponse, OfertaLaboralSimple } from '../model';
import { TablaBandeja } from './TablaBandeja';
import { FormCrearPostulacion } from './FormCrearPostulacion';
import { FormConfirmarContratacion } from './FormConfirmarContratacion';
import { PostulacionEventosModal } from './PostulacionEventosModal.tsx';

export interface BandejaPostulacionesHandle {
  openCreatePostulante(): void;
}

type TabActiva = 'reclutamiento' | 'contratacion';
type ModalAbierto =
  | null
  | 'crear'
  | 'historial'
  | 'confirmar'
  | 'editar';

const TABS = [
  { id: 'reclutamiento' as TabActiva, label: 'Reclutar' },
  { id: 'contratacion' as TabActiva, label: 'Contratar' },
];

interface BandejaPostulacionesProps {
  activeSection?: TabActiva;
  hideTabs?: boolean;
  hideHeader?: boolean;
  hideCreateButton?: boolean;
}

/**
 * Ofertas disponibles simuladas. En producción, vendrían de una API
 */
const OFERTAS_DISPONIBLES: OfertaLaboralSimple[] = [
  { id: 1, codigo: 'INF-001', titulo: 'Ingeniero Informático' },
  { id: 2, codigo: 'ADM-001', titulo: 'Administrador de Sistemas' },
  { id: 3, codigo: 'VENTAS-001', titulo: 'Ejecutivo de Ventas' },
];

interface SuccessMessage {
  visible: boolean;
  text: string;
}

export const BandejaPostulaciones = forwardRef<
  BandejaPostulacionesHandle,
  BandejaPostulacionesProps
>(({ activeSection, hideTabs = false, hideHeader = false, hideCreateButton = false }, ref) => {
  const [tabActiva, setTabActiva] = useState<TabActiva>(
    activeSection ?? 'reclutamiento'
  );
  const [modalAbierto, setModalAbierto] = useState<ModalAbierto>(null);
  const [postulacionSeleccionada, setPostulacionSeleccionada] =
    useState<PostulacionResponse | null>(null);
  const [successMessage, setSuccessMessage] = useState<SuccessMessage>({
    visible: false,
    text: '',
  });

  React.useEffect(() => {
    if (activeSection) {
      setTabActiva(activeSection);
    }
  }, [activeSection]);

  const isReclutamientoTab = tabActiva === 'reclutamiento';
  const isContratacionTab = tabActiva === 'contratacion';

  // Hooks de bandeja
  const bandejaReclutamiento = useBandejaReclutamiento({
    enabled: isReclutamientoTab,
    refetchIntervalMs: 0, // Desactivar polling automático
    syncBetweenTabs: true,
  });
  const bandejaCapacitacion = useBandejaCapacitacion({
    enabled: isReclutamientoTab,
    refetchIntervalMs: 0, // Desactivar polling automático
    syncBetweenTabs: true,
  });
  const bandejaContratacion = useBandejaContratacion({ enabled: isContratacionTab });

  const reclutamientoData = useMemo(() => {
    const source = [
      ...(bandejaReclutamiento.data || []),
      ...(bandejaCapacitacion.data || []),
    ];
    const byId = new Map<number, PostulacionResponse>();
    source.forEach((item) => {
      byId.set(item.id, item);
    });
    return Array.from(byId.values());
  }, [bandejaReclutamiento.data, bandejaCapacitacion.data]);

  const contratacionData = useMemo(() => bandejaContratacion.data || [], [bandejaContratacion.data]);

  const tablaData = useMemo(() => {
    return tabActiva === 'reclutamiento' ? reclutamientoData : contratacionData;
  }, [tabActiva, reclutamientoData, contratacionData]);

  const tipificacionQueries = useQueries({
    queries: tablaData.map((post) => ({
      queryKey: ['ultima-tipificacion', post.id],
      queryFn: () => getUltimaTipificacion(post.id),
      staleTime: 0, // CRÍTICO: Cambiar a 0 para forzar refetch inmediato
      refetchOnMount: 'always', // Siempre refetch al montar
      enabled: post.id > 0,
    })),
  });

  const tablaDataEnriquecida = useMemo(() => {
    return tablaData.map((post, index) => {
      const ultimaTipificacion = tipificacionQueries[index]?.data;
      const codigoTipificacion = ultimaTipificacion?.codigo ?? null;
      return {
        ...post,
        tipificacion: codigoTipificacion
          ? {
              id: ultimaTipificacion?.id ?? null,
              codigo: codigoTipificacion,
            }
          : post.tipificacion,
        codigoTipificacion:
          codigoTipificacion ?? post.codigoTipificacion ?? null,
      };
    });
  }, [tablaData, tipificacionQueries]);

  const reclutamientoLoading = bandejaReclutamiento.loading || bandejaCapacitacion.loading;

  const reclutamientoError = bandejaReclutamiento.error || bandejaCapacitacion.error;

  const datosActuales = useMemo(() => {
    const refetchReclutamiento = async () => {
      await Promise.allSettled([
        bandejaReclutamiento.refetch(),
        bandejaCapacitacion.refetch(),
      ]);
    };

    switch (tabActiva) {
      case 'reclutamiento':
        return {
          data: tablaDataEnriquecida,
          loading: reclutamientoLoading,
          error: reclutamientoError,
          refetch: refetchReclutamiento,
        };
      case 'contratacion':
        return {
          data: tablaDataEnriquecida,
          loading: bandejaContratacion.loading,
          error: bandejaContratacion.error,
          refetch: bandejaContratacion.refetch,
        };
      default:
        return {
          data: reclutamientoData,
          loading: reclutamientoLoading,
          error: reclutamientoError,
          refetch: refetchReclutamiento,
        };
    }
  }, [
    tabActiva,
    reclutamientoData,
    reclutamientoLoading,
    reclutamientoError,
    bandejaReclutamiento,
    bandejaCapacitacion,
    bandejaContratacion,
  ]);

  // Manejadores de modal
  const abrirModalCrear = useCallback(() => {
    setPostulacionSeleccionada(null);
    setModalAbierto('crear');
  }, []);

  useImperativeHandle(ref, () => ({
    openCreatePostulante: abrirModalCrear,
  }), [abrirModalCrear]);

  const abrirModalEditar = (post: PostulacionResponse) => {
    setPostulacionSeleccionada(post);
    setModalAbierto('editar');
  };

  const abrirModalHistorial = (post: PostulacionResponse) => {
    setPostulacionSeleccionada(post);
    setModalAbierto('historial');
  };

  const abrirModalConfirmar = (post: PostulacionResponse) => {
    setPostulacionSeleccionada(post);
    setModalAbierto('confirmar');
  };

  const cerrarModal = () => {
    setModalAbierto(null);
    setPostulacionSeleccionada(null);
  };

  // Callback de éxito
  const handleExitoModal = async () => {
    setSuccessMessage({
      visible: true,
      text: `Postulación ${
        modalAbierto === 'crear' || modalAbierto === 'editar'
          ? 'guardada'
            : 'contratada'
      } exitosamente`,
    });

    cerrarModal();
    await datosActuales.refetch?.();

    // Limpiar mensaje después de 3 segundos
    setTimeout(() => {
      setSuccessMessage({ visible: false, text: '' });
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Postulaciones
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gestiona postulantes en todo el proceso de selección
          </p>
        </>
      )}
      {!hideCreateButton && (
        <div className="mt-4">
          <Button
            onClick={abrirModalCrear}
            variant="primary"
            className="flex items-center gap-2"
          >
            <Plus size={18} />
            Registrar Postulante
          </Button>
        </div>
      )}

      {/* Mensaje de éxito */}
      {successMessage.visible && (
        <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
          <Check size={18} />
          {successMessage.text}
        </div>
      )}

      {!hideTabs && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex gap-8" aria-label="Tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  tabActiva === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Botón Actualizar */}
      <div className="text-right">
        <Button
          onClick={datosActuales.refetch}
          variant="ghost"
          size="sm"
          disabled={datosActuales.loading}
        >
          Actualizar
        </Button>
      </div>

      {/* Tabla de contenido */}
      <TablaBandeja
        postulaciones={datosActuales.data || []}
        loading={datosActuales.loading}
        error={datosActuales.error}
        onRetry={datosActuales.refetch}
        onCreate={abrirModalCrear}
        onEditar={abrirModalEditar}
        onVerHistorial={abrirModalHistorial}
        onConfirmarContratacion={
          tabActiva === 'contratacion' ? abrirModalConfirmar : undefined
        }
      />

      {/* MODAL: Crear Postulación */}
      <Modal
        isOpen={modalAbierto === 'crear'}
        onClose={cerrarModal}
        title="Nueva Postulación"
        size="lg"
        className="rrhh-modal-theme"
      >
        <FormCrearPostulacion
          onSuccess={handleExitoModal}
          onCancel={cerrarModal}
          ofertasDisponibles={OFERTAS_DISPONIBLES}
        />
      </Modal>

      {/* MODAL: Editar Postulación */}
      <Modal
        isOpen={modalAbierto === 'editar' && !!postulacionSeleccionada}
        onClose={cerrarModal}
        title="Editar Postulación"
        size="lg"
        className="rrhh-modal-theme"
      >
        {postulacionSeleccionada && (
          <FormCrearPostulacion
            onSuccess={handleExitoModal}
            onCancel={cerrarModal}
            ofertasDisponibles={OFERTAS_DISPONIBLES}
            postulacionExistente={postulacionSeleccionada}
          />
        )}
      </Modal>

      {/* MODAL: Historial de Postulación */}
      <Modal
        isOpen={modalAbierto === 'historial' && !!postulacionSeleccionada}
        onClose={cerrarModal}
        title="Historial de Postulación"
        size="xl"
        className="rrhh-modal-theme"
      >
        {postulacionSeleccionada && (
          <PostulacionEventosModal
            postulacionId={postulacionSeleccionada.id}
            nombrePostulante={`${postulacionSeleccionada.postulante.nombres} ${postulacionSeleccionada.postulante.apellidos}`}
          />
        )}
      </Modal>

      {/* MODAL: Confirmar Contratación */}
      <Modal
        isOpen={modalAbierto === 'confirmar' && !!postulacionSeleccionada}
        onClose={cerrarModal}
        title="Confirmar Contratación"
        size="md"
        className="rrhh-modal-theme"
      >
        {postulacionSeleccionada && (
          <FormConfirmarContratacion
            idPostulacion={postulacionSeleccionada.id}
            onSuccess={handleExitoModal}
            onCancel={cerrarModal}
          />
        )}
      </Modal>
    </div>
  );
});
