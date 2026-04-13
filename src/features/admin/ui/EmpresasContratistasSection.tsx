import React, { useEffect, useState } from 'react';
import {
  createEmpresaContratista,
  desactivarEmpresaContratista,
  getEmpresasContratistas,
  type EmpresaContratista,
} from '../api/adminManagementApi';

export const EmpresasContratistasSection: React.FC = () => {
  const [items, setItems] = useState<EmpresaContratista[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEmpresasContratistas();
      setItems(data);
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo cargar empresas contratistas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const handleCreate = async () => {
    if (!nombre.trim()) {
      setError('Nombre es obligatorio.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await createEmpresaContratista({
        nombre: nombre.trim(),
      });
      setNombre('');
      await load();
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo crear la empresa contratista.');
    } finally {
      setLoading(false);
    }
  };

  const handleDesactivar = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await desactivarEmpresaContratista(id);
      await load();
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo desactivar la empresa contratista.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h2>Empresas Contratistas</h2>
      <p>Administra empresas contratistas desde el área de Administrador.</p>

      <div className="admin-form-grid">
        <div className="form-group">
          <label>Nombre</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre comercial" />
        </div>
      </div>

      <button className="btn-primary" onClick={handleCreate} disabled={loading}>
        Crear Empresa Contratista
      </button>

      {error && <div className="error-message">{error}</div>}

      <table className="credentials-table" style={{ marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Activo</th>
            <th>Created At</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.nombre}</td>
              <td>{item.activo ? 'true' : 'false'}</td>
              <td>{item.createdAt ? new Date(item.createdAt).toLocaleString('es-PE') : '-'}</td>
              <td>
                <button className="btn-danger-small" onClick={() => handleDesactivar(Number(item.id))} disabled={loading || !item.activo}>
                  Desactivar
                </button>
              </td>
            </tr>
          ))}
          {!loading && items.length === 0 && (
            <tr>
              <td colSpan={5}>No hay empresas contratistas registradas.</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
};
