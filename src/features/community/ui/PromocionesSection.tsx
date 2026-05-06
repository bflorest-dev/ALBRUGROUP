import React, { useState } from 'react';
import type {
  PromocionComercialResponse,
  PromocionComercialRequest,
  ProveedorResponse,
  ZonaResponse,
  PlanResponse,
} from '@shared/types';
import { EstadoConfirmModal } from './EstadoConfirmModal';

interface PromocionesSectionProps {
  promociones: PromocionComercialResponse[];
  proveedores: ProveedorResponse[];
  zonas: ZonaResponse[];
  planes: PlanResponse[];
  onCreatePromocion: (payload: PromocionComercialRequest) => Promise<unknown>;
  onRefresh: () => Promise<void>;
  onToggleEstado: (promocion: PromocionComercialResponse, nextActivo: boolean) => Promise<void>;
  updatingEstadoId: number | null;
  error: boolean;
  status: number;
}

const defaultForm = {
  reglaComercial: '',
  idProveedor: '',
  idZona: '',
  idsPlanes: [] as number[],
};

export const PromocionesSection: React.FC<PromocionesSectionProps> = ({
  promociones,
  proveedores,
  zonas,
  planes,
  onCreatePromocion,
  onRefresh,
  onToggleEstado,
  updatingEstadoId,
  error,
  status,
}) => {
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingPromocion, setPendingPromocion] = useState<PromocionComercialResponse | null>(null);
  const [modalError, setModalError] = useState('');

  const activeProveedores = proveedores.filter((p) => p.activo);
  const activeZonas = zonas.filter((z) => z.activo);
  const activePlanes = planes.filter((p) => p.activo);

  // Filtrar planes por proveedor y zona seleccionados
  // Solo mostrar planes si hay un proveedor seleccionado
  const planesDisponibles = form.idProveedor 
    ? activePlanes.filter((plan) => {
        const matchProveedor = plan.idProveedor === Number(form.idProveedor);
        const matchZona = !form.idZona || plan.idZona === Number(form.idZona);
        return matchProveedor && matchZona;
      }).map(plan => ({
        ...plan,
        // Ensure adicionales is always an array
        adicionales: Array.isArray(plan.adicionales) ? plan.adicionales : []
      }))
    : [];

  const reset = () => setForm(defaultForm);

  const handleTogglePlan = (planId: number) => {
    setForm((prev) => ({
      ...prev,
      idsPlanes: prev.idsPlanes.includes(planId)
        ? prev.idsPlanes.filter((id) => id !== planId)
        : [...prev.idsPlanes, planId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.reglaComercial.trim()) {
      setMessage('❌ Regla comercial es requerida');
      return;
    }

    if (!form.idProveedor) {
      setMessage('❌ Selecciona un proveedor');
      return;
    }

    if (!form.idZona) {
      setMessage('❌ Selecciona una zona');
      return;
    }

    if (form.idsPlanes.length === 0) {
      setMessage('❌ Selecciona al menos un plan');
      return;
    }

    try {
      setSubmitting(true);
      const payload: PromocionComercialRequest = {
        reglaComercial: form.reglaComercial.trim(),
        idProveedor: Number(form.idProveedor),
        idZona: Number(form.idZona),
        idsPlanes: form.idsPlanes,
      };
      console.debug('[PromocionesSection] POST /promociones', payload);
      await onCreatePromocion(payload);
      setMessage('✅ Promoción creada correctamente');
      reset();
    } catch (err: any) {
      console.error('[PromocionesSection] error creating promocion', err);
      setMessage(err?.message || '💥 Error al crear promoción');
    } finally {
      setSubmitting(false);
    }
  };

  const renderTable = () => {
    if (!promociones || promociones.length === 0) return <p className="community-empty">Sin promociones</p>;

    return (
      <div className="community-table-wrapper">
        <table className="community-table">
          <thead>
            <tr>
              <th>REGLA COMERCIAL</th>
              <th>PROVEEDOR</th>
              <th>ZONA</th>
              <th>PLANES</th>
              <th>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            {promociones.map((promo, index) => (
              <tr key={`promo-${promo.id ?? 'x'}-${index}`}>
                <td>{promo.reglaComercial}</td>
                <td>{promo.nombreProveedor}</td>
                <td>{promo.nombreZona}</td>
                <td>
                  {promo.nombresPlanes && promo.nombresPlanes.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                      {promo.nombresPlanes.map((nombre, idx) => (
                        <li key={idx}>{nombre}</li>
                      ))}
                    </ul>
                  ) : (
                    '-'
                  )}
                </td>
                <td>
                  <div className="community-status-control">
                    <label className="community-switch" aria-label={`Cambiar estado de ${promo.reglaComercial}`}>
                      <input
                        type="checkbox"
                        checked={promo.activo}
                        onChange={() => {
                          setModalError('');
                          setPendingPromocion(promo);
                        }}
                        disabled={submitting || updatingEstadoId !== null}
                      />
                      <span className="community-switch-track" />
                    </label>
                    <span className={`community-switch-label ${promo.activo ? 'is-active' : 'is-inactive'}`}>
                      {promo.activo ? 'Activo' : 'Inactivo'}
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

  const handleCloseModal = () => {
    if (updatingEstadoId !== null) {
      return;
    }
    setPendingPromocion(null);
    setModalError('');
  };

  const handleConfirmToggle = async () => {
    if (!pendingPromocion) {
      return;
    }

    try {
      setModalError('');
      await onToggleEstado(pendingPromocion, !pendingPromocion.activo);
      setPendingPromocion(null);
    } catch (err: any) {
      setModalError(err instanceof Error ? err.message : 'No se pudo actualizar el estado.');
    }
  };

  return (
    <section className="community-card">
      <div className="community-section-head">
        <div>
          <h2>Promociones</h2>
          <p>Administra promociones por proveedor y zona con fechas de vigencia.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="community-form community-form-spaced">
        {message && (
          <div className={`${message.startsWith('✅') ? 'community-alert' : 'community-error'} community-message`}>
            {message}
          </div>
        )}

        <div className="community-content-stack">
          <div className="community-field">
            <label>Regla Comercial*</label>
            <input
              className="community-input"
              placeholder="Ej: Promoción 2x1 en planes de internet"
              value={form.reglaComercial}
              onChange={(e) => setForm((s) => ({ ...s, reglaComercial: e.target.value }))}
              disabled={submitting}
            />
          </div>

          <div className="community-grid-2">
            <div className="community-field">
              <label>Proveedor*</label>
              <select
                className="community-select"
                value={form.idProveedor}
                onChange={(e) => setForm((s) => ({ ...s, idProveedor: e.target.value, idsPlanes: [] }))}
                disabled={submitting}
              >
                <option value="">Selecciona proveedor</option>
                {activeProveedores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="community-field">
              <label>Zona*</label>
              <select
                className="community-select"
                value={form.idZona}
                onChange={(e) => setForm((s) => ({ ...s, idZona: e.target.value, idsPlanes: [] }))}
                disabled={submitting}
              >
                <option value="">Selecciona zona</option>
                {activeZonas.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="community-field">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Planes* (selecciona al menos uno)</span>
              {form.idsPlanes.length > 0 && (
                <span style={{ 
                  backgroundColor: '#2563eb', 
                  color: 'white', 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '9999px',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}>
                  {form.idsPlanes.length} seleccionado{form.idsPlanes.length !== 1 ? 's' : ''}
                </span>
              )}
            </label>
            {!form.idProveedor ? (
              <p className="community-empty" style={{ 
                padding: '2rem', 
                textAlign: 'center',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px dashed #d1d5db'
              }}>
                👆 Primero selecciona un proveedor para ver los planes disponibles
              </p>
            ) : planesDisponibles.length === 0 ? (
              <p className="community-empty" style={{ 
                padding: '2rem', 
                textAlign: 'center',
                backgroundColor: '#fef2f2',
                borderRadius: '8px',
                border: '1px dashed #fca5a5'
              }}>
                {!form.idZona
                  ? '📍 Selecciona una zona para filtrar los planes'
                  : '❌ No hay planes disponibles para este proveedor y zona'}
              </p>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                gap: '1rem',
                maxHeight: '500px',
                overflowY: 'auto',
                padding: '0.5rem'
              }}>
                {planesDisponibles.map((plan) => (
                  <label 
                    key={plan.id} 
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      border: form.idsPlanes.includes(plan.id) ? '2px solid #2563eb' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '1rem',
                      cursor: 'pointer',
                      backgroundColor: form.idsPlanes.includes(plan.id) ? '#eff6ff' : '#ffffff',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!form.idsPlanes.includes(plan.id)) {
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!form.idsPlanes.includes(plan.id)) {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <input
                        type="checkbox"
                        checked={form.idsPlanes.includes(plan.id)}
                        onChange={() => handleTogglePlan(plan.id)}
                        disabled={submitting}
                        style={{ 
                          marginTop: '0.25rem',
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontWeight: 600, 
                          fontSize: '1rem', 
                          color: '#1f2937',
                          marginBottom: '0.5rem'
                        }}>
                          {plan.nombre}
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '0.25rem',
                          fontSize: '0.875rem',
                          color: '#6b7280'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Precio:</span>
                            <span style={{ fontWeight: 600, color: '#059669' }}>
                              S/ {plan.precio.toFixed(2)}
                            </span>
                          </div>
                          
                          {plan.precioPromocional > 0 && plan.precioPromocional !== plan.precio && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Precio Promo:</span>
                              <span style={{ fontWeight: 600, color: '#dc2626' }}>
                                S/ {plan.precioPromocional.toFixed(2)}
                              </span>
                            </div>
                          )}
                          
                          {plan.internet && (
                            <div style={{ 
                              marginTop: '0.5rem',
                              paddingTop: '0.5rem',
                              borderTop: '1px solid #e5e7eb'
                            }}>
                              <div style={{ fontWeight: 500, color: '#1f2937', marginBottom: '0.25rem' }}>
                                🌐 Internet
                              </div>
                              <div>{plan.internet.velocidad} {plan.internet.unidad} ({plan.internet.tecnologia})</div>
                            </div>
                          )}
                          
                          {plan.television && (
                            <div style={{ 
                              marginTop: '0.5rem',
                              paddingTop: '0.5rem',
                              borderTop: '1px solid #e5e7eb'
                            }}>
                              <div style={{ fontWeight: 500, color: '#1f2937', marginBottom: '0.25rem' }}>
                                📺 TV
                              </div>
                              <div>{plan.television.nombre} ({plan.television.cantidadCanales} canales)</div>
                            </div>
                          )}
                          
                          {plan.telefono && (
                            <div style={{ 
                              marginTop: '0.5rem',
                              paddingTop: '0.5rem',
                              borderTop: '1px solid #e5e7eb'
                            }}>
                              <div style={{ fontWeight: 500, color: '#1f2937', marginBottom: '0.25rem' }}>
                                📞 Teléfono
                              </div>
                              <div>{plan.telefono.minutos} minutos</div>
                            </div>
                          )}
                          
                          {plan.adicionales && plan.adicionales.length > 0 && (
                            <div style={{ 
                              marginTop: '0.5rem',
                              paddingTop: '0.5rem',
                              borderTop: '1px solid #e5e7eb'
                            }}>
                              <div style={{ 
                                fontWeight: 500, 
                                color: '#1f2937', 
                                marginBottom: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}>
                                <span>➕ Adicionales</span>
                                <span style={{
                                  backgroundColor: '#e0e7ff',
                                  color: '#3730a3',
                                  padding: '0.125rem 0.5rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }}>
                                  {plan.adicionales.length}
                                </span>
                              </div>
                              <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '0.375rem',
                                paddingLeft: '0.5rem'
                              }}>
                                {plan.adicionales.map((adicional, idx) => {
                                  // Safely access adicional properties with fallbacks
                                  const nombre = adicional?.nombreAdicional ?? 'Sin nombre';
                                  const cantidad = adicional?.cantidadIncluida ?? 0;
                                  const permiteCompra = adicional?.permiteCompraAdicional ?? false;
                                  const cantidadMaxima = adicional?.cantidadMaximaAdicional ?? 0;

                                  return (
                                    <div 
                                      key={idx}
                                      style={{ 
                                        fontSize: '0.8125rem',
                                        color: '#4b5563',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '0.375rem'
                                      }}
                                    >
                                      <span style={{ 
                                        color: '#9ca3af',
                                        fontSize: '0.75rem',
                                        marginTop: '0.125rem'
                                      }}>
                                        •
                                      </span>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 500, color: '#1f2937' }}>
                                          {nombre}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                          {cantidad} incluido{cantidad !== 1 ? 's' : ''}
                                          {permiteCompra && cantidadMaxima > 0 && (
                                            <span> • Hasta {cantidadMaxima} máx.</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="community-actions">
          <button type="submit" className="community-btn primary" disabled={submitting}>
            {submitting ? 'Creando...' : 'Crear Promoción'}
          </button>
        </div>
      </form>

      {error ? (
        <div className="community-error">Error al cargar promociones (status {status})</div>
      ) : (
        renderTable()
      )}

      <EstadoConfirmModal
        open={Boolean(pendingPromocion)}
        submitting={updatingEstadoId !== null}
        errorMessage={modalError}
        onCancel={handleCloseModal}
        onConfirm={handleConfirmToggle}
      />
    </section>
  );
};
