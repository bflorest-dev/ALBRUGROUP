import React, { useEffect, useState } from 'react';
import { useCommunityData } from '@features/community/hooks';
import { CampaignSection } from '@features/community/ui/CampaignSection';
import { EstadoConfirmModal } from '@features/community/ui/EstadoConfirmModal';
import { ProveedoresSection } from '@features/community/ui/ProveedoresSection';
import { PlanForm } from '@features/community/ui/PlanForm';
import { PromocionesSection } from '@features/community/ui/PromocionesSection';
import { ZonaForm } from '@features/community/ui/ZonaForm';
import { ZonasPeruMap } from '@features/community/ui/ZonasPeruMap';
import { leadsHttp } from '@shared/api/clienteHttp';
import { SessionLogoutButton } from '@shared/ui';
import type { CampanaResponse, PromocionComercialResponse } from '@shared/types';
import './PaginaCommunity.css';

type RequestState = {
  loading: boolean;
  error: boolean;
  status: number;
  data: unknown[];
};

const initialState: RequestState = { loading: false, error: false, status: 0, data: [] };
let communityBootstrapInFlight: Promise<void> | null = null;
type SectionKey = 'campanas' | 'cuentas' | 'planes' | 'adicionales' | 'promociones' | 'proveedores' | 'zonas';

const sections = [
  { key: 'campanas', label: 'Campanas' },
  { key: 'cuentas', label: 'Cuentas' },
  { key: 'planes', label: 'Planes' },
  { key: 'adicionales', label: 'Adicionales' },
  { key: 'promociones', label: 'Promociones' },
  { key: 'proveedores', label: 'Proveedores' },
  { key: 'zonas', label: 'Zonas' },
] as const;

type GenericEntity = 'cuentas' | 'planes' | 'zonas';

type GenericRow = {
  id?: number;
  activo?: boolean;
  nombre?: string;
  nombreCuenta?: string;
};

interface PendingEstadoChange {
  entity: GenericEntity;
  id: number;
  activoActual: boolean;
  label: string;
}

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  if (typeof err === 'object' && err !== null) {
    const maybeMessage = (err as { message?: unknown }).message;
    if (typeof maybeMessage === 'string' && maybeMessage.trim().length > 0) {
      return maybeMessage;
    }
  }
  return fallback;
};

