import React, { useEffect, useState } from 'react';
import { loadApplicantsFromStorage, saveApplicantsToStorage } from '@utils/localStorage';
import type { Applicant } from '@types';
import { Card } from '@molecules/Card';
import { Modal } from '@molecules/Modal';
import './TrainingDashboard.css';

export const TrainingDashboard: React.FC = () => {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [companyFilter, setCompanyFilter] = useState<'WIN' | 'CLARO'>('WIN');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [currentRejectId, setCurrentRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const rejectOptions: string[] = []; // aún no se define lista

  useEffect(() => {
    const stored = loadApplicantsFromStorage();
    if (stored) {
      setApplicants(stored);
    }
  }, []);

  const filtered = applicants.filter(
    (a) => a.company === companyFilter && a.status === 'EN_PROCESO'
  );

  const handleDecision = (
    id: string,
    decision: 'APROBADO' | 'RECHAZADO',
    reason?: string
  ) => {
    setApplicants(prev => {
      const updated = prev.map(a =>
        a.id === id
          ? {
              ...a,
              status: decision,
              ...(decision === 'RECHAZADO' && reason ? { rejectionReason: reason } : {}),
            }
          : a
      );
      saveApplicantsToStorage(updated);
      return updated;
    });
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
                <div className="training-actions">
                  <button
                    className="btn-approved"
                    onClick={() => handleDecision(a.id, 'APROBADO')}
                  >
                    APROBADO
                  </button>
                  <button
                    className="btn-rejected"
                    onClick={() => {
                      setCurrentRejectId(a.id);
                      setRejectReason('');
                      setIsRejectModalOpen(true);
                    }}
                  >
                    RECHAZADO
                  </button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="training-empty">No hay postulantes en proceso</div>
        )}
      </div>

      <Modal
        isOpen={isRejectModalOpen}
        title="Motivo de rechazo"
        onClose={() => setIsRejectModalOpen(false)}
      >
        <div className="tipify-form">
          <label htmlFor="reject-reason-select">Motivo</label>
          <select
            id="reject-reason-select"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          >
            {rejectOptions.length ? (
              rejectOptions.map(r => <option key={r} value={r}>{r}</option>)
            ) : (
              <option value="">(aún no se define la lista)</option>
            )}
          </select>
          <div className="modal-actions">
            <button onClick={() => setIsRejectModalOpen(false)}>Cancelar</button>
            <button
              onClick={() => {
                if (currentRejectId) {
                  handleDecision(currentRejectId, 'RECHAZADO', rejectReason);
                }
                setIsRejectModalOpen(false);
              }}
            >Guardar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TrainingDashboard;
