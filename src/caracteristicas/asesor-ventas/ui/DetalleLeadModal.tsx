import React, { useState } from 'react';
import type { LeadAsesorVentasResponse } from '../model';
import { FormularioContacto } from './FormularioContacto';
import { FormularioTipificacion } from './FormularioTipificacion';
import { FormularioOferta } from './FormularioOferta';
import { FormularioDireccion } from './FormularioDireccion';
import { FormularioDatosPreventa } from './FormularioDatosPreventa';

interface DetalleLeadModalProps {
  lead: LeadAsesorVentasResponse;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'resumen' | 'contacto' | 'tipificacion' | 'oferta' | 'direccion' | 'preventa';

/**
 * Modal con detalles del lead y formularios para acciones
 * Consume los 5 endpoints de mutación del asesor de ventas
 */
export const DetalleLeadModal: React.FC<DetalleLeadModalProps> = ({ lead, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('resumen');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{lead.nombreCliente}</h2>
            <p className="text-sm text-blue-100">Lead #{lead.numeroLead}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-700 rounded-full p-2 transition"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-300 flex bg-gray-50 overflow-x-auto">
          {[
            { id: 'resumen' as const, label: 'Resumen' },
            { id: 'contacto' as const, label: 'Registrar Contacto' },
            { id: 'tipificacion' as const, label: 'Tipificar' },
            { id: 'oferta' as const, label: 'Oferta Comercial' },
            { id: 'direccion' as const, label: 'Dirección' },
            { id: 'preventa' as const, label: 'Datos Preventa' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'resumen' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Teléfono</label>
                  <p className="text-gray-900">{lead.telefonoContacto}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Correo</label>
                  <p className="text-gray-900">{lead.correoContacto}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Producto</label>
                  <p className="text-gray-900">{lead.producto}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Estado</label>
                  <p className="text-gray-900">{lead.estado}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Fecha Registro</label>
                  <p className="text-gray-900">
                    {new Date(lead.fechaRegistro).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Este es un lead fresco sin información previa. Proceda con
                  el registro de contacto y tipificación según corresponda.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'contacto' && <FormularioContacto idLead={lead.id} onSuccess={onClose} />}

          {activeTab === 'tipificacion' && (
            <FormularioTipificacion idLead={lead.id} onSuccess={onClose} />
          )}

          {activeTab === 'oferta' && (
            <FormularioOferta idLead={lead.id} onSuccess={onClose} />
          )}

          {activeTab === 'direccion' && (
            <FormularioDireccion idLead={lead.id} onSuccess={onClose} />
          )}

          {activeTab === 'preventa' && (
            <FormularioDatosPreventa idLead={lead.id} onSuccess={onClose} />
          )}
        </div>
      </div>
    </div>
  );
};