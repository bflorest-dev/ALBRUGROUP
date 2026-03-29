import React, { useEffect, useState } from 'react';
import { LeadsRepository } from '@shared/api/repositories/leads.repository';
import type { DepartamentoResponse, DistritoResponse, PlanRequest, ProvinciaResponse } from '@shared/types';

export type NivelGeografico = 'DEPARTAMENTO' | 'PROVINCIA' | 'DISTRITO';
export type CriterioZona = 'INCLUIR' | 'EXCLUIR';

interface ZonaReglaInput {
  nivelGeografico: NivelGeografico;
  departamentoId: number | '';
  provinciaId: number | '';
  geoId: number | '';
  criterio: CriterioZona;
}

interface ZonaFormProps {
  onCreateZona: (payload: { nombre: string; reglas: Array<{ nivelGeografico: NivelGeografico; geoId: number; criterio: CriterioZona }> }) => Promise<unknown>;
  onCreated?: () => void;
}

export const ZonaForm: React.FC<ZonaFormProps> = ({ onCreateZona, onCreated }) => {
  const [nombre, setNombre] = useState('');
  const [reglas, setReglas] = useState<ZonaReglaInput[]>([]);

  const [departamentos, setDepartamentos] = useState<DepartamentoResponse[]>([]);
  const [provincias, setProvincias] = useState<Record<number, ProvinciaResponse[]>>({});
  const [distritos, setDistritos] = useState<Record<number, DistritoResponse[]>>({});

  const [loading, setLoading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadDepartamentos = async () => {
      try {
        const data = await LeadsRepository.getDepartamentos();
        setDepartamentos(data);
      } catch (err) {
        console.error('[ZonaForm] Error loading departamentos', err);
        setDepartamentos([]);
      }
    };

    loadDepartamentos();
  }, []);

  const loadProvincias = async (depId: number): Promise<void> => {
    if (provincias[depId]) return; // cache
    try {
      const data = await LeadsRepository.getProvinciasPorDepartamento(depId);
      setProvincias((prev) => ({ ...prev, [depId]: data }));
    } catch (err) {
      console.error('[ZonaForm] Error loading provincias', err);
      setProvincias((prev) => ({ ...prev, [depId]: [] }));
    }
  };

  const loadDistritos = async (provId: number): Promise<void> => {
    if (distritos[provId]) return;
    try {
      const data = await LeadsRepository.getDistritosPorProvincia(provId);
      setDistritos((prev) => ({ ...prev, [provId]: data }));
    } catch (err) {
      console.error('[ZonaForm] Error loading distritos', err);
      setDistritos((prev) => ({ ...prev, [provId]: [] }));
    }
  };

  const addRegla = () => {
    setReglas((prev) => [
      ...prev,
      {
        nivelGeografico: 'DEPARTAMENTO',
        departamentoId: '',
        provinciaId: '',
        geoId: '',
        criterio: 'INCLUIR',
      },
    ]);
  };

  const removeRegla = (index: number) => {
    setReglas((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateRegla = (index: number, changes: Partial<ZonaReglaInput>) => {
    setReglas((prev) =>
      prev.map((r, idx) => {
        if (idx !== index) return r;
        const next = { ...r, ...changes };

        if (changes.nivelGeografico && changes.nivelGeografico !== r.nivelGeografico) {
          next.departamentoId = '';
          next.provinciaId = '';
          next.geoId = '';
        }

        if (changes.departamentoId && r.provinciaId !== '') {
          next.provinciaId = '';
          next.geoId = '';
        }

        if (changes.provinciaId && r.geoId !== '') {
          next.geoId = '';
        }

        return next;
      }),
    );
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!nombre.trim()) {
      newErrors.nombre = 'Nombre de zona es requerido';
    }

    if (reglas.length === 0) {
      newErrors.reglas = 'Debes crear al menos una regla';
    }

    reglas.forEach((regla, index) => {
      const prefix = `reglas.${index}`;
      if (!['DEPARTAMENTO', 'PROVINCIA', 'DISTRITO'].includes(regla.nivelGeografico)) {
        newErrors[`${prefix}.nivelGeografico`] = 'Nivel geográfico inválido';
      }
      if (regla.nivelGeografico === 'DEPARTAMENTO') {
        if (!regla.geoId) {
          newErrors[`${prefix}.geoId`] = 'Departamento requerido';
        }
      }
      if (regla.nivelGeografico === 'PROVINCIA') {
        if (!regla.departamentoId) {
          newErrors[`${prefix}.departamentoId`] = 'Departamento requerido';
        }
        if (!regla.provinciaId) {
          newErrors[`${prefix}.provinciaId`] = 'Provincia requerida';
        }
        if (!regla.geoId) {
          newErrors[`${prefix}.geoId`] = 'Provincia requerida';
        }
      }
      if (regla.nivelGeografico === 'DISTRITO') {
        if (!regla.departamentoId) {
          newErrors[`${prefix}.departamentoId`] = 'Departamento requerido';
        }
        if (!regla.provinciaId) {
          newErrors[`${prefix}.provinciaId`] = 'Provincia requerida';
        }
        if (!regla.geoId) {
          newErrors[`${prefix}.geoId`] = 'Distrito requerido';
        }
      }
      if (!['INCLUIR', 'EXCLUIR'].includes(regla.criterio)) {
        newErrors[`${prefix}.criterio`] = 'Criterio inválido';
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setGlobalMessage('❌ Corrige los errores antes de enviar');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) return;

    const payload = {
      nombre: nombre.trim(),
      reglas: reglas.map((r) => ({
        nivelGeografico: r.nivelGeografico,
        geoId: Number(r.geoId),
        criterio: r.criterio,
      })),
    };

    setLoading(true);
    setGlobalMessage('');

    try {
      await onCreateZona(payload);
      setGlobalMessage('✅ Zona creada exitosamente');
      setNombre('');
      setReglas([]);
      onCreated?.();
    } catch (err: any) {
      console.error('[ZonaForm] createZona error', err);
      if (err?.message?.includes('401')) {
        setGlobalMessage('🔐 Token inválido o expirado');
      } else if (err?.message?.includes('400')) {
        setGlobalMessage('⚠️ Error de validación en servidor');
      } else {
        setGlobalMessage('💥 Error al crear zona');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateGeoOptions = (regla: ZonaReglaInput): Array<{ id: number; label: string }> => {
    if (regla.nivelGeografico === 'DEPARTAMENTO') {
      return departamentos.map((d) => ({ id: d.id, label: d.nombre }));
    }

    if (regla.nivelGeografico === 'PROVINCIA') {
      const depId = Number(regla.departamentoId);
      if (!depId || !provincias[depId]) return [];
      return provincias[depId].map((prov) => ({ id: prov.id, label: prov.nombre }));
    }

    if (regla.nivelGeografico === 'DISTRITO') {
      const provId = Number(regla.provinciaId);
      if (!provId || !distritos[provId]) return [];
      return distritos[provId].map((dist) => ({ id: dist.id, label: dist.nombre }));
    }

    return [];
  };

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, background: '#fff' }}>
      <h3>Crear Zona</h3>
      {globalMessage && <div style={{ marginBottom: 12 }}>{globalMessage}</div>}

      <div style={{ marginBottom: 12 }}>
        <label>Nombre*</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          disabled={loading}
          style={{ width: '100%', padding: 8 }}
        />
        {errors.nombre && <small style={{ color: 'red' }}>{errors.nombre}</small>}
      </div>

      <div style={{ marginBottom: 12 }}>
        <button type="button" onClick={addRegla} disabled={loading} style={{ padding: '8px 12px' }}>
          + Agregar regla
        </button>
        {errors.reglas && <div style={{ color: 'red', marginTop: 8 }}>{errors.reglas}</div>}
      </div>

      {reglas.map((regla, index) => {
        const geoOptions = generateGeoOptions(regla);
        return (
          <div key={index} style={{ border: '1px solid #eee', padding: 12, marginBottom: 12, borderRadius: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Regla #{index + 1}</strong>
              <button type="button" onClick={() => removeRegla(index)} disabled={loading} style={{ color: '#c82333' }}>
                Eliminar norma
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 10 }}>
              <div>
                <label>Nivel geográfico*</label>
                <select
                  value={regla.nivelGeografico}
                  onChange={(e) => {
                    const nivel = e.target.value as NivelGeografico;
                    updateRegla(index, { nivelGeografico: nivel, departamentoId: '', provinciaId: '', geoId: '' });
                  }}
                  disabled={loading}
                  style={{ width: '100%', padding: 8 }}
                >
                  <option value="DEPARTAMENTO">DEPARTAMENTO</option>
                  <option value="PROVINCIA">PROVINCIA</option>
                  <option value="DISTRITO">DISTRITO</option>
                </select>
                {errors[`reglas.${index}.nivelGeografico`] && (
                  <small style={{ color: 'red' }}>{errors[`reglas.${index}.nivelGeografico`]}</small>
                )}
              </div>

              {regla.nivelGeografico !== 'DEPARTAMENTO' && (
                <div>
                  <label>Departamento*</label>
                  <select
                    value={regla.departamentoId}
                    onChange={async (e) => {
                      const val = Number(e.target.value) || '';
                      updateRegla(index, { departamentoId: val, provinciaId: '', geoId: '' });
                      if (val) await loadProvincias(Number(val));
                    }}
                    disabled={loading}
                    style={{ width: '100%', padding: 8 }}
                  >
                    <option value="">Selecciona departamento</option>
                    {departamentos.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nombre}
                      </option>
                    ))}
                  </select>
                  {errors[`reglas.${index}.departamentoId`] && (
                    <small style={{ color: 'red' }}>{errors[`reglas.${index}.departamentoId`]}</small>
                  )}
                </div>
              )}

              {regla.nivelGeografico === 'DISTRITO' && (
                <div>
                  <label>Provincia*</label>
                  <select
                    value={regla.provinciaId}
                    onChange={async (e) => {
                      const val = Number(e.target.value) || '';
                      updateRegla(index, { provinciaId: val, geoId: '' });
                      if (val) await loadDistritos(Number(val));
                    }}
                    disabled={loading || !regla.departamentoId}
                    style={{ width: '100%', padding: 8 }}
                  >
                    <option value="">Selecciona provincia</option>
                    {(() => {
                      const depId = Number(regla.departamentoId);
                      const lista = depId ? provincias[depId] : [];
                      return Array.isArray(lista)
                        ? lista.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nombre}
                            </option>
                          ))
                        : null;
                    })()}
                  </select>
                  {errors[`reglas.${index}.provinciaId`] && (
                    <small style={{ color: 'red' }}>{errors[`reglas.${index}.provinciaId`]}</small>
                  )}
                </div>
              )}

              <div>
                <label>Ubicación*</label>
                <select
                  value={regla.geoId}
                  onChange={(e) => updateRegla(index, { geoId: Number(e.target.value) || '' })}
                  disabled={loading || (!regla.nivelGeografico && !regla.departamentoId)}
                  style={{ width: '100%', padding: 8 }}
                >
                  <option value="">Selecciona ubicación</option>
                  {geoOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
                {errors[`reglas.${index}.geoId`] && (
                  <small style={{ color: 'red' }}>{errors[`reglas.${index}.geoId`]}</small>
                )}
              </div>

              <div>
                <label>Criterio*</label>
                <select
                  value={regla.criterio}
                  onChange={(e) => updateRegla(index, { criterio: e.target.value as CriterioZona })}
                  disabled={loading}
                  style={{ width: '100%', padding: 8 }}
                >
                  <option value="INCLUIR">INCLUIR</option>
                  <option value="EXCLUIR">EXCLUIR</option>
                </select>
                {errors[`reglas.${index}.criterio`] && (
                  <small style={{ color: 'red' }}>{errors[`reglas.${index}.criterio`]}</small>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <button type="submit" disabled={loading} style={{ marginTop: 12, padding: '8px 16px' }}>
        {loading ? '⏳ Creando zona...' : 'Crear zona'}
      </button>
    </form>
  );
};
