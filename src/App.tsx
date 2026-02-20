import './App.css'
import { MainLayout } from './components/templates/DashboardTemplate'
import { DataProvider } from './contexts/DataContext'
import { DevRoleProvider, useDevRole } from './contexts/DevRoleContext'
import { ErrorBoundary } from './components/molecules/ErrorBoundary'
import { DarkModeToggle } from './components/atoms/DarkModeToggle'

const AppContent = () => {
  const { selectedRole, setSelectedRole } = useDevRole();

  return (
    <>
      <div className="dev-controls">
        <label htmlFor="role-select">Dev Role:</label>
        <select
          id="role-select"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as any)}
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

      {/* Dark mode toggle only on LOGIN role */}
      {selectedRole === 'LOGIN' && (
        <div className="dark-toggle-wrapper" style={{ position: 'fixed', top: 10, right: 10, zIndex: 1001 }}>
          <DarkModeToggle />
        </div>
      )}

      <MainLayout />
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <div className="app">
        <DevRoleProvider>
          <DataProvider>
            <AppContent />
          </DataProvider>
        </DevRoleProvider>
      </div>
    </ErrorBoundary>
  )
}

export default App
