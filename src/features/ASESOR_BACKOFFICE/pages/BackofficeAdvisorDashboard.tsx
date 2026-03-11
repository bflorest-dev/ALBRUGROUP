/**
 * BackofficeAdvisorDashboard - Page
 * 
 * Dashboard principal para ASESOR_BACKOFFICE
 * 
 * Responsabilidades:
 * 1. Orquestar toda la lógica usando hooks personalizados
 * 2. Gestionar estado global de leads y tipificaciones
 * 3. Coordinar interacciones entre lista y panel de tipificación
 * 4. Manejar guardado de tipificaciones
 * 
 * Componentes integrados:
 * - LeadsListPanel: Lista de leads con filtros
 * - TipificationPanel: Detalle del lead y opciones de tipificación
 * 
 * Hooks integrados:
 * - useBackofficeLeads: Gestión de leads
 * - useTipification: Gestión de tipificación
 * 
 * @component
 * @returns {JSX.Element} Dashboard completo
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useBackofficeLeads, useTipification } from '../../../hooks';
import { LeadsListPanel } from '../../../components/organisms/LeadsListPanel';
import { TipificationPanel } from '../../../components/organisms/TipificationPanel';
import type { LeadDTO } from '../../../shared/types';
import './BackofficeAdvisorDashboard.css';

/**
 * Lead extendido para ASESOR_BACKOFFICE
 */
interface BackofficeLead extends LeadDTO {
  email?: string;
  address?: string;
  province?: string;
  district?: string;
  addressType?: string;
  domicileType?: string;
  planName?: string;
  planPrice?: string;
  planServices?: string[];
  promotionName?: string;
  promotionDiscount?: string;
  promotionDuration?: string;
  tipificationStatus?: 'pending' | 'tipified';
  tipificationLabel?: string;
}

/**
 * Mock data - En producción, esto vendría del API
 */
const MOCK_LEADS: BackofficeLead[] = [
  {
    id: '1',
    registrationDate: '04/03/26',
    registrationTime: '08:10 a.m.',
    campaign: 'Promo Fibra Marzo',
    businessUnit: 'Telefonía Hogar',
    channel: 'Facebook',
    firstName: 'Pedro',
    lastName: 'López',
    phone: '+51 987 123 456',
    tipification: 'Sin tipificar',
    followUp: 'Nuevo',
    advisor: 'María',
    advisorArea: 'Norte',
    reassignmentCount: 0,
    email: 'pedro@email.com',
    address: 'Av. Principal 123, Apt 4B',
    province: 'Lima',
    district: 'Miraflores',
    addressType: 'Jiron',
    domicileType: 'Departamento',
    planName: 'Fibra 100MB',
    planPrice: 'S/. 89.90',
    planServices: ['Internet', 'TV'],
    promotionName: 'Fibra Marzo 2026',
    promotionDiscount: '15% por 3 meses',
    promotionDuration: '3 meses',
    tipificationStatus: 'pending'
  },
  {
    id: '2',
    registrationDate: '03/03/26',
    registrationTime: '02:15 p.m.',
    campaign: 'Fibra Empresarial Q1',
    businessUnit: 'Internet Empresas',
    channel: 'Instagram',
    firstName: 'María',
    lastName: 'García',
    phone: '+51 912 345 678',
    tipification: 'Sin tipificar',
    followUp: 'Nuevo',
    advisor: 'Juan',
    advisorArea: 'Sur',
    reassignmentCount: 0,
    email: 'maria.garcia@email.com',
    address: 'Pasaje Los Andes 456',
    province: 'Callao',
    district: 'Bellavista',
    addressType: 'Pasaje',
    domicileType: 'Casa',
    planName: 'Fibra 200MB',
    planPrice: 'S/. 129.90',
    planServices: ['Internet', 'Telefonía'],
    promotionName: 'Inicio de Servicios',
    promotionDiscount: '20% desc inicial',
    promotionDuration: '1 mes',
    tipificationStatus: 'pending'
  },
  {
    id: '3',
    registrationDate: '02/03/26',
    registrationTime: '11:45 a.m.',
    campaign: 'Plan TV Marzo',
    businessUnit: 'Cable',
    channel: 'WhatsApp',
    firstName: 'Carlos',
    lastName: 'Ruiz',
    phone: '+51 945 678 901',
    tipification: 'Sin tipificar',
    followUp: 'Nuevo',
    advisor: 'Ana',
    advisorArea: 'Centro',
    reassignmentCount: 0,
    email: 'carlos.ruiz@email.com',
    address: 'Calle Las Flores 789',
    province: 'Lima',
    district: 'San Isidro',
    addressType: 'Calle',
    domicileType: 'Departamento',
    planName: 'Plan TV + Internet',
    planPrice: 'S/. 99.90',
    planServices: ['TV', 'Internet'],
    promotionName: 'Triple Play',
    promotionDiscount: '25% primeros 2 meses',
    promotionDuration: '2 meses',
    tipificationStatus: 'pending'
  }
];

