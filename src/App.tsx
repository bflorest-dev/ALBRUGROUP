import './App.css'
import { MainLayout } from '@widgets/layout-principal/ui/MainLayout'
import { DevRoleProvider, useDevRole } from '@compartido/lib'
import { ApplicantsProvider } from '@compartido/lib'
import { ErrorBoundary } from '@compartido/ui/limitadorErrores/ErrorBoundary'
import { ErrorLogger } from '@compartido/lib'
import { AuthService } from '@caracteristicas/autenticacion/api'
import type { ErrorInfo } from 'react';
import { useEffect } from 'react';

const AppContent = () => {
  const { selectedRole, setSelectedRole } = useDevRole();

  // Restaurar token del localStorage al montar la app
  useEffect(() => {
    AuthService.initialize();
  }, []);

  return (
    <>
      <div className="dev-controls">
        <label htmlFor="role-select">Dev Role:</label>
        <select
          id="role-select"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as 'ADMINISTRADOR' | 'DESARROLLADOR' | 'LOGIN' | 'RRHH' | 'RECLUTAMIENTO')}
        >
          <option value="ADMINISTRADOR">ADMINISTRADOR</option>
          <option value="DESARROLLADOR">DESARROLLADOR</option>
          <option value="LOGIN">LOGIN</option>
          <option value="RRHH">RRHH</option>
          <option value="RECLUTAMIENTO">RECLUTAMIENTO</option>
          <option value="CAPACITACION">CAPACITACION</option>
          <option value="CONTABILIDAD">CONTABILIDAD</option>
          <option value="COMMUNITY">COMMUNITY</option>
          <option value="SUPERVISOR_VENTAS">SUPERVISOR_VENTAS</option>
          <option value="ASESOR_VENTAS">ASESOR_VENTAS</option>
          <option value="SUPERVISOR_BACKOFFICE">SUPERVISOR_BACKOFFICE</option>
          <option value="ASESOR_BACKOFFICE">ASESOR_BACKOFFICE</option>
          <option value="SUPERVISOR_GTR">SUPERVISOR_GTR</option>
          <option value="ASESOR_GTR">ASESOR_GTR</option>
          <option value="SUPERVISOR_POSTVENTA">SUPERVISOR_POSTVENTA</option>
          <option value="ASESOR_POSTVENTA">ASESOR_POSTVENTA</option>
        </select>
      </div>

      <MainLayout />
    </>
  );
};

function App() {
  // Note: ErrorBoundary now handles errors internally via componentDidCatch
  // handleErrorBoundaryError kept commented for reference
  // const handleErrorBoundaryError = (error: Error, errorInfo: ErrorInfo) => {
  //   ErrorLogger.logError('App.tsx', error, {
  //     componentStack: errorInfo.componentStack,
  //     context: 'Global ErrorBoundary'
  //   });
  // };

  return (
    <ErrorBoundary>
      <div className="app">
        <DevRoleProvider>
          <ApplicantsProvider>
            <AppContent />
          </ApplicantsProvider>
        </DevRoleProvider>
      </div>
    </ErrorBoundary>
  )
}

export default App
