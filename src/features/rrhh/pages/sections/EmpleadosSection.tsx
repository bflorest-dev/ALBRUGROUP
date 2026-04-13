import React, { useEffect, useMemo, useState } from 'react';
import { Button, Modal } from '@shared/ui';
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
} from '../rrhhExtendedApi';

export const EmpleadosSection: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [search, setSearch] = useState('');
  const [empleados, setEmpleados] = useState<RrhhEmpleado[]>([]);
  const [selected, setSelected] = useState<RrhhEmpleado | null>(null);
  const [selectedOriginal, setSelectedOriginal] = useState<RrhhEmpleado | null>(null);
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
    } catch (err: any) {
      setError(err?.message ?? 'No se pudieron cargar empleados.');
    } finally {
      setLoading(false);
    }
  };

  const loadPersonalRecruitment = async () => {
    setLoading(true);
    setError('');
    try {
      setEmpleados(await getPersonalRecruitment());
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo cargar personal recruitment.');
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
    } catch (err: any) {
      setError(err?.message ?? 'Error en búsqueda universal.');
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
        tipoDocumento: String((selected as any)?.tipoDocumento ?? 'DNI'),
        numeroDocumento: selected?.numeroDocumento,
        nacionalidad: String((selected as any)?.nacionalidad ?? 'PERUANO'),
        fechaNacimiento: String((selected as any)?.fechaNacimiento ?? ''),
        estadoCivil: String((selected as any)?.estadoCivil ?? 'SOLTERO'),
        tieneHijos: Boolean((selected as any)?.tieneHijos),
      });
      await patchEmpleadoDatosContactoUbicacion(selectedId, {
        celularPersonal: (selected as any)?.celularPersonal,
        correoPersonal: (selected as any)?.correoPersonal,
        distrito: (selected as any)?.distrito,
        direccion: (selected as any)?.direccion,
      });
      await patchEmpleadoDatosFinancieros(selectedId, {
        banco: String((selected as any)?.banco ?? 'BCP'),
        cuentaBancaria: (selected as any)?.cuentaBancaria,
        cuentaInterbancaria: (selected as any)?.cuentaInterbancaria,
        cuentaPropia: Boolean((selected as any)?.cuentaPropia),
        parentesco: String((selected as any)?.parentesco ?? 'OTRO'),
        celularTransferencia: String((selected as any)?.celularTransferencia ?? ''),
        idEmpresaContratista: Number((selected as any)?.idEmpresaContratista ?? 0),
      });
      await patchEmpleadoDatosCorporativos(selectedId, {
        celularCorporativo: String((selected as any)?.celularCorporativo ?? ''),
        correoCorporativo: String((selected as any)?.correoCorporativo ?? ''),
      });
      setError('Cambios guardados correctamente.');
      setIsEditing(false);
      await loadAll();
    } catch (err: any) {
      setError(err?.message ?? 'No se pudieron guardar los cambios.');
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
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo actualizar lista negra.');
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Empleados</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => loadAll()}>Todos</Button>
          <Button size="sm" variant="ghost" onClick={() => loadPersonalRecruitment()}>Personal Recruitment</Button>
        </div>
      </div>

      {error && <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">{error}</div>}

      <div className="flex gap-2">
        <input
          className="w-full rounded border border-slate-300 px-3 py-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar universal por dato"
        />
        <Button variant="secondary" onClick={loadUniversal} disabled={loading}>Buscar Universal</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">Documento</th>
                <th className="px-3 py-2 text-left">Puesto</th>
              </tr>
            </thead>
            <tbody>
              {empleados.map((emp) => (
                <tr
                  key={Number(emp.id)}
                  className={`cursor-pointer border-t border-slate-100 ${selected?.id === emp.id ? 'bg-blue-50' : ''}`}
                  onClick={() => {
                    setSelected(emp);
                    setSelectedOriginal(emp);
                    setIsEditing(false);
                  }}
                >
                  <td className="px-3 py-2">{Number(emp.id)}</td>
                  <td className="px-3 py-2">{String(emp.nombres ?? '')} {String(emp.apellidos ?? '')}</td>
                  <td className="px-3 py-2">{String(emp.numeroDocumento ?? '-')}</td>
                  <td className="px-3 py-2">{String(emp.puesto ?? '-')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">Edición de {selectedNombre}</h3>
          {!selected && <p className="text-sm text-slate-500">Selecciona un empleado para editar.</p>}
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
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
                className="w-full rounded border px-3 py-2"
                value={String(selected.nombres ?? '')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), nombres: e.target.value }))}
                placeholder="Nombres"
              />
              <input
                className="w-full rounded border px-3 py-2"
                value={String(selected.apellidos ?? '')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), apellidos: e.target.value }))}
                placeholder="Apellidos"
              />
              <select
                className="w-full rounded border px-3 py-2"
                value={String((selected as any).tipoDocumento ?? 'DNI')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), tipoDocumento: e.target.value }))}
              >
                <option value="DNI">DNI</option>
                <option value="CE">CE</option>
              </select>
              <input
                className="w-full rounded border px-3 py-2"
                value={String(selected.numeroDocumento ?? '')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), numeroDocumento: e.target.value }))}
                placeholder="Documento"
              />
              <select
                className="w-full rounded border px-3 py-2"
                value={String((selected as any).nacionalidad ?? 'PERUANO')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), nacionalidad: e.target.value }))}
              >
                <option value="PERUANO">PERUANO</option>
                <option value="EXTRANJERO">EXTRANJERO</option>
              </select>
              <input
                type="date"
                className="w-full rounded border px-3 py-2"
                value={String((selected as any).fechaNacimiento ?? '')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), fechaNacimiento: e.target.value }))}
                placeholder="Fecha Nacimiento"
              />
              <select
                className="w-full rounded border px-3 py-2"
                value={String((selected as any).estadoCivil ?? 'SOLTERO')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), estadoCivil: e.target.value }))}
              >
                <option value="SOLTERO">SOLTERO</option>
                <option value="CASADO">CASADO</option>
                <option value="VIUDO">VIUDO</option>
                <option value="DIVORCIADO">DIVORCIADO</option>
              </select>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean((selected as any).tieneHijos)}
                  disabled={!isEditing}
                  onChange={(e) => setSelected((p) => ({ ...(p ?? {}), tieneHijos: e.target.checked }))}
                />
                Tiene Hijos
              </label>
              <input
                className="w-full rounded border px-3 py-2"
                value={String((selected as any).celularPersonal ?? '')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), celularPersonal: e.target.value }))}
                placeholder="Celular Personal"
              />
              <input
                className="w-full rounded border px-3 py-2"
                value={String((selected as any).correoPersonal ?? '')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), correoPersonal: e.target.value }))}
                placeholder="Correo Personal"
              />
              <select
                className="w-full rounded border px-3 py-2"
                value={String((selected as any).distrito ?? '')}
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
                className="w-full rounded border px-3 py-2"
                value={String((selected as any).direccion ?? '')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), direccion: e.target.value }))}
                placeholder="Dirección"
              />

              <input
                className="w-full rounded border px-3 py-2"
                value={String((selected as any).banco ?? 'BCP')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), banco: e.target.value }))}
                placeholder="Banco"
              />
              <input
                className="w-full rounded border px-3 py-2"
                value={String((selected as any).cuentaBancaria ?? '')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), cuentaBancaria: e.target.value }))}
                placeholder="Cuenta Bancaria"
              />
              <input
                className="w-full rounded border px-3 py-2"
                value={String((selected as any).cuentaInterbancaria ?? '')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), cuentaInterbancaria: e.target.value }))}
                placeholder="Cuenta Interbancaria"
              />
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean((selected as any).cuentaPropia)}
                  disabled={!isEditing}
                  onChange={(e) => setSelected((p) => ({ ...(p ?? {}), cuentaPropia: e.target.checked }))}
                />
                Cuenta Propia
              </label>
              <select
                className="w-full rounded border px-3 py-2"
                value={String((selected as any).parentesco ?? 'OTRO')}
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
                className="w-full rounded border px-3 py-2"
                value={String((selected as any).celularTransferencia ?? '')}
                disabled={!isEditing}
                onChange={(e) => setSelected((p) => ({ ...(p ?? {}), celularTransferencia: e.target.value }))}
                placeholder="Celular Transferencia"
              />

              <div className="rounded border p-2">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={blacklist} disabled={!isEditing} onChange={(e) => setBlacklist(e.target.checked)} />
                  Lista Negra
                </label>
                <input
                  className="mt-2 w-full rounded border px-3 py-2"
                  value={blacklistObs}
                  disabled={!isEditing}
                  onChange={(e) => setBlacklistObs(e.target.value)}
                  placeholder="Observación"
                />
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="danger" onClick={saveListaNegra}>Actualizar Lista Negra</Button>
                  <Button size="sm" variant="ghost" onClick={openEventos}>Eventos Empleado</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={eventosOpen} onClose={() => setEventosOpen(false)} title="Eventos del Empleado" size="lg">
        <div className="max-h-[60vh] overflow-auto rounded border border-slate-200">
          <pre className="whitespace-pre-wrap p-3 text-xs text-slate-700">{JSON.stringify(eventos, null, 2)}</pre>
        </div>
      </Modal>
    </div>
  );
};
