import React from 'react';
import { Modal } from '@compartido/ui/base';
import type { CommunityDashboardState } from '@compartido/tipos/community';

/**
 * ModalsSection Component
 * 
 * Renders all 3 modals used in CommunityDashboard:
 * 1. Edit Metrics (META ADS or DRIVE)
 * 2. Edit Campaign Metrics
 * 3. Create New Campaign
 * 
 * Part of CommunityDashboard refactorization (Problem #2)
 */
interface ModalsSectionProps {
  state: CommunityDashboardState;
}

/**
 * Problema #6: Component Memoization
 * Wrapped with React.memo to prevent unnecessary re-renders
 * when parent updates but modal states haven't changed
 */
const ModalsSectionComponent: React.FC<ModalsSectionProps> = ({ state }) => {
  return (
    <>
      {/* MODAL 1: Editar Metricas (META ADS o DRIVE) */}
      <Modal
        isOpen={state.isEditingMetrics}
        title={`Editar ${state.editingMetricsType}`}
        onClose={() => state.setIsEditingMetrics(false)}
      >
        <div className="campaign-form">
          <div className="form-section">
            <label>CANT LEADS</label>
            <input 
              type="number" 
              value={state.editMetricsData.cantLeads}
              onChange={(e) => state.handleEditMetricsCantLeadsChange(e.target.value)}
              className="form-input"
            />

            <label>Δ LEADS</label>
            <input 
              type="number" 
              value={state.editMetricsData.deltaLeads}
              onChange={(e) => state.handleEditMetricsDeltaLeadsChange(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-actions">
            <button 
              className="btn-cancel"
              onClick={state.handleCloseEditMetricsModal}
            >
              Cancelar
            </button>
            <button 
              className="btn-confirm"
              onClick={state.handleSaveMetrics}
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: Editar Metricas de Campaña */}
      <Modal
        isOpen={state.isEditingCampaignMetrics}
        title={`Editar ${state.selectedCampaignForEdit?.campaignName || 'Campaña'}`}
        onClose={() => state.setIsEditingCampaignMetrics(false)}
        className="large"
      >
        <div className="campaign-form">
          <div className="form-section">
            {/* Columna Izquierda */}
            <div className="form-group">
              <label>IMPORTE GASTADO</label>
              <input 
                type="number" 
                value={state.campaignEditData.spent}
                onChange={(e) => state.handleCampaignSpentChange(e.target.value)}
                className="form-input"
              />

              <label>RESULTADOS</label>
              <input 
                type="number" 
                value={state.campaignEditData.results}
                onChange={(e) => state.handleCampaignResultsChange(e.target.value)}
                className="form-input"
              />

              <label>ALCANCE</label>
              <input 
                type="number" 
                value={state.campaignEditData.reach}
                onChange={(e) => state.handleCampaignReachChange(e.target.value)}
                className="form-input"
              />

              <label>IMPRESIONES</label>
              <input 
                type="number" 
                value={state.campaignEditData.impressions}
                onChange={(e) => state.handleCampaignImpressionsChange(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Columna Derecha */}
            <div className="form-group">
              <label>FRECUENCIA</label>
              <input 
                type="number" 
                step="0.01"
                value={state.campaignEditData.frequency}
                onChange={(e) => state.handleCampaignFrequencyChange(e.target.value)}
                className="form-input"
              />

              <label>CLICS</label>
              <input 
                type="number" 
                value={state.campaignEditData.clicks}
                onChange={(e) => state.handleCampaignClicksChange(e.target.value)}
                className="form-input"
              />

              <label>CLICS [TODOS]</label>
              <input 
                type="number" 
                value={state.campaignEditData.clicsTotal}
                onChange={(e) => state.handleCampaignClicsTotalChange(e.target.value)}
                className="form-input"
              />

              <label>VENTAS C.</label>
              <input 
                type="number" 
                value={state.campaignEditData.ventasCerradas}
                onChange={(e) => state.handleCampaignVentasCerradasChange(e.target.value)}
                className="form-input-green"
              />

              <label>CONTACTO</label>
              <input 
                type="number" 
                value={state.campaignEditData.contacto}
                onChange={(e) => state.handleCampaignContactoChange(e.target.value)}
                className="form-input-green"
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              className="btn-cancel"
              onClick={state.handleCloseEditCampaignMetricsModal}
            >
              Cancelar
            </button>
            <button 
              className="btn-confirm"
              onClick={state.handleSaveCampaignMetrics}
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: Crear Nueva Campaña */}
      <Modal
        isOpen={state.isModalOpen}
        title="Nueva Campaña"
        onClose={state.handleCloseCreateModal}
        className="medium"
      >
        <div className="campaign-form">
          <div className="form-section">
            <div className="form-group">
              <label>CAMPAÑA</label>
              <input 
                type="text" 
                name="campaignName" 
                value={state.formData.campaignName}
                onChange={(e) => state.handleFormChange(e.target.name, e.target.value)}
                placeholder="Nombre de la campaña"
                className="form-input"
              />

              <label>CEL. EMPRESA</label>
              <input 
                type="text" 
                name="nomEmpresa" 
                value={state.formData.nomEmpresa}
                onChange={(e) => state.handleFormChange(e.target.name, e.target.value)}
                placeholder="Célula empresa"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>CTA. PUBLICITARIA</label>
              <input 
                type="text" 
                name="ctaPublicitaria" 
                value={state.formData.ctaPublicitaria}
                onChange={(e) => state.handleFormChange(e.target.name, e.target.value)}
                placeholder="Cuenta publicitaria"
                className="form-input"
              />

              <label>NOM. CTA. PUBLICITARIA</label>
              <input 
                type="text" 
                name="nomCtaPublicitaria" 
                value={state.formData.nomCtaPublicitaria}
                onChange={(e) => state.handleFormChange(e.target.name, e.target.value)}
                placeholder="Nombre cuenta publicitaria"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              className="btn-cancel"
              onClick={state.handleToggleModalClose}
            >
              Cancelar
            </button>
            <button 
              className="btn-confirm"
              onClick={state.handleCreateCampaign}
            >
              Crear Campaña
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};


export const ModalsSection = React.memo(ModalsSectionComponent);
