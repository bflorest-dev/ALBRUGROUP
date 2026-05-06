/**
 * Página: Listado de ofertas laborales activas
 * Ruta: /rrhh/ofertas-laborales
 */

import { useState } from 'react';
import type { ReactElement } from 'react';
import { Search, SlidersHorizontal, Plus } from 'lucide-react';
import { Button } from '@shared/ui';
import { DsPageShell, DsSectionCard } from '@shared/ui/design-system';
import { ListadoOfertasActivas, useOfertasActivas } from '@features/hr/job-offers';
import styles from './PaginaListadoOfertasActivas.module.css';

const PaginaListadoOfertasActivas = (): ReactElement => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const {
    data: ofertasActivas,
    isLoading: ofertasLoading,
    error: ofertasError,
    refetch: refetchOfertasActivas,
  } = useOfertasActivas();

  return (
    <DsPageShell
      eyebrow="Recursos Humanos"
      title="Gestiona ofertas laborales y candidatos de manera eficiente"
      subtitle="Explora ofertas activas, filtra por negocio o puesto y administra tus procesos desde una única vista."
    >
      <DsSectionCard
        title="Ofertas activas"
        description="Mostrando todas las ofertas disponibles"
      >
        <div className={styles.searchRow}>
          <label className={styles.searchField}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código, negocio o puesto..."
              className={styles.searchInput}
            />
          </label>

          <Button
            type="button"
            variant="secondary"
            className={styles.filterButton}
          >
            <SlidersHorizontal size={16} />
            Filtros
          </Button>

          <Button
            type="button"
            variant="default"
            className={styles.createButton}
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} />
            Nueva Oferta
          </Button>
        </div>

        <ListadoOfertasActivas
          ofertasActivas={ofertasActivas}
          ofertasLoading={ofertasLoading}
          ofertasError={ofertasError}
          onRefetchOfertas={refetchOfertasActivas}
          searchTerm={searchTerm}
          hideHeader
          hideCreateButton
          hideRefreshButton
          onCreate={() => setShowCreateModal(true)}
          isCreateModalOpen={showCreateModal}
          onCloseCreateModal={() => setShowCreateModal(false)}
        />
      </DsSectionCard>
    </DsPageShell>
  );
};

export default PaginaListadoOfertasActivas;
