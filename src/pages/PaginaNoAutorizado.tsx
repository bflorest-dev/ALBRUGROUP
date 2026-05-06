import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, SessionLogoutButton } from '@shared/ui';
import { DsSectionCard, DsStatusBadge } from '@shared/ui/design-system';
import styles from './PaginaNoAutorizado.module.css';

const PaginaNoAutorizado: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.headerActions}>
          <SessionLogoutButton />
        </div>

        <DsSectionCard
          title="Acceso denegado"
          description="No tienes permiso para acceder a esta página"
          className={styles.noticePanel}
        >
          <div className={styles.content}>
            <DsStatusBadge tone="danger" label="403" className={styles.codeBadge} />
            <Button onClick={() => navigate('/panel')} variant="default">
              Volver al panel
            </Button>
          </div>
        </DsSectionCard>
      </div>
    </div>
  );
};

export default PaginaNoAutorizado;
