import React, { useMemo, useState } from 'react';
import { useTipificacionesCatalogo, usePutTipificacionesCatalogo, usePatchTipificacionEstado } from '../model/useTipificacionesQuery';
import type { Tipificacion } from '../model/tipificaciones.api';
import './TipificacionesAdmin.css';

const etapas = ['PREVENTA', 'VENTA', 'POSTVENTA'] as const;

export const TipificacionesAdmin: React.FC = () => {
  const [etapa, setEtapa] = useState<typeof etapas[number]>('PREVENTA');
  const [draftTipificaciones, setDraftTipificaciones] = useState<Tipificacion[] | null>(null);

  const { data: serverTipificaciones, isLoading: loadingCatalogo, isError: catalogoError } =
    useTipificacionesCatalogo(etapa);

  const putCatalogo = usePutTipificacionesCatalogo();
  const patchEstado = usePatchTipificacionEstado();

  const localTipificaciones = useMemo(
    () => draftTipificaciones ?? serverTipificaciones ?? [],
    [draftTipificaciones, serverTipificaciones]
  );

  const handleAdd = () => {
    setDraftTipificaciones((prev) => {
      const base = prev ?? serverTipificaciones ?? [];
      return [
        ...base,
        {
          codigo: '',
          descripcion: '',
          orden: base.length + 1,
          activo: true,
        },
      ];
    });
  };

  const handleChange = (index: number, values: Partial<Tipificacion>) => {
    setDraftTipificaciones((prev) => {
      const base = prev ?? serverTipificaciones ?? [];
      return base.map((item, i) => (i === index ? { ...item, ...values } : item));
    });
  };

  const handleRemove = (index: number) => {
    setDraftTipificaciones((prev) => {
      const base = prev ?? serverTipificaciones ?? [];
      return base.filter((_, i) => i !== index);
    });
  };

  const handleGuardar = () => {
    putCatalogo.mutate(
      { etapa, tipificaciones: localTipificaciones },
      { onSuccess: () => setDraftTipificaciones(null) }
    );
  };

  const handleToggleActivo = (tipificacion: Tipificacion, index: number) => {
    if (!tipificacion.id) {
      handleChange(index, { activo: !tipificacion.activo });
      return;
    }

    patchEstado.mutate({ payload: { idTipificacion: tipificacion.id, activo: !tipificacion.activo }, etapa });
  };

  const sortedTipificaciones = useMemo(
    () => [...localTipificaciones].sort((a, b) => a.orden - b.orden),
    [localTipificaciones]
  );

  return (
    <div className="tipificaciones-admin">
      <h2>Administracion de Tipificaciones</h2>

      <div className="tipificaciones-actions">
        <label>
          Etapa:
          <select
            value={etapa}
            onChange={(e) => {
              setEtapa(e.target.value as typeof etapas[number]);
              setDraftTipificaciones(null);
            }}
          >
            {etapas.map((et) => (
              <option key={et} value={et}>
                {et}
              </option>
            ))}
          </select>
        </label>

        <button onClick={handleAdd} className="btn-secondary">
          + Nueva tipificacion
        </button>

        <button onClick={handleGuardar} className="btn-primary" disabled={putCatalogo.isPending}>
          Guardar catalogo
        </button>
      </div>

      {loadingCatalogo ? (
        <p>Cargando tipificaciones...</p>
      ) : catalogoError ? (
        <p>Error al cargar catalogo.</p>
      ) : (
        <table className="tipificaciones-table">
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Descripcion</th>
              <th>Orden</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sortedTipificaciones.map((tip, index) => (
              <tr key={tip.id ?? index}>
                <td>
                  <input
                    type="text"
                    value={tip.codigo}
                    onChange={(e) => handleChange(index, { codigo: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={tip.descripcion}
                    onChange={(e) => handleChange(index, { descripcion: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={tip.orden}
                    onChange={(e) => handleChange(index, { orden: Number(e.target.value) })}
                    className="w-[72px]"
                  />
                </td>
                <td>
                  <button
                    onClick={() => handleToggleActivo(tip, index)}
                    className={tip.activo ? 'btn-active' : 'btn-inactive'}
                  >
                    {tip.activo ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td>
                  <button onClick={() => handleRemove(index)} className="btn-danger-small">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {putCatalogo.isError && <p className="error">Error guardando: {(putCatalogo.error as Error)?.message}</p>}
      {putCatalogo.isSuccess && <p className="success">Catalogo guardado correctamente</p>}
      {patchEstado.isError && <p className="error">Error estado: {(patchEstado.error as Error)?.message}</p>}
    </div>
  );
};
