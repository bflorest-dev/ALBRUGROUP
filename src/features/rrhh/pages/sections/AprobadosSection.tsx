import React, { useEffect, useMemo, useState } from 'react';
import { History, UserPlus } from 'lucide-react';
import { Modal, Button } from '@shared/ui';
import {
  createEmpleado,
  getBandejaContratacion,
  getEmpleadoByDocumento,
  getEmpresasContratistas,
  getPostulacionEventos,
  registrarContrato,
  type RrhhEmpresaContratista,
  type RrhhEventoPostulacion,
  type RrhhPostulacion,
} from '../rrhhExtendedApi';

type PostulacionAprobada = RrhhPostulacion & {
  ultimaTipificacion: string;
  etapaMostrada: string;
  estadoMostrado: string;
};

const getToday = () => new Date().toISOString().split('T')[0] ?? '';

const normalizeToInputDate = (value: unknown): string => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().split('T')[0] ?? '';
};

const getPostulanteFechaNacimiento = (row: RrhhPostulacion): string => {
  const rawRow = row as any;
  const rawPostulante = rawRow?.postulante ?? {};
  return normalizeToInputDate(
    rawPostulante.fechaNacimiento ??
      rawPostulante.fecha_nacimiento ??
      rawRow.fechaNacimiento ??
      rawRow.fecha_nacimiento ??
      ''
  );
};

const DISTRITOS = [
  'ANCON', 'ATE', 'BARRANCO', 'BELLAVISTA', 'BREÑA', 'CALLAO', 'CARABAYLLO', 'CARMEN_DE_LA_LEGUA',
  'CERCADO_DE_LIMA', 'CHACLACAYO', 'CHORRILLOS', 'CIENEGUILLA', 'COMAS', 'EL_AGUSTINO', 'INDEPENDENCIA',
  'JESUS_MARIA', 'LA_MOLINA', 'LA_PUNTA', 'LA_PERLA', 'LA_VICTORIA', 'LINCE', 'LOS_OLIVOS', 'LURIN',
  'LURIGANCHO', 'MAGDALENA_DEL_MAR', 'MIRAFLORES', 'MI_PERU', 'PACHACAMAC', 'PUCUSANA', 'PUEBLO_LIBRE',
  'PUENTE_PIEDRA', 'PUNTA_HERMOSA', 'PUNTA_NEGRA', 'RIMAC', 'SAN_BARTOLO', 'SAN_BORJA', 'SAN_ISIDRO',
  'SAN_JUAN_DE_LURIGANCHO', 'SAN_JUAN_DE_MIRAFLORES', 'SAN_LUIS', 'SAN_MARTIN_DE_PORRES', 'SAN_MIGUEL',
  'SANTA_ANITA', 'SANTA_MARIA_DEL_MAR', 'SANTA_ROSA', 'SANTIAGO_DE_SURCO', 'SURQUILLO', 'VENTANILLA',
  'VILLA_EL_SALVADOR', 'VILLA_MARIA_DEL_TRIUNFO',
];

const resolveUltimaTipificacion = (eventos: RrhhEventoPostulacion[]): string => {
  const ultimo = [...eventos]
    .filter((e) => e.tipificacion || e.codigoTipificacion)
    .sort((a, b) => new Date(b.createdAt ?? b.fecha ?? 0).getTime() - new Date(a.createdAt ?? a.fecha ?? 0).getTime())[0];
  return ultimo?.tipificacion ?? ultimo?.codigoTipificacion ?? 'SIN_TIPIFICACION';
};

const resolveEtapa = (item: RrhhPostulacion, eventos: RrhhEventoPostulacion[]): string => {
  const row = item as any;
  const fromRow = item.etapaProceso ?? row.etapa ?? row.etapa_proceso;
  if (fromRow) return String(fromRow);

  const fromEvent = [...eventos]
    .filter((e) => e.etapa)
    .sort((a, b) => new Date(b.createdAt ?? b.fecha ?? 0).getTime() - new Date(a.createdAt ?? a.fecha ?? 0).getTime())[0]
    ?.etapa;

  return fromEvent ? String(fromEvent) : 'N/A';
};

const resolveEstado = (item: RrhhPostulacion): string => {
  const row = item as any;
  return String(
    item.estadoProceso ??
      row.estado ??
      row.estadoBandeja ??
      row.estado_bandeja ??
      'N/A'
  );
};

