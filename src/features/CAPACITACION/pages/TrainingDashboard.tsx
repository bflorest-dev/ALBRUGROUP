import React, { useState } from 'react';
import { BiCalendar } from 'react-icons/bi';
import { useApplicants } from '@contexts/ApplicantsContext';
import { useApplicantsSync } from '@hooks/useApplicantsSync';
import type { Applicant } from '@types';
import { Card } from '@molecules/Card';
import { Modal } from '@molecules/Modal';
import './TrainingDashboard.css';

const REJECTION_REASONS = [
  'POCA FLUIDEZ VERBAL',
  'INEXPERIENCIA',
  'PROBLEMAS CON HORARIOS',
  'DISTANCIA TIEMPO',
  'BENEFICIOS PLANILLA',
  'SALARIO BASE',
  'MALA EXPERENCIA',
  'RUBRO DE LA EMPRESA',
  'RECIBIO MEJOR PROPUESTA',
];

// Sub-componente que solo se re-renderiza cuando hay cambios en postulantes
interface TrainingListProps {
  companyFilter: 'WIN' | 'CLARO';
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

const TrainingList: React.FC<TrainingListProps> = ({ companyFilter, onAccept, onReject }) => {
  // Este hook sincroniza con cambios en applicantes y fuerza re-render solo en este componente
  const { applicants } = useApplicantsSync();

  const filtered = applicants.filter(
    (a) => a.company === companyFilter && a.status === 'POR_CAPACITAR'
  );

  return (
    <div className="training-list">
      {filtered.length ? (
        filtered.map((a) => (
          <Card key={a.id} className="training-item">
            <div className="training-card">
              <div className="training-avatar">
                {a.fullName ? a.fullName.charAt(0) : '?'}
              </div>
              <div className="training-info">
                <strong className="training-name">{a.fullName}</strong>
                {a.positionOfInterest && (
                  <span className="role-pill">{a.positionOfInterest}</span>
                )}
                <div className="training-doc">
                  <span className="doc-badge">{a.documentType}</span>
                  <span className="doc-number">{a.documentNumber}</span>
                </div>
              </div>
              {a.startDate && (
                <div className="training-badge">
                  <div className="badge-date">{a.startDate.includes(' ') ? a.startDate.split(' ')[0] : a.startDate}</div>
                  <div className="badge-time">{a.startDate.includes(' ') ? a.startDate.split(' ')[1] : ''}</div>
                </div>
              )}
              <div className="training-actions">
                <button
                  className="btn-approved"
                  onClick={() => onAccept(a.id)}
                  title="Aprobar"
                >
                  APROBAR
                </button>
                <button
                  className="btn-rejected"
                  onClick={() => onReject(a.id)}
                  title="Rechazar"
                >
                  RECHAZAR
                </button>
              </div>
            </div>
          </Card>
        ))
      ) : (
        <div className="training-empty">No hay postulantes en proceso</div>
      )}
    </div>
  );
};

// Componente padre que maneja modales y filtros (NO se re-renderiza con cambios de datos)
export const TrainingDashboard: React.FC = () => {
  const { applicants, updateApplicant } = useApplicants();
  const [companyFilter, setCompanyFilter] = useState<'WIN' | 'CLARO'>('WIN');

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleAccept = (id: string) => {
    const applicant = applicants.find(a => a.id === id);
    if (applicant) {
      // Guardar internamente como POR_CONTRATAR pero mostrar APROBADO al usuario
      updateApplicant(id, { ...applicant, status: 'POR_CONTRATAR' });
    }
  };

  const handleReject = (id: string) => {
    setSelectedId(id);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const submitRejection = () => {
    if (selectedId) {
      const applicant = applicants.find(a => a.id === selectedId);
      if (applicant) {
        updateApplicant(selectedId, { 
          ...applicant, 
          status: 'RECHAZADO',
          rejectionReason: rejectionReason
        });
      }
    }
    setIsRejectModalOpen(false);
    setSelectedId(null);
  };

  return (
    <div className="training-root">
      <div className="company-tabs">
        <button
          className={companyFilter === 'CLARO' ? 'active' : ''}
          onClick={() => setCompanyFilter('CLARO')}
        >
          CLARO
        </button>
        <button
          className={companyFilter === 'WIN' ? 'active' : ''}
          onClick={() => setCompanyFilter('WIN')}
        >
          WIN
        </button>
      </div>

      {/* Sub-componente que solo se re-renderiza cuando hay cambios en postulantes */}
      <TrainingList companyFilter={companyFilter} onAccept={handleAccept} onReject={handleReject} />

      {/* Modal de rechazo - managed by parent, NO se re-renderiza con cambios de datos */}
      <Modal isOpen={isRejectModalOpen} title="Motivo de rechazo" onClose={() => setIsRejectModalOpen(false)}>
        <div className="reject-form">
          <label htmlFor="reason" className="reject-label">Selecciona el motivo:</label>
          <select
            id="reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="reject-select"
          >
            <option value="">¿Cuál es el motivo del rechazo?</option>
            {REJECTION_REASONS.map((r) => (
              <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <div className="modal-actions">
            <button onClick={() => setIsRejectModalOpen(false)} className="btn-cancel">
              Cancelar
            </button>
            <button onClick={submitRejection} className="btn-reject-action" disabled={!rejectionReason}>
              RECHAZAR
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TrainingDashboard;