export const BackofficeAdvisorDashboard: React.FC = () => {
  const leadsManager = useBackofficeLeads(MOCK_LEADS);
  const tipificationManager = useTipification();

  const [submitError, setSubmitError] = useState<string | null>(null);

  // Handlers
  const handleSelectBlock = useCallback(
    (blockId: string) => {
      tipificationManager.selectBlock(blockId);
      setSubmitError(null);
    },
    [tipificationManager]
  );

  const handleSelectOption = useCallback(
    (optionId: string) => {
      tipificationManager.selectOption(optionId as any);
      setSubmitError(null);
    },
    [tipificationManager]
  );

  const handleFilterByBlock = useCallback((blockId: string) => {
    leadsManager.setFilter({ blockId });
  }, [leadsManager]);

  const handleSaveAndNext = useCallback(async () => {
    if (!leadsManager.selectedLead) return;

    try {
      // En producción, aquí se haría un call a la API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Tipificar el lead actual
      leadsManager.tipifyLead(
        leadsManager.selectedLead.id,
        tipificationManager.selectedBlockId || '',
        tipificationManager.selectedOptionId || ''
      );

      // Obtener el siguiente lead
      const nextLead = leadsManager.getNextLead();
      if (nextLead) {
        leadsManager.selectLead(nextLead.id);
      }

      // Limpiar tipificación
      tipificationManager.clear();
      setSubmitError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar tipificación';
      setSubmitError(message);
    }
  }, [leadsManager, tipificationManager]);

  const handleCancel = useCallback(() => {
    tipificationManager.clear();
    setSubmitError(null);
  }, [tipificationManager]);

  // Stats general
  const generalStats = useMemo(() => {
    return {
      total: leadsManager.leads.length,
      pending: leadsManager.pendingLeads.length,
      completed: leadsManager.completedLeads.length,
      completionPercent: Math.round(
        (leadsManager.completedLeads.length / leadsManager.leads.length) * 100
      )
    };
  }, [leadsManager]);

  return (
    <div className="backoffice-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">ASESOR BACKOFFICE</h1>
          <p className="dashboard-subtitle">
            Tipifica las preventas y gestiona el seguimiento de llamadas
          </p>
        </div>

        {/* Stats Card */}
        <div className="dashboard-stats">
          <div className="backoffice-stat-card">
            <span className="backoffice-stat-label">Total</span>
            <span className="backoffice-stat-value">{generalStats.total}</span>
          </div>
          <div className="backoffice-stat-card">
            <span className="backoffice-stat-label">Pendientes</span>
            <span className="backoffice-stat-value">{generalStats.pending}</span>
          </div>
          <div className="backoffice-stat-card">
            <span className="backoffice-stat-label">Tipificadas</span>
            <span className="backoffice-stat-value">{generalStats.completed}</span>
          </div>
          <div className="backoffice-stat-card">
            <span className="backoffice-stat-label">Progreso</span>
            <div className="backoffice-progress-bar">
              <div
                className="backoffice-progress-fill"
                style={{ width: `${generalStats.completionPercent}%` }}
              />
            </div>
            <span className="stat-value">{generalStats.completionPercent}%</span>
          </div>
        </div>
      </header>

      {/* Main Content - Split View */}
      <div className="dashboard-content">
        <LeadsListPanel
          leads={leadsManager.filteredLeads}
          selectedLeadId={leadsManager.selectedLeadId}
          searchTerm={leadsManager.searchTerm}
          onSearchChange={leadsManager.setSearchTerm}
          onLeadSelect={leadsManager.selectLead}
        />

        <TipificationPanel
          selectedLead={leadsManager.selectedLead as BackofficeLead}
          selectedBlockId={tipificationManager.selectedBlockId}
          selectedOptionId={tipificationManager.selectedOptionId}
          isSubmitting={tipificationManager.isSubmitting}
          error={submitError}
          onSelectBlock={handleSelectBlock}
          onSelectOption={handleSelectOption}
          onFilterByBlock={handleFilterByBlock}
          onSaveAndNext={handleSaveAndNext}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default BackofficeAdvisorDashboard;