export const AprobadosSection: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [rows, setRows] = useState<PostulacionAprobada[]>([]);

  const [historialOpen, setHistorialOpen] = useState(false);
  const [eventos, setEventos] = useState<RrhhEventoPostulacion[]>([]);

  const [empleadoOpen, setEmpleadoOpen] = useState(false);
  const [empleadoPostulacion, setEmpleadoPostulacion] = useState<PostulacionAprobada | null>(null);
  const [empresasContratistasActivas, setEmpresasContratistasActivas] = useState<RrhhEmpresaContratista[]>([]);
  const [empleadoForm, setEmpleadoForm] = useState<Record<string, unknown>>({
    nombres: '',
    apellidos: '',
    tipoDocumento: 'DNI',
    numeroDocumento: '',
    nacionalidad: 'PERUANO',
    fechaNacimiento: '',
    estadoCivil: 'SOLTERO',
    tieneHijos: false,
    celularPersonal: '',
    correoPersonal: '',
    origen: 'INDEED',
    distrito: '',
    direccion: '',
    banco: 'BCP',
    cuentaBancaria: '',
    cuentaInterbancaria: '',
    cuentaPropia: true,
    parentesco: 'OTRO',
    celularTransferencia: '',
    idEmpresaContratista: 1,
  });
  const [contratoForm, setContratoForm] = useState<Record<string, unknown>>({
    idPostulacion: 0,
    puestoTrabajo: 'ASESOR_VENTAS',
    regimen: 'PLANILLA',
    modalidad: 'FULL_TIME',
    seguroSalud: 'ESSALUD',
    sistemaPensiones: 'ONP',
    sueldoBase: 1200,
    fechaInicio: getToday(),
    fechaFin: '',
  });

  const loadData = async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await getBandejaContratacion();
      const enriched = await Promise.all(
        data.map(async (item) => {
          const eventosData = await getPostulacionEventos(Number(item.id)).catch(() => []);
          return {
            ...item,
            ultimaTipificacion: resolveUltimaTipificacion(eventosData),
            etapaMostrada: resolveEtapa(item, eventosData),
            estadoMostrado: resolveEstado(item),
          } as PostulacionAprobada;
        })
      );
      setRows(enriched);
    } catch (err: any) {
      setMessage(err?.message ?? 'No se pudo cargar la bandeja de aprobados.');
    } finally {
      setLoading(false);
    }
  };

  const loadEmpresasContratistas = async () => {
    try {
      const empresas = await getEmpresasContratistas();
      const activas = empresas.filter((empresa) => empresa.activo);
      setEmpresasContratistasActivas(activas);
      if (activas.length > 0) {
        setEmpleadoForm((prev) => ({ ...prev, idEmpresaContratista: Number(activas[0].id) }));
      }
    } catch {
      setEmpresasContratistasActivas([]);
    }
  };

  useEffect(() => {
    loadData().catch(() => undefined);
    loadEmpresasContratistas().catch(() => undefined);
  }, []);

  const openHistorial = async (row: PostulacionAprobada) => {
    const data = await getPostulacionEventos(Number(row.id)).catch(() => []);
    setEventos(data);
    setHistorialOpen(true);
  };

  const openEmpleadoModal = (row: PostulacionAprobada) => {
    setEmpleadoPostulacion(row);
    setEmpleadoForm((prev) => ({
      ...prev,
      nombres: String(row.postulante?.nombres ?? ''),
      apellidos: String(row.postulante?.apellidos ?? ''),
      numeroDocumento: String(row.postulante?.documento ?? ''),
      fechaNacimiento: getPostulanteFechaNacimiento(row),
      celularPersonal: String((row as any).postulante?.celular ?? ''),
      correoPersonal: String((row as any).postulante?.correo ?? ''),
      idEmpresaContratista: Number(empresasContratistasActivas[0]?.id ?? prev.idEmpresaContratista ?? 1),
    }));
    setContratoForm((prev) => ({
      ...prev,
      idPostulacion: Number(row.id),
      fechaInicio: getToday(),
      fechaFin: '',
    }));
    setEmpleadoOpen(true);
  };

  const submitEmpleado = async () => {
    if (!empleadoPostulacion) return;
    const documento = String(empleadoForm.numeroDocumento ?? '').trim();
    if (!documento) {
      setMessage('Debes ingresar número de documento para registrar el empleado.');
      return;
    }

    try {
      let empleadoId: number;
      const existente = await getEmpleadoByDocumento(documento);
      if (existente) {
        empleadoId = Number(existente.id);
      } else {
        const payloadEmpleado = {
          nombres: String(empleadoForm.nombres ?? ''),
          apellidos: String(empleadoForm.apellidos ?? ''),
          tipoDocumento: String(empleadoForm.tipoDocumento ?? 'DNI'),
          numeroDocumento: String(empleadoForm.numeroDocumento ?? ''),
          nacionalidad: String(empleadoForm.nacionalidad ?? 'PERUANO'),
          fechaNacimiento: String(empleadoForm.fechaNacimiento ?? ''),
          estadoCivil: String(empleadoForm.estadoCivil ?? 'SOLTERO'),
          tieneHijos: Boolean(empleadoForm.tieneHijos),
          celularPersonal: String(empleadoForm.celularPersonal ?? ''),
          correoPersonal: String(empleadoForm.correoPersonal ?? ''),
          origen: String(empleadoForm.origen ?? 'INDEED'),
          distrito: String(empleadoForm.distrito ?? ''),
          direccion: String(empleadoForm.direccion ?? ''),
          banco: String(empleadoForm.banco ?? 'BCP'),
          cuentaBancaria: String(empleadoForm.cuentaBancaria ?? ''),
          cuentaInterbancaria: String(empleadoForm.cuentaInterbancaria ?? ''),
          cuentaPropia: Boolean(empleadoForm.cuentaPropia),
          parentesco: String(empleadoForm.parentesco ?? 'OTRO'),
          celularTransferencia: String(empleadoForm.celularTransferencia ?? ''),
          idEmpresaContratista: Number(empleadoForm.idEmpresaContratista ?? 1),
        };

        const created = await createEmpleado(payloadEmpleado);
        empleadoId = Number(created.id);
      }

      await registrarContrato(empleadoId, {
        idPostulacion: Number(contratoForm.idPostulacion ?? empleadoPostulacion.id),
        puestoTrabajo: String(contratoForm.puestoTrabajo ?? ''),
        regimen: String(contratoForm.regimen ?? ''),
        modalidad: String(contratoForm.modalidad ?? ''),
        seguroSalud: String(contratoForm.seguroSalud ?? ''),
        sistemaPensiones: String(contratoForm.sistemaPensiones ?? ''),
        sueldoBase: Number(contratoForm.sueldoBase ?? 0),
        fechaInicio: String(contratoForm.fechaInicio ?? ''),
        fechaFin: String(contratoForm.fechaFin ?? ''),
      });

      setEmpleadoOpen(false);
      setMessage('Empleado validado/registrado y contrato generado correctamente.');
      await loadData();
    } catch (err: any) {
      setMessage(err?.message ?? 'No se pudo completar registro automático de empleado/contrato.');
    }
  };

  const eventosOrdenados = useMemo(
    () => [...eventos].sort((a, b) => new Date(b.createdAt ?? b.fecha ?? 0).getTime() - new Date(a.createdAt ?? a.fecha ?? 0).getTime()),
    [eventos]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Aprobados</h2>
        <Button variant="ghost" size="sm" onClick={() => loadData()} disabled={loading}>Actualizar</Button>
      </div>

      {message && <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">{message}</div>}

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left">Postulante</th>
              <th className="px-3 py-2 text-left">Documento</th>
              <th className="px-3 py-2 text-left">Etapa</th>
              <th className="px-3 py-2 text-left">Estado</th>
              <th className="px-3 py-2 text-left">Última Tipificación</th>
              <th className="px-3 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row.id)} className="border-t border-slate-100">
                <td className="px-3 py-2">{String(row.postulante?.nombres ?? '')} {String(row.postulante?.apellidos ?? '')}</td>
                <td className="px-3 py-2">{String(row.postulante?.documento ?? '-')}</td>
                <td className="px-3 py-2">{row.etapaMostrada}</td>
                <td className="px-3 py-2">{row.estadoMostrado}</td>
                <td className="px-3 py-2">{row.ultimaTipificacion}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openHistorial(row)} title="Historial">
                      <History size={16} />
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => openEmpleadoModal(row)} title="Registrar empleado">
                      <UserPlus size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-slate-500" colSpan={6}>No hay candidatos en bandeja de contratación.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={historialOpen} onClose={() => setHistorialOpen(false)} title="Historial de Eventos" size="lg">
        <div className="max-h-[60vh] overflow-auto">
          <ul className="space-y-2">
            {eventosOrdenados.map((e) => (
              <li key={e.id} className="rounded border border-slate-200 p-2 text-sm">
                <p className="font-semibold text-slate-800">{String(e.tipificacion ?? e.codigoTipificacion ?? '-')}</p>
                <p className="text-slate-600">{String(e.descripcion ?? e.accion ?? '-')}</p>
                <p className="text-xs text-slate-500">{String(e.createdAt ?? e.fecha ?? '-')}</p>
              </li>
            ))}
          </ul>
        </div>
      </Modal>

      <Modal isOpen={empleadoOpen} onClose={() => setEmpleadoOpen(false)} title="Registrar Empleado" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-700">Nombres</label>
              <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={String(empleadoForm.nombres ?? '')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, nombres: e.target.value }))} />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-700">Apellidos</label>
              <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={String(empleadoForm.apellidos ?? '')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, apellidos: e.target.value }))} />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-700">Tipo Documento</label>
              <select className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={String(empleadoForm.tipoDocumento ?? 'DNI')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, tipoDocumento: e.target.value }))}>
                <option value="DNI">DNI</option>
                <option value="CE">CE</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-700">Número Documento</label>
              <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={String(empleadoForm.numeroDocumento ?? '')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, numeroDocumento: e.target.value }))} />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-700">Nacionalidad</label>
              <select className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={String(empleadoForm.nacionalidad ?? 'PERUANO')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, nacionalidad: e.target.value }))}>
                <option value="PERUANO">PERUANO</option>
                <option value="EXTRANJERO">EXTRANJERO</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-700">Fecha Nacimiento</label>
              <input type="date" className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={String(empleadoForm.fechaNacimiento ?? '')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, fechaNacimiento: e.target.value }))} />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-700">Estado Civil</label>
              <select className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={String(empleadoForm.estadoCivil ?? 'SOLTERO')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, estadoCivil: e.target.value }))}>
                <option value="SOLTERO">SOLTERO</option>
                <option value="CASADO">CASADO</option>
                <option value="VIUDO">VIUDO</option>
                <option value="DIVORCIADO">DIVORCIADO</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-700">Tiene Hijos</label>
              <select className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={String(Boolean(empleadoForm.tieneHijos))} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, tieneHijos: e.target.value === 'true' }))}>
                <option value="false">NO</option>
                <option value="true">SI</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-700">Celular Personal</label>
              <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={String(empleadoForm.celularPersonal ?? '')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, celularPersonal: e.target.value }))} />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-700">Correo Personal</label>
              <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={String(empleadoForm.correoPersonal ?? '')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, correoPersonal: e.target.value }))} />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-700">Origen</label>
              <select className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={String(empleadoForm.origen ?? 'INDEED')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, origen: e.target.value }))}>
                <option value="COMPUTRABAJO">COMPUTRABAJO</option>
                <option value="INDEED">INDEED</option>
                <option value="TIKTOK">TIKTOK</option>
                <option value="FACEBOOK">FACEBOOK</option>
                <option value="LINKEDIN">LINKEDIN</option>
                <option value="REFERIDO">REFERIDO</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-700">Distrito</label>
              <select className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={String(empleadoForm.distrito ?? '')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, distrito: e.target.value }))}>
                <option value="">Selecciona distrito</option>
                {DISTRITOS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-700">Dirección</label>
              <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={String(empleadoForm.direccion ?? '')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, direccion: e.target.value }))} />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-700">Banco</label>
              <select className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={String(empleadoForm.banco ?? 'BCP')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, banco: e.target.value }))}>
                <option value="BCP">BCP</option>
                <option value="BBVA">BBVA</option>
                <option value="INTERBANK">INTERBANK</option>
                <option value="SCOTIABANK">SCOTIABANK</option>
                <option value="BANCO_DE_LA_NACION">BANCO_DE_LA_NACION</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-700">Cuenta Bancaria</label>
              <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={String(empleadoForm.cuentaBancaria ?? '')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, cuentaBancaria: e.target.value }))} />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-700">Cuenta Interbancaria</label>
              <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={String(empleadoForm.cuentaInterbancaria ?? '')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, cuentaInterbancaria: e.target.value }))} />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-700">Cuenta Propia</label>
              <select className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={String(Boolean(empleadoForm.cuentaPropia))} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, cuentaPropia: e.target.value === 'true' }))}>
                <option value="true">SI</option>
                <option value="false">NO</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-700">Parentesco</label>
              <select className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={String(empleadoForm.parentesco ?? 'OTRO')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, parentesco: e.target.value }))}>
                <option value="PADRE">PADRE</option>
                <option value="MADRE">MADRE</option>
                <option value="TIO">TIO</option>
                <option value="ESPOSO">ESPOSO</option>
                <option value="HERMANO">HERMANO</option>
                <option value="ABUELO">ABUELO</option>
                <option value="PAREJA">PAREJA</option>
                <option value="OTRO">OTRO</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-700">Celular Transferencia</label>
              <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={String(empleadoForm.celularTransferencia ?? '')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, celularTransferencia: e.target.value }))} />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-700">ID Empresa Contratista</label>
              <select
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                value={String(empleadoForm.idEmpresaContratista ?? '')}
                onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, idEmpresaContratista: Number(e.target.value || 0) }))}
                disabled={empresasContratistasActivas.length === 0}
              >
                {empresasContratistasActivas.length === 0 && (
                  <option value="">No hay empresas activas</option>
                )}
                {empresasContratistasActivas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-700">Puesto Trabajo</label>
              <select
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                value={String(contratoForm.puestoTrabajo ?? 'ASESOR_VENTAS')}
                onChange={(e) => setContratoForm((prev) => ({ ...prev, puestoTrabajo: e.target.value }))}
              >
                <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                <option value="RRHH">RRHH</option>
                <option value="RECLUTADOR">RECLUTADOR</option>
                <option value="CAPACITADOR">CAPACITADOR</option>
                <option value="DESARROLLADOR">DESARROLLADOR</option>
                <option value="CONTADOR">CONTADOR</option>
                <option value="COMMUNITY">COMMUNITY</option>
                <option value="MONITOR">MONITOR</option>
                <option value="SUPERVISOR_VENTAS">SUPERVISOR_VENTAS</option>
                <option value="ASESOR_VENTAS">ASESOR_VENTAS</option>
                <option value="SUPERVISOR_BACKOFFICE">SUPERVISOR_BACKOFFICE</option>
                <option value="ASESOR_BACKOFFICE">ASESOR_BACKOFFICE</option>
                <option value="SUPERVISOR_GTR">SUPERVISOR_GTR</option>
                <option value="ASESOR_GTR">ASESOR_GTR</option>
                <option value="SUPERVISOR_POSTVENTA">SUPERVISOR_POSTVENTA</option>
                <option value="ASESOR_POSTVENTA">ASESOR_POSTVENTA</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-700">Régimen</label>
              <select
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                value={String(contratoForm.regimen ?? 'PLANILLA')}
                onChange={(e) => setContratoForm((prev) => ({ ...prev, regimen: e.target.value }))}
              >
                <option value="RECIBO_POR_HONORARIOS">RECIBO_POR_HONORARIOS</option>
                <option value="PLANILLA">PLANILLA</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-700">Modalidad</label>
              <select
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                value={String(contratoForm.modalidad ?? 'FULL_TIME')}
                onChange={(e) => setContratoForm((prev) => ({ ...prev, modalidad: e.target.value }))}
              >
                <option value="PART_TIME">PART_TIME</option>
                <option value="FULL_TIME">FULL_TIME</option>
                <option value="SEMI_FULL">SEMI_FULL</option>
                <option value="SUPER_FULL">SUPER_FULL</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-700">Seguro Salud</label>
              <select
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                value={String(contratoForm.seguroSalud ?? 'ESSALUD')}
                onChange={(e) => setContratoForm((prev) => ({ ...prev, seguroSalud: e.target.value }))}
              >
                <option value="SIS">SIS</option>
                <option value="ESSALUD">ESSALUD</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-700">Sistema Pensiones</label>
              <select
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                value={String(contratoForm.sistemaPensiones ?? 'ONP')}
                onChange={(e) => setContratoForm((prev) => ({ ...prev, sistemaPensiones: e.target.value }))}
              >
                <option value="ONP">ONP</option>
                <option value="AFP_INTEGRA">AFP_INTEGRA</option>
                <option value="AFP_PROFUTURO">AFP_PROFUTURO</option>
                <option value="AFP_HABITAT">AFP_HABITAT</option>
                <option value="PRIMA_AFP">PRIMA_AFP</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-700">Sueldo Base</label>
              <input
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                type="number"
                min={0}
                value={String(contratoForm.sueldoBase ?? 0)}
                onChange={(e) => setContratoForm((prev) => ({ ...prev, sueldoBase: Number(e.target.value || 0) }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-700">Fecha Inicio</label>
              <input
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                type="date"
                value={String(contratoForm.fechaInicio ?? '')}
                onChange={(e) => setContratoForm((prev) => ({ ...prev, fechaInicio: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-700">Fecha Fin</label>
              <input
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                type="date"
                value={String(contratoForm.fechaFin ?? '')}
                onChange={(e) => setContratoForm((prev) => ({ ...prev, fechaFin: e.target.value }))}
              />
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setEmpleadoOpen(false)}>Cancelar</Button>
          <Button variant="primary" onClick={submitEmpleado}>Guardar Empleado y Generar Contrato</Button>
        </div>
      </Modal>
    </div>
  );
};
