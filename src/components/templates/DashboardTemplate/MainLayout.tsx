/**
 * Componente MainLayout - Layout principal de la aplicación
 */

import { useState } from 'react';
import type { ComponentType } from 'react';
import { BiGroup, BiSearchAlt, BiBarChart, BiTime } from 'react-icons/bi';
import { Sidebar } from '../../organisms/Layout';
import { EmployeeDashboard, ApplicantsDashboard, ComingSoonPage } from '../../pages';
import { mockUserProfile } from '../../../utils/mockData';
import { NotificationProvider } from '../../../contexts/NotificationContext';
import { useNotification } from '../../../contexts/useNotification';
import { ToastContainer } from '../../molecules/Toast';
import { ErrorBoundary } from '../../molecules/ErrorBoundary';
import './MainLayout.css';

interface NavItem {
  label: string;
  icon: ComponentType<{ size?: number }>;
  active: boolean;
}

const MainLayoutContent = () => {
  const [activeNav, setActiveNav] = useState('Postulantes');

  const navItems: NavItem[] = [
    { label: 'Postulantes', icon: BiSearchAlt, active: activeNav === 'Postulantes' },
    { label: 'Empleados', icon: BiGroup, active: activeNav === 'Empleados' },
    { label: 'Reportes', icon: BiBarChart, active: activeNav === 'Reportes' },
    { label: 'Horario', icon: BiTime, active: activeNav === 'Horario' },
  ];

  const handleNavClick = (label: string) => {
    setActiveNav(label);
  };

  const renderPage = () => {
    switch (activeNav) {
      case 'Postulantes':
        return (
          <ErrorBoundary fallback={
            <div className="error-boundary">
              <div className="error-boundary__content">
                <div className="error-boundary__icon">👥</div>
                <h2 className="error-boundary__title">Error en Postulantes</h2>
                <p className="error-boundary__message">
                  Ha ocurrido un error al cargar la sección de postulantes.
                </p>
                <button
                  className="error-boundary__retry-btn"
                  onClick={() => window.location.reload()}
                >
                  Recargar sección
                </button>
              </div>
            </div>
          }>
            <ApplicantsDashboard />
          </ErrorBoundary>
        );
      case 'Empleados':
        return (
          <ErrorBoundary fallback={
            <div className="error-boundary">
              <div className="error-boundary__content">
                <div className="error-boundary__icon">👤</div>
                <h2 className="error-boundary__title">Error en Empleados</h2>
                <p className="error-boundary__message">
                  Ha ocurrido un error al cargar la sección de empleados.
                </p>
                <button
                  className="error-boundary__retry-btn"
                  onClick={() => window.location.reload()}
                >
                  Recargar sección
                </button>
              </div>
            </div>
          }>
            <EmployeeDashboard />
          </ErrorBoundary>
        );
      case 'Reportes':
        return <ComingSoonPage title="Reportes" icon={<BiBarChart size={64} />} />;
      case 'Horario':
        return <ComingSoonPage title="Horario" icon={<BiTime size={64} />} />;
      default:
        return (
          <ErrorBoundary>
            <ApplicantsDashboard />
          </ErrorBoundary>
        );
    }
  };

  const { toasts, removeToast } = useNotification();

  return (
    <>
      <div className="main-layout">
        <Sidebar navItems={navItems} onNavClick={handleNavClick} user={mockUserProfile} />
        
        <div className="layout-content">
          {renderPage()}
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

export const MainLayout = () => {
  return (
    <NotificationProvider>
      <MainLayoutContent />
    </NotificationProvider>
  );
};

