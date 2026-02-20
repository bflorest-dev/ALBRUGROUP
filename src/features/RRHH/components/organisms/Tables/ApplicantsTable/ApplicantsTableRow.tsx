import React from 'react';
import { BiEdit, BiBlock, BiUserPlus } from 'react-icons/bi';
import type { Applicant } from '../../../../../../types';

interface ApplicantsTableRowProps {
  applicant: Applicant;
  onEdit: (applicant: Applicant) => void;
  onHire: (applicant: Applicant) => void;
  onBlacklist: (applicant: Applicant) => void;
}

export const ApplicantsTableRow: React.FC<ApplicantsTableRowProps> = ({
  applicant,
  onEdit,
  onHire,
  onBlacklist,
}) => {
  return (
    <tr>
      <td>{applicant.fullName}</td>
      <td>{applicant.phoneMobile}</td>
      <td>{applicant.documentType}</td>
      <td>{applicant.documentNumber}</td>
      <td>{applicant.positionOfInterest}</td>
      <td className={`company-cell ${applicant.company?.toLowerCase()}`}>{applicant.company}</td>
      <td>{applicant.status || 'POSTULANTE'}</td>
      <td>{applicant.campaign}</td>
      <td>
        <button onClick={() => onEdit(applicant)} title="Editar">
          <BiEdit />
        </button>
        <button onClick={() => onHire(applicant)} title="Contratar">
          <BiUserPlus />
        </button>
        <button onClick={() => onBlacklist(applicant)} title="Lista negra">
          <BiBlock />
        </button>
      </td>
    </tr>
  );
};
