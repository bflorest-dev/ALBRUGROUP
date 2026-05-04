import React, { useEffect, useMemo, useState } from 'react';
import { Button, Modal } from '@shared/ui';
import { DsDataTable, DsInlineMessage, type DsDataTableColumn } from '@shared/ui/design-system';
import {
  getEmpleados,
  getEventosEmpleado,
  getPersonalRecruitment,
  patchEmpleadoDatosContactoUbicacion,
  patchEmpleadoDatosCorporativos,
  patchEmpleadoDatosFinancieros,
  patchEmpleadoDatosPersonales,
  patchEmpleadoListaNegra,
  searchEmpleadosUniversal,
  type RrhhEmpleado,
} from '@features/hr/api/rrhhExtendedApi';
import styles from './EmpleadosSection.module.css';

type EmpleadoEditable = Partial<RrhhEmpleado> & {
  tipoDocumento?: string;
  nacionalidad?: string;
  fechaNacimiento?: string;
  estadoCivil?: string;
  tieneHijos?: boolean;
  celularPersonal?: string;
  correoPersonal?: string;
  distrito?: string;
  direccion?: string;
  banco?: string;
  cuentaBancaria?: string;
  cuentaInterbancaria?: string;
  cuentaPropia?: boolean;
  parentesco?: string;
  celularTransferencia?: string;
  idEmpresaContratista?: number;
  celularCorporativo?: string;
  correoCorporativo?: string;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return fallback;
};

