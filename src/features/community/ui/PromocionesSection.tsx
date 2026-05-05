import React, { useState } from 'react';
import type {
  PromocionComercialResponse,
  PromocionComercialRequest,
  ProveedorResponse,
  ZonaResponse,
} from '@shared/types';
import { FlatpickrDateInput } from '@shared/ui/date-picker';
import { EstadoConfirmModal } from './EstadoConfirmModal';

interface PromocionesSectionProps {
  promociones: PromocionComercialResponse[];
  proveedores: ProveedorResponse[];
  zonas: ZonaResponse[];
  onCreatePromocion: (payload: PromocionComercialRequest) => Promise<unknown>;
  onRefresh: () => Promise<void>;
  onToggleEstado: (promocion: PromocionComercialResponse, nextActivo: boolean) => Promise<void>;
  updatingEstadoId: number | null;
  error: boolean;
  status: number;
}

const defaultForm = {
  nombre: '',
  interno: false,
  idProveedor: '',
  idZona: '',
  tipoDescuento: 'PORCENTUAL' as 'PORCENTUAL' | 'MONTO',
  descuentoPorcentual: '',
  descuentoMonto: '',
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

  const reset = () => setForm(defaultForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nombre.trim()) {
      setMessage('❌ Nombre es requerido');
      return;
    }

    if (!form.interno && !form.idProveedor) {
      setMessage('❌ Selecciona un proveedor');
      return;
    }

    if (!form.idZona) {
      setMessage('❌ Selecciona una zona');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const vigenciaDesdeIso = form.vigenciaDesde || today;
    const vigenciaHastaIso = form.vigenciaHasta || '';

    if (vigenciaHastaIso && vigenciaHastaIso < vigenciaDesdeIso) {
      setMessage('❌ Vigencia hasta no puede ser anterior a vigencia desde');
      return;
    }

    const hasDescuento = form.tipoDescuento === 'PORCENTUAL'
      ? form.descuentoPorcentual.trim().length > 0
      : form.descuentoMonto.trim().length > 0;

    if (hasDescuento) {
      if (form.tipoDescuento === 'PORCENTUAL') {
        const porcentaje = Number(form.descuentoPorcentual);
        if (!form.descuentoPorcentual || Number.isNaN(porcentaje) || porcentaje <= 0 || porcentaje > 100) {
          setMessage('❌ Ingresa un descuento porcentual válido (1-100)');
          return;
        }
      } else {
        const monto = Number(form.descuentoMonto);
        if (!form.descuentoMonto || Number.isNaN(monto) || monto <= 0) {
          setMessage('❌ Ingresa un descuento por monto válido (> 0)');
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      const payload: PromocionComercialRequest = {
        nombre: form.nombre.trim(),
        interno: form.interno,
        ...(form.interno ? {} : { idProveedor: Number(form.idProveedor) }),
        idZona: Number(form.idZona),
        descuento: hasDescuento,
        ...(hasDescuento
          ? form.tipoDescuento === 'PORCENTUAL'
            ? { descuentoPorcentual: Number(form.descuentoPorcentual) }
            : { descuentoMonto: Number(form.descuentoMonto) }
          : {}),
        cantidadMeses: Number(form.cantidadMeses),
        vigenciaDesde: vigenciaDesdeIso,
        vigenciaHasta: vigenciaHastaIso,
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
      'nombre',
      'nombreProveedor',
      'nombreZona',
      'descuento',
      'cantidadMeses',
      'vigenciaDesde',
      'vigenciaHasta',
      'estado',
    ];

    return (
      <div className="community-table-wrapper">
        <table className="community-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>
                  {col === 'nombreProveedor'
                    ? 'PROVEEDOR'
                    : col === 'nombreZona'
                    ? 'ZONA'
                    : col === 'cantidadMeses'
                    ? 'MES/ES'
                    : col === 'vigenciaDesde'
                    ? 'DESDE'
                    : col === 'vigenciaHasta'
                    ? 'HASTA'
                    : col === 'estado'
                    ? 'ESTADO'
                    : col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {promociones.map((promo, index) => (
              <tr key={`promo-${promo.id ?? 'x'}-${index}`}>
                {columns.map((col) => (
                  <td key={`promo-${promo.id ?? 'x'}-${col}-${index}`}>
                    {col === 'estado' ? (
                      <div className="community-status-control">
                        <label className="community-switch" aria-label={`Cambiar estado de ${promo.nombre}`}>
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
                    ) : col === 'descuento' ? (
                      promo.descuento === false
                        ? 'No'
                        : promo.descuento === true
                        ? typeof (promo as any).descuentoPorcentual === 'number'
                          ? `Porcentual - ${(promo as any).descuentoPorcentual}%`
                          : typeof (promo as any).descuentoMonto === 'number'
                          ? `Monto - ${(promo as any).descuentoMonto}`
                          : 'Sí'
                        : '-'
                    ) : col === 'nombreProveedor' ? (
                      promo.interno === true ? 'ALBRU' : (promo as any)[col] ?? '-'
                    ) : col === 'vigenciaHasta' ? (
                      promo.vigenciaHasta ?? '-'
                    ) : typeof (promo as any)[col] === 'object' ? (
                      JSON.stringify((promo as any)[col])
                    ) : (
                      (promo as any)[col] ?? '-'
                    )}
                  </td>
                ))}
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
              {form.interno ? (
                <input
                  className="community-input"
                  type="text"
                  value="ALBRU"
                  disabled
                />
              ) : (
                <select
                  className="community-select"
                  value={form.idProveedor}
                  onChange={(e) => setForm((s) => ({ ...s, idProveedor: e.target.value }))}
                  disabled={submitting}
                >
                  <option value="">Selecciona proveedor</option>
                  {activeProveedores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              )}
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
                {activeZonas.map((z) => (
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
                <FlatpickrDateInput
                  value={form.vigenciaDesde}
                  onChange={(date) => setForm((s) => ({ ...s, vigenciaDesde: date }))}
                  disabled={submitting}
                  required
                />
              </div>
              <div className="community-field">
                <label>Vigencia hasta</label>
                <FlatpickrDateInput
                  value={form.vigenciaHasta}
                  onChange={(date) => setForm((s) => ({ ...s, vigenciaHasta: date }))}
                  minDate={form.vigenciaDesde || undefined}
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          <div className="community-check-group">
            <div className="community-field">
              <label>Tipo de descuento</label>
              <select
                className="community-select"
                value={form.tipoDescuento}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    tipoDescuento: e.target.value as 'PORCENTUAL' | 'MONTO',
                    descuentoPorcentual: e.target.value === 'PORCENTUAL' ? s.descuentoPorcentual : '',
                    descuentoMonto: e.target.value === 'MONTO' ? s.descuentoMonto : '',
                  }))
                }
                disabled={submitting}
              >
                <option value="PORCENTUAL">Porcentual (%)</option>
                <option value="MONTO">Monto fijo</option>
              </select>
            </div>

            <div className="community-field">
              <label>{form.tipoDescuento === 'PORCENTUAL' ? 'Descuento porcentual (%)' : 'Descuento por monto'}</label>
              <input
                type="number"
                min={form.tipoDescuento === 'PORCENTUAL' ? 1 : 0.01}
                max={form.tipoDescuento === 'PORCENTUAL' ? 100 : undefined}
                step={0.01}
                className="community-input"
                value={form.tipoDescuento === 'PORCENTUAL' ? form.descuentoPorcentual : form.descuentoMonto}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    descuentoPorcentual: form.tipoDescuento === 'PORCENTUAL' ? e.target.value : s.descuentoPorcentual,
                    descuentoMonto: form.tipoDescuento === 'MONTO' ? e.target.value : s.descuentoMonto,
                  }))
                }
                disabled={submitting}
                placeholder={form.tipoDescuento === 'PORCENTUAL' ? 'Ej: 25' : 'Ej: 49.90'}
              />
            </div>
          </div>

          <div className="community-check-group">
            <label className="community-check-row">
              <input
                type="checkbox"
                checked={form.interno}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    interno: e.target.checked,
                    idProveedor: e.target.checked ? '' : s.idProveedor,
                  }))
                }
                disabled={submitting}
              />
              Interno
            </label>
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
