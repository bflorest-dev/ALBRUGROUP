import React from 'react';
import { AppShell } from '@app/layout/AppShell';

const PaginaPanel: React.FC = () => {
  return (
    <AppShell>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Panel Administrativo</h1>
        <p>Bienvenido al panel administrativo</p>
      </div>
    </AppShell>
  );
};

export default PaginaPanel;
