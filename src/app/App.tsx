import React from 'react';
import { AppRoutes } from '@app/router/AppRoutes';
import { ProveedorAuth } from '@app/providers/ProveedorAuth';
import { AppProvider } from '@app/AppContext';

const App: React.FC = () => {
  return (
    <ProveedorAuth>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </ProveedorAuth>
  );
};

export default App;
