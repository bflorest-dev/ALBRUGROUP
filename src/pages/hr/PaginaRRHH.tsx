import React, { useState, useRef } from 'react';
import { Search, SlidersHorizontal, Plus } from 'lucide-react';
import { Button, Modal } from '@shared/ui';
import { DsPageShell, DsSectionCard, DsTabs } from '@shared/ui/design-system';
import {
  ListadoOfertasActivas,
  OfertaLaboralForm,
  useOfertasActivas,
} from '@features/hr/job-offers';
import { BandejaPostulaciones } from '@features/hr/applications';
import type { BandejaPostulacionesHandle } from '@features/hr/applications/ui/BandejaPostulaciones';
import { AprobadosSection } from './sections/AprobadosSection';
import { EmpleadosSection } from './sections/EmpleadosSection';
import { ContratosSection } from './sections/ContratosSection';
import styles from './PaginaRRHH.module.css';

type TabId = 'ofertas' | 'reclutar' | 'aprobados' | 'empleados' | 'contratos';

const tabs: { id: TabId; label: string }[] = [
  { id: 'ofertas', label: 'Ofertas Activas' },
  { id: 'reclutar', label: 'Reclutar' },
  { id: 'aprobados', label: 'Aprobados' },
  { id: 'empleados', label: 'Empleados' },
  { id: 'contratos', label: 'Contratos' },
];

const PaginaRRHH: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('ofertas');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const postulacionesRef = useRef<BandejaPostulacionesHandle | null>(null);
  const {
    data: ofertasActivas,
    isLoading: ofertasLoading,
    error: ofertasError,
    refetch: refetchOfertasActivas,
  } = useOfertasActivas();

  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => setIsCreateModalOpen(false);
  const handleCreateSuccess = () => {
    closeCreateModal();
  };

  const openCreatePostulacionModal = () => {
    postulacionesRef.current?.openCreatePostulante();
  };

  return (
    <>
      <DsPageShell
        eyebrow="Recursos Humanos"
        title="Recursos Humanos"
        subtitle="Gestiona ofertas laborales y candidatos de manera eficiente"
      >
        <DsTabs
          value={activeTab}
          onChange={setActiveTab}
          items={tabs.map((tab) => ({ value: tab.id, label: tab.label }))}
          className="rrhh-tabs-theme"
        />

        {activeTab === 'ofertas' && (
          <>
            <DsSectionCard>
              <div className={styles.toolbar}>
                <Button type="button" onClick={openCreateModal} variant="default">
                  <Plus size={16} />
                  Nueva Oferta
                </Button>
                <div className={styles.searchActions}>
                  <label className={styles.searchField}>
                    <Search size={16} className={styles.searchIcon} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Buscar por código, negocio o puesto..."
                      className={styles.searchInput}
                    />
                  </label>
                  <Button type="button" variant="secondary">
                    <SlidersHorizontal size={16} />
                    Filtros
                  </Button>
                </div>
              </div>
            </DsSectionCard>

            <ListadoOfertasActivas
              ofertasActivas={ofertasActivas}
              ofertasLoading={ofertasLoading}
              ofertasError={ofertasError}
              onRefetchOfertas={refetchOfertasActivas}
              searchTerm={searchTerm}
              hideCreateButton
              hideRefreshButton
              onCreate={openCreateModal}
            />
          </>
        )}

        {activeTab === 'reclutar' && (
          <DsSectionCard
            title="Reclutar"
            description="Gestiona las postulaciones en la fase de reclutamiento."
            actions={(
              <Button type="button" onClick={openCreatePostulacionModal} variant="default">
                <Plus size={16} />
                Crear Postulación
              </Button>
            )}
          >
            <BandejaPostulaciones
              ref={postulacionesRef}
              activeSection="reclutamiento"
              hideTabs
              hideHeader
              hideCreateButton
            />
          </DsSectionCard>
        )}

        {activeTab === 'aprobados' && (
          <DsSectionCard>
            <AprobadosSection />
          </DsSectionCard>
        )}

        {activeTab === 'empleados' && (
          <DsSectionCard>
            <EmpleadosSection />
          </DsSectionCard>
        )}

        {activeTab === 'contratos' && (
          <DsSectionCard>
            <ContratosSection />
          </DsSectionCard>
        )}
      </DsPageShell>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        title="Crear Nueva Oferta"
        size="lg"
        className="rrhh-modal-theme"
      >
        <OfertaLaboralForm
          onSuccess={handleCreateSuccess}
          onCancel={closeCreateModal}
          isModal={true}
        />
      </Modal>
    </>
  );
};

export default PaginaRRHH;
