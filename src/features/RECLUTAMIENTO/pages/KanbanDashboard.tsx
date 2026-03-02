import React, { useState, useEffect } from 'react';
import { BiPhone, BiBadge, BiCalendar } from 'react-icons/bi';
import { Card } from '@molecules/Card';
import { useApplicants } from '@contexts/ApplicantsContext';
import { useApplicantsSync } from '@hooks/useApplicantsSync';
import { Modal } from '@molecules/Modal';
import { DatePicker } from '@molecules/DatePicker/DatePicker';
import type { Applicant } from '@types';
import './KanbanDashboard.css';

const STATUS_COLUMNS = [
  'POSTULANTE',
  'SIN_CONTACTO',
  'NO_INTERESADO',
  'INTERESADO',
  'RECHAZADO',
] as const;

type StatusValue = (typeof STATUS_COLUMNS)[number];

const statusColorMap: Record<StatusValue, string> = {
  POSTULANTE: '#3B82F6',
  SIN_CONTACTO: '#A78BFA',
  INTERESADO: '#10B981',
  NO_INTERESADO: '#6B7280',
  RECHAZADO: '#EF4444',
};

// Sub-componente que solo se re-renderiza cuando hay cambios en postulantes
interface KanbanBoardProps {
  companyFilter: 'WIN' | 'CLARO';
  onSelectForTipify: (app: Applicant) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ companyFilter, onSelectForTipify }) => {
  // Este hook sincroniza con cambios en aplicantes y fuerza re-render solo en este componente
  const { applicants } = useApplicantsSync();

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

  // pagination state per column
  const [pageByStatus, setPageByStatus] = useState<Record<StatusValue, number>>( 
    STATUS_COLUMNS.reduce((acc, s) => ({ ...acc, [s]: 1 }), {} as Record<StatusValue, number>)
  );
  const ITEMS_PER_COLUMN = 10;

  const changePage = (status: StatusValue, delta: number) => {
    setPageByStatus((prev) => {
      const total = columns[status].length;
      const pages = Math.max(1, Math.ceil(total / ITEMS_PER_COLUMN));
      const next = prev[status] + delta;
      if (next < 1 || next > pages) return prev;
      return { ...prev, [status]: next };
    });
  };

  // when the data set or company filter changes (new applicant added/updated),
  // jump each column to its last page so the new/modified card is visible.
  React.useEffect(() => {
    setPageByStatus((prev) => {
      const updated: Record<StatusValue, number> = {} as any;
      STATUS_COLUMNS.forEach((status) => {
        const total = columns[status].length;
        const pages = Math.max(1, Math.ceil(total / ITEMS_PER_COLUMN));
        // if we were already on a page beyond the new total, clamp;
        // otherwise move to last page explicitly
        updated[status] = pages;
      });
      return updated;
    });
  }, [companyFilter, applicants.length]);

  return (
    <div className="kanban-board">
      {STATUS_COLUMNS.map((status) => {
        const allCards = columns[status];
        const currentPage = pageByStatus[status] || 1;
        const start = (currentPage - 1) * ITEMS_PER_COLUMN;
        const paginatedCards = allCards.slice(start, start + ITEMS_PER_COLUMN);
        const totalPages = Math.max(1, Math.ceil(allCards.length / ITEMS_PER_COLUMN));
        return (
        <div className="kanban-column" key={status}>
          <div
            className="kanban-column-header"
            style={{ borderTopColor: statusColorMap[status] }}
          >
            <span>{status.replace('_', ' ')}</span>
            <span className="count">{allCards.length}</span>
          </div>
          <div className="kanban-column-cards">
            {paginatedCards.map((app) => (
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
                  {status === 'INTERESADO' && app.meetingDate && (
                    <div className="meeting-badge">
                      <div className="badge-date">{app.meetingDate.includes(' ') ? app.meetingDate.split(' ')[0] : app.meetingDate}</div>
                      <div className="badge-time">{app.meetingDate.includes(' ') ? app.meetingDate.split(' ')[1] : ''}</div>
                    </div>
                  )}
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
                    onClick={() => onSelectForTipify(app)}
                  >
                    Tipificar
                  </button>
                </div>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="kanban-pagination">
              <button
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => changePage(status, -1)}
              >
                ‹
              </button>
              <span className="page-info">
                {currentPage} / {totalPages}
              </span>
              <button
                className="page-btn"
                disabled={currentPage === totalPages}
                onClick={() => changePage(status, 1)}
              >
                ›
              </button>
            </div>
          )}
        </div>
      );
      })}
    </div>
  );
};

