/* eslint-disable no-restricted-syntax */
// TODO: Migrar layout y estilos del kanban a primitives del design-system con cva + cn.

import React, { useState } from 'react';
import { BiPlus } from 'react-icons/bi';
import { Modal } from '@shared/ui/base';
import { CampaignCard, type Campaign } from './CampaignCard';
import './CampaignsKanban.css';

interface Company {
  id: string;
  name: string;
  status: 'ACTIVO' | 'INACTIVO';
}

interface AdvertiserAccount {
  id: string;
  name: string;
  accountNumber: string;
}

interface CampaignsKanbanProps {
  companies: Company[];
  advertiserAccounts: AdvertiserAccount[];
}

export const CampaignsKanban: React.FC<CampaignsKanbanProps> = ({ 
  companies,
  advertiserAccounts
}) => {
  // TODO: Migrar Kanban a componente DS con cva + cn
  const [campaigns] = useState<Campaign[]>(() => {
    try {
      const stored = localStorage.getItem('kanban_campaigns');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  void advertiserAccounts;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Filter active companies
  const activeCompanies = companies.filter(c => c.status === 'ACTIVO');

  // Group campaigns by company
  const campaignsByCompany = activeCompanies.map(company => ({
    company,
    campaigns: campaigns.filter(c => c.company === company.name)
  }));

  const handleOpenEdit = (campaign: Campaign) => {
    void campaign;
    setIsEditing(true);
    setIsModalOpen(true);
  };

  return (
    <div className="campaigns-kanban">
      <div className="kanban-header">
        <h2>Gestión de Campañas</h2>
        <button className="add-campaign-btn" onClick={() => setIsModalOpen(true)}>
          <BiPlus size={20} />
          Nueva Campaña
        </button>
      </div>

      <div className="kanban-board">
        {campaignsByCompany.map(({ company, campaigns: companyCampaigns }) => (
          <div key={company.id} className="kanban-column">
            <div className="column-header">
              <h3>{company.name}</h3>
              <span className="card-count">{companyCampaigns.length}</span>
            </div>
            <div className="cards-container">
              {companyCampaigns.map(campaign => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onEdit={() => handleOpenEdit(campaign)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setIsEditing(false);
          }}
          title={isEditing ? 'Editar Campaña' : 'Nueva Campaña'}
        >
          <div>Modal content placeholder</div>
        </Modal>
      )}
    </div>
  );
};
