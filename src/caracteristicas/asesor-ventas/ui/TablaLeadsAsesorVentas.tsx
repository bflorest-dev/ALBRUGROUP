import React from 'react';
import type { LeadAsesorVentasResponse } from '../model';

interface TablaLeadsAsesorVentasProps {
  leads: LeadAsesorVentasResponse[];
  isLoading: boolean;
  onSelectLead: (lead: LeadAsesorVentasResponse) => void;
}

/**
 * Tabla de leads asignados al asesor de ventas
 * Muestra bandeja de leads frescos sin información previa (GET /leads/asesor-ventas)
 */
export const TablaLeadsAsesorVentas: React.FC<TablaLeadsAsesorVentasProps> = ({
  leads,
  isLoading,
  onSelectLead,
}) => {
  if (isLoading) {
    return <div className="p-4 text-center">Cargando leads...</div>;
  }

  if (leads.length === 0) {
    return <div className="p-4 text-center text-gray-500">No hay leads asignados</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 p-3 text-left">Lead #</th>
            <th className="border border-gray-300 p-3 text-left">Cliente</th>
            <th className="border border-gray-300 p-3 text-left">Teléfono</th>
            <th className="border border-gray-300 p-3 text-left">Correo</th>
            <th className="border border-gray-300 p-3 text-left">Producto</th>
            <th className="border border-gray-300 p-3 text-left">Estado</th>
            <th className="border border-gray-300 p-3 text-left">Acción</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 p-3 font-mono text-sm">{lead.numeroLead}</td>
              <td className="border border-gray-300 p-3">{lead.nombreCliente}</td>
              <td className="border border-gray-300 p-3">{lead.telefonoContacto}</td>
              <td className="border border-gray-300 p-3">{lead.correoContacto}</td>
              <td className="border border-gray-300 p-3">{lead.producto}</td>
              <td className="border border-gray-300 p-3">
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                    lead.estado === 'NUEVO'
                      ? 'bg-blue-100 text-blue-800'
                      : lead.estado === 'EN_CONTACTO'
                        ? 'bg-yellow-100 text-yellow-800'
                        : lead.estado === 'TIPIFICADO'
                          ? 'bg-purple-100 text-purple-800'
                          : lead.estado === 'CONVERTIDO'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                  }`}
                >
                  {lead.estado}
                </span>
              </td>
              <td className="border border-gray-300 p-3">
                <button
                  onClick={() => onSelectLead(lead)}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  Detalles
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};