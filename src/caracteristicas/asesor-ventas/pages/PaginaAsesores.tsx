import React, { useState } from 'react';
import { useBandejaLeads } from '../hooks';
import {
  TablaLeadsAsesorVentas,
  DetalleLeadModal,
} from '../ui';
import { PreventaLeadModal } from '@caracteristicas/preventa/ui/PreventaLeadModal';
import type { LeadAsesorVentasResponse } from '../model';

/**
 * Página principal del Asesor de Ventas
 * Gestiona la bandeja de leads asignados y operaciones según los 6 endpoints:
 * - GET /leads/asesor-ventas (carga inicial)
 * - POST /leads/{idLead}/contacto
 * - POST /leads/{idLead}/tipificacion
 * - PATCH /leads/{idLead}/oferta-comercial
 * - PATCH /leads/{idLead}/direccion
 * - PATCH /leads/{idLead}/datos-preventa
 */
const PaginaAsesores: React.FC = () => {
  const [selectedLead, setSelectedLead] = useState<LeadAsesorVentasResponse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedLeadPreventa, setSelectedLeadPreventa] = useState<LeadAsesorVentasResponse | null>(null);
  const [showPreventaModal, setShowPreventaModal] = useState(false);

  const { data: leads = [], isLoading, error, refetch } = useBandejaLeads();

  const handleSelectLead = (lead: LeadAsesorVentasResponse) => {
    setSelectedLead(lead);
    setShowModal(true);
  };

  const handlePreventaLead = (lead: LeadAsesorVentasResponse) => {
    setSelectedLeadPreventa(lead);
    setShowPreventaModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLead(null);
    refetch();
  };

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Bandeja de Leads</h1>
        <p className="text-gray-600">
          Gestiona tus leads asignados: contactos, tipificación, ofertas comerciales y datos de
          preventa
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
          Error al cargar leads: {error instanceof Error ? error.message : 'Error desconocido'}
        </div>
      )}

      {/* Refresh Button */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition"
        >
          {isLoading ? 'Actualizando...' : 'Actualizar Bandeja'}
        </button>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <TablaLeadsAsesorVentas
          leads={leads}
          isLoading={isLoading}
          onSelectLead={handleSelectLead}
          onPreventa={handlePreventaLead}
        />
      </div>

      {/* Detail Modal */}
      {selectedLead && (
        <DetalleLeadModal
          lead={selectedLead}
          isOpen={showModal}
          onClose={handleCloseModal}
        />
      )}

      {selectedLeadPreventa && (
        <PreventaLeadModal
          idLead={selectedLeadPreventa.id}
          isOpen={showPreventaModal}
          onClose={() => {
            setShowPreventaModal(false);
            setSelectedLeadPreventa(null);
            refetch();
          }}
        />
      )}

      {/* Stats Footer */}
      {!isLoading && leads.length > 0 && (
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-600 font-semibold">Total Leads</p>
            <p className="text-2xl font-bold text-blue-900">{leads.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-green-600 font-semibold">Nuevos</p>
            <p className="text-2xl font-bold text-green-900">
              {leads.filter((l) => l.estadoSeguimiento === 'NUEVO').length}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <p className="text-sm text-yellow-600 font-semibold">En Contacto</p>
            <p className="text-2xl font-bold text-yellow-900">
              {leads.filter((l) => l.estadoSeguimiento === 'EN_CONTACTO').length}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <p className="text-sm text-purple-600 font-semibold">Tipificados</p>
            <p className="text-2xl font-bold text-purple-900">
              {leads.filter((l) => l.estadoSeguimiento === 'TIPIFICADO').length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaginaAsesores;
