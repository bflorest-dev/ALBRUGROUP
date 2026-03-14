import React, { useState } from 'react';
import { BiPlus, BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import { Modal } from '@molecules/index';
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

  const handleSave = () => {
    if (!formData.name.trim() || !formData.whatsapp || !formData.advertiserAccount || !formData.company) {
      alert('Por favor completa todos los campos');
      return;
    }

    if (!validateWhatsApp(formData.whatsapp)) {
      alert('Por favor ingresa un número de WhatsApp válido (9 dígitos)');
      return;
    }

    if (isEditing && editingId) {
      // Actualizar campaña
      setCampaigns(prev => {
        const updated = prev.map(c =>
          c.id === editingId
            ? { ...c, ...formData }
            : c
        );
        localStorage.setItem('kanban_campaigns', JSON.stringify(updated));
        return updated;
      });
    } else {
      // Crear nueva campaña
      const newCampaign: Campaign = {
        id: `${Date.now()}`,
        ...formData
      };
      setCampaigns(prev => {
        const updated = [newCampaign, ...prev];
        localStorage.setItem('kanban_campaigns', JSON.stringify(updated));
        return updated;
      });
    }

    setIsModalOpen(false);
    setFormData({ name: '', whatsapp: '', advertiserAccount: '', accountNumber: '', company: '' });
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta campaña?')) {
      setCampaigns(prev => {
        const updated = prev.filter(c => c.id !== id);
        localStorage.setItem('kanban_campaigns', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', whatsapp: '', advertiserAccount: '', accountNumber: '', company: '' });
    setIsEditing(false);
    setEditingId(null);
  };

  const CAMPAIGNS_PER_PAGE = 3;

  const handlePageChange = (companyId: string, newPage: number) => {
    setCurrentPage(prev => ({
      ...prev,
      [companyId]: newPage
    }));
  };

  return (
    <div className="campaigns-kanban-section">
      {/* Header */}
      <div className="campaigns-kanban-header">
        <div className="campaigns-header-title">
          <h1>Campañas</h1>
          <p>Gestiona tus campañas por empresa</p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {campaignsByCompany.map(({ company, campaigns: companyCampaigns }) => {
          const currentPageNum = currentPage[company.id] || 1;
          const totalPages = Math.ceil(companyCampaigns.length / CAMPAIGNS_PER_PAGE);
          const startIndex = (currentPageNum - 1) * CAMPAIGNS_PER_PAGE;
          const endIndex = startIndex + CAMPAIGNS_PER_PAGE;
          const paginatedCampaigns = companyCampaigns.slice(startIndex, endIndex);

          return (
            <div key={company.id} className="kanban-column">
              <div className="column-header">
                <h3 className="column-title">{company.name}</h3>
                <span className="column-badge">{companyCampaigns.length}</span>
              </div>

              <div className="column-content">
                {companyCampaigns.length > 0 ? (
                  <>
                    {paginatedCampaigns.map(campaign => (
                      <CampaignCard
                        key={campaign.id}
                        campaign={campaign}
                        onEdit={handleOpenEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                    
                    {/* Paginación */}
                    {totalPages > 1 && (
                      <div className="column-pagination">
                        <button
                          className="pagination-btn"
                          onClick={() => handlePageChange(company.id, currentPageNum - 1)}
                          disabled={currentPageNum === 1}
                          title="Página anterior"
                        >
                          <BiChevronLeft size={20} />
                        </button>
                        <span className="pagination-info">
                          {currentPageNum} / {totalPages}
                        </span>
                        <button
                          className="pagination-btn"
                          onClick={() => handlePageChange(company.id, currentPageNum + 1)}
                          disabled={currentPageNum === totalPages}
                          title="Página siguiente"
                        >
                          <BiChevronRight size={20} />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="column-empty">
                    <p>Sin campañas</p>
                    <button
                      className="btn-add-campaign"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, company: company.name }));
                        setIsModalOpen(true);
                      }}
                    >
                      <BiPlus size={14} />
                      Agregar
                    </button>
                  </div>
                )}
              </div>

              <div className="column-footer">
                <button
                  className="btn-column-add"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, company: company.name }));
                    setIsModalOpen(true);
                  }}
                >
                  <BiPlus size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal para crear/editar */}
      <Modal
        isOpen={isModalOpen}
        title={isEditing ? 'Editar Campaña' : 'Nueva Campaña'}
        onClose={handleCloseModal}
        className="medium"
      >
        <div className="campaign-form">
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="name">NOMBRE DE LA CAMPAÑA *</label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="ej: Promo Fibra Marzo"
                className="form-input"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="whatsapp">NÚMERO DE WHATSAPP *</label>
              <input
                id="whatsapp"
                type="text"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleFormChange}
                placeholder="987654321"
                className="form-input"
                inputMode="numeric"
              />
              <span className="form-hint">Solo números • Máximo 9 dígitos ({formData.whatsapp.length}/9)</span>
            </div>

            <div className="form-group">
              <label htmlFor="advertiserAccount">CUENTA PUBLICITARIA *</label>
              <select
                id="advertiserAccount"
                name="advertiserAccount"
                value={formData.advertiserAccount}
                onChange={handleFormChange}
                className="form-input"
              >
                <option value="">Selecciona una cuenta...</option>
                {advertiserAccounts.map(account => (
                  <option key={account.id} value={account.name}>
                    {account.name} ({account.accountNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="company">EMPRESA *</label>
              <select
                id="company"
                name="company"
                value={formData.company}
                onChange={handleFormChange}
                className="form-input"
              >
                <option value="">Selecciona una empresa...</option>
                {activeCompanies.map(company => (
                  <option key={company.id} value={company.name}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn-cancel" onClick={handleCloseModal}>
              Cancelar
            </button>
            <button className="btn-confirm" onClick={handleSave}>
              {isEditing ? 'Actualizar' : 'Crear'} Campaña
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
