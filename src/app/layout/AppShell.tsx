import React from 'react';
import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-gray-900 text-white shadow-lg">
      <div className="p-6">
        <h1 className="text-2xl font-bold">ALBRUGROUP</h1>
      </div>
      <nav className="px-4 py-6 space-y-2">
        {/* Sections de navegación serán añadidas */}
      </nav>
    </aside>
  );
};

const Navbar: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-8 py-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
        <div>{/* Usuario info aquí */}</div>
      </div>
    </header>
  );
};
