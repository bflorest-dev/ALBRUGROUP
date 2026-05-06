import React, { useEffect, useRef, useState } from 'react';
import { useCommunityData } from '@features/community/hooks';
import { CampaignSection } from '@features/community/ui/CampaignSection';
import { EstadoConfirmModal } from '@features/community/ui/EstadoConfirmModal';
import { ProveedoresSection } from '@features/community/ui/ProveedoresSection';
import { PlanForm } from '@features/community/ui/PlanForm';
import { PromocionesSection } from '@features/community/ui/PromocionesSection';
import { ZonaForm } from '@features/community/ui/ZonaForm';
import { ZonasPeruMap } from '@features/community/ui/ZonasPeruMap';
import { leadsHttp } from '@shared/api/clienteHttp';
import type { AdicionalResponse, CampanaResponse, PlanResponse, PromocionComercialResponse, ZonaRequest, ZonaResponse } from '@shared/types';
import './PaginaCommunity.css';

const initialState = { loading: false, error: false, status: 0, data: [] };
let communityBootstrapInFlight: Promise<void> | null = null;
type SectionKey = 'campanas' | 'cuentas' | 'planes' | 'promociones' | 'proveedores' | 'zonas' | 'adicionales';

const sections = [
  { key: 'campanas', label: 'Campanas' },
  { key: 'cuentas', label: 'Cuentas' },
  { key: 'planes', label: 'Planes' },
  { key: 'promociones', label: 'Promociones' },
  { key: 'proveedores', label: 'Proveedores' },
  { key: 'adicionales', label: 'Adicionales' },
  { key: 'zonas', label: 'Zonas' },
] as const;

