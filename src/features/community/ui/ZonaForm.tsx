import React, { useEffect, useState } from 'react';
import { LeadsRepository } from '@shared/api/repositories/leads.repository';
import type {
  DepartamentoResponse,
  DistritoResponse,
  ProvinciaResponse,
  ZonaRequest,
  ZonaResponse,
} from '@shared/types';

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
  editingZona?: ZonaResponse | null;
  onSaveZona: (payload: ZonaRequest, id?: number) => Promise<unknown>;
  onCreated?: () => void;
  onCancelEdit?: () => void;
}

export const ZonaForm: React.FC<ZonaFormProps> = ({ editingZona, onSaveZona, onCreated, onCancelEdit }) => {
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

  useEffect(() => {
    if (!editingZona) {
      setNombre('');
      setReglas([]);
      setErrors({});
      setGlobalMessage('');
      return;
    }

    setNombre(editingZona.nombre);
    setReglas(
      editingZona.reglas.map((regla) => ({
        nivelGeografico: regla.nivelGeografico as NivelGeografico,
        departamentoId: '',
        provinciaId: '',
        geoId: regla.geoId,
        criterio: regla.criterio as CriterioZona,
      })),
    );
    setErrors({});
    setGlobalMessage('');
  }, [editingZona]);

  const getAllProvincias = (): ProvinciaResponse[] => Object.values(provincias).flat();
  const getAllDistritos = (): DistritoResponse[] => Object.values(distritos).flat();

  const getProvinciaById = (id: number) => getAllProvincias().find((prov) => prov.id === id);
  const getDistritoById = (id: number) => getAllDistritos().find((dist) => dist.id === id);

  const loadAllProvincias = async (): Promise<void> => {
    await Promise.all(departamentos.map(async (dep) => loadProvincias(dep.id)));
  };

  const loadDistritoForRule = async (rule: ZonaReglaInput): Promise<ZonaReglaInput> => {
    if (rule.nivelGeografico !== 'DISTRITO') {
      return rule;
    }

    const district = getDistritoById(Number(rule.geoId));
    if (district) {
      return {
        ...rule,
        departamentoId: district.idDepartamento,
        provinciaId: district.idProvincia,
      };
    }

    const provinces = getAllProvincias();
    for (const province of provinces) {
      const loadedDistricts = await loadDistritos(province.id);
      const districtFromCache = loadedDistricts.find((dist) => dist.id === Number(rule.geoId));
      if (districtFromCache) {
        return {
          ...rule,
          departamentoId: districtFromCache.idDepartamento,
          provinciaId: districtFromCache.idProvincia,
        };
      }
    }

    return rule;
  };

  useEffect(() => {
    const resolveEditingRuleHierarchy = async () => {
      if (!editingZona || departamentos.length === 0) {
        return;
      }

      const needsProvinceLoad = editingZona.reglas.some((rule) => rule.nivelGeografico === 'PROVINCIA' || rule.nivelGeografico === 'DISTRITO');
      if (needsProvinceLoad) {
        await loadAllProvincias();
      }

      const updatedReglas = await Promise.all(
        editingZona.reglas.map(async (rule) => {
          const base: ZonaReglaInput = {
            nivelGeografico: rule.nivelGeografico as NivelGeografico,
            departamentoId: '',
            provinciaId: '',
            geoId: rule.geoId,
            criterio: rule.criterio as CriterioZona,
          };

          if (rule.nivelGeografico === 'PROVINCIA') {
            const province = getProvinciaById(rule.geoId);
            if (province) {
              return {
                ...base,
                departamentoId: province.idDepartamento,
              };
            }
          }

          if (rule.nivelGeografico === 'DISTRITO') {
            return loadDistritoForRule(base);
          }

          return base;
        }),
      );

      setReglas(updatedReglas);
    };

    void resolveEditingRuleHierarchy();
  }, [editingZona, departamentos]);

  const loadProvincias = async (depId: number): Promise<ProvinciaResponse[]> => {
    if (provincias[depId]) {
      return provincias[depId];
    }

    try {
      const data = await LeadsRepository.getProvinciasPorDepartamento(depId);
      setProvincias((prev) => ({ ...prev, [depId]: data }));
      return data;
    } catch (err) {
      console.error('[ZonaForm] Error loading provincias', err);
      setProvincias((prev) => ({ ...prev, [depId]: [] }));
      return [];
    }
  };

  const loadDistritos = async (provId: number): Promise<DistritoResponse[]> => {
    if (distritos[provId]) {
      return distritos[provId];
    }

    try {
      const data = await LeadsRepository.getDistritosPorProvincia(provId);
      setDistritos((prev) => ({ ...prev, [provId]: data }));
      return data;
    } catch (err) {
      console.error('[ZonaForm] Error loading distritos', err);
      setDistritos((prev) => ({ ...prev, [provId]: [] }));
      return [];
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

    const payload: ZonaRequest = {
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
      await onSaveZona(payload, editingZona?.id);
      setGlobalMessage(editingZona ? '✅ Zona actualizada exitosamente' : '✅ Zona creada exitosamente');
      setNombre('');
      setReglas([]);
      if (onCreated) {
        await onCreated();
      }
      if (editingZona && onCancelEdit) {
        onCancelEdit();
      }
    } catch (err: any) {
      console.error('[ZonaForm] saveZona error', err);
      if (err?.message?.includes('401')) {
        setGlobalMessage('🔐 Token inválido o expirado');
      } else if (err?.message?.includes('400')) {
        setGlobalMessage('⚠️ Error de validación en servidor');
      } else {
        setGlobalMessage(editingZona ? '💥 Error al actualizar zona' : '💥 Error al crear zona');
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
    <form onSubmit={handleSubmit} className="community-form">
      <h3>{editingZona ? 'Editar Zona' : 'Crear Zona'}</h3>
      {globalMessage && (
        <div className={`${globalMessage.startsWith('✅') ? 'community-alert' : 'community-error'} community-message`}>
          {globalMessage}
        </div>
      )}

      <div className="community-field">
        <label>Nombre*</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          disabled={loading}
        />
        {errors.nombre && <small>{errors.nombre}</small>}
      </div>

      <div>
        <button type="button" className="community-btn ghost" onClick={addRegla} disabled={loading}>
          + Agregar regla
        </button>
        {errors.reglas && <div className="community-error-text community-block-top-sm">{errors.reglas}</div>}
      </div>

      {reglas.map((regla, index) => {
        const geoOptions = generateGeoOptions(regla);
        return (
          <div key={index} className="community-subcard community-subcard-stack">
            <div className="community-subcard-head">
              <strong className="community-subcard-title">Regla #{index + 1}</strong>
              <button type="button" className="community-btn ghost danger" onClick={() => removeRegla(index)} disabled={loading}>
                Eliminar norma
              </button>
            </div>

            <div className="community-grid-3 community-block-top-sm">
              <div className="community-field">
                <label>Nivel geográfico*</label>
                <select
                  value={regla.nivelGeografico}
                  onChange={(e) => {
                    const nivel = e.target.value as NivelGeografico;
                    updateRegla(index, { nivelGeografico: nivel, departamentoId: '', provinciaId: '', geoId: '' });
                  }}
                  disabled={loading}
                >
                  <option value="DEPARTAMENTO">DEPARTAMENTO</option>
                  <option value="PROVINCIA">PROVINCIA</option>
                  <option value="DISTRITO">DISTRITO</option>
                </select>
                {errors[`reglas.${index}.nivelGeografico`] && (
                  <small>{errors[`reglas.${index}.nivelGeografico`]}</small>
                )}
              </div>

              {regla.nivelGeografico !== 'DEPARTAMENTO' && (
                <div className="community-field">
                  <label>Departamento*</label>
                  <select
                    value={regla.departamentoId}
                    onChange={async (e) => {
                      const val = Number(e.target.value) || '';
                      updateRegla(index, { departamentoId: val, provinciaId: '', geoId: '' });
                      if (val) await loadProvincias(Number(val));
                    }}
                    disabled={loading}
                  >
                    <option value="">Selecciona departamento</option>
                    {departamentos.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nombre}
                      </option>
                    ))}
                  </select>
                  {errors[`reglas.${index}.departamentoId`] && (
                    <small>{errors[`reglas.${index}.departamentoId`]}</small>
                  )}
                </div>
              )}

              {regla.nivelGeografico === 'DISTRITO' && (
                <div className="community-field">
                  <label>Provincia*</label>
                  <select
                    value={regla.provinciaId}
                    onChange={async (e) => {
                      const val = Number(e.target.value) || '';
                      updateRegla(index, { provinciaId: val, geoId: '' });
                      if (val) await loadDistritos(Number(val));
                    }}
                    disabled={loading || !regla.departamentoId}
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
                    <small>{errors[`reglas.${index}.provinciaId`]}</small>
                  )}
                </div>
              )}

              <div className="community-field">
                <label>Ubicación*</label>
                <select
                  value={regla.geoId}
                  onChange={(e) => updateRegla(index, { geoId: Number(e.target.value) || '' })}
                  disabled={loading || (!regla.nivelGeografico && !regla.departamentoId)}
                >
                  <option value="">Selecciona ubicación</option>
                  {geoOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
                {errors[`reglas.${index}.geoId`] && (
                  <small>{errors[`reglas.${index}.geoId`]}</small>
                )}
              </div>

              <div className="community-field">
                <label>Criterio*</label>
                <select
                  value={regla.criterio}
                  onChange={(e) => updateRegla(index, { criterio: e.target.value as CriterioZona })}
                  disabled={loading}
                >
                  <option value="INCLUIR">INCLUIR</option>
                  <option value="EXCLUIR">EXCLUIR</option>
                </select>
                {errors[`reglas.${index}.criterio`] && (
                  <small>{errors[`reglas.${index}.criterio`]}</small>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div className="community-actions">
        <button type="submit" className="community-btn primary" disabled={loading}>
          {loading ? (editingZona ? '⏳ Actualizando zona...' : '⏳ Creando zona...') : editingZona ? 'Actualizar zona' : 'Crear zona'}
        </button>
        {editingZona && onCancelEdit && (
          <button type="button" className="community-btn ghost" onClick={onCancelEdit} disabled={loading}>
            Cancelar edición
          </button>
        )}
      </div>
    </form>
  );
};
