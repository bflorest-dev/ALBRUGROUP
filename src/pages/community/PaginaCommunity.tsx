import React, { useEffect, useRef, useState } from 'react';
import { useCommunityData } from '@features/community/hooks';
import { CampaignSection } from '@features/community/ui/CampaignSection';
import { EstadoConfirmModal } from '@features/community/ui/EstadoConfirmModal';
import { ProveedoresSection } from '@features/community/ui/ProveedoresSection';
import { PlanForm } from '@features/community/ui/PlanForm';
import { PlanDetailsModal } from '@features/community/ui/PlanDetailsModal';
import { PromocionesSection } from '@features/community/ui/PromocionesSection';
import { ZonaForm } from '@features/community/ui/ZonaForm';
import { ZonasPeruMap } from '@features/community/ui/ZonasPeruMap';
import { leadsHttp } from '@shared/api/clienteHttp';
import type { AdicionalResponse, CampanaResponse, CuentaPublicitariaResponse, PlanResponse, PromocionComercialResponse, ZonaRequest, ZonaResponse } from '@shared/types';
import './PaginaCommunity.css';

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

type GenericEntity = 'zonas' | 'adicionales';

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
    deleteCampana,
    deleteCuenta,
    deletePlan,
    deletePromocion,
    toggleZonaEstado,
    toggleAdicionalEstadoLocal,
    adicionales,
    createAdicional,
  } = useCommunityData();

  const [cuentaForm, setCuentaForm] = useState({ numeroCuenta: '', nombreCuenta: '' });

  const [globalMessage, setGlobalMessage] = useState('');
  const [updatingCampanaId, setUpdatingCampanaId] = useState<number | null>(null);
  const [updatingPromocionId, setUpdatingPromocionId] = useState<number | null>(null);
  const [pendingEstadoChange, setPendingEstadoChange] = useState<PendingEstadoChange | null>(null);
  const [estadoSubmitting, setEstadoSubmitting] = useState(false);
  const [estadoModalError, setEstadoModalError] = useState('');
  const [selectedZonaForMap, setSelectedZonaForMap] = useState<ZonaResponse | null>(null);
  const [zonaEditTarget, setZonaEditTarget] = useState<ZonaResponse | null>(null);
  const [selectedPlanForDetails, setSelectedPlanForDetails] = useState<PlanResponse | null>(null);
  const [planToDelete, setPlanToDelete] = useState<PlanResponse | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null);
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

  const createOne = async (path: string, payload: any, refresh: () => Promise<void>) => {
    const normalizedPath = normalizeLeadsPath(path);
    try {
      const token = localStorage.getItem('auth_token');
      console.debug('[COMMUNITY] POST', normalizedPath, 'Authorization:', token ? 'Bearer *****' : 'NO TOKEN');

      const res = await leadsHttp.post(normalizedPath, payload);
      setGlobalMessage('✅ Creado correctamente');
      await refresh();
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
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map((plan) => (
              <tr key={plan.id}>
                <td>{plan.nombre}</td>
                <td>{formatCurrency(plan.precio)}</td>
                <td>{formatDateString(plan.vigenciaDesde)}</td>
                <td>{plan.vigenciaHasta ? formatDateString(plan.vigenciaHasta) : '-'}</td>
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
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="community-btn ghost"
                      onClick={() => setSelectedPlanForDetails(plan)}
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                    >
                      Ver Detalles
                    </button>
                    <button
                      className="community-btn ghost"
                      onClick={() => handleDeletePlan(plan)}
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', color: '#dc2626' }}
                    >
                      Eliminar
                    </button>
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
      if (pendingEstadoChange.entity === 'zonas') {
        await toggleZonaEstado(pendingEstadoChange.id);
        setGlobalMessage(`✅ Estado de zona actualizado: ${pendingEstadoChange.label}`);
      } else if (pendingEstadoChange.entity === 'adicionales') {
        toggleAdicionalEstadoLocal(pendingEstadoChange.id, nextActivo);
        setGlobalMessage(`✅ Estado de adicional actualizado en pantalla: ${pendingEstadoChange.label} (sin endpoint de estado en backend).`);
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
      await deleteCampana(campana.id);
      setGlobalMessage(`✅ Campaña eliminada: ${campana.nombre}`);
    } catch (err) {
      const message = getErrorMessage(err, 'No se pudo eliminar la campaña.');
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
      await deletePromocion(promocion.id);
      setGlobalMessage(`✅ Promoción eliminada: ${promocion.reglaComercial}`);
    } catch (err) {
      const message = getErrorMessage(err, 'No se pudo eliminar la promoción.');
      setGlobalMessage(`❌ ${message}`);
      throw err;
    } finally {
      setUpdatingPromocionId(null);
    }
  };

  const handleDeletePlan = (plan: PlanResponse) => {
    setPlanToDelete(plan);
  };

  const handleConfirmDeletePlan = async () => {
    if (!planToDelete) return;

    setDeletingPlanId(planToDelete.id);
    try {
      await deletePlan(planToDelete.id);
      setGlobalMessage(`✅ Plan eliminado: ${planToDelete.nombre}`);
      setPlanToDelete(null);
    } catch (err) {
      const message = getErrorMessage(err, 'No se pudo eliminar el plan.');
      setGlobalMessage(`❌ ${message}`);
    } finally {
      setDeletingPlanId(null);
    }
  };

  const [cuentaToDelete, setCuentaToDelete] = useState<{ id: number; nombre: string } | null>(null);
  const [deletingCuentaId, setDeletingCuentaId] = useState<number | null>(null);

  const renderCuentasTable = (data: CuentaPublicitariaResponse[]) => {
    if (!data || data.length === 0) return <p className="community-empty">Sin resultados</p>;

    return (
      <div className="community-table-wrapper">
        <table className="community-table">
          <thead>
            <tr>
              <th>Número Cuenta</th>
              <th>Nombre Cuenta</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map((cuenta) => (
              <tr key={cuenta.id}>
                <td>{cuenta.numeroCuenta}</td>
                <td>{cuenta.nombreCuenta}</td>
                <td>
                  <button
                    className="community-btn ghost"
                    onClick={() => setCuentaToDelete({ id: cuenta.id, nombre: cuenta.nombreCuenta })}
                    disabled={deletingCuentaId !== null}
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', color: '#dc2626' }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const handleConfirmDeleteCuenta = async () => {
    if (!cuentaToDelete) return;

    setDeletingCuentaId(cuentaToDelete.id);
    try {
      await deleteCuenta(cuentaToDelete.id);
      setGlobalMessage(`✅ Cuenta eliminada: ${cuentaToDelete.nombre}`);
      setCuentaToDelete(null);
    } catch (err) {
      const message = getErrorMessage(err, 'No se pudo eliminar la cuenta.');
      setGlobalMessage(`❌ ${message}`);
    } finally {
      setDeletingCuentaId(null);
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
          {loading ? (
            <div className="community-state">Cargando planes...</div>
          ) : planes.length === 0 ? (
            <p className="community-empty">Sin planes disponibles</p>
          ) : (
            renderPlanesTable(planes)
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
          {renderZonasTable(zonas || [])}
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
            await createOne('/api/leads/cuentas-publicitarias', { numeroCuenta: cuentaForm.numeroCuenta, nombreCuenta: cuentaForm.nombreCuenta }, fetchCuentas);
          }}
        >
          <input className="community-input" value={cuentaForm.numeroCuenta} placeholder="Numero cuenta" onChange={(e) => setCuentaForm((s) => ({ ...s, numeroCuenta: e.target.value }))} />
          <input className="community-input" value={cuentaForm.nombreCuenta} placeholder="Nombre cuenta" onChange={(e) => setCuentaForm((s) => ({ ...s, nombreCuenta: e.target.value }))} />
          <button className="community-btn primary" type="submit">Crear Cuenta</button>
          <button className="community-btn ghost" type="button" onClick={() => fetchCuentas()}>Cargar datos</button>
        </form>
        {renderCuentasTable(cuentas || [])}
      </section>
      )}

      {activeSection === 'promociones' && (
        <PromocionesSection
          promociones={promociones}
          proveedores={proveedores}
          zonas={zonas}
          planes={planes}
          onCreatePromocion={createPromocion}
          onRefresh={fetchPromociones}
          onToggleEstado={handleTogglePromocionEstado}
          updatingEstadoId={updatingPromocionId}
          error={false}
          status={0}
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

      <EstadoConfirmModal
        open={Boolean(planToDelete)}
        submitting={deletingPlanId !== null}
        errorMessage=""
        onCancel={() => setPlanToDelete(null)}
        onConfirm={handleConfirmDeletePlan}
        title="Confirmar eliminación"
        message={`¿Seguro que quieres eliminar el plan "${planToDelete?.nombre}"? Esta acción no se puede deshacer.`}
      />

      <EstadoConfirmModal
        open={Boolean(cuentaToDelete)}
        submitting={deletingCuentaId !== null}
        errorMessage=""
        onCancel={() => setCuentaToDelete(null)}
        onConfirm={handleConfirmDeleteCuenta}
        title="Confirmar eliminación"
        message={`¿Seguro que quieres eliminar la cuenta "${cuentaToDelete?.nombre}"? Esta acción no se puede deshacer.`}
      />

      <PlanDetailsModal
        plan={selectedPlanForDetails}
        onClose={() => setSelectedPlanForDetails(null)}
      />
      </div>
    </div>
  );
};

export default PaginaCommunity;