type GenericEntity = 'cuentas' | 'planes' | 'zonas' | 'adicionales';

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
    promociones,
    zonas,
    proveedores,
    fetchCampanas,
    fetchCuentas,
    fetchPlanes,
    fetchPromociones,
    fetchZonas,
    fetchProveedores,
    fetchAdicionales,
    createPlan,
    createZona,
    updateZona,
    createPromocion,
    toggleCampanaEstado,
    toggleCuentaEstadoLocal,
    togglePlanEstado,
    togglePromocionEstadoLocal,
    toggleZonaEstado,
    toggleAdicionalEstadoLocal,
    adicionales,
    createAdicional,
  } = useCommunityData();

  const [cuentaForm, setCuentaForm] = useState({ numeroCuenta: '', nombreCuenta: '' });

  const [planState, setPlanState] = useState(initialState);
  const [zonaState, setZonaState] = useState(initialState);
  const [cuentaState, setCuentaState] = useState(initialState);
  const [promoState, setPromoState] = useState(initialState);

  const [globalMessage, setGlobalMessage] = useState('');
  const [updatingCampanaId, setUpdatingCampanaId] = useState<number | null>(null);
  const [updatingPromocionId, setUpdatingPromocionId] = useState<number | null>(null);
  const [pendingEstadoChange, setPendingEstadoChange] = useState<PendingEstadoChange | null>(null);
  const [estadoSubmitting, setEstadoSubmitting] = useState(false);
  const [estadoModalError, setEstadoModalError] = useState('');
  const [selectedZonaForMap, setSelectedZonaForMap] = useState<ZonaResponse | null>(null);
  const [zonaEditTarget, setZonaEditTarget] = useState<ZonaResponse | null>(null);
  const [adicionalNombre, setAdicionalNombre] = useState('');
  const [adicionalPrecio, setAdicionalPrecio] = useState('');
  const [adicionalProveedorId, setAdicionalProveedorId] = useState<number | ''>('');
  const [adicionalActivo, setAdicionalActivo] = useState(true);
  const [adicionalMessage, setAdicionalMessage] = useState('');
  const messageTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (globalMessage.startsWith('✅')) {
      if (messageTimeoutRef.current) {
        window.clearTimeout(messageTimeoutRef.current);
      }
      messageTimeoutRef.current = window.setTimeout(() => {
        setGlobalMessage('');
      }, 2500);
    }
    return () => {
      if (messageTimeoutRef.current) {
        window.clearTimeout(messageTimeoutRef.current);
      }
    };
  }, [globalMessage]);

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
  }, [fetchCampanas, fetchCuentas, fetchPlanes, fetchPromociones, fetchZonas, fetchProveedores, fetchAdicionales]);

  useEffect(() => {
    setSelectedZonaForMap((prev) => {
      if (!prev) {
        return null;
      }

      const updatedZona = zonas.find((zona) => zona.id === prev.id);
      return updatedZona ?? null;
    });
  }, [zonas]);

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

  const getColumnLabel = (col: string) => {
    switch (col) {
      case 'numeroCuenta':
        return 'Número cuenta';
      case 'nombreCuenta':
        return 'Nombre cuenta';
      case 'idCuentaPublicitaria':
        return 'Cuenta publicitaria';
      case 'idProveedor':
        return 'Proveedor';
      case 'nombreProveedor':
        return 'Proveedor';
      case 'nombreZona':
        return 'Zona';
      case 'activo':
        return 'Estado';
      default:
        return col
          .replace(/([A-Z])/g, ' $1')
          .replace(/_/g, ' ')
          .trim();
    }
  };

  const renderTable = (
    data: GenericRow[],
    options?: {
      onRequestToggleEstado?: (item: GenericRow) => void;
      disableToggle?: boolean;
      hideColumns?: string[];
    },
  ) => {
    if (!data || data.length === 0) return <p className="community-empty">Sin resultados</p>;
    const firstItem = data[0];
    if (!firstItem) return <p className="community-empty">Sin datos</p>;
    const cols = Object.keys(firstItem).filter(
      (col) => !options?.hideColumns?.includes(col) && !/^id($|[A-Z_])/.test(col),
    );
    if (cols.length === 0) return <p className="community-empty">Sin columnas</p>;

    return (
      <div className="community-table-wrapper">
        <table className="community-table">
          <thead>
            <tr>
              {cols.map((col) => (
                <th key={col}>
                  {getColumnLabel(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              const rowValues = item as Record<string, unknown>;
              const itemKey = typeof item.id === 'number' ? item.id : index;

              return (
                <tr key={itemKey}>
                  {cols.map((col) => {
                    const cellValue = rowValues[col];
                    const isActiveColumn = col === 'activo' && typeof item.activo === 'boolean';
                    const canToggle = isActiveColumn && typeof item.id === 'number' && typeof options?.onRequestToggleEstado === 'function';

                    return (
                      <td key={`${itemKey}-${col}`}>
                        {isActiveColumn ? (
                          <div className="community-status-control">
                            <label className="community-switch" aria-label={`Cambiar estado de ${String(item.nombre || item.nombreCuenta || item.id)}`}>
                              <input
                                type="checkbox"
                                checked={item.activo}
                                onChange={canToggle ? () => options.onRequestToggleEstado?.(item) : undefined}
                                disabled={!canToggle || Boolean(options?.disableToggle)}
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
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const formatDateString = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('es-PE');
  };

  const formatCurrency = (value?: number | null) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return '-';
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(value);
  };

  const renderPlanesTable = (data: PlanResponse[]) => {
    if (!data || data.length === 0) return <p className="community-empty">Sin resultados</p>;

    return (
      <div className="community-table-wrapper">
        <table className="community-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Desde</th>
              <th>Hasta</th>
              <th>Proveedor</th>
              <th>Internet</th>
              <th>Televisión</th>
              <th>Teléfono</th>
              <th>Adicionales</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.map((plan) => (
              <tr key={plan.id}>
                <td>{plan.nombre}</td>
                <td>{formatCurrency(plan.precio)}</td>
                <td>{formatDateString(plan.vigenciaDesde)}</td>
                <td>{formatDateString(plan.vigenciaHasta)}</td>
                <td>{plan.nombreProveedor || '-'}</td>
                <td>
                  {plan.internet
                    ? `${plan.internet.velocidad} ${plan.internet.unidad} (${plan.internet.tecnologia})`
                    : '-'}
                </td>
                <td>{plan.television ? plan.television.nombre : '-'}</td>
                <td>{plan.telefono ? `${plan.telefono.minutos} min` : '-'}</td>
                <td>{plan.adicionales?.length ?? 0}</td>
                <td>
                  <div className="community-status-control">
                    <label className="community-switch" aria-label={`Cambiar estado de ${plan.nombre}`}>
                      <input
                        type="checkbox"
                        checked={plan.activo}
                        onChange={() => requestEstadoToggle('planes', plan as GenericRow)}
                      />
                      <span className="community-switch-track" />
                    </label>
                    <span className={`community-switch-label ${plan.activo ? 'is-active' : 'is-inactive'}`}>
                      {plan.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const handleEditZona = (zona: ZonaResponse) => {
    setZonaEditTarget(zona);
  };

  const handleSaveZona = async (payload: ZonaRequest, id?: number) => {
    if (typeof id === 'number') {
      await updateZona(id, payload);
      setZonaEditTarget(null);
      return;
    }
    await createZona(payload);
  };

  const handleCancelEdit = () => {
    setZonaEditTarget(null);
  };

  const renderZonasTable = (data: ZonaResponse[]) => {
    if (!data || data.length === 0) {
      return <p className="community-empty">Sin resultados</p>;
    }

    return (
      <div className="community-table-wrapper">
        <table className="community-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map((zona) => {
              const expanded = selectedZonaForMap?.id === zona.id;

              return (
                <tr key={zona.id}>
                  <td>{zona.nombre}</td>
                  <td>
                    <div className="community-status-control">
                      <label className="community-switch" aria-label={`Cambiar estado de ${String(zona.nombre || zona.id)}`}>
                        <input
                          type="checkbox"
                          checked={zona.activo}
                          onChange={() => requestEstadoToggle('zonas', zona as GenericRow)}
                          disabled={estadoSubmitting}
                        />
                        <span className="community-switch-track" />
                      </label>
                      <span className={`community-switch-label ${zona.activo ? 'is-active' : 'is-inactive'}`}>
                        {zona.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="community-row-actions">
                      <button
                        type="button"
                        className="community-btn ghost"
                        onClick={() => handleEditZona(zona)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="community-btn ghost"
                        onClick={() => {
                          setSelectedZonaForMap((prev) => (prev?.id === zona.id ? null : zona));
                        }}
                      >
                        {expanded ? 'Ocultar' : 'Ver más'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
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
      } else if (pendingEstadoChange.entity === 'adicionales') {
        toggleAdicionalEstadoLocal(pendingEstadoChange.id, nextActivo);
        setGlobalMessage(`✅ Estado de adicional actualizado en pantalla: ${pendingEstadoChange.label} (sin endpoint de estado en backend).`);
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

  const handleCreateAdicional = async () => {
    if (!adicionalProveedorId || !adicionalNombre.trim() || !adicionalPrecio.trim()) {
      setAdicionalMessage('❌ Completa proveedor, nombre y precio del adicional');
      return;
    }

    const precioNum = Number(adicionalPrecio);
    if (Number.isNaN(precioNum) || precioNum <= 0) {
      setAdicionalMessage('❌ Precio inválido');
      return;
    }

    try {
      await createAdicional({
        nombre: adicionalNombre.trim(),
        precioUnitario: precioNum,
        idProveedor: Number(adicionalProveedorId),
        activo: adicionalActivo,
      });
      await fetchAdicionales(Number(adicionalProveedorId));
      setAdicionalMessage('✅ Adicional creado correctamente');
      setAdicionalNombre('');
      setAdicionalPrecio('');
      setAdicionalActivo(true);
    } catch (err: any) {
      setAdicionalMessage(err?.message || '💥 Error al crear adicional');
    }
  };

  const [activeSection, setActiveSection] = useState<SectionKey>('campanas');

  useEffect(() => {
    if (activeSection === 'adicionales' && adicionalProveedorId !== '') {
      void fetchAdicionales(Number(adicionalProveedorId));
    }
  }, [activeSection, adicionalProveedorId, fetchAdicionales]);

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
            renderPlanesTable(planes || [])
          )}
        </section>
      )}

      {activeSection === 'adicionales' && (
        <section className="community-card">
          <div className="community-section-head">
            <div>
              <h2>Adicionales</h2>
              <p>Crea y lista adicionales de proveedores aquí. Solo los adicionales creados estarán disponibles en los planes.</p>
            </div>
          </div>

          <form className="community-form community-form-spaced" onSubmit={(e) => { e.preventDefault(); void handleCreateAdicional(); }}>
            {adicionalMessage && (
              <div className={`${adicionalMessage.startsWith('✅') ? 'community-alert' : 'community-error'} community-message`}>
                {adicionalMessage}
              </div>
            )}

            <div className="community-field">
              <label>Proveedor*</label>
              <select
                value={adicionalProveedorId}
                onChange={(e) => setAdicionalProveedorId(Number(e.target.value) as number | '')}
              >
                <option value="">Selecciona proveedor</option>
                {proveedores.filter((p) => p.activo).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="community-field">
              <label>Nombre del adicional*</label>
              <input
                type="text"
                value={adicionalNombre}
                onChange={(e) => setAdicionalNombre(e.target.value)}
              />
            </div>

            <div className="community-field">
              <label>Precio unitario*</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={adicionalPrecio}
                onChange={(e) => setAdicionalPrecio(e.target.value)}
              />
            </div>

            <div className="community-check-group">
              <label className="community-check-row">
                <input
                  type="checkbox"
                  checked={adicionalActivo}
                  onChange={(e) => setAdicionalActivo(e.target.checked)}
                />
                Activo
              </label>
            </div>

            <div className="community-actions">
              <button type="submit" className="community-btn primary">
                Crear adicional
              </button>
            </div>
          </form>

          {renderTable((adicionales || []) as GenericRow[], {
            hideColumns: ['idProveedor'],
            onRequestToggleEstado: (item) => requestEstadoToggle('adicionales', item),
            disableToggle: estadoSubmitting,
          })}
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
            editingZona={zonaEditTarget}
            onSaveZona={handleSaveZona}
            onCreated={fetchZonas}
            onCancelEdit={handleCancelEdit}
          />
          {zonaState.error ? (
            <div className="community-error">Error al cargar datos (status: {zonaState.status})</div>
          ) : (
            renderZonasTable(zonas || [])
          )}
          {selectedZonaForMap && (
            <div id={`community-zonas-map-${selectedZonaForMap.id}`} className="community-block-top-md">
              <h3 className="community-inline-title">Reglas y cobertura: {selectedZonaForMap.nombre}</h3>
              <div className="community-block-top-sm">
                <ZonasPeruMap zonas={[selectedZonaForMap]} />
              </div>
            </div>
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

