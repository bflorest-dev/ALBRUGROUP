import React, { useState } from 'react';
import { BiTrash, BiEdit } from 'react-icons/bi';
import './AdvertiserAccountCard.css';

export interface AdvertiserAccount {
  id: string;
  name: string;
  accountNumber: string;
}

interface AdvertiserAccountCardProps {
  account: AdvertiserAccount;
  colorIndex: number;
  onDelete: (id: string) => void;
  onEdit: (account: AdvertiserAccount) => void;
}

const gradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
];

export const AdvertiserAccountCard: React.FC<AdvertiserAccountCardProps> = ({
  account,
  colorIndex,
  onDelete,
  onEdit
}) => {
  const [showActions, setShowActions] = useState(false);
  const gradient = gradients[colorIndex % gradients.length];

  return (
    <div
      className="account-card"
      style={{ background: gradient }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Contenido principal */}
      <div className="account-card-content">
        <h3 className="account-card-name">{account.name}</h3>
        <p className="account-card-number">ID: {account.accountNumber}</p>
      </div>

      {/* Acciones (hover) */}
      {showActions && (
        <div className="account-card-actions">
          <button
            className="account-action-btn edit"
            onClick={() => onEdit(account)}
            title="Editar"
          >
            <BiEdit size={18} />
          </button>
          <button
            className="account-action-btn delete"
            onClick={() => onDelete(account.id)}
            title="Eliminar"
          >
            <BiTrash size={18} />
          </button>
        </div>
      )}

      {/* Shine effect */}
      <div className="account-card-shine"></div>
    </div>
  );
};
