/**
 * Componente contenedor para listado de ofertas laborales activas
 * Orquesta carga, errores y renderización + Modal para crear nueva
 */

import { useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import type { OfertaLaboralResponse } from '@shared/types';
import { OfertaCard } from './OfertaCard';
import { SkeletonOfertaCard } from './SkeletonOfertaCard';
import { VacioOfertasActivas } from './VacioOfertasActivas';
import { ErrorOfertasActivas } from './ErrorOfertasActivas';
import { Modal } from '@shared/ui';
import { DsSectionCard } from '@shared/ui/design-system';
import { AmpliarOfertaModal } from './AmpliarOfertaModal';
import { OfertaDetallesModal } from './OfertaDetallesModal';
import { OfertaLaboralForm } from '../index';

interface ListadoOfertasActivasProps {
  ofertasActivas: OfertaLaboralResponse[] | null;
  ofertasLoading: boolean;
  ofertasError: string | null;
  onRefetchOfertas: () => Promise<void>;
  searchTerm?: string;
  hideHeader?: boolean;
  hideCreateButton?: boolean;
  hideRefreshButton?: boolean;
  onCreate?: () => void;
  isCreateModalOpen?: boolean;
  onCloseCreateModal?: () => void;
}

export function ListadoOfertasActivas({
  ofertasActivas,
  ofertasLoading,
  ofertasError,
  onRefetchOfertas,
  searchTerm = '',
  hideHeader = false,
  hideCreateButton = false,
  hideRefreshButton = false,
  onCreate,
  isCreateModalOpen,
  onCloseCreateModal,
}: ListadoOfertasActivasProps): ReactElement {
  const ofertas = ofertasActivas;
  const isLoading = ofertasLoading;
  const error = ofertasError;
  const refetch = onRefetchOfertas;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOferta, setSelectedOferta] = useState<OfertaLaboralResponse | null>(null);
  const [selectedModal, setSelectedModal] = useState<'detalles' | 'ampliar' | null>(null);

  const trimmedSearch = searchTerm.trim().toLowerCase();

  const filteredOfertas = useMemo(() => {
    if (!ofertas || trimmedSearch === '') {
      return ofertas ?? [];
    }

    return ofertas.filter((oferta) => {
      const searchFields = [
        oferta.codigo,
        oferta.negocio,
        oferta.puestoObjetivo,
        oferta.horario,
      ].join(' ');
      return searchFields.toLowerCase().includes(trimmedSearch);
    });
  }, [ofertas, trimmedSearch]);

  const handleCloseModal = () => {
    if (onCloseCreateModal) {
      onCloseCreateModal();
      return;
    }
    setIsModalOpen(false);
  };

  const handleSuccessCreate = () => {
    if (onCloseCreateModal) {
      onCloseCreateModal();
    } else {
      setIsModalOpen(false);
    }
    refetch();
  };

  const handleCreateButton = () => {
    if (onCreate) {
      onCreate();
      return;
    }
    setIsModalOpen(true);
  };

  if (isLoading && !ofertas) {
    return (
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <SkeletonOfertaCard key={idx} />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorOfertasActivas error={error} onReintentar={refetch} />;
  }

  if ((!ofertas || ofertas.length === 0) && filteredOfertas.length === 0) {
    return (
      <DsSectionCard>
        <VacioOfertasActivas onCrear={handleCreateButton} />
      </DsSectionCard>
    );
  }

  return (
    <div>
      {!hideHeader && (
        <div className="mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Ofertas Activas <span className="text-slate-500">({filteredOfertas.length})</span>
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Mostrando {filteredOfertas.length} ofertas en total
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredOfertas.map((oferta, index) => (
          <OfertaCard
            key={oferta.id}
            oferta={oferta}
            index={index}
            onOpenDetails={(ofertaSeleccionada) => {
              setSelectedOferta(ofertaSeleccionada);
              setSelectedModal('detalles');
            }}
            onOpenAmpliar={(ofertaSeleccionada) => {
              setSelectedOferta(ofertaSeleccionada);
              setSelectedModal('ampliar');
            }}
          />
        ))}
      </div>

      {selectedOferta && selectedModal === 'detalles' && (
        <OfertaDetallesModal
          oferta={selectedOferta}
          isOpen={true}
          onClose={() => {
            setSelectedModal(null);
            setSelectedOferta(null);
          }}
        />
      )}

      {selectedOferta && selectedModal === 'ampliar' && (
        <AmpliarOfertaModal
          oferta={selectedOferta}
          isOpen={true}
          onClose={() => {
            setSelectedModal(null);
            setSelectedOferta(null);
          }}
          onSuccess={() => {
            setSelectedModal(null);
            setSelectedOferta(null);
          }}
        />
      )}

      <Modal
        isOpen={isCreateModalOpen ?? isModalOpen}
        onClose={handleCloseModal}
        title="Crear Nueva Oferta Laboral"
        size="lg"
        className="rrhh-modal-theme"
      >
        <OfertaLaboralForm onSuccess={handleSuccessCreate} onCancel={handleCloseModal} isModal={true} />
      </Modal>
    </div>
  );
}
