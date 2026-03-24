import React from 'react';
import { BiEdit, BiBlock, BiUserPlus, BiFile } from 'react-icons/bi';
import type { Applicant } from '@compartido/tipos';

interface ApplicantsTableRowProps {
  applicant: Applicant;
  onEdit?: (applicant: Applicant) => void;
  onHire?: (applicant: Applicant) => void; // optional, hide button when undefined
  onBlacklist?: (applicant: Applicant) => void;
  onContract?: (applicant: Applicant) => void;
  showStatus?: boolean;
}

export const ApplicantsTableRow: React.FC<ApplicantsTableRowProps> = ({
  applicant,
  onEdit,
  onHire,
  onBlacklist,
  onContract,
  showStatus = true,
}) => {
  return (
    <tr>
      <td className="applicant-name">{applicant.fullName}</td>
      <td>{applicant.phoneMobile}</td>
      <td>{applicant.documentType}</td>
      <td>{applicant.documentNumber}</td>
      <td>{applicant.positionOfInterest?.replace(/_/g, ' ')}</td>
      <td className={`company-cell ${applicant.company?.toLowerCase()}`}>{applicant.company}</td>
      {showStatus && (
        <td 
          className={`status-cell${(applicant.status === 'NO_INTERESADO' || applicant.status === 'RECHAZADO') && applicant.rejectionReason ? ' has-tooltip' : ''}`}
          data-tooltip={(applicant.status === 'NO_INTERESADO' || applicant.status === 'RECHAZADO') && applicant.rejectionReason 
            ? `${applicant.rejectionReason?.replace(/_/g, ' ')}` 
            : ''
          }
          data-status={applicant.status}
        >
          {applicant.status || 'POR_RECLUTAR'}
        </td>
      )}
      <td>{applicant.campaign}</td>
      <td className="cell-actions">
        {onEdit && (
        <button className="action-btn edit-btn" onClick={() => { onEdit(applicant); }} title="Editar">
          <BiEdit />
        </button>
        )}
        {onHire && (
        <button className="action-btn hire-btn" onClick={() => onHire(applicant)} title="Contratar">
          <BiUserPlus />
        </button>
      )}
        {onContract && (
          <button className="action-btn contract-btn" onClick={() => onContract(applicant)} title="Contratar">
            <BiFile />
          </button>
        )}
        {onBlacklist && applicant.status !== 'LISTA_NEGRA' && (
          <button className="action-btn blacklist-btn" onClick={() => onBlacklist(applicant)} title="Lista negra">
            <BiBlock />
          </button>
        )}
      </td>
    </tr>
  );
};