// Componente padre que maneja modales y filtros (NO se re-renderiza con cambios de datos)
export const KanbanDashboard: React.FC = () => {
  const { updateApplicant } = useApplicants();
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
    'SIN_CONTACTO',
    'NO_INTERESADO',
    'INTERESADO',
    'RECHAZADO',
    'RECLUTADO',
  ];

// razones predefinidas para el estado NO_INTERESADO
const NO_INTERESADO_REASONS: string[] = [
  'DISTANCIA_TIEMPO',
  'PROBLEMAS_CON_HORARIOS',
  'SALARIO_BASE',
  'BENEFICIOS_PLANILLA',
  'NO_DESEA_PUESTO',
  'RUBRO_DE_LA_EMPRESA',
  'MALA_EXPERIENCIA',
  'RECIBIO_MEJOR_PROPUESTA',
];

const RECHAZADO_REASONS: string[] = [
  'SIN_HABILIDADES_COMERCIALES',
  'POCA_FLUIDEZ_VERBAL',
  'INEXPERIENCIA',
];

  const handleSelectForTipify = (app: Applicant) => {
    setSelectedForTipify(app);
    // empezar con valor vacío para forzar al usuario a elegir
    setTipifyStatus('');
    setSelectedReason('');
    setReasonOptions([]);
    setStartDate('');
    setStartTime('');
    setMeetingDate('');
    setMeetingTime('');
    setIsTipifyModalOpen(true);
  };

  const handleTipifyStatusChange = (val: string) => {
    setTipifyStatus(val);
    setSelectedReason('');
    setStartDate('');
    setStartTime('');
    setMeetingDate('');
    setMeetingTime('');
    if (val === 'NO_INTERESADO') {
      setReasonOptions(NO_INTERESADO_REASONS);
    } else if (val === 'RECHAZADO') {
      setReasonOptions(RECHAZADO_REASONS);
    } else {
      setReasonOptions([]);
    }
  };

  const handleSaveTipify = () => {
    if (selectedForTipify) {
      const updated: any = { ...selectedForTipify, status: tipifyStatus };
      if (tipifyStatus === 'RECLUTADO' && startDate) {
        updated.startDate = startTime ? `${startDate} ${startTime}` : startDate;
      }
      if (tipifyStatus === 'INTERESADO' && meetingDate) {
        updated.meetingDate = meetingTime ? `${meetingDate} ${meetingTime}` : meetingDate;
      }
      updateApplicant(selectedForTipify.id, updated);
    }
    setIsTipifyModalOpen(false);
  };

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

        {/* Sub-componente que solo se re-renderiza cuando hay cambios en postulantes */}
        <KanbanBoard companyFilter={companyFilter} onSelectForTipify={handleSelectForTipify} />
      </div>

      {/* Modal de tipificación - managed by parent, NO se re-renderiza con cambios de datos */}
      <Modal className="tipify-modal" isOpen={isTipifyModalOpen} title="Tipificar" onClose={() => setIsTipifyModalOpen(false)}>
        {selectedForTipify && (
          <div className="tipify-form">
            <label htmlFor="status-select">Seleccionar estado</label>
            <select
              id="status-select"
              value={tipifyStatus}
              onChange={(e) => handleTipifyStatusChange(e.target.value)}
            >
              <option value="">Tipifica</option>
              {TIPIFY_STATUSES.map(s => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
            {tipifyStatus === 'RECLUTADO' && (
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
                    reasonOptions.map(r => (
                      <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                    ))
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
              <button onClick={handleSaveTipify}>Guardar</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
