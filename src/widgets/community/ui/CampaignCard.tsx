import React from 'react';

export type Campaign = {
  id: string;
  name: string;
  whatsapp: string;
  advertiserAccount: string;
  accountNumber: string;
  company: string;
};

interface CampaignCardProps {
  campaign: Campaign;
  onEdit?: () => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onEdit }) => (
  <div className="campaign-card">
    <h4>{campaign.name}</h4>
    <p>WhatsApp: {campaign.whatsapp}</p>
    <p>Cuenta: {campaign.advertiserAccount}</p>
    <p>Empresa: {campaign.company}</p>
    <button onClick={onEdit}>Editar</button>
  </div>
);
