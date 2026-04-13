import React from 'react';
import { ReclutamientoStatusCard } from './ReclutamientoStatusCard';
import type { PostulacionResponse } from '@features/rrhh/postulaciones/model';

interface ReclutamientoSummaryProps {
  postulaciones: PostulacionResponse[];
}

export const ReclutamientoSummary: React.FC<ReclutamientoSummaryProps> = ({ postulaciones }) => {
  const total = postulaciones.length;
  const postulantesNegros = postulaciones.filter((post) => post.postulante.listaNegra).length;
  const enProceso = postulaciones.filter((post) => post.estadoProceso?.toLowerCase().includes('proceso')).length;
  const reclutados = postulaciones.filter((post) => post.estadoProceso?.toLowerCase().includes('aprobado') || post.estadoProceso?.toLowerCase().includes('completado')).length;

  return (
    <div className="grid gap-4 xl:grid-cols-4 lg:grid-cols-2 sm:grid-cols-2">
      <ReclutamientoStatusCard
        title="Total postulantes"
        value={total}
        subtitle="Postulantes en la bandeja de reclutamiento"
        variant="primary"
      />
      <ReclutamientoStatusCard
        title="En proceso"
        value={enProceso}
        subtitle="Postulantes que están siendo evaluados"
        variant="warning"
      />
      <ReclutamientoStatusCard
        title="Lista negra"
        value={postulantesNegros}
        subtitle="Postulantes marcados en lista negra"
        variant="danger"
      />
      <ReclutamientoStatusCard
        title="Avanzados"
        value={reclutados}
        subtitle="Postulantes con estado aprobado/completado"
        variant="success"
      />
    </div>
  );
};
