import React, { useState } from 'react';
import { BiTrash, BiEdit } from 'react-icons/bi';
import './CompanyCard.css';

export interface Company {
  id: string;
  name: string;
  status: 'ACTIVO' | 'INACTIVO';
  color?: string;
}

interface CompanyCardProps {
  company: Company;
  onStatusChange: (id: string, newStatus: 'ACTIVO' | 'INACTIVO') => void;
  onEdit: (company: Company) => void;
  onDelete: (id: string) => void;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({
  company,
  onStatusChange,
  onEdit,
  onDelete
}) => {
  const [isRotating, setIsRotating] = useState(false);

  const handleStatusToggle = () => {
    setIsRotating(true);
    const newStatus = company.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    onStatusChange(company.id, newStatus);
    
    // Reset animation after completion
    setTimeout(() => setIsRotating(false), 600);
  };

  const isActive = company.status === 'ACTIVO';
  const cardColor = company.color || '#10B981';

  // Convertir hex a rgba para usar como fondo semi-transparente
  const hexToRgba = (hex: string, alpha: number = 0.1): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const cardBgColor = hexToRgba(cardColor, 0.08);

  return (
    <div 
      className={`company-card ${isActive ? 'active' : 'inactive'}`}
      style={{ 
        '--company-color': cardColor,
        '--company-bg-color': cardBgColor
      } as React.CSSProperties}
    >
      {/* Contenido principal */}
      <div className="company-card-content">
        <h3 className="company-card-name">{company.name}</h3>
      </div>

      {/* Badge Status Rotatorio */}
      <div 
        className={`company-status-badge ${isActive ? 'active' : 'inactive'} ${isRotating ? 'rotating' : ''}`}
      >
        <span className="badge-text">{company.status}</span>
      </div>

      {/* Toggle Switch 3D */}
      <div className="company-toggle-container">
        <button
          className={`toggle-switch ${isActive ? 'active' : 'inactive'}`}
          onClick={handleStatusToggle}
          aria-label={`Toggle status: ${company.status}`}
        >
          <span className={`toggle-label ${isActive ? 'on' : 'off'}`}>{isActive ? 'ON' : 'OFF'}</span>
          <span className="toggle-circle"></span>
        </button>
      </div>

      {/* Botones de Acción */}
      <div className="company-actions">
        <button
          className="company-edit-btn"
          onClick={() => onEdit(company)}
          title="Editar empresa"
        >
          <BiEdit size={16} />
        </button>
        <button
          className="company-delete-btn"
          onClick={() => onDelete(company.id)}
          title="Eliminar empresa"
        >
          <BiTrash size={16} />
        </button>
      </div>
    </div>
  );
};
