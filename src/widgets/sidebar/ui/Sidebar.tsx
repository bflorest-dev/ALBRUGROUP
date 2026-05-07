/**
 * Componente Sidebar - Barra lateral de navegaciÃ³n
 */

import type { ComponentType } from 'react';
import type { UserProfile } from '@shared/types';
import { UserProfileComponent } from './UserProfile';
import { useSidebar } from '@shared/hooks';
import './Sidebar.css';

interface NavItem {
  label: string;
  icon: ComponentType<{ size?: number }>;
  active?: boolean;
}

interface SidebarProps {
  navItems: NavItem[];
  onNavClick?: (label: string) => void;
  user?: UserProfile;
}

export const Sidebar = ({ navItems, onNavClick, user }: SidebarProps) => {
  const { collapsed } = useSidebar();

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-text">ALBRU</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.label}
              className={`nav-item ${item.active ? 'active' : ''}`}
              onClick={() => onNavClick?.(item.label)}
              title={item.label}
              aria-label={item.label}
              aria-current={item.active ? 'page' : undefined}
            >
              <span className="nav-icon" aria-hidden>
                <IconComponent size={20} />
              </span>
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {user && (
        <div className="sidebar-user-profile">
          <UserProfileComponent user={user} />
        </div>
      )}
    </aside>
  );
};

