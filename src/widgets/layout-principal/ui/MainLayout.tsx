/**
 * Componente MainLayout - Layout principal de la aplicación
 */

import React, { useRef } from 'react';
import RouterByRole from '@app/RouterByRole';
import { NotificationProvider } from '@compartido/lib';
import { useNotification } from '@compartido/lib';
import { useDevRole } from '@compartido/lib';
import { SidebarProvider, useSidebar } from '@compartido/lib';
// DEPRECATED: ToastContainer no existe en nueva estructura
// import { ToastContainer } from '../../molecules/Toast';
// DEPRECATED: MainLayout.css was removed in refactoring
// import './MainLayout.css';

const MainLayoutContent = () => {
  const { selectedRole } = useDevRole();
  const mainRef = useRef<HTMLDivElement | null>(null);
  const { collapsed } = useSidebar();

  const renderPage = () => {
    return <RouterByRole role={selectedRole} />;
  };

  const { toasts, removeToast } = useNotification();

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const el = mainRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches?.[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      const me = e as React.MouseEvent;
      clientX = me.clientX;
      clientY = me.clientY;
    }

    const px = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const py = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    const nx = (px - 0.5) * 2; // -1..1
    const ny = (py - 0.5) * 2; // -1..1

    el.style.setProperty('--nx', nx.toFixed(3));
    el.style.setProperty('--ny', ny.toFixed(3));
  };

  const handlePointerLeave = () => {
    const el = mainRef.current;
    if (!el) return;
    el.style.setProperty('--nx', '0');
    el.style.setProperty('--ny', '0');
  };

  return (
    <>
      <div
        ref={mainRef}
        className={`main-layout${collapsed ? ' sidebar-collapsed' : ''}`}
        onMouseMove={handlePointerMove}
        onTouchMove={handlePointerMove}
        onMouseLeave={handlePointerLeave}
      >
        {/* Global waves background only on login */}
        {selectedRole === 'LOGIN' && (
          <div className="global-waves" aria-hidden="true">
            <svg className="waves-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400" preserveAspectRatio="none">
              <defs>
                <linearGradient id="seaGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="45%" stopColor="var(--wave-fill-3)" stopOpacity="0.06" />
                  <stop offset="75%" stopColor="var(--wave-fill-2)" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="var(--wave-fill-1)" stopOpacity="0.42" />
                </linearGradient>

                <path id="wave-path" d="M0,160 C150,320 350,40 600,160 C850,280 1050,80 1200,160 L1200,400 L0,400 Z" />
              </defs>

              <rect x="0" y="0" width="1200" height="400" fill="url(#seaGradient)" />

              <g className="parallax-waves">
                <use href="#wave-path" x="0" y="0" className="wave-1" />
                <use href="#wave-path" x="0" y="12" className="wave-2" />
                <use href="#wave-path" x="0" y="24" className="wave-3" />
                <use href="#wave-path" x="0" y="36" className="wave-4" />
              </g>
            </svg>
          </div>
        )}

        {/* if login show page directly; otherwise wrap in layout-content for margins */}
        {selectedRole === 'LOGIN' ? (
          renderPage()
        ) : (
          <div className={`layout-content ${selectedRole === 'RRHH' ? 'full-bleed' : ''}`}>
            {renderPage()}
          </div>
        )}
      </div>
      {/* DEPRECATED: ToastContainer no existe */}
      {/* <ToastContainer toasts={toasts} onRemove={removeToast} /> */}
    </>
  );
};

export const MainLayout = () => {
  return (
    <NotificationProvider>
      <SidebarProvider>
        <MainLayoutContent />
      </SidebarProvider>
    </NotificationProvider>
  );
};

