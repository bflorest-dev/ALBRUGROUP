import React, { useEffect, useState } from 'react';
import { useCommunityData } from '../hooks';
import { CampaignSection } from '../ui/CampaignSection';
import { ProveedoresSection } from '../ui/ProveedoresSection';
import { PlanForm } from '../ui/PlanForm';
import { PromocionesSection } from '../ui/PromocionesSection';
import { ZonaForm } from '../ui/ZonaForm';
import { leadsHttp } from '@shared/api/clienteHttp';
import './PaginaCommunity.css';

const initialState = { loading: false, error: false, status: 0, data: [] };
let communityBootstrapInFlight: Promise<void> | null = null;
const sections = [
  { key: 'campanas', label: 'Campanas' },
  { key: 'cuentas', label: 'Cuentas' },
  { key: 'planes', label: 'Planes' },
  { key: 'promociones', label: 'Promociones' },
  { key: 'proveedores', label: 'Proveedores' },
  { key: 'zonas', label: 'Zonas' },
] as const;

const PaginaCommunity: React.FC = () => {
  const {
    loading,
    error,
    campanas,
    cuentas,
    planes,
    promociones,
    zonas,
    proveedores,
    fetchCampanas,
    fetchCuentas,
    fetchPlanes,
    fetchPromociones,
    fetchZonas,
    fetchProveedores,
    createPlan,
    createZona,
    createPromocion,
  } = useCommunityData();

  const [cuentaForm, setCuentaForm] = useState({ numeroCuenta: '', nombreCuenta: '' });

  const [planState, setPlanState] = useState(initialState);
  const [zonaState, setZonaState] = useState(initialState);
  const [cuentaState, setCuentaState] = useState(initialState);
  const [promoState, setPromoState] = useState(initialState);

  const [globalMessage, setGlobalMessage] = useState('');

  useEffect(() => {
    // Evita duplicar llamadas de bootstrap en React StrictMode (dev)
    if (communityBootstrapInFlight) {
      return;
    }

    communityBootstrapInFlight = (async () => {
      await Promise.all([
        fetchCampanas(),
        fetchCuentas(),
        fetchPlanes(),
        fetchPromociones(),
        fetchZonas(),
        fetchProveedores(),
      ]);
    })().finally(() => {
      communityBootstrapInFlight = null;
    });
  }, [fetchCampanas, fetchCuentas, fetchPlanes, fetchPromociones, fetchZonas, fetchProveedores]);

  const normalizeLeadsPath = (path: string) => path.replace(/^\/api\/leads/, '');

  const getOne = async (path: string, refresh: () => Promise<void>, setter: React.Dispatch<React.SetStateAction<any>>) => {
    setter({ loading: true, error: false, status: 0, data: [] });
    const normalizedPath = normalizeLeadsPath(path);
    try {
      const token = localStorage.getItem('auth_token');
      console.debug('[COMMUNITY] GET', normalizedPath, 'Authorization:', token ? 'Bearer *****' : 'NO TOKEN');

      const res = await leadsHttp.get(normalizedPath);
      setter({ loading: false, error: false, status: res.status, data: res.data ?? [] });
      setGlobalMessage('');
      await refresh();
    } catch (err: any) {
      setter({ loading: false, error: true, status: err.status || 0, data: [] });
      setGlobalMessage(`Error al cargar ${normalizedPath}: ${err.message}`);
    }
  };

  const createOne = async (path: string, payload: any, refresh: () => Promise<void>, setter: React.Dispatch<React.SetStateAction<any>>) => {
    setter({ loading: true, error: false, status: 0, data: [] });
    const normalizedPath = normalizeLeadsPath(path);
    try {
      const token = localStorage.getItem('auth_token');
      console.debug('[COMMUNITY] POST', normalizedPath, 'Authorization:', token ? 'Bearer *****' : 'NO TOKEN');

      const res = await leadsHttp.post(normalizedPath, payload);
      setGlobalMessage('✅ Creado correctamente');
      await refresh();
      setter({ loading: false, error: false, status: res.status, data: [] });
    } catch (err: any) {
      const status = err.status || err.response?.status || 0;
      let message = '';
      if (status === 401) {
        message = '🔐 Sesión expirada';
      } else if (status === 403) {
        message = '🚫 Permiso denegado';
      } else if (status === 400 || status === 422) {
        message = '⚠️ Datos inválidos';
      } else if (status === 500) {
        message = '💥 Error del servidor';
      } else {
        message = err.message || 'Error al crear';
      }
      setter({ loading: false, error: true, status, data: [] });
      setGlobalMessage(`❌ ${message}`);
    }
  };

  const renderTable = (data: any[]) => {
    if (!data || data.length === 0) return <p className="community-empty">Sin resultados</p>;
    const firstItem = data[0];
    if (!firstItem) return <p className="community-empty">Sin datos</p>;
    const cols = Object.keys(firstItem);
    if (cols.length === 0) return <p className="community-empty">Sin columnas</p>;

    return (
      <div className="community-table-wrapper">
        <table className="community-table">
          <thead>
            <tr>
              {cols.map((col) => (
                <th key={col}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                {cols.map((col) => (
                  <td key={col}>
                    {typeof item[col] === 'object' ? JSON.stringify(item[col]) : item[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: 0,
    border: 'none',
    borderRadius: 0,
    padding: 0,
    background: '#fff',
  };

  const [activeSection, setActiveSection] = useState<'campanas' | 'cuentas' | 'planes' | 'promociones' | 'proveedores' | 'zonas'>('campanas');

  return (
    <div className="community-page">
      <div className="community-shell">
        <header className="community-header">
          <p className="community-eyebrow">Panel de Operaciones</p>
          <h1>Community</h1>
          <p className="community-subtitle">Gestiona campanas, cuentas, planes, promociones, proveedores y zonas desde una sola vista.</p>
        </header>

        <div className="community-tabs" role="tablist" aria-label="Secciones de community">
          {sections.map((section) => (
          <button
            key={section.key}
            type="button"
            className={`community-tab ${activeSection === section.key ? 'is-active' : ''}`}
            onClick={() => setActiveSection(section.key)}
          >
            {section.label}
          </button>
        ))}
        </div>

        {globalMessage && <div className="community-alert">{globalMessage}</div>}

      {activeSection === 'planes' && (
        <section style={sectionStyle} className="community-card">
          <div className="community-section-head">
            <div>
              <h2>Planes</h2>
              <p>Configura planes comerciales con internet, television, telefono y adicionales.</p>
            </div>
          </div>
          <PlanForm
            proveedores={proveedores}
            onCreatePlan={createPlan}
            onCreated={fetchPlanes}
          />
          {planState.error ? <div className="community-error">Error al cargar datos (status: {planState.status})</div> : renderTable(planes || [])}
        </section>
      )}

      {activeSection === 'zonas' && (
        <section style={sectionStyle} className="community-card">
          <div className="community-section-head">
            <div>
              <h2>Zonas</h2>
              <p>Define reglas geograficas por nivel y criterio para segmentacion.</p>
            </div>
          </div>
          <ZonaForm
            onCreateZona={createZona}
            onCreated={fetchZonas}
          />
          {zonaState.error ? <div className="community-error">Error al cargar datos (status: {zonaState.status})</div> : renderTable(zonas || [])}
        </section>
      )}

      {activeSection === 'campanas' && (
        <CampaignSection
          sectionStyle={sectionStyle}
          campanas={campanas}
          catalogs={{ cuentas, proveedores, planes, zonas, promociones }}
          loading={loading}
          error={!!error}
          onRefresh={fetchCampanas}
        />
      )}

      {activeSection === 'cuentas' && (
        <section style={sectionStyle} className="community-card">
          <div className="community-section-head">
            <div>
              <h2>Cuentas Publicitarias</h2>
              <p>Registra y sincroniza cuentas antes de crear nuevas campanas.</p>
            </div>
          </div>
        <form
          className="community-inline-form"
          onSubmit={async (e) => {
            e.preventDefault();
            await createOne('/api/leads/cuentas-publicitarias', { numeroCuenta: cuentaForm.numeroCuenta, nombreCuenta: cuentaForm.nombreCuenta }, fetchCuentas, setCuentaState);
          }}
        >
          <input className="community-input" value={cuentaForm.numeroCuenta} placeholder="Numero cuenta" onChange={(e) => setCuentaForm((s) => ({ ...s, numeroCuenta: e.target.value }))} />
          <input className="community-input" value={cuentaForm.nombreCuenta} placeholder="Nombre cuenta" onChange={(e) => setCuentaForm((s) => ({ ...s, nombreCuenta: e.target.value }))} />
          <button className="community-btn primary" type="submit">Crear Cuenta</button>
          <button className="community-btn ghost" type="button" onClick={() => fetchCuentas()}>Cargar datos</button>
        </form>
        {cuentaState.error ? <div className="community-error">Error al cargar datos (status: {cuentaState.status})</div> : renderTable(cuentas || [])}
      </section>
      )}

      {activeSection === 'promociones' && (
        <PromocionesSection
          promociones={promociones}
          proveedores={proveedores}
          zonas={zonas}
          onCreatePromocion={createPromocion}
          onRefresh={fetchPromociones}
          error={promoState.error}
          status={promoState.status}
        />
      )}

      {activeSection === 'proveedores' && (
        <ProveedoresSection
          sectionStyle={sectionStyle}
        />
      )}
      </div>
    </div>
  );
};

export default PaginaCommunity;

