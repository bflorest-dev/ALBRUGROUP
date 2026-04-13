import React, { useState } from 'react';
import BandejaReclutamiento from './BandejaReclutamiento';
import GrupoCapacitacion from './GrupoCapacitacion';

type ReclutamientoTab = 'BANDEJA_RECLUTAMIENTO' | 'GRUPO_CAPACITACION';

const TAB_ITEMS: Array<{ id: ReclutamientoTab; label: string }> = [
  { id: 'BANDEJA_RECLUTAMIENTO', label: 'Bandeja de Reclutamiento' },
  { id: 'GRUPO_CAPACITACION', label: 'Grupo de Capacitación' },
];

const ReclutamientoPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReclutamientoTab>('BANDEJA_RECLUTAMIENTO');

  return (
    <div className="space-y-6 p-8">
      <nav className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm" aria-label="Navegación reclutamiento">
        <div className="flex flex-wrap gap-2">
          {TAB_ITEMS.map((tab) => {
            const isActive = tab.id === activeTab;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={
                  isActive
                    ? 'rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm'
                    : 'rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100'
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {activeTab === 'BANDEJA_RECLUTAMIENTO' ? (
        <BandejaReclutamiento />
      ) : (
        <GrupoCapacitacion />
      )}
    </div>
  );
};

export default ReclutamientoPage;