const PaginaCommunity: React.FC = () => {
  const {
    loading,
    error,
    campanas,
    cuentas,
    planes,
    adicionales,
    promociones,
    zonas,
    proveedores,
    fetchCampanas,
    fetchCuentas,
    fetchPlanes,
    fetchAdicionales,
    fetchPromociones,
    fetchZonas,
    fetchProveedores,
    createPlan,
    createAdicional,
    createZona,
    createPromocion,
    toggleCampanaEstado,
    toggleCuentaEstadoLocal,
    togglePlanEstado,
    togglePromocionEstadoLocal,
    toggleZonaEstado,
  } = useCommunityData();

  const [cuentaForm, setCuentaForm] = useState({ numeroCuenta: '', nombreCuenta: '' });

  const [planState] = useState(initialState);
  const [zonaState] = useState(initialState);
  const [cuentaState, setCuentaState] = useState(initialState);
  const [promoState] = useState(initialState);
  const [adicionalState, setAdicionalState] = useState(initialState);

  const [globalMessage, setGlobalMessage] = useState('');
  const [updatingCampanaId, setUpdatingCampanaId] = useState<number | null>(null);
  const [updatingPromocionId, setUpdatingPromocionId] = useState<number | null>(null);
  const [pendingEstadoChange, setPendingEstadoChange] = useState<PendingEstadoChange | null>(null);
  const [estadoSubmitting, setEstadoSubmitting] = useState(false);
  const [estadoModalError, setEstadoModalError] = useState('');
  const [adicionalForm, setAdicionalForm] = useState({
    idProveedor: '',
    nombre: '',
    precioUnitario: '',
    activo: true,
  });

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

  const createOne = async (
    path: string,
    payload: unknown,
    refresh: () => Promise<void>,
    setter: React.Dispatch<React.SetStateAction<RequestState>>
  ) => {
    setter({ loading: true, error: false, status: 0, data: [] });
    const normalizedPath = normalizeLeadsPath(path);
    try {
      const token = localStorage.getItem('auth_token');
      console.debug('[COMMUNITY] POST', normalizedPath, 'Authorization:', token ? 'Bearer *****' : 'NO TOKEN');

      const res = await leadsHttp.post(normalizedPath, payload);
      setGlobalMessage('✅ Creado correctamente');
      await refresh();
      setter({ loading: false, error: false, status: res.status, data: [] });
    } catch (err: unknown) {
      const errLike = err as {
        status?: number;
        response?: { status?: number };
        message?: string;
      };
      const status = errLike.status ?? errLike.response?.status ?? 0;
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
        message = errLike.message || 'Error al crear';
      }
      setter({ loading: false, error: true, status, data: [] });
      setGlobalMessage(`❌ ${message}`);
    }
  };

  const renderTable = (
    data: GenericRow[],
    options?: {
      onRequestToggleEstado?: (item: GenericRow) => void;
      disableToggle?: boolean;
    },
  ) => {
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
              <tr key={typeof item.id === 'number' ? item.id : index}>
                {cols.map((col) => {
                  const rowValues = item as Record<string, unknown>;
                  const cellValue = rowValues[col];

                  return (
                    <td key={`${typeof item.id === 'number' ? item.id : index}-${col}`}>
                      {col === 'activo' && typeof item.activo === 'boolean' && typeof item.id === 'number' && options?.onRequestToggleEstado ? (
                        <div className="community-status-control">
                          <label className="community-switch" aria-label={`Cambiar estado de ${String(item.nombre || item.nombreCuenta || item.id)}`}>
                            <input
                              type="checkbox"
                              checked={item.activo}
                              onChange={() => options.onRequestToggleEstado?.(item)}
                              disabled={Boolean(options.disableToggle)}
                            />
                            <span className="community-switch-track" />
                          </label>
                          <span className={`community-switch-label ${item.activo ? 'is-active' : 'is-inactive'}`}>
                            {item.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      ) : typeof cellValue === 'object' ? (
                        JSON.stringify(cellValue)
                      ) : (
                        String(cellValue ?? '')
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const requestEstadoToggle = (entity: GenericEntity, item: GenericRow) => {
    if (typeof item.id !== 'number' || typeof item.activo !== 'boolean') {
      return;
    }

    setEstadoModalError('');
    setPendingEstadoChange({
      entity,
      id: item.id,
      activoActual: item.activo,
      label: String(item.nombre || item.nombreCuenta || `ID ${item.id}`),
    });
  };

  const handleCloseEstadoModal = () => {
    if (estadoSubmitting) {
      return;
    }

    setPendingEstadoChange(null);
    setEstadoModalError('');
  };

  const handleConfirmEstadoToggle = async () => {
    if (!pendingEstadoChange) {
      return;
    }

    const nextActivo = !pendingEstadoChange.activoActual;
    setEstadoSubmitting(true);
    setEstadoModalError('');

    try {
      if (pendingEstadoChange.entity === 'planes') {
        await togglePlanEstado(pendingEstadoChange.id, nextActivo);
        setGlobalMessage(`✅ Estado de plan actualizado: ${pendingEstadoChange.label}`);
      } else if (pendingEstadoChange.entity === 'zonas') {
        await toggleZonaEstado(pendingEstadoChange.id);
        setGlobalMessage(`✅ Estado de zona actualizado: ${pendingEstadoChange.label}`);
      } else {
        toggleCuentaEstadoLocal(pendingEstadoChange.id, nextActivo);
        setGlobalMessage(`✅ Estado de cuenta actualizado en pantalla: ${pendingEstadoChange.label} (sin endpoint de estado en backend).`);
      }

      setPendingEstadoChange(null);
    } catch (err) {
      setEstadoModalError(getErrorMessage(err, 'No se pudo actualizar el estado.'));
    } finally {
      setEstadoSubmitting(false);
    }
  };

  const handleToggleCampanaEstado = async (campana: CampanaResponse, nextActivo: boolean) => {
    setUpdatingCampanaId(campana.id);
    try {
      await toggleCampanaEstado(campana.id, nextActivo);
      setGlobalMessage(`✅ Estado de campaña actualizado: ${campana.nombre}`);
    } catch (err) {
      const message = getErrorMessage(err, 'No se pudo actualizar el estado de la campaña.');
      setGlobalMessage(`❌ ${message}`);
      throw err;
    } finally {
      setUpdatingCampanaId(null);
    }
  };

  const handleTogglePromocionEstado = async (
    promocion: PromocionComercialResponse,
    nextActivo: boolean,
  ) => {
    setUpdatingPromocionId(promocion.id);
    try {
      togglePromocionEstadoLocal(promocion.id, nextActivo);
      setGlobalMessage(`✅ Estado de promoción actualizado en pantalla: ${promocion.nombre} (sin endpoint de estado en backend).`);
    } finally {
      setUpdatingPromocionId(null);
    }
  };

  const handleCreateAdicional = async (event: React.FormEvent) => {
    event.preventDefault();

    const idProveedor = Number(adicionalForm.idProveedor);
    const precioUnitario = Number(adicionalForm.precioUnitario);

    if (!idProveedor || !adicionalForm.nombre.trim()) {
      setGlobalMessage('❌ Proveedor y nombre son obligatorios para crear un adicional.');
      return;
    }

    if (Number.isNaN(precioUnitario) || precioUnitario < 0) {
      setGlobalMessage('❌ El precio unitario debe ser un número mayor o igual a 0.');
      return;
    }

    setAdicionalState({ loading: true, error: false, status: 0, data: [] });

    try {
      const adicionalCreado = await createAdicional({
        idProveedor,
        nombre: adicionalForm.nombre.trim(),
        precioUnitario,
        activo: adicionalForm.activo,
      });

      await fetchAdicionales();
      setGlobalMessage(`✅ Adicional creado: ${adicionalCreado.nombre}`);
      setAdicionalState({ loading: false, error: false, status: 201, data: [] });
      setAdicionalForm((prev) => ({
        ...prev,
        nombre: '',
        precioUnitario: '',
        activo: true,
      }));
    } catch (err) {
      const status = (err as { status?: number }).status ?? 0;
      setAdicionalState({ loading: false, error: true, status, data: [] });
      setGlobalMessage(`❌ ${getErrorMessage(err, 'No se pudo crear el adicional.')}`);
    }
  };

  const handleFetchAdicionales = async () => {
    const idProveedor = adicionalForm.idProveedor ? Number(adicionalForm.idProveedor) : undefined;

    if (!idProveedor) {
      setAdicionalState({ loading: false, error: true, status: 0, data: [] });
      setGlobalMessage('❌ Selecciona un proveedor antes de cargar los adicionales.');
      return;
    }

    setAdicionalState({ loading: true, error: false, status: 0, data: [] });
    try {
      await fetchAdicionales(idProveedor);
      setAdicionalState({ loading: false, error: false, status: 200, data: [] });
      setGlobalMessage('');
    } catch (err) {
      const status = (err as { status?: number }).status ?? 0;
      setAdicionalState({ loading: false, error: true, status, data: [] });
      setGlobalMessage(`❌ ${getErrorMessage(err, 'No se pudieron cargar los adicionales.')}`);
    }
  };

  const [activeSection, setActiveSection] = useState<SectionKey>('campanas');

  return (
    <div className="community-page">
      <div className="community-shell">
        <header className="community-header">
          <div className="community-header-main">
            <div>
              <p className="community-eyebrow">Panel de Operaciones</p>
              <h1>Community</h1>
              <p className="community-subtitle">Gestiona campanas, cuentas, planes, adicionales, promociones, proveedores y zonas desde una sola vista.</p>
            </div>
            <SessionLogoutButton />
          </div>
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
        <section className="community-card">
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
          {planState.error ? (
            <div className="community-error">Error al cargar datos (status: {planState.status})</div>
          ) : (
            renderTable((planes || []) as GenericRow[], {
              onRequestToggleEstado: (item) => requestEstadoToggle('planes', item),
              disableToggle: estadoSubmitting,
            })
          )}
        </section>
      )}

      {activeSection === 'adicionales' && (
        <section className="community-card">
          <div className="community-section-head">
            <div>
              <h2>Adicionales</h2>
              <p>Crea y consulta adicionales por proveedor para usarlos en la configuración de planes.</p>
            </div>
          </div>
          <form className="community-inline-form" onSubmit={handleCreateAdicional}>
            <select
              className="community-select"
              value={adicionalForm.idProveedor}
              onChange={(e) =>
                setAdicionalForm((prev) => ({ ...prev, idProveedor: e.target.value }))
              }
            >
              <option value="">Selecciona proveedor</option>
              {proveedores.map((proveedor) => (
                <option key={proveedor.id} value={String(proveedor.id)}>
                  {proveedor.nombre}
                </option>
              ))}
            </select>
            <input
              className="community-input"
              value={adicionalForm.nombre}
              placeholder="Nombre del adicional"
              onChange={(e) =>
                setAdicionalForm((prev) => ({ ...prev, nombre: e.target.value }))
              }
            />
            <input
              className="community-input"
              type="number"
              min="0"
              step="0.01"
              value={adicionalForm.precioUnitario}
              placeholder="Precio unitario"
              onChange={(e) =>
                setAdicionalForm((prev) => ({ ...prev, precioUnitario: e.target.value }))
              }
            />
            <label className="community-check-row">
              <input
                type="checkbox"
                checked={adicionalForm.activo}
                onChange={(e) =>
                  setAdicionalForm((prev) => ({ ...prev, activo: e.target.checked }))
                }
              />
              Activo
            </label>
            <button className="community-btn primary" type="submit" disabled={adicionalState.loading}>
              {adicionalState.loading ? 'Guardando...' : 'Crear adicional'}
            </button>
            <button
              className="community-btn ghost"
              type="button"
              onClick={handleFetchAdicionales}
              disabled={adicionalState.loading || !adicionalForm.idProveedor}
            >
              Cargar datos
            </button>
          </form>

          {adicionalState.error ? (
            <div className="community-error">Error al cargar datos (status: {adicionalState.status})</div>
          ) : (
            renderTable((adicionales || []) as GenericRow[])
          )}
        </section>
      )}

      {activeSection === 'zonas' && (
        <section className="community-card">
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
          <div className="community-block-top-md">
            <h3 className="community-inline-title">Mapa de cobertura por zona</h3>
            <ZonasPeruMap zonas={zonas} />
          </div>
          {zonaState.error ? (
            <div className="community-error">Error al cargar datos (status: {zonaState.status})</div>
          ) : (
            renderTable((zonas || []) as GenericRow[], {
              onRequestToggleEstado: (item) => requestEstadoToggle('zonas', item),
              disableToggle: estadoSubmitting,
            })
          )}
        </section>
      )}

      {activeSection === 'campanas' && (
        <CampaignSection
          campanas={campanas}
          catalogs={{ cuentas, proveedores, planes, zonas, promociones }}
          loading={loading}
          error={!!error}
          onRefresh={fetchCampanas}
          updatingEstadoId={updatingCampanaId}
          onToggleEstado={handleToggleCampanaEstado}
        />
      )}

      {activeSection === 'cuentas' && (
        <section className="community-card">
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
        {cuentaState.error ? (
          <div className="community-error">Error al cargar datos (status: {cuentaState.status})</div>
        ) : (
          renderTable((cuentas || []) as GenericRow[], {
            onRequestToggleEstado: (item) => requestEstadoToggle('cuentas', item),
            disableToggle: estadoSubmitting,
          })
        )}
      </section>
      )}

      {activeSection === 'promociones' && (
        <PromocionesSection
          promociones={promociones}
          proveedores={proveedores}
          zonas={zonas}
          onCreatePromocion={createPromocion}
          onRefresh={fetchPromociones}
          onToggleEstado={handleTogglePromocionEstado}
          updatingEstadoId={updatingPromocionId}
          error={promoState.error}
          status={promoState.status}
        />
      )}

      {activeSection === 'proveedores' && (
        <ProveedoresSection />
      )}

      <EstadoConfirmModal
        open={Boolean(pendingEstadoChange)}
        submitting={estadoSubmitting}
        errorMessage={estadoModalError}
        onCancel={handleCloseEstadoModal}
        onConfirm={handleConfirmEstadoToggle}
      />
      </div>
    </div>
  );
};

export default PaginaCommunity;

