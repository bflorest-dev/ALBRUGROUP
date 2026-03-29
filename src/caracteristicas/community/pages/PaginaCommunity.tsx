import React, { useEffect, useState } from 'react';
import { useCommunityData } from '../hooks';
import { CampaignSection } from '../ui/CampaignSection';
import { ProveedoresSection } from '../ui/ProveedoresSection';
import { PlanForm } from '../ui/PlanForm';
import { ZonaForm } from '../ui/ZonaForm';
import { leadsHttp } from '@shared/api/clienteHttp';

const initialState = { loading: false, error: false, status: 0, data: [] };

const PaginaCommunity: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'campanas' | 'cuentas' | 'planes' | 'promociones' | 'proveedores' | 'zonas'>('campanas');
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
  } = useCommunityData();

  const [planForm, setPlanForm] = useState({ nombre: '', precio: '', nombreProveedor: '', activo: true });
  const [zonaForm, setZonaForm] = useState({ nombre: '', activo: true });
  const [cuentaForm, setCuentaForm] = useState({ numeroCuenta: '', nombreCuenta: '' });
  const [promoForm, setPromoForm] = useState({ nombre: '', nombreZona: '', cantidadMeses: 1, activo: true });

  const [planState, setPlanState] = useState(initialState);
  const [zonaState, setZonaState] = useState(initialState);
  const [cuentaState, setCuentaState] = useState(initialState);
  const [promoState, setPromoState] = useState(initialState);

  const [globalMessage, setGlobalMessage] = useState('');

  useEffect(() => {
    fetchCampanas();
    fetchCuentas();
    fetchPlanes();
    fetchPromociones();
    fetchZonas();
  }, [fetchCampanas, fetchCuentas, fetchPlanes, fetchPromociones, fetchZonas]);

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
    if (!data || data.length === 0) return <p style={{ color: '#666' }}>Sin resultados</p>;
    const firstItem = data[0];
    if (!firstItem) return <p style={{ color: '#666' }}>Sin datos</p>;
    const cols = Object.keys(firstItem);
    if (cols.length === 0) return <p style={{ color: '#666' }}>Sin columnas</p>;

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {cols.map((col) => (
                <th key={col} style={{ border: '1px solid #ddd', padding: 8, background: '#f4f4f4' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} style={{ background: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                {cols.map((col) => (
                  <td key={col} style={{ border: '1px solid #ddd', padding: 8 }}>
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
    border: '1px solid #ccc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    background: '#fff',
  };

  const inputStyle: React.CSSProperties = {
    marginRight: 8,
    marginBottom: 8,
    padding: 8,
    border: '1px solid #ccc',
    borderRadius: 4,
  };

  const [activeSection, setActiveSection] = useState<'campanas' | 'cuentas' | 'planes' | 'promociones' | 'proveedores' | 'zonas'>('campanas');

  return (
    <div className="container-fluid p-4">
      <h1 className="mb-4">Panel Community</h1>
      <div style={{ marginBottom: 16 }}>
        {(['campanas', 'cuentas', 'planes', 'promociones', 'proveedores', 'zonas'] as const).map((section: string) => (
          <button
            key={section}
            style={{
              marginRight: 8,
              padding: '6px 14px',
              borderRadius: 6,
              border: activeSection === section ? '2px solid #007bff' : '1px solid #ccc',
              background: activeSection === section ? '#e7f3ff' : '#fff',
              cursor: 'pointer',
            }}
            onClick={() => setActiveSection(section as any)}
          >
            {/* @ts-ignore */}
            {section[0].toUpperCase() + section.slice(1)}
          </button>
        ))}
      </div>

      {globalMessage && <div className="alert alert-info">{globalMessage}</div>}

      {activeSection === 'planes' && (
        <section style={sectionStyle}>
          <h2>Planes</h2>
          <PlanForm
            proveedores={proveedores}
            onCreatePlan={createPlan}
            onCreated={fetchPlanes}
          />
          {planState.error ? <div className="text-danger">Error al cargar datos (status: {planState.status})</div> : renderTable(planes || [])}
        </section>
      )}

      {activeSection === 'zonas' && (
        <section style={sectionStyle}>
          <h2>Zonas</h2>
          <ZonaForm
            onCreateZona={createZona}
            onCreated={fetchZonas}
          />
          {zonaState.error ? <div className="text-danger">Error al cargar datos (status: {zonaState.status})</div> : renderTable(zonas || [])}
        </section>
      )}

      {activeSection === 'campanas' && <CampaignSection sectionStyle={sectionStyle} />}

      {activeSection === 'cuentas' && (
        <section style={sectionStyle}>
          <h2>Cuentas Publicitarias</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await createOne('/api/leads/cuentas-publicitarias', { numeroCuenta: cuentaForm.numeroCuenta, nombreCuenta: cuentaForm.nombreCuenta }, fetchCuentas, setCuentaState);
          }}
        >
          <input style={inputStyle} value={cuentaForm.numeroCuenta} placeholder="Número cuenta" onChange={(e) => setCuentaForm((s) => ({ ...s, numeroCuenta: e.target.value }))} />
          <input style={inputStyle} value={cuentaForm.nombreCuenta} placeholder="Nombre cuenta" onChange={(e) => setCuentaForm((s) => ({ ...s, nombreCuenta: e.target.value }))} />
          <button style={inputStyle} type="submit">Crear Cuenta</button>
          <button style={inputStyle} type="button" onClick={() => fetchCuentas()}>Cargar datos</button>
        </form>
        {cuentaState.error ? <div className="text-danger">Error al cargar datos (status: {cuentaState.status})</div> : renderTable(cuentas || [])}
      </section>
      )}

      {activeSection === 'promociones' && (
        <section style={sectionStyle}>
          <h2>Promociones</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await createOne('/api/leads/promociones', { nombre: promoForm.nombre, nombreZona: promoForm.nombreZona, cantidadMeses: Number(promoForm.cantidadMeses), activo: promoForm.activo }, fetchPromociones, setPromoState);
          }}
        >
          <input style={inputStyle} value={promoForm.nombre} placeholder="Nombre" onChange={(e) => setPromoForm((s) => ({ ...s, nombre: e.target.value }))} />
          <input style={inputStyle} value={promoForm.nombreZona} placeholder="Zona" onChange={(e) => setPromoForm((s) => ({ ...s, nombreZona: e.target.value }))} />
          <input style={inputStyle} type="number" value={promoForm.cantidadMeses} onChange={(e) => setPromoForm((s) => ({ ...s, cantidadMeses: Number(e.target.value) }))} />
          <label style={{ marginRight: 8 }}>
            <input type="checkbox" checked={promoForm.activo} onChange={(e) => setPromoForm((s) => ({ ...s, activo: e.target.checked }))} /> Activo
          </label>
          <button style={inputStyle} type="submit">Crear Promoción</button>
          <button style={inputStyle} type="button" onClick={() => fetchPromociones()}>Cargar datos</button>
        </form>
        {promoState.error ? <div className="text-danger">Error al cargar datos (status: {promoState.status})</div> : renderTable(promociones || [])}
      </section>
      )}

      {activeSection === 'proveedores' && <ProveedoresSection sectionStyle={sectionStyle} />}
    </div>
  );
};

export default PaginaCommunity;