export const EmpleadosSection: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [search, setSearch] = useState('');
  const [empleados, setEmpleados] = useState<RrhhEmpleado[]>([]);
  const [selected, setSelected] = useState<EmpleadoEditable | null>(null);
  const [selectedOriginal, setSelectedOriginal] = useState<EmpleadoEditable | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [eventosOpen, setEventosOpen] = useState(false);
  const [eventos, setEventos] = useState<Array<Record<string, unknown>>>([]);

  const [blacklist, setBlacklist] = useState(false);
  const [blacklistObs, setBlacklistObs] = useState('');

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      setEmpleados(await getEmpleados());
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No se pudieron cargar empleados.'));
    } finally {
      setLoading(false);
    }
  };

  const loadPersonalRecruitment = async () => {
    setLoading(true);
    setError('');
    try {
      setEmpleados(await getPersonalRecruitment());
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No se pudo cargar personal recruitment.'));
    } finally {
      setLoading(false);
    }
  };

  const loadUniversal = async () => {
    if (!search.trim()) return;
    setLoading(true);
    setError('');
    try {
      setEmpleados(await searchEmpleadosUniversal(search.trim()));
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Error en búsqueda universal.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll().catch(() => undefined);
  }, []);

  const selectedId = Number(selected?.id ?? 0);

  const saveAllChanges = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError('');
    try {
      await patchEmpleadoDatosPersonales(selectedId, {
        nombres: selected?.nombres,
        apellidos: selected?.apellidos,
        tipoDocumento: String(selected?.tipoDocumento ?? 'DNI'),
        numeroDocumento: selected?.numeroDocumento,
        nacionalidad: String(selected?.nacionalidad ?? 'PERUANO'),
        fechaNacimiento: String(selected?.fechaNacimiento ?? ''),
        estadoCivil: String(selected?.estadoCivil ?? 'SOLTERO'),
        tieneHijos: Boolean(selected?.tieneHijos),
      });
      await patchEmpleadoDatosContactoUbicacion(selectedId, {
        celularPersonal: selected?.celularPersonal,
        correoPersonal: selected?.correoPersonal,
        distrito: selected?.distrito,
        direccion: selected?.direccion,
      });
      await patchEmpleadoDatosFinancieros(selectedId, {
        banco: String(selected?.banco ?? 'BCP'),
        cuentaBancaria: selected?.cuentaBancaria,
        cuentaInterbancaria: selected?.cuentaInterbancaria,
        cuentaPropia: Boolean(selected?.cuentaPropia),
        parentesco: String(selected?.parentesco ?? 'OTRO'),
        celularTransferencia: String(selected?.celularTransferencia ?? ''),
        idEmpresaContratista: Number(selected?.idEmpresaContratista ?? 0),
      });
      await patchEmpleadoDatosCorporativos(selectedId, {
        celularCorporativo: String(selected?.celularCorporativo ?? ''),
        correoCorporativo: String(selected?.correoCorporativo ?? ''),
      });
      setError('Cambios guardados correctamente.');
      setIsEditing(false);
      await loadAll();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No se pudieron guardar los cambios.'));
    } finally {
      setLoading(false);
    }
  };

  const saveListaNegra = async () => {
    if (!selectedId) return;
    try {
      await patchEmpleadoListaNegra(selectedId, {
        listaNegra: blacklist,
        observacion: blacklistObs || undefined,
      });
      setError('Estado de lista negra actualizado.');
      await loadAll();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No se pudo actualizar lista negra.'));
    }
  };

  const openEventos = async () => {
    if (!selectedId) return;
    const data = await getEventosEmpleado(selectedId).catch(() => []);
    setEventos(data);
    setEventosOpen(true);
  };

  const selectedNombre = useMemo(() => {
    if (!selected) return 'Sin selección';
    return `${String(selected.nombres ?? '')} ${String(selected.apellidos ?? '')}`.trim() || `Empleado #${selected.id}`;
  }, [selected]);

  const empleadoColumns = useMemo<DsDataTableColumn<RrhhEmpleado>[]>(
    () => [
      {
        key: 'id',
        label: 'ID',
        render: (emp) => Number(emp.id),
      },
      {
        key: 'nombres',
        label: 'Nombre',
        render: (emp) => `${String(emp.nombres ?? '')} ${String(emp.apellidos ?? '')}`,
      },
      {
        key: 'numeroDocumento',
        label: 'Documento',
        render: (emp) => String(emp.numeroDocumento ?? '-'),
      },
      {
        key: 'puesto',
        label: 'Puesto',
        render: (emp) => String(emp.puesto ?? '-'),
      },
    ],
    []
  );

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>Empleados</h2>
        <div className={styles.headerActions}>
          <Button size="sm" variant="ghost" onClick={() => loadAll()}>Todos</Button>
          <Button size="sm" variant="ghost" onClick={() => loadPersonalRecruitment()}>Personal Recruitment</Button>
        </div>
      </div>

      {error && (
        <DsInlineMessage tone="warning">
          {error}
        </DsInlineMessage>
      )}

      <div className={styles.searchRow}>
        <input
          className={styles.control}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar universal por dato"
        />
        <Button variant="secondary" onClick={loadUniversal} disabled={loading}>Buscar Universal</Button>
      </div>

      <div className={styles.gridSplit}>
        <div className={styles.dataTablePane}>
          <DsDataTable
            rows={empleados}
            columns={empleadoColumns}
            loading={loading}
            emptyMessage="No hay empleados para mostrar"
            onRowClick={(emp) => {
              setSelected(emp);
              setSelectedOriginal(emp);
              setIsEditing(false);
            }}
            rowKey={(emp) => Number(emp.id)}
            rowClassName={(emp) => (selected?.id === emp.id ? styles.dataTableRowActive : undefined)}
          />
        </div>

        <div className={styles.editorCard}>
          <h3 className={styles.editorTitle}>Edicion de {selectedNombre}</h3>
          {!selected && <p className={styles.emptyText}>Selecciona un empleado para editar.</p>}
          {selected && (
            <div className={styles.formStack}>
              <div className={styles.actionRow}>
                {!isEditing ? (
                  <Button size="sm" onClick={() => setIsEditing(true)}>Editar</Button>
                ) : (
                  <>
                    <Button size="sm" onClick={saveAllChanges} disabled={loading}>Guardar cambios</Button>
                    <Button size="sm" variant="secondary" onClick={() => {
                      setSelected(selectedOriginal);
                      setIsEditing(false);
                    }} disabled={loading}>Cancelar</Button>
                  </>
                )}
              </div>

              <input
                className={styles.control}
                value={String(selected.nombres ?? '')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), nombres: e.target.value }))}
                placeholder="Nombres"
              />
              <input
                className={styles.control}
                value={String(selected.apellidos ?? '')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), apellidos: e.target.value }))}
                placeholder="Apellidos"
              />
              <select
                className={styles.control}
                value={String(selected.tipoDocumento ?? 'DNI')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), tipoDocumento: e.target.value }))}
              >
                <option value="DNI">DNI</option>
                <option value="CE">CE</option>
              </select>
              <input
                className={styles.control}
                value={String(selected.numeroDocumento ?? '')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), numeroDocumento: e.target.value }))}
                placeholder="Documento"
              />
              <select
                className={styles.control}
                value={String(selected.nacionalidad ?? 'PERUANO')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), nacionalidad: e.target.value }))}
              >
                <option value="PERUANO">PERUANO</option>
                <option value="EXTRANJERO">EXTRANJERO</option>
              </select>
              <input
                type="date"
                className={styles.control}
                value={String(selected.fechaNacimiento ?? '')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), fechaNacimiento: e.target.value }))}
                placeholder="Fecha Nacimiento"
              />
              <select
                className={styles.control}
                value={String(selected.estadoCivil ?? 'SOLTERO')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), estadoCivil: e.target.value }))}
              >
                <option value="SOLTERO">SOLTERO</option>
                <option value="CASADO">CASADO</option>
                <option value="VIUDO">VIUDO</option>
                <option value="DIVORCIADO">DIVORCIADO</option>
              </select>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={Boolean(selected.tieneHijos)}
                  disabled={!isEditing}
                  onChange={(e) => setSelected((p) => ({ ...(p ?? {}), tieneHijos: e.target.checked }))}
                />
                Tiene Hijos
              </label>
              <input
                className={styles.control}
                value={String(selected.celularPersonal ?? '')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), celularPersonal: e.target.value }))}
                placeholder="Celular Personal"
              />
              <input
                className={styles.control}
                value={String(selected.correoPersonal ?? '')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), correoPersonal: e.target.value }))}
                placeholder="Correo Personal"
              />
              <select
                className={styles.control}
                value={String(selected.distrito ?? '')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), distrito: e.target.value }))}
              >
                <option value="">Seleccione Distrito</option>
                <option value="ANCON">ANCON</option>
                <option value="ATE">ATE</option>
                <option value="BARRANCO">BARRANCO</option>
                <option value="BELLAVISTA">BELLAVISTA</option>
                <option value="BREÑA">BREÑA</option>
                <option value="CALLAO">CALLAO</option>
                <option value="CARABAYLLO">CARABAYLLO</option>
                <option value="CARMEN_DE_LA_LEGUA">CARMEN_DE_LA_LEGUA</option>
                <option value="CERCADO_DE_LIMA">CERCADO_DE_LIMA</option>
                <option value="CHACLACAYO">CHACLACAYO</option>
                <option value="CHORRILLOS">CHORRILLOS</option>
                <option value="CIENEGUILLA">CIENEGUILLA</option>
                <option value="COMAS">COMAS</option>
                <option value="EL_AGUSTINO">EL_AGUSTINO</option>
                <option value="INDEPENDENCIA">INDEPENDENCIA</option>
                <option value="JESUS_MARIA">JESUS_MARIA</option>
                <option value="LA_MOLINA">LA_MOLINA</option>
                <option value="LA_PUNTA">LA_PUNTA</option>
                <option value="LA_PERLA">LA_PERLA</option>
                <option value="LA_VICTORIA">LA_VICTORIA</option>
                <option value="LINCE">LINCE</option>
                <option value="LOS_OLIVOS">LOS_OLIVOS</option>
                <option value="LURIN">LURIN</option>
                <option value="LURIGANCHO">LURIGANCHO</option>
                <option value="MAGDALENA_DEL_MAR">MAGDALENA_DEL_MAR</option>
                <option value="MIRAFLORES">MIRAFLORES</option>
                <option value="MI_PERU">MI_PERU</option>
                <option value="PACHACAMAC">PACHACAMAC</option>
                <option value="PUCUSANA">PUCUSANA</option>
                <option value="PUEBLO_LIBRE">PUEBLO_LIBRE</option>
                <option value="PUENTE_PIEDRA">PUENTE_PIEDRA</option>
                <option value="PUNTA_HERMOSA">PUNTA_HERMOSA</option>
                <option value="PUNTA_NEGRA">PUNTA_NEGRA</option>
                <option value="RIMAC">RIMAC</option>
                <option value="SAN_BARTOLO">SAN_BARTOLO</option>
                <option value="SAN_BORJA">SAN_BORJA</option>
                <option value="SAN_ISIDRO">SAN_ISIDRO</option>
                <option value="SAN_JUAN_DE_LURIGANCHO">SAN_JUAN_DE_LURIGANCHO</option>
                <option value="SAN_JUAN_DE_MIRAFLORES">SAN_JUAN_DE_MIRAFLORES</option>
                <option value="SAN_LUIS">SAN_LUIS</option>
                <option value="SAN_MARTIN_DE_PORRES">SAN_MARTIN_DE_PORRES</option>
                <option value="SAN_MIGUEL">SAN_MIGUEL</option>
                <option value="SANTA_ANITA">SANTA_ANITA</option>
                <option value="SANTA_MARIA_DEL_MAR">SANTA_MARIA_DEL_MAR</option>
                <option value="SANTA_ROSA">SANTA_ROSA</option>
                <option value="SANTIAGO_DE_SURCO">SANTIAGO_DE_SURCO</option>
                <option value="SURQUILLO">SURQUILLO</option>
                <option value="VENTANILLA">VENTANILLA</option>
                <option value="VILLA_EL_SALVADOR">VILLA_EL_SALVADOR</option>
                <option value="VILLA_MARIA_DEL_TRIUNFO">VILLA_MARIA_DEL_TRIUNFO</option>
              </select>
              <input
                className={styles.control}
                value={String(selected.direccion ?? '')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), direccion: e.target.value }))}
                placeholder="Dirección"
              />

              <input
                className={styles.control}
                value={String(selected.banco ?? 'BCP')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), banco: e.target.value }))}
                placeholder="Banco"
              />
              <input
                className={styles.control}
                value={String(selected.cuentaBancaria ?? '')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), cuentaBancaria: e.target.value }))}
                placeholder="Cuenta Bancaria"
              />
              <input
                className={styles.control}
                value={String(selected.cuentaInterbancaria ?? '')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), cuentaInterbancaria: e.target.value }))}
                placeholder="Cuenta Interbancaria"
              />
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={Boolean(selected.cuentaPropia)}
                  disabled={!isEditing}
                  onChange={(e) => setSelected((p) => ({ ...(p ?? {}), cuentaPropia: e.target.checked }))}
                />
                Cuenta Propia
              </label>
              <select
                className={styles.control}
                value={String(selected.parentesco ?? 'OTRO')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), parentesco: e.target.value }))}
              >
                <option value="PADRE">PADRE</option>
                <option value="MADRE">MADRE</option>
                <option value="TIO">TIO</option>
                <option value="ESPOSO">ESPOSO</option>
                <option value="HERMANO">HERMANO</option>
                <option value="ABUELO">ABUELO</option>
                <option value="PAREJA">PAREJA</option>
                <option value="OTRO">OTRO</option>
              </select>
              <input
                className={styles.control}
                value={String(selected.celularTransferencia ?? '')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), celularTransferencia: e.target.value }))}
                placeholder="Celular Transferencia"
              />

              <div className={styles.blacklistBox}>
                <label className={styles.checkboxRow}>
                  <input type="checkbox" checked={blacklist} disabled={!isEditing} onChange={(e) => setBlacklist(e.target.checked)} />
                  Lista Negra
                </label>
                <input
                  className={styles.control}
                  value={blacklistObs}
                  disabled={!isEditing}
                  onChange={(e) => setBlacklistObs(e.target.value)}
                  placeholder="Observación"
                />
                <div className={styles.actionRow}>
                  <Button size="sm" variant="danger" onClick={saveListaNegra}>Actualizar Lista Negra</Button>
                  <Button size="sm" variant="ghost" onClick={openEventos}>Eventos Empleado</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={eventosOpen} onClose={() => setEventosOpen(false)} title="Eventos del Empleado" size="lg">
        <div className={styles.modalJsonWrap}>
          <pre className={styles.modalJsonPre}>{JSON.stringify(eventos, null, 2)}</pre>
        </div>
      </Modal>
    </div>
  );
};

