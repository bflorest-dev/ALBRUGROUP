import React from 'react';
import { BiTrash, BiEdit, BiMobile, BiBarChartAlt2 } from 'react-icons/bi';
import './CampaignCard.css';

export interface Campaign {
  id: string;
  name: string;
  whatsapp: string;
  advertiserAccount: string;
  accountNumber: string;
  company: string;
}

interface CampaignCardProps {
  campaign: Campaign;
  onEdit: (campaign: Campaign) => void;
  onDelete: (id: string) => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  onEdit,
  onDelete
}) => {
  return (
    <div className="campaign-card">
      <div className="campaign-card-header">
        <h4 className="campaign-name">{campaign.name}</h4>
      </div>

      <div className="campaign-card-body">
        <div className="campaign-info-item">
          <BiMobile className="campaign-info-icon" size={16} />
          <span className="campaign-info-value">{campaign.whatsapp}</span>
        </div>
        <div className="campaign-info-item">
          <BiBarChartAlt2 className="campaign-info-icon" size={16} />
          <div className="campaign-info-column">
            <span className="campaign-info-value">{campaign.advertiserAccount}</span>
            <span className="campaign-account-number">{campaign.accountNumber}</span>
          </div>
        </div>
      </div>

      <div className="campaign-card-actions">
        <button
          className="campaign-action-btn edit"
          onClick={() => onEdit(campaign)}
          title="Editar campaña"
        >
          <BiEdit size={16} />
        </button>
        <button
          className="campaign-action-btn delete"
          onClick={() => onDelete(campaign.id)}
          title="Eliminar campaña"
        >
          <BiTrash size={16} />
        </button>
      </div>
    </div>
  );
};
