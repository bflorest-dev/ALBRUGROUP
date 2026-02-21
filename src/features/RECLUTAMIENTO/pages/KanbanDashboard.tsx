import React, { useEffect, useState } from 'react';
import { BiPhone, BiBadge, BiCalendar } from 'react-icons/bi';
import { Card } from '@molecules/Card';
import { loadApplicantsFromStorage, saveApplicantsToStorage } from '@utils/localStorage';
import { Modal } from '@molecules/Modal';
import { DatePicker } from '@molecules/DatePicker/DatePicker';
import type { Applicant } from '@types';
import './KanbanDashboard.css';

// orden de columnas según imagen provista
const STATUS_COLUMNS = [
  'POSTULANTE',
  'SIN_CONTACTO',
  'INTERESADO',
  'NO_INTERESADO',
  'RECHAZADO',
] as const;

type StatusValue = (typeof STATUS_COLUMNS)[number];

const statusColorMap: Record<StatusValue, string> = {
  POSTULANTE: '#3B82F6', // blue-500
  SIN_CONTACTO: '#A78BFA', // purple-400
  INTERESADO: '#10B981', // green-500
  NO_INTERESADO: '#6B7280', // gray-500
  RECHAZADO: '#EF4444', // red-500
};

export const KanbanDashboard: React.FC = () => {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [companyFilter, setCompanyFilter] = useState<'WIN' | 'CLARO'>('WIN');

  const [isTipifyModalOpen, setIsTipifyModalOpen] = useState(false);
  const [selectedForTipify, setSelectedForTipify] = useState<Applicant | null>(null);
  const [tipifyStatus, setTipifyStatus] = useState<string>('');
  const [reasonOptions, setReasonOptions] = useState<string[]>([]);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [meetingDate, setMeetingDate] = useState<string>('');
  const [meetingTime, setMeetingTime] = useState<string>('');

  const TIPIFY_STATUSES: string[] = [
    'NO_INTERESADO',
    'SIN_CONTACTO',
    'EN_PROCESO',
    'INTERESADO',
    'RECHAZADO',
  ];

  useEffect(() => {
    const stored = loadApplicantsFromStorage();
    if (stored) {
      setApplicants(stored);
    }
  }, []);

  // apply company filter before grouping
  const filteredApplicants = applicants.filter(a => a.company === companyFilter);

  const columns: Record<StatusValue, Applicant[]> = STATUS_COLUMNS.reduce(
    (acc, status) => ({ ...acc, [status]: [] }),
    {} as Record<StatusValue, Applicant[]>
  );

  filteredApplicants.forEach((a) => {
    const key = (a.status || 'POSTULANTE') as StatusValue;
    if (columns[key]) {
      columns[key].push(a);
    }
  });

  return (
    <>
    <div className="kanban-root">
      <div className="company-tabs">
        <button
          className={companyFilter === 'WIN' ? 'active' : ''}
          onClick={() => setCompanyFilter('WIN')}
        >
          WIN
        </button>
        <button
          className={companyFilter === 'CLARO' ? 'active' : ''}
          onClick={() => setCompanyFilter('CLARO')}
        >
          CLARO
        </button>
      </div>
      <div className="kanban-board">
        {STATUS_COLUMNS.map((status) => (
          <div className="kanban-column" key={status}>
          <div
            className="kanban-column-header"
            style={{ borderTopColor: statusColorMap[status] }}
          >
            <span>{status.replace('_', ' ')}</span>
            <span className="count">{columns[status].length}</span>
          </div>
          <div className="kanban-column-cards">
            {columns[status].map((app) => (
              <Card
                key={app.id}
                className="kanban-card"
                style={{ borderLeftColor: statusColorMap[status] }}
              >
                <div className="card-header">
                  <div className="avatar">
                    {app.nombres?.charAt(0)}{app.apellidos?.charAt(0)}
                  </div>
                  <div className="card-title">
                    <strong>{app.fullName}</strong>
                    <em>{app.positionOfInterest}</em>
                  </div>
                </div>
                <div className="card-body">
                  <div className="info">
                    <BiPhone /> {app.phoneMobile}
                  </div>
                  <div className="info">
                    <BiBadge /> {app.documentType} · {app.documentNumber}
                  </div>
                  {app.startDate && (
                    <div className="info">
                      <BiCalendar /> {app.startDate}
                    </div>
                  )}
                </div>
                      <div className="card-footer">
                  <button
                    className="tipificar-btn"
                    onClick={() => {
                      setSelectedForTipify(app);
                      setTipifyStatus(app.status || 'NO_INTERESADO');
                      setIsTipifyModalOpen(true);
                    }}
                  >
                    Tipificar
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>

  {/* tipificar modal */}
  <Modal className="tipify-modal" isOpen={isTipifyModalOpen} title="Tipificar" onClose={() => setIsTipifyModalOpen(false)}>
    {selectedForTipify && (
      <div className="tipify-form">
        <label htmlFor="status-select">Seleccionar estado</label>
        <select
          id="status-select"
          value={tipifyStatus}
          onChange={(e) => {
            const val = e.target.value;
            setTipifyStatus(val);
            setSelectedReason('');
            setStartDate('');
            setStartTime('');
            setMeetingDate('');
            setMeetingTime('');
            if (val === 'NO_INTERESADO') {
              setReasonOptions([]);
            } else if (val === 'RECHAZADO') {
              setReasonOptions([]);
            } else {
              setReasonOptions([]);
            }
          }}
        >
          <option value="">Selecciona esta</option>
          {TIPIFY_STATUSES.map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        {tipifyStatus === 'EN_PROCESO' && (
          <>
            <label htmlFor="start-date">Fecha Inicio</label>
            <DatePicker
              value={startDate}
              onChange={(d: string) => setStartDate(d)}
            />
            <label htmlFor="start-time">Hora</label>
            <input
              type="time"
              id="start-time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
            />
          </>
        )}
        {tipifyStatus === 'INTERESADO' && (
          <>
            <label htmlFor="meeting-date">Fecha del Meet</label>
            <DatePicker
              value={meetingDate}
              onChange={(d: string) => setMeetingDate(d)}
            />
            <label htmlFor="meeting-time">Hora del Meet</label>
            <input
              type="time"
              id="meeting-time"
              value={meetingTime}
              onChange={e => setMeetingTime(e.target.value)}
            />
          </>
        )}
        {tipifyStatus === 'NO_INTERESADO' && (
          <>
            <label htmlFor="reason-select">Motivo de no interes</label>
            <select
              id="reason-select"
              value={selectedReason}
              onChange={e => setSelectedReason(e.target.value)}
            >
              {reasonOptions.length ? (
                reasonOptions.map(r => <option key={r} value={r}>{r}</option>)
              ) : (
                <option value="">(ninguno definido)</option>
              )}
            </select>
          </>
        )}
        {tipifyStatus === 'RECHAZADO' && (
          <>
            <label htmlFor="rejected-reason-select">Motivo de rechazo</label>
            <select
              id="rejected-reason-select"
              value={selectedReason}
              onChange={e => setSelectedReason(e.target.value)}
            >
              {reasonOptions.length ? (
                reasonOptions.map(r => <option key={r} value={r}>{r}</option>)
              ) : (
                <option value="">(aún no se define la lista)</option>
              )}
            </select>
          </>
        )}
        <div className="modal-actions">
          <button onClick={() => setIsTipifyModalOpen(false)}>Cancelar</button>
          <button
            onClick={() => {
              if (selectedForTipify) {
                setApplicants(prev => {
                  const updated = prev.map(a => {
                    if (a.id === selectedForTipify.id) {
                      const copy: any = { ...a, status: tipifyStatus };
                      if (tipifyStatus === 'EN_PROCESO' && startDate) {
                        copy.startDate = startTime ? `${startDate} ${startTime}` : startDate;
                      }
                      if (tipifyStatus === 'INTERESADO' && meetingDate) {
                        copy.meetingDate = meetingTime ? `${meetingDate} ${meetingTime}` : meetingDate;
                      }
                      return copy;
                    }
                    return a;
                  });
                  saveApplicantsToStorage(updated);
                  return updated;
                });
              }
              setIsTipifyModalOpen(false);
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    )}
  </Modal>
    </>
  );
};
