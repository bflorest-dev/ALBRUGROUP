/**
 * Componente CampaignCard - Widget Community
 */

import React from 'react';

export interface Campaign {
  id?: string;
  title?: string;
  description?: string;
}

interface CampaignCardProps {
  id?: string;
  title?: string;
  description?: string;
  onClick?: () => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({ title, description, onClick }) => {
  return (
    <div className="campaign-card" onClick={onClick}>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

export default CampaignCard;
