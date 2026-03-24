import React, { useState } from 'react';
import { BiTrash, BiEdit } from 'react-icons/bi';
import './CampaignCard.css';

export interface Campaign {
  id: string;
  name: string;
  whatsapp?: string;
  advertiserAccount?: string;
  accountNumber?: string;
  company?: string;
}

interface CampaignCardProps {
  campaign: Campaign;
  onEdit?: (campaign: Campaign) => void;
  onDelete?: (id: string) => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onEdit, onDelete }) => {
  return (
    <div className="campaign-card">
      <div className="campaign-card-header">
        <h3>{campaign.name}</h3>
      </div>
      
      <div className="campaign-card-body">
        {campaign.whatsapp && <p>WhatsApp: {campaign.whatsapp}</p>}
        {campaign.advertiserAccount && <p>Cuenta: {campaign.advertiserAccount}</p>}
        {campaign.accountNumber && <p>Número: {campaign.accountNumber}</p>}
        {campaign.company && <p>Empresa: {campaign.company}</p>}
      </div>
      
      <div className="campaign-card-actions">
        {onEdit && (
          <button 
            className="btn-edit"
            onClick={() => onEdit(campaign)}
            title="Editar campaña"
          >
            <BiEdit size={18} />
          </button>
        )}
        {onDelete && (
          <button 
            className="btn-delete"
            onClick={() => onDelete(campaign.id)}
            title="Eliminar campaña"
          >
            <BiTrash size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
