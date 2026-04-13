import React from 'react';
import type { LeadAsesorVentasResponse } from '../model';

interface TablaLeadsAsesorVentasProps {
  leads: LeadAsesorVentasResponse[];
  isLoading: boolean;
  onSelectLead: (lead: LeadAsesorVentasResponse) => void;
  onPreventa: (lead: LeadAsesorVentasResponse) => void;
}

/**
 * Tabla de leads asignados al asesor de ventas
 * Muestra bandeja de leads frescos sin información previa (GET /leads/asesor-ventas)
 */
export const TablaLeadsAsesorVentas: React.FC<TablaLeadsAsesorVentasProps> = ({
  leads,
  isLoading,
  onSelectLead,
  onPreventa,
}) => {
  if (isLoading) {
    return <div className="p-4 text-center">Cargando leads...</div>;
  }

  if (leads.length === 0) {
    return <div className="p-4 text-center text-gray-500">No hay leads asignados</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 text-sm min-w-max">          
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-5 py-4 text-left">Lead #</th>
            <th className="border border-gray-300 px-5 py-4 text-left min-w-[180px]">Fecha Asignación</th>
            <th className="border border-gray-300 px-5 py-4 text-left min-w-[140px]">Prefijo</th>
            <th className="border border-gray-300 px-5 py-4 text-left">Lead</th>
            <th className="border border-gray-300 px-4 py-3 text-left">Titular</th>
            <th className="border border-gray-300 px-4 py-3 text-left">Email</th>
            <th className="border border-gray-300 px-4 py-3 text-left">Estado</th>
            <th className="border border-gray-300 px-4 py-3 text-left">Acción</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-3 font-mono text-left">{lead.id}</td>
              <td className="border border-gray-300 px-5 py-4 min-w-[180px] whitespace-nowrap text-left">{lead.fechaAsignacion}</td>
              <td className="border border-gray-300 px-5 py-4 min-w-[140px] whitespace-nowrap text-left">{lead.prefijo}</td>
              <td className="border border-gray-300 px-4 py-3 text-left">{lead.lead}</td>
              <td className="border border-gray-300 px-4 py-3 text-left">{lead.nombreTitular}</td>
              <td className="border border-gray-300 px-4 py-3 text-left">{lead.correo}</td>
              <td className="border border-gray-300 px-4 py-3 text-left">                <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-800">
                  {lead.estadoSeguimiento}
                </span>
              </td>
              <td className="border border-gray-300 p-3 text-left">
                <button
                  onClick={() => onPreventa(lead)}
                  className="px-3 py-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 text-sm"
                >
                  Tipificar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};