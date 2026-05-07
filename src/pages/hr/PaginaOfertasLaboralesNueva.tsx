/**
 * PaginaOfertasLaboralesNueva
 * Página para crear nuevas ofertas laborales
 * Ruta: /rrhh/ofertas-laborales/nueva
 * Roles permitidos: ADMINISTRADOR, RRHH
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@shared/ui';
import { DsPageShell, DsSectionCard } from '@shared/ui/design-system';
import { OfertaLaboralForm } from '@features/hr/job-offers';
import styles from './PaginaOfertasLaboralesNueva.module.css';

export function PaginaOfertasLaboralesNueva() {
  const navigate = useNavigate();

  /**
   * Manejar éxito - navegar de vuelta a lista de ofertas (cuando exista)
   */
  const handleSuccess = (id: number) => {
    console.log('Oferta creada exitosamente:', id);
    // TODO: Navegar a lista de ofertas cuando esté implementada
    // navigate('/rrhh/ofertas-laborales', { state: { newId: id } });
    navigate('/rrhh', { state: { tab: 'ofertas', newId: id } });
  };

  /**
   * Manejar cancelación - navegar de vuelta a RRHH
   */
  const handleCancel = () => {
    navigate('/rrhh');
  };

  return (
    <DsPageShell
      eyebrow="Recursos Humanos"
      title="Crear Nueva Oferta Laboral"
      subtitle="Completa el formulario para registrar una nueva oferta de empleo en el sistema"
      actions={(
        <Button variant="ghost" onClick={handleCancel}>
          ← Volver a RRHH
        </Button>
      )}
    >
      <DsSectionCard className={styles.formWrapper}>
        <OfertaLaboralForm onSuccess={handleSuccess} onCancel={handleCancel} className={styles.form} />
      </DsSectionCard>
    </DsPageShell>
  );
}

export default PaginaOfertasLaboralesNueva;
