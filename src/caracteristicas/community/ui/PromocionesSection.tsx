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
      await onRefresh();
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
    if (!promociones || promociones.length === 0) return <p style={{ color: '#666' }}>Sin promociones</p>;

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
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col} style={{ border: '1px solid #ddd', padding: 8, background: '#f4f4f4' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {promociones.map((promo) => (
              <tr key={promo.id} style={{ background: promo.id % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                {columns.map((col) => (
                  <td key={`${promo.id}-${col}`} style={{ border: '1px solid #ddd', padding: 8 }}>
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
    <section style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, background: '#fff' }}>
      <h2>Promociones</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
        {message && <div style={{ marginBottom: 12, color: message.startsWith('✅') ? '#155724' : '#721c24' }}>{message}</div>}

        <div style={{ display: 'grid', gap: 12, marginBottom: 12 }}>
          <input
            style={{ padding: 8 }}
            placeholder="Nombre de la promoción"
            value={form.nombre}
            onChange={(e) => setForm((s) => ({ ...s, nombre: e.target.value }))}
            disabled={submitting}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <select
              style={{ padding: 8 }}
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

            <select
              style={{ padding: 8 }}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input
              type="number"
              min={1}
              style={{ padding: 8 }}
              value={form.cantidadMeses}
              onChange={(e) => setForm((s) => ({ ...s, cantidadMeses: Number(e.target.value) }))}
              disabled={submitting}
              placeholder="Cantidad de meses"
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <input
                type="date"
                value={form.vigenciaDesde}
                onChange={(e) => setForm((s) => ({ ...s, vigenciaDesde: e.target.value }))}
                disabled={submitting}
              />
              <input
                type="date"
                value={form.vigenciaHasta}
                onChange={(e) => setForm((s) => ({ ...s, vigenciaHasta: e.target.value }))}
                disabled={submitting}
              />
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
          <button type="submit" disabled={submitting} style={{ padding: '8px 12px' }}>
            {submitting ? 'Creando...' : 'Crear Promoción'}
          </button>
          <button type="button" onClick={() => onRefresh()} style={{ padding: '8px 12px' }}>
            Recargar Promociones
          </button>
        </div>
      </form>

      {error ? (
        <div style={{ color: 'red' }}>Error al cargar promociones (status {status})</div>
      ) : (
        renderTable()
      )}
    </section>
  );
};
