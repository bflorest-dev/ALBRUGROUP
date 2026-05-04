import React from 'react';
import { AppRoutes } from '@app/router/AppRoutes';
import { ProveedorAuth } from '@app/providers/ProveedorAuth';
import { AppProvider } from '@app/AppContext';
import { ErrorBoundary } from '@shared/ui';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ProveedorAuth>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </ProveedorAuth>
    </ErrorBoundary>
  );
};

export default App;
