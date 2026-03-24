import React, { useState } from 'react';
import { BiPlus, BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import { Modal } from '@compartido/ui/moleculas';
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

interface CampaignFormData {
  name: string;
  whatsapp: string;
  advertiserAccount: string;
  accountNumber: string;
  company: string;
}

export const CampaignsKanban: React.FC<CampaignsKanbanProps> = ({ 
  companies,
  advertiserAccounts
}) => {
  // Load campaigns from localStorage or use empty array
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    try {
      const stored = localStorage.getItem('kanban_campaigns');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    whatsapp: '',
    advertiserAccount: '',
    accountNumber: '',
    company: ''
  });
  const [currentPage, setCurrentPage] = useState<{ [key: string]: number }>({});

  // Filter active companies
  const activeCompanies = companies.filter(c => c.status === 'ACTIVO');

  // Group campaigns by company
  const campaignsByCompany = activeCompanies.map(company => ({
    company,
    campaigns: campaigns.filter(c => c.company === company.name)
  }));

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Si cambia el whatsapp, validar que solo sean números y máximo 9 dígitos
    if (name === 'whatsapp') {
      const numericValue = value.replace(/\D/g, '').slice(0, 9);
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    }
    // Si cambia la cuenta publicitaria, obtener su número de cuenta
    else if (name === 'advertiserAccount') {
      const selectedAccount = advertiserAccounts.find(acc => acc.name === value);
      setFormData(prev => ({
        ...prev,
        advertiserAccount: value,
        accountNumber: selectedAccount?.accountNumber || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateWhatsApp = (phone: string): boolean => {
    // Solo permite exactamente 9 dígitos
    const phoneRegex = /^\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleOpenEdit = (campaign: Campaign) => {
    setIsEditing(true);
    setEditingId(campaign.id);
    setFormData({
      name: campaign.name,
      whatsapp: campaign.whatsapp,
      advertiserAccount: campaign.advertiserAccount,
      accountNumber: campaign.accountNumber,
      company: campaign.company
    });
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
            setEditingId(null);
            setFormData({
              name: '',
              whatsapp: '',
              advertiserAccount: '',
              accountNumber: '',
              company: ''
            });
          }}
          title={isEditing ? 'Editar Campaña' : 'Nueva Campaña'}
        >
          {/* Modal content */}
        </Modal>
      )}
    </div>
  );
};
