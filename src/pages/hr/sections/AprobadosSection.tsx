import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Button } from '@shared/ui';
import { FlatpickrDateInput } from '@shared/ui/date-picker';
import { DsDataTable, DsInlineMessage, type DsDataTableColumn } from '@shared/ui/design-system';
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
} from '@features/hr/api/rrhhExtendedApi';
import styles from './AprobadosSection.module.css';

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
      const firstActiva = activas[0];
      if (firstActiva) {
        setEmpleadoForm((prev) => ({ ...prev, idEmpresaContratista: Number(firstActiva.id) }));
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

  const columns = useMemo<DsDataTableColumn<PostulacionAprobada>[]>(
    () => [
      {
        key: 'postulante',
        label: 'Postulante',
        render: (row) => `${String(row.postulante?.nombres ?? '')} ${String(row.postulante?.apellidos ?? '')}`,
      },
      {
        key: 'documento',
        label: 'Documento',
        render: (row) => String(row.postulante?.documento ?? '-'),
      },
      {
        key: 'etapaMostrada',
        label: 'Etapa',
        render: (row) => row.etapaMostrada,
      },
      {
        key: 'estadoMostrado',
        label: 'Estado',
        render: (row) => row.estadoMostrado,
      },
      {
        key: 'ultimaTipificacion',
        label: 'Ultima Tipificacion',
        render: (row) => row.ultimaTipificacion,
      },
    ],
    []
  );

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>Aprobados</h2>
        <Button variant="ghost" size="sm" onClick={() => loadData()} disabled={loading}>Actualizar</Button>
      </div>

      {message && (
        <DsInlineMessage tone="warning">
          {message}
        </DsInlineMessage>
      )}

      <div className={styles.dataTablePane}>
        <DsDataTable
          rows={rows}
          columns={columns}
          loading={loading}
          emptyMessage="No hay candidatos en bandeja de contratación."
          rowKey={(row) => String(row.id)}
          actionsLabel="Acciones"
          actions={[
            {
              label: 'Historial',
              variant: 'ghost',
              onClick: (row) => openHistorial(row),
            },
            {
              label: 'Registrar',
              variant: 'secondary',
              onClick: (row) => openEmpleadoModal(row),
            },
          ]}
        />
      </div>

      <Modal isOpen={historialOpen} onClose={() => setHistorialOpen(false)} title="Historial de Eventos" size="lg" className="rrhh-modal-theme">
        <div className={styles.historyWrap}>
          <ul className={styles.historyList}>
            {eventosOrdenados.map((e) => (
              <li key={e.id} className={styles.historyItem}>
                <p className={styles.historyTitle}>{String(e.tipificacion ?? e.codigoTipificacion ?? '-')}</p>
                <p className={styles.historyDescription}>{String(e.descripcion ?? e.accion ?? '-')}</p>
                <p className={styles.historyDate}>{String(e.createdAt ?? e.fecha ?? '-')}</p>
              </li>
            ))}
          </ul>
        </div>
      </Modal>

      <Modal isOpen={empleadoOpen} onClose={() => setEmpleadoOpen(false)} title="Registrar Empleado" size="lg" className="rrhh-modal-theme">
        <div className={styles.modalBody}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Nombres</label>
              <input className={styles.control} value={String(empleadoForm.nombres ?? '')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, nombres: e.target.value }))} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Apellidos</label>
              <input className={styles.control} value={String(empleadoForm.apellidos ?? '')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, apellidos: e.target.value }))} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Tipo Documento</label>
              <select className={styles.control} value={String(empleadoForm.tipoDocumento ?? 'DNI')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, tipoDocumento: e.target.value }))}>
                <option value="DNI">DNI</option>
                <option value="CE">CE</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Número Documento</label>
              <input className={styles.control} value={String(empleadoForm.numeroDocumento ?? '')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, numeroDocumento: e.target.value }))} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Nacionalidad</label>
              <select className={styles.control} value={String(empleadoForm.nacionalidad ?? 'PERUANO')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, nacionalidad: e.target.value }))}>
                <option value="PERUANO">PERUANO</option>
                <option value="EXTRANJERO">EXTRANJERO</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Fecha Nacimiento</label>
              <FlatpickrDateInput
                value={String(empleadoForm.fechaNacimiento ?? '')}
                onChange={(value) => setEmpleadoForm((prev) => ({ ...prev, fechaNacimiento: value }))}
                inputClassName={styles.control}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Estado Civil</label>
              <select className={styles.control} value={String(empleadoForm.estadoCivil ?? 'SOLTERO')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, estadoCivil: e.target.value }))}>
                <option value="SOLTERO">SOLTERO</option>
                <option value="CASADO">CASADO</option>
                <option value="VIUDO">VIUDO</option>
                <option value="DIVORCIADO">DIVORCIADO</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Tiene Hijos</label>
              <select className={styles.control} value={String(Boolean(empleadoForm.tieneHijos))} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, tieneHijos: e.target.value === 'true' }))}>
                <option value="false">NO</option>
                <option value="true">SI</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Celular Personal</label>
              <input className={styles.control} value={String(empleadoForm.celularPersonal ?? '')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, celularPersonal: e.target.value }))} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Correo Personal</label>
              <input className={styles.control} value={String(empleadoForm.correoPersonal ?? '')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, correoPersonal: e.target.value }))} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Origen</label>
              <select className={styles.control} value={String(empleadoForm.origen ?? 'INDEED')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, origen: e.target.value }))}>
                <option value="COMPUTRABAJO">COMPUTRABAJO</option>
                <option value="INDEED">INDEED</option>
                <option value="TIKTOK">TIKTOK</option>
                <option value="FACEBOOK">FACEBOOK</option>
                <option value="LINKEDIN">LINKEDIN</option>
                <option value="REFERIDO">REFERIDO</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Distrito</label>
              <select className={styles.control} value={String(empleadoForm.distrito ?? '')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, distrito: e.target.value }))}>
                <option value="">Selecciona distrito</option>
                {DISTRITOS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Dirección</label>
              <input className={styles.control} value={String(empleadoForm.direccion ?? '')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, direccion: e.target.value }))} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Banco</label>
              <select className={styles.control} value={String(empleadoForm.banco ?? 'BCP')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, banco: e.target.value }))}>
                <option value="BCP">BCP</option>
                <option value="BBVA">BBVA</option>
                <option value="INTERBANK">INTERBANK</option>
                <option value="SCOTIABANK">SCOTIABANK</option>
                <option value="BANCO_DE_LA_NACION">BANCO_DE_LA_NACION</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Cuenta Bancaria</label>
              <input className={styles.control} value={String(empleadoForm.cuentaBancaria ?? '')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, cuentaBancaria: e.target.value }))} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Cuenta Interbancaria</label>
              <input className={styles.control} value={String(empleadoForm.cuentaInterbancaria ?? '')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, cuentaInterbancaria: e.target.value }))} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Cuenta Propia</label>
              <select className={styles.control} value={String(Boolean(empleadoForm.cuentaPropia))} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, cuentaPropia: e.target.value === 'true' }))}>
                <option value="true">SI</option>
                <option value="false">NO</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Parentesco</label>
              <select className={styles.control} value={String(empleadoForm.parentesco ?? 'OTRO')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, parentesco: e.target.value }))}>
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

            <div className={styles.field}>
              <label className={styles.label}>Celular Transferencia</label>
              <input className={styles.control} value={String(empleadoForm.celularTransferencia ?? '')} onChange={(e) => setEmpleadoForm((prev) => ({ ...prev, celularTransferencia: e.target.value }))} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>ID Empresa Contratista</label>
              <select
                className={styles.control}
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

          <div className={styles.contratoGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Puesto Trabajo</label>
              <select
                className={styles.control}
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

            <div className={styles.field}>
              <label className={styles.label}>Régimen</label>
              <select
                className={styles.control}
                value={String(contratoForm.regimen ?? 'PLANILLA')}
                onChange={(e) => setContratoForm((prev) => ({ ...prev, regimen: e.target.value }))}
              >
                <option value="RECIBO_POR_HONORARIOS">RECIBO_POR_HONORARIOS</option>
                <option value="PLANILLA">PLANILLA</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Modalidad</label>
              <select
                className={styles.control}
                value={String(contratoForm.modalidad ?? 'FULL_TIME')}
                onChange={(e) => setContratoForm((prev) => ({ ...prev, modalidad: e.target.value }))}
              >
                <option value="PART_TIME">PART_TIME</option>
                <option value="FULL_TIME">FULL_TIME</option>
                <option value="SEMI_FULL">SEMI_FULL</option>
                <option value="SUPER_FULL">SUPER_FULL</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Seguro Salud</label>
              <select
                className={styles.control}
                value={String(contratoForm.seguroSalud ?? 'ESSALUD')}
                onChange={(e) => setContratoForm((prev) => ({ ...prev, seguroSalud: e.target.value }))}
              >
                <option value="SIS">SIS</option>
                <option value="ESSALUD">ESSALUD</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Sistema Pensiones</label>
              <select
                className={styles.control}
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

            <div className={styles.field}>
              <label className={styles.label}>Sueldo Base</label>
              <input
                className={styles.control}
                type="number"
                min={0}
                value={String(contratoForm.sueldoBase ?? 0)}
                onChange={(e) => setContratoForm((prev) => ({ ...prev, sueldoBase: Number(e.target.value || 0) }))}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Fecha Inicio</label>
              <FlatpickrDateInput
                value={String(contratoForm.fechaInicio ?? '')}
                onChange={(value) => setContratoForm((prev) => ({ ...prev, fechaInicio: value }))}
                inputClassName={styles.control}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Fecha Fin</label>
              <FlatpickrDateInput
                value={String(contratoForm.fechaFin ?? '')}
                onChange={(value) => setContratoForm((prev) => ({ ...prev, fechaFin: value }))}
                inputClassName={styles.control}
                minDate={String(contratoForm.fechaInicio ?? '') || undefined}
              />
            </div>
          </div>
        </div>
        <div className={styles.footerActions}>
          <Button variant="secondary" onClick={() => setEmpleadoOpen(false)}>Cancelar</Button>
          <Button variant="primary" onClick={submitEmpleado}>Guardar Empleado y Generar Contrato</Button>
        </div>
      </Modal>
    </div>
  );
};
