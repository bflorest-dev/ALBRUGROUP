import React from 'react';
import { BiHome, BiChart, BiBarChartAlt2, BiBuilding } from 'react-icons/bi';
import './CommunityMenubar.css';

export interface CommunityMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  section: 'campaigns' | 'dashboard' | 'accounts' | 'companies';
}

interface CommunityMenubarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems: CommunityMenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <BiHome size={20} />,
    section: 'dashboard'
  },
  {
    id: 'accounts',
    label: 'Cuentas Publicitarias',
    icon: <BiBarChartAlt2 size={20} />,
    section: 'accounts'
  },
  {
    id: 'companies',
    label: 'Empresas',
    icon: <BiBuilding size={20} />,
    section: 'companies'
  },
  {
    id: 'campaigns',
    label: 'Campañas',
    icon: <BiChart size={20} />,
    section: 'campaigns'
  }
];

export const CommunityMenubar: React.FC<CommunityMenubarProps> = ({ 
  activeSection, 
  onSectionChange 
}) => {
  return (
    <nav className="community-menubar">
      <div className="menubar-header">
        <h3 className="menubar-title">Gestión</h3>
      </div>

      <ul className="menubar-list">
        {menuItems.map((item) => (
          <li key={item.id}>
            <button
              className={`menubar-item ${activeSection === item.section ? 'active' : ''}`}
              onClick={() => onSectionChange(item.section)}
              title={item.label}
            >
              <span className="menubar-icon">{item.icon}</span>
              <span className="menubar-label">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="menubar-footer">
        <p className="menubar-version">v1.0</p>
      </div>
    </nav>
  );
};
