import React, { useEffect, useState } from 'react';
import { Button, Modal } from '@shared/ui';
import { FlatpickrDateInput } from '@shared/ui/date-picker';
import { DsInlineMessage } from '@shared/ui/design-system';
import { Eye } from 'lucide-react';
import {
  cesarContrato,
  getContratoHistorico,
  getContratoVigente,
  getEmpleados,
  registrarContrato,
  type RrhhContrato,
  type RrhhEmpleado,
} from '@features/hr/api/rrhhExtendedApi';
import styles from './ContratosSection.module.css';

const today = () => new Date().toISOString().split('T')[0] ?? '';

export const ContratosSection: React.FC = () => {
  const [empleados, setEmpleados] = useState<RrhhEmpleado[]>([]);
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    puestoTrabajo: 'ASESOR_VENTAS',
    regimen: 'PLANILLA',
    modalidad: 'FULL_TIME',
    seguroSalud: 'ESSALUD',
    sistemaPensiones: 'ONP',
    sueldoBase: 1200,
    fechaInicio: today(),
    fechaFin: today(),
  });

  const [vigente, setVigente] = useState<RrhhContrato | null>(null);
  const [historico, setHistorico] = useState<RrhhContrato[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  const loadEmpleados = async () => {
    const data = await getEmpleados().catch(() => []);
    setEmpleados(data);
  };

  useEffect(() => {
    loadEmpleados().catch(() => undefined);
  }, []);

  const empleadoId = Number(selectedEmpleadoId);

  const handleRegistrar = async () => {
    if (!empleadoId) {
      setMessage('Selecciona un empleado para registrar contrato.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await registrarContrato(empleadoId, form);
      setMessage('Contrato registrado correctamente. La confirmación de contratación deriva automáticamente de este proceso en backend.');
      const contratoVigente = await getContratoVigente(empleadoId).catch(() => null);
      setVigente(contratoVigente);
      const contratoHistorico = await getContratoHistorico(empleadoId).catch(() => []);
      setHistorico(contratoHistorico);
    } catch (err: any) {
      setMessage(err?.message ?? 'No se pudo registrar contrato.');
    } finally {
      setLoading(false);
    }
  };

  const handleVigente = async (id?: number) => {
    const contractId = id ?? empleadoId;
    if (!contractId) return null;
    const data = await getContratoVigente(contractId).catch(() => null);
    setVigente(data);
    return data;
  };

  const handleHistorico = async (id?: number) => {
    const contractId = id ?? empleadoId;
    if (!contractId) return [];
    const data = await getContratoHistorico(contractId).catch(() => []);
    setHistorico(data);
    return data;
  };

  const getContratoId = (contrato: RrhhContrato | null): number | null => {
    if (!contrato) return null;
    return (
      Number(contrato.id ?? (contrato as any).idContrato ?? (contrato as any).id_contrato ?? 0) || null
    );
  };

  const handleCesar = async () => {
    const contratoId = getContratoId(vigente);
    if (!contratoId) {
      setMessage('No hay contrato vigente para finalizar.');
      return;
    }
    try {
      await cesarContrato(contratoId, { fechaFin: today() });
      setMessage('Contrato finalizado correctamente.');
      setVigente(null);
      const employeeId = Number(selectedEmpleadoId);
      if (employeeId) {
        await handleVigente(employeeId);
        await handleHistorico(employeeId);
      }
    } catch (err: any) {
      setMessage(err?.message ?? 'No se pudo finalizar el contrato.');
    }
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Contratos</h2>

      {message && (
        <DsInlineMessage tone="info">
          {message}
        </DsInlineMessage>
      )}

      <div className={styles.gridTwoColumns}>
        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>Registrar contrato</h3>
          <div className={styles.formStack}>
            <select
              className={styles.control}
              value={selectedEmpleadoId}
              onChange={async (e) => {
                const value = e.target.value;
                setSelectedEmpleadoId(value);
                const employeeId = Number(value);
                if (employeeId) {
                  await handleVigente(employeeId);
                  await handleHistorico(employeeId);
                } else {
                  setVigente(null);
                  setHistorico([]);
                }
              }}
            >
              <option value="">Selecciona empleado</option>
              {empleados.map((emp) => (
                <option key={Number(emp.id)} value={Number(emp.id)}>
                  {String(emp.nombres ?? '')} {String(emp.apellidos ?? '')}
                </option>
              ))}
            </select>

            <select
              className={styles.control}
              value={form.puestoTrabajo}
              onChange={(e) => setForm((prev) => ({ ...prev, puestoTrabajo: e.target.value }))}
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
            <select
              className={styles.control}
              value={form.regimen}
              onChange={(e) => setForm((prev) => ({ ...prev, regimen: e.target.value }))}
            >
              <option value="RECIBO_POR_HONORARIOS">RECIBO_POR_HONORARIOS</option>
              <option value="PLANILLA">PLANILLA</option>
            </select>
            <select
              className={styles.control}
              value={form.modalidad}
              onChange={(e) => setForm((prev) => ({ ...prev, modalidad: e.target.value }))}
            >
              <option value="PART_TIME">PART_TIME</option>
              <option value="FULL_TIME">FULL_TIME</option>
              <option value="SEMI_FULL">SEMI_FULL</option>
              <option value="SUPER_FULL">SUPER_FULL</option>
            </select>
            <select
              className={styles.control}
              value={form.seguroSalud}
              onChange={(e) => setForm((prev) => ({ ...prev, seguroSalud: e.target.value }))}
            >
              <option value="SIS">SIS</option>
              <option value="ESSALUD">ESSALUD</option>
            </select>
            <select
              className={styles.control}
              value={form.sistemaPensiones}
              onChange={(e) => setForm((prev) => ({ ...prev, sistemaPensiones: e.target.value }))}
            >
              <option value="ONP">ONP</option>
              <option value="AFP_INTEGRA">AFP_INTEGRA</option>
              <option value="AFP_PROFUTURO">AFP_PROFUTURO</option>
              <option value="AFP_HABITAT">AFP_HABITAT</option>
              <option value="PRIMA_AFP">PRIMA_AFP</option>
            </select>
            <input className={styles.control} type="number" value={form.sueldoBase} onChange={(e) => setForm((prev) => ({ ...prev, sueldoBase: Number(e.target.value || 0) }))} placeholder="Sueldo Base" />
            <FlatpickrDateInput
              value={form.fechaInicio}
              onChange={(value) => setForm((prev) => ({ ...prev, fechaInicio: value }))}
              inputClassName={styles.control}
            />
            <FlatpickrDateInput
              value={form.fechaFin}
              onChange={(value) => setForm((prev) => ({ ...prev, fechaFin: value }))}
              inputClassName={styles.control}
              minDate={form.fechaInicio || undefined}
            />

            <Button variant="primary" onClick={handleRegistrar} disabled={loading}>Registrar Contrato</Button>
          </div>
        </div>

        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>Vigente / Histórico / Cese</h3>
          <div className={styles.actionRow}>
            {vigente && (
              <Button size="sm" variant="secondary" onClick={() => handleVigente()}>
                Ver Vigente
              </Button>
            )}
            {historico.length > 0 && (
              <button
                className={styles.iconButton}
                type="button"
                onClick={() => setHistoryOpen(true)}
                aria-label="Ver Histórico"
              >
                <Eye size={16} />
              </button>
            )}
          </div>

          <div className={styles.contractPreview}>
            <p className={styles.contractTitle}>Contrato Vigente</p>
            {vigente ? (
              <div className={styles.contractDetails}>
                <div><span className={styles.fieldLabel}>Puesto Trabajo:</span> {vigente.puestoTrabajo ?? '-'}</div>
                <div><span className={styles.fieldLabel}>Regimen:</span> {vigente.regimen ?? '-'}</div>
                <div><span className={styles.fieldLabel}>Modalidad:</span> {vigente.modalidad ?? '-'}</div>
                <div><span className={styles.fieldLabel}>Seguro Salud:</span> {vigente.seguroSalud ?? '-'}</div>
                <div><span className={styles.fieldLabel}>Sistema Pensiones:</span> {vigente.sistemaPensiones ?? '-'}</div>
                <div><span className={styles.fieldLabel}>Sueldo Base:</span> {vigente.sueldoBase ?? '-'}</div>
                <div><span className={styles.fieldLabel}>Fecha Inicio:</span> {vigente.fechaInicio ?? '-'}</div>
                <div><span className={styles.fieldLabel}>Fecha Fin:</span> {vigente.fechaFin ?? '-'}</div>
              </div>
            ) : (
              <p className={styles.mutedText}>No hay contrato vigente.</p>
            )}
          </div>

          <div className={styles.ctaRow}>
            <Button size="sm" variant="danger" onClick={handleCesar}>Finalizar Contrato</Button>
          </div>
        </div>
      </div>

      <Modal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} title="Histórico de Contratos" size="lg" className="rrhh-modal-theme">
        <div className={styles.formStack}>
          {historico.length === 0 ? (
            <p className={styles.mutedText}>No hay contratos históricos disponibles.</p>
          ) : (
            historico.map((contrato, index) => (
              <div key={index} className={styles.historyCard}>
                <p className={styles.contractTitle}>Contrato #{index + 1}</p>
                <div className={styles.historyDetails}>
                  <div><span className={styles.fieldLabel}>Puesto Trabajo:</span> {contrato.puestoTrabajo ?? '-'}</div>
                  <div><span className={styles.fieldLabel}>Regimen:</span> {contrato.regimen ?? '-'}</div>
                  <div><span className={styles.fieldLabel}>Modalidad:</span> {contrato.modalidad ?? '-'}</div>
                  <div><span className={styles.fieldLabel}>Seguro Salud:</span> {contrato.seguroSalud ?? '-'}</div>
                  <div><span className={styles.fieldLabel}>Sistema Pensiones:</span> {contrato.sistemaPensiones ?? '-'}</div>
                  <div><span className={styles.fieldLabel}>Sueldo Base:</span> {contrato.sueldoBase ?? '-'}</div>
                  <div><span className={styles.fieldLabel}>Fecha Inicio:</span> {contrato.fechaInicio ?? '-'}</div>
                  <div><span className={styles.fieldLabel}>Fecha Fin:</span> {contrato.fechaFin ?? '-'}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};
