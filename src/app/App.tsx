import React from 'react';
import { AppRoutes } from '@app/router/AppRoutes';
import { ProveedorAuth } from '@app/providers/ProveedorAuth';
import { ProveedorQuery } from '@app/providers/ProveedorQuery';
import { AppProvider } from '@app/AppContext';
import '@shared/api/interceptors';

const App: React.FC = () => {
  return (
    <ProveedorQuery>
      <ProveedorAuth>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </ProveedorAuth>
    </ProveedorQuery>
  );
};

export default App;
