import React, { useState, useRef } from 'react';
import { Search, SlidersHorizontal, Plus } from 'lucide-react';
import { Modal } from '@shared/ui';
import {
  ListadoOfertasActivas,
  OfertaLaboralForm,
  useOfertasActivas,
} from '@features/rrhh/ofertas-laborales';
import { BandejaPostulaciones } from '@features/rrhh/postulaciones';
import type { BandejaPostulacionesHandle } from '@features/rrhh/postulaciones/ui/BandejaPostulaciones';
import { AprobadosSection } from './sections/AprobadosSection';
import { EmpleadosSection } from './sections/EmpleadosSection';
import { ContratosSection } from './sections/ContratosSection';

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto w-full max-w-7xl bg-white border-b border-gray-200 px-6 py-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Recursos Humanos</h1>
            <p className="text-gray-500">
              Gestiona ofertas laborales y candidatos de manera eficiente
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-6 pb-8">
        {activeTab === 'ofertas' && (
          <>
            <div className="mb-6 rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700"
                >
                  <Plus size={18} />
                  Nueva Oferta
                </button>
                <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Buscar por código, negocio o puesto..."
                      className="w-full rounded-full border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filtros
                  </button>
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
          </>
        )}

        {activeTab === 'reclutar' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Reclutar</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Gestiona las postulaciones en la fase de reclutamiento.
                </p>
              </div>
              <button
                type="button"
                onClick={openCreatePostulacionModal}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700"
              >
                <Plus size={16} />
                Crear Postulación
              </button>
            </div>
            <div>
              <BandejaPostulaciones
                ref={postulacionesRef}
                activeSection="reclutamiento"
                hideTabs
                hideHeader
                hideCreateButton
              />
            </div>
          </div>
        )}

        {activeTab === 'aprobados' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <AprobadosSection />
          </div>
        )}

        {activeTab === 'empleados' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <EmpleadosSection />
          </div>
        )}

        {activeTab === 'contratos' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <ContratosSection />
          </div>
        )}

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
    </div>
  );
};

export default PaginaRRHH;
