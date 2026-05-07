import React, { useState } from 'react';
import type { LeadAsesorVentasResponse } from '../model';
import { FormularioContacto } from './FormularioContacto';
import { FormularioTipificacion } from './FormularioTipificacion';
import { FormularioOferta } from './FormularioOferta';
import { FormularioDireccion } from './FormularioDireccion';
import { FormularioDatosPreventa } from './FormularioDatosPreventa';
import { PreventaLeadModal } from '@features/presales/ui/PreventaLeadModal';
import styles from './DetalleLeadModal.module.css';

interface DetalleLeadModalProps {
  lead: LeadAsesorVentasResponse;
  isOpen: boolean;
  onClose: () => void;
  dashboardMode?: boolean;
}

type TabType = 'resumen' | 'contacto' | 'tipificacion' | 'oferta' | 'direccion' | 'preventa';

/**
 * Modal con detalles del lead y formularios para acciones
 * Consume los 5 endpoints de mutación del asesor de ventas
 */
export const DetalleLeadModal: React.FC<DetalleLeadModalProps> = ({
  lead,
  isOpen,
  onClose,
  dashboardMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('resumen');
  const [showPreventaAdvanced, setShowPreventaAdvanced] = useState(false);

  if (!isOpen) return null;

  return (
    <div className={dashboardMode ? styles.overlay : 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'}>
      <div className={dashboardMode ? styles.modal : 'bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col'}>
        {/* Header */}
        <div className={dashboardMode ? styles.header : 'bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 flex items-center justify-between'}>
          <div>
            <h2 className={dashboardMode ? styles.headerTitle : 'text-xl font-bold'}>{lead.nombreTitular}</h2>
            <p className={dashboardMode ? styles.headerSubtitle : 'text-sm text-blue-100'}>
              {dashboardMode ? `Lead ${lead.prefijo}${lead.lead}` : `Lead #${lead.lead}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className={dashboardMode ? styles.closeButton : 'text-white hover:bg-blue-700 rounded-full p-2 transition'}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className={dashboardMode ? styles.tabBar : 'border-b border-gray-300 flex bg-gray-50 overflow-x-auto'}>
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
              className={
                dashboardMode
                  ? `${styles.tabButton} ${activeTab === tab.id ? styles.tabButtonActive : ''}`
                  : `px-4 py-3 font-medium whitespace-nowrap transition ${
                      activeTab === tab.id
                        ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={dashboardMode ? styles.content : 'flex-1 overflow-y-auto p-6'}>
          {activeTab === 'resumen' && (
            <div className={dashboardMode ? styles.summarySection : 'space-y-4'}>
              <div className={dashboardMode ? styles.summaryGrid : 'grid grid-cols-2 gap-4'}>
                <div className={dashboardMode ? styles.summaryItem : ''}>
                  <label className={dashboardMode ? styles.summaryLabel : 'text-sm font-semibold text-gray-700'}>Prefijo</label>
                  <p className={dashboardMode ? styles.summaryValue : 'text-gray-900'}>{lead.prefijo}</p>
                </div>
                <div className={dashboardMode ? styles.summaryItem : ''}>
                  <label className={dashboardMode ? styles.summaryLabel : 'text-sm font-semibold text-gray-700'}>Correo</label>
                  <p className={dashboardMode ? styles.summaryValue : 'text-gray-900'}>{lead.correo}</p>
                </div>
                <div className={dashboardMode ? styles.summaryItem : ''}>
                  <label className={dashboardMode ? styles.summaryLabel : 'text-sm font-semibold text-gray-700'}>Lead</label>
                  <p className={dashboardMode ? styles.summaryValue : 'text-gray-900'}>{lead.lead}</p>
                </div>
                <div className={dashboardMode ? styles.summaryItem : ''}>
                  <label className={dashboardMode ? styles.summaryLabel : 'text-sm font-semibold text-gray-700'}>Estado</label>
                  <p className={dashboardMode ? styles.summaryValue : 'text-gray-900'}>{lead.estadoSeguimiento}</p>
                </div>
                <div className={dashboardMode ? styles.summaryItem : ''}>
                  <label className={dashboardMode ? styles.summaryLabel : 'text-sm font-semibold text-gray-700'}>Fecha Asignación</label>
                  <p className={dashboardMode ? styles.summaryValue : 'text-gray-900'}>
                    {new Date(lead.fechaAsignacion).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>
              <div className={dashboardMode ? styles.summaryNote : 'mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200'}>
                <p className={dashboardMode ? styles.summaryNoteText : 'text-sm text-blue-800'}>
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
            <div className={dashboardMode ? styles.preventaSection : 'space-y-4'}>
              <FormularioDatosPreventa idLead={lead.id} onSuccess={onClose} />
              <button
                onClick={() => setShowPreventaAdvanced(true)}
                className={dashboardMode ? styles.preventaButton : 'w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700'}
              >
                Abrir flujo PREVENTA avanzado (3 pasos + tipificación)
              </button>
            </div>
          )}
        </div>

        {showPreventaAdvanced && (
          <PreventaLeadModal
            idLead={lead.id}
            isOpen={showPreventaAdvanced}
            dashboardMode={dashboardMode}
            onClose={() => setShowPreventaAdvanced(false)}
          />
        )}
      </div>
    </div>
  );
};