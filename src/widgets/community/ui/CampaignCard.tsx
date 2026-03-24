/**
 * Componente CampaignCard - Widget Community
 */

import React from 'react';

export interface Campaign {
  id?: string;
  title?: string;
  description?: string;
  name?: string;
  campaignName?: string;
  company?: string;
  whatsapp?: string;
  advertiserAccount?: string;
  accountNumber?: string;
}

interface CampaignCardProps {
  id?: string;
  title?: string;
  name?: string;
  description?: string;
  campaign?: Campaign;
  onClick?: () => void;
  onEdit?: () => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({ 
  title, 
  name,
  description, 
  campaign,
  onClick, 
  onEdit 
}) => {
  const displayTitle = title || name || campaign?.name || campaign?.title;
  const displayDescription = description || campaign?.description;
  
  return (
    <div className="campaign-card" onClick={onClick}>
      <h3>{displayTitle}</h3>
      <p>{displayDescription}</p>
      {onEdit && (
        <button 
          className="edit-btn" 
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          Edit
        </button>
      )}
    </div>
  );
};

export default CampaignCard;
