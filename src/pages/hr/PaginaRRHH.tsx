import React, { useState, useRef } from 'react';
import { Search, SlidersHorizontal, Plus } from 'lucide-react';
import { Button, Modal, SessionLogoutButton } from '@shared/ui';
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
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerRow}>
            <div>
              <p className={styles.eyebrow}>Recursos Humanos</p>
              <h1>Recursos Humanos</h1>
              <p className={styles.subtitle}>Gestiona ofertas laborales y candidatos de manera eficiente</p>
            </div>
            <SessionLogoutButton />
          </div>
        </header>

        <nav className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`.trim()}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <main className={styles.content}>
          {activeTab === 'ofertas' && (
            <section className={styles.section}>
              <div className={styles.toolbarPanel}>
                <div className={styles.toolbar}>
                  <Button type="button" onClick={openCreateModal} variant="primary">
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
              </div>

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
            </section>
          )}

          {activeTab === 'reclutar' && (
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <div>
                  <h2 className={styles.sectionTitle}>Reclutar</h2>
                  <p className={styles.sectionDescription}>Gestiona las postulaciones en la fase de reclutamiento.</p>
                </div>
                <Button type="button" onClick={openCreatePostulacionModal} variant="primary">
                  <Plus size={16} />
                  Crear Postulación
                </Button>
              </div>
              <BandejaPostulaciones
                ref={postulacionesRef}
                activeSection="reclutamiento"
                hideTabs
                hideHeader
                hideCreateButton
              />
            </section>
          )}

          {activeTab === 'aprobados' && (
            <section className={styles.section}>
              <AprobadosSection />
            </section>
          )}

          {activeTab === 'empleados' && (
            <section className={styles.section}>
              <EmpleadosSection />
            </section>
          )}

          {activeTab === 'contratos' && (
            <section className={styles.section}>
              <ContratosSection />
            </section>
          )}
        </main>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        title="Crear Nueva Oferta"
        size="lg"
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
