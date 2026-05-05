import React, { useEffect, useState } from 'react';
import { getPagos, pagarContrato, type PagoContrato } from '../api/adminManagementApi';
import { FlatpickrDateInput } from '@shared/ui/date-picker';

const today = () => new Date().toISOString().split('T')[0] ?? '';

export const PagosSection: React.FC = () => {
  const [items, setItems] = useState<PagoContrato[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fechaInicio, setFechaInicio] = useState(today());
  const [fechaFin, setFechaFin] = useState(today());
  const [asignacionFamiliar, setAsignacionFamiliar] = useState('0');
  const [bonoPuntualidad, setBonoPuntualidad] = useState('0');
  const [comisionSemanal, setComisionSemanal] = useState('0');
  const [comisionMensual, setComisionMensual] = useState('0');
  const [bonoExtra, setBonoExtra] = useState('0');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPagos();
      setItems(data);
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo cargar pagos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const handlePagar = async (idPago: number) => {
    setLoading(true);
    setError(null);
    try {
      await pagarContrato(idPago, {
        fechaInicio,
        fechaFin,
        asignacionFamiliar: Number(asignacionFamiliar || 0),
        bonoPuntualidad: Number(bonoPuntualidad || 0),
        comisionSemanal: Number(comisionSemanal || 0),
        comisionMensual: Number(comisionMensual || 0),
        bonoExtra: Number(bonoExtra || 0),
      });
      setFechaInicio(today());
      setFechaFin(today());
      setAsignacionFamiliar('0');
      setBonoPuntualidad('0');
      setComisionSemanal('0');
      setComisionMensual('0');
      setBonoExtra('0');
      await load();
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo registrar el pago del contrato.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h2>Pagos</h2>
      <p>Visualiza pagos y registra pago de contrato desde el área de Administrador.</p>

      <div className="admin-form-grid">
        <div className="form-group">
          <label>Fecha Inicio</label>
          <FlatpickrDateInput value={fechaInicio} onChange={setFechaInicio} />
        </div>
        <div className="form-group">
          <label>Fecha Fin</label>
          <FlatpickrDateInput value={fechaFin} onChange={setFechaFin} minDate={fechaInicio || undefined} />
        </div>
        <div className="form-group">
          <label>Asignación Familiar</label>
          <input type="number" min="0" value={asignacionFamiliar} onChange={(e) => setAsignacionFamiliar(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Bono Puntualidad</label>
          <input type="number" min="0" value={bonoPuntualidad} onChange={(e) => setBonoPuntualidad(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Comisión Semanal</label>
          <input type="number" min="0" value={comisionSemanal} onChange={(e) => setComisionSemanal(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Comisión Mensual</label>
          <input type="number" min="0" value={comisionMensual} onChange={(e) => setComisionMensual(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Bono Extra</label>
          <input type="number" min="0" value={bonoExtra} onChange={(e) => setBonoExtra(e.target.value)} />
        </div>
      </div>

      <button className="btn-secondary" onClick={() => load()} disabled={loading} style={{ marginLeft: '0.5rem' }}>
        Actualizar Lista
      </button>

      {error && <div className="error-message">{error}</div>}

      <table className="credentials-table" style={{ marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>ID Contrato</th>
            <th>ID Empleado</th>
            <th>Monto</th>
            <th>Estado</th>
            <th>Fecha Pago</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{String(item.idContrato ?? '-')}</td>
              <td>{String(item.idEmpleado ?? '-')}</td>
              <td>{String(item.monto ?? '-')}</td>
              <td>{String(item.estado ?? '-')}</td>
              <td>{String(item.fechaPago ?? '-')}</td>
              <td>
                <button className="btn-primary" onClick={() => handlePagar(item.id)} disabled={loading}>
                  Pagar Contrato
                </button>
              </td>
            </tr>
          ))}
          {!loading && items.length === 0 && (
            <tr>
              <td colSpan={7}>No hay pagos para mostrar.</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
};
