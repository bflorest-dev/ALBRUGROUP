import { useAdminDashboard } from '../hooks/useAdminDashboard';
import './AdminDashboard.css';

/**
 * Versión de prueba del AdminDashboard para debug
 */
export const AdminDashboardTest = () => {
  const state = useAdminDashboard();

  return (
    <div className="admin-dashboard-wrapper">
      {/* Sidebar Menu */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>Administrador</h2>
          <p style={{ color: 'white', fontSize: '12px', margin: '8px 0 0 0' }}>
            Sección Activa: {state.activeSection}
          </p>
        </div>
        <nav className="admin-nav">
          <button
            type="button"
            className={`admin-nav-item ${state.activeSection === 'plans' ? 'active' : ''}`}
            onClick={() => state.setActiveSection('plans')}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-label">Planes</span>
          </button>
          <button
            type="button"
            className={`admin-nav-item ${state.activeSection === 'promotions' ? 'active' : ''}`}
            onClick={() => state.setActiveSection('promotions')}
          >
            <span className="nav-icon">🎁</span>
            <span className="nav-label">Promociones</span>
          </button>
          <button
            type="button"
            className={`admin-nav-item ${state.activeSection === 'adicionales' ? 'active' : ''}`}
            onClick={() => state.setActiveSection('adicionales')}
          >
            <span className="nav-icon">➕</span>
            <span className="nav-label">Adicionales</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-content">
        <div className="admin-section">
          {/* Test Content */}
          {state.activeSection === 'plans' && (
            <div>
              <h2>📋 Gestión de Planes</h2>
              <p>Total de planes: {state.plans.length}</p>
              <button onClick={() => console.log('Plans data:', state.plans)}>
                Ver planes en consola
              </button>
              <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '4px' }}>
                <pre>{JSON.stringify(state.plans, null, 2)}</pre>
              </div>
            </div>
          )}

          {state.activeSection === 'promotions' && (
            <div>
              <h2>🎁 Gestión de Promociones</h2>
              <p>Total de promociones: {state.promotions.length}</p>
              <button onClick={() => console.log('Promotions data:', state.promotions)}>
                Ver promociones en consola
              </button>
              <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '4px' }}>
                <pre>{JSON.stringify(state.promotions, null, 2)}</pre>
              </div>
            </div>
          )}

          {state.activeSection === 'adicionales' && (
            <div>
              <h2>➕ Gestión de Adicionales</h2>
              <p>Total de adicionales: {state.adicionales.length}</p>
              <button onClick={() => console.log('Adicionales data:', state.adicionales)}>
                Ver adicionales en consola
              </button>
              <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '4px' }}>
                <pre>{JSON.stringify(state.adicionales, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
