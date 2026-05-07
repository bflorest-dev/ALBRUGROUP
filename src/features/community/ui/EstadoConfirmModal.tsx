import React from 'react';

interface EstadoConfirmModalProps {
  open: boolean;
  submitting: boolean;
  errorMessage?: string;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export const EstadoConfirmModal: React.FC<EstadoConfirmModalProps> = ({
  open,
  submitting,
  errorMessage,
  onCancel,
  onConfirm,
  title = 'Confirmar cambio de estado',
  message = '¿Seguro que quieres activar/desactivar este elemento?',
}) => {
  if (!open) {
    return null;
  }

  return (
    <div className="community-modal-overlay" role="presentation">
      <div
        className="community-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="community-estado-modal-title"
      >
        <h3 id="community-estado-modal-title">{title}</h3>
        <p>{message}</p>

        {errorMessage ? <div className="community-error">{errorMessage}</div> : null}

        <div className="community-actions">
          <button type="button" className="community-btn ghost" onClick={onCancel} disabled={submitting}>
            Cancelar
          </button>
          <button type="button" className="community-btn primary" onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Aplicando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};