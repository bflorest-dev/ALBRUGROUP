import React from 'react';
import { GrupoCapacitacionForm } from '@features/reclutamiento/components/GrupoCapacitacionForm';

const GrupoCapacitacion: React.FC = () => {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-brand-600">
          Reclutamiento
        </p>
        <h2 className="mt-3 text-2xl font-bold text-slate-900">Grupo de Capacitación</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Crea y programa nuevos grupos de capacitación para la siguiente etapa del proceso.
        </p>
      </div>

      <GrupoCapacitacionForm />
    </section>
  );
};

export default GrupoCapacitacion;
