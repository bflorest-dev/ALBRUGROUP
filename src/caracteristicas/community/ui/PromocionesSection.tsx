import React, { useState } from 'react';
import type {
  PromocionComercialResponse,
  PromocionComercialRequest,
  ProveedorResponse,
  ZonaResponse,
} from '@shared/types';

interface PromocionesSectionProps {
  promociones: PromocionComercialResponse[];
  proveedores: ProveedorResponse[];
  zonas: ZonaResponse[];
  onCreatePromocion: (payload: PromocionComercialRequest) => Promise<unknown>;
  onRefresh: () => Promise<void>;
  error: boolean;
  status: number;
}

const defaultForm = {
  nombre: '',
  interno: false,
  idProveedor: '',
  idZona: '',
  descuento: false,
  cantidadMeses: 1,
  vigenciaDesde: '',
  vigenciaHasta: '',
};

export const PromocionesSection: React.FC<PromocionesSectionProps> = ({
  promociones,
  proveedores,
  zonas,
  onCreatePromocion,
  onRefresh,
  error,
  status,
}) => {
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => setForm(defaultForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nombre.trim()) {
      setMessage('❌ Nombre es requerido');
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

    if (!form.vigenciaDesde || !form.vigenciaHasta) {
      setMessage('❌ Completa las fechas de vigencia');
      return;
    }

    try {
      setSubmitting(true);
      const payload: PromocionComercialRequest = {
        nombre: form.nombre.trim(),
        interno: form.interno,
        idProveedor: Number(form.idProveedor),
        idZona: Number(form.idZona),
        descuento: form.descuento,
        cantidadMeses: Number(form.cantidadMeses),
        vigenciaDesde: form.vigenciaDesde,
        vigenciaHasta: form.vigenciaHasta,
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

    const columns = [
      'id',
      'nombre',
      'interno',
      'idProveedor',
      'nombreProveedor',
      'idZona',
      'nombreZona',
      'descuento',
      'cantidadMeses',
      'vigenciaDesde',
      'vigenciaHasta',
      'activo',
    ];

    return (
      <div className="community-table-wrapper">
        <table className="community-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {promociones.map((promo, index) => (
              <tr key={`promo-${promo.id ?? 'x'}-${index}`}>
                {columns.map((col) => (
                  <td key={`promo-${promo.id ?? 'x'}-${col}-${index}`}>
                    {typeof (promo as any)[col] === 'object'
                      ? JSON.stringify((promo as any)[col])
                      : (promo as any)[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <section className="community-card">
      <div className="community-section-head">
        <div>
          <h2>Promociones</h2>
          <p>Administra promociones por proveedor y zona con fechas de vigencia.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="community-form" style={{ marginBottom: 16 }}>
        {message && (
          <div className={message.startsWith('✅') ? 'community-alert' : 'community-error'} style={{ marginBottom: 12 }}>
            {message}
          </div>
        )}

        <div style={{ display: 'grid', gap: 12, marginBottom: 12 }}>
          <div className="community-field">
            <label>Nombre de la promoción</label>
            <input
              className="community-input"
              placeholder="Nombre de la promoción"
              value={form.nombre}
              onChange={(e) => setForm((s) => ({ ...s, nombre: e.target.value }))}
              disabled={submitting}
            />
          </div>

          <div className="community-grid-2">
            <div className="community-field">
              <label>Proveedor</label>
              <select
                className="community-select"
                value={form.idProveedor}
                onChange={(e) => setForm((s) => ({ ...s, idProveedor: e.target.value }))}
                disabled={submitting}
              >
                <option value="">Selecciona proveedor</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="community-field">
              <label>Zona</label>
              <select
                className="community-select"
                value={form.idZona}
                onChange={(e) => setForm((s) => ({ ...s, idZona: e.target.value }))}
                disabled={submitting}
              >
                <option value="">Selecciona zona</option>
                {zonas.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="community-grid-2">
            <div className="community-field">
              <label>Cantidad de meses</label>
              <input
                type="number"
                min={1}
                className="community-input"
                value={form.cantidadMeses}
                onChange={(e) => setForm((s) => ({ ...s, cantidadMeses: Number(e.target.value) }))}
                disabled={submitting}
                placeholder="Cantidad de meses"
              />
            </div>
            <div className="community-grid-2">
              <div className="community-field">
                <label>Vigencia desde</label>
                <input
                  type="date"
                  className="community-input"
                  value={form.vigenciaDesde}
                  onChange={(e) => setForm((s) => ({ ...s, vigenciaDesde: e.target.value }))}
                  disabled={submitting}
                />
              </div>
              <div className="community-field">
                <label>Vigencia hasta</label>
                <input
                  type="date"
                  className="community-input"
                  value={form.vigenciaHasta}
                  onChange={(e) => setForm((s) => ({ ...s, vigenciaHasta: e.target.value }))}
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={form.interno}
                onChange={(e) => setForm((s) => ({ ...s, interno: e.target.checked }))}
                disabled={submitting}
              />
              Interno
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={form.descuento}
                onChange={(e) => setForm((s) => ({ ...s, descuento: e.target.checked }))}
                disabled={submitting}
              />
              Descuento
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className="community-btn primary" disabled={submitting}>
            {submitting ? 'Creando...' : 'Crear Promoción'}
          </button>
          <button type="button" className="community-btn ghost" onClick={() => onRefresh()}>
            Recargar Promociones
          </button>
        </div>
      </form>

      {error ? (
        <div className="community-error">Error al cargar promociones (status {status})</div>
      ) : (
        renderTable()
      )}
    </section>
  );
};
