/**
 * Página: Listado de ofertas laborales activas
 * Ruta: /rrhh/ofertas-laborales
 */

import { useState } from 'react';
import { Search, SlidersHorizontal, Plus } from 'lucide-react';
import { ListadoOfertasActivas, useOfertasActivas } from '@features/rrhh/ofertas-laborales';

const PaginaListadoOfertasActivas = (): React.ReactElement => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const {
    data: ofertasActivas,
    isLoading: ofertasLoading,
    error: ofertasError,
    refetch: refetchOfertasActivas,
  } = useOfertasActivas();

  return (
    <div className="h-screen w-screen overflow-auto bg-[#F8FAFF] flex flex-col">
      <div className="flex-1 px-6 py-6">
        {/* Header Page */}
        <div className="mb-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-blue-400">
            Recursos Humanos
          </p>
          <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold leading-tight text-slate-900">
            Gestiona ofertas laborales y candidatos de manera eficiente
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Explora ofertas activas, filtra por negocio o puesto y administra tus procesos desde una única vista.
          </p>
        </div>

        {/* Search & Create */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex-1">
            <label className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2.5 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por código, negocio o puesto..."
                className="w-full border-none bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400"
              />
            </label>
          </div>

          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-colors duration-150 hover:border-blue-300 hover:text-blue-600"
          >
            <SlidersHorizontal size={18} />
            Filtros
          </button>

          <button
            type="button"
            className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-blue-700 hover:shadow-lg"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={18} />
            Nueva Oferta
          </button>
        </div>

        {/* Divider */}
        <div className="mb-4 border-t border-slate-200" />

        {/* Section Header */}
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-800">Ofertas Activas</h2>
          <p className="mt-0.5 text-xs text-slate-400">Mostrando todas las ofertas disponibles</p>
        </div>

        {/* Content */}
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
      </div>
    </div>
  );
};

export default PaginaListadoOfertasActivas;
