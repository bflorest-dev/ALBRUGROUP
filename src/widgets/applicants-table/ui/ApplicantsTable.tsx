/**
 * Componente ApplicantsTable
 */

/* eslint-disable no-restricted-syntax */
// TODO: Migrar estructura visual a primitives del design-system con cva + cn.

import { useMemo, useState } from 'react';
import { BiFilter, BiSortAlt2, BiSearch } from 'react-icons/bi';
import type { Applicant } from '@shared/types';
import './ApplicantsTable.css';
import { ApplicantsTableRow } from './ApplicantsTableRow';

interface ApplicantsTableProps {
  applicants: Applicant[];
  onEdit?: (applicant: Applicant) => void;
  onHire?: (applicant: Applicant) => void;
  onBlacklist?: (applicant: Applicant) => void;
  onContract?: (applicant: Applicant) => void;
  // show status column? default true
  showStatus?: boolean;
  // search control
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
}

export const ApplicantsTable = ({ applicants, onEdit, onHire, onBlacklist, onContract, showStatus = true, searchTerm, onSearchChange }: ApplicantsTableProps) => {
  // TODO: Migrar tabla a componente DS con cva + cn
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [activeFilter, setActiveFilter] = useState<'phone' | 'documentType' | null>(null);
  const [filters, setFilters] = useState({
    phone: '',
    documentType: '',
  });

  const handleFilterChange = (filterKey: keyof typeof filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }));
  };

  const uniqueDocTypes = useMemo(
    () =>
      Array.from(
        new Set(
          applicants
            .map((applicant) => applicant.documentType)
            .filter((documentType): documentType is string => Boolean(documentType))
        )
      ),
    [applicants]
  );

  const filteredApplicants = useMemo(() => {
    let result = [...applicants];

    if (searchTerm && searchTerm.trim().length > 0) {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      result = result.filter((applicant) =>
        String(applicant.fullName ?? '').toLowerCase().includes(normalizedSearch)
      );
    }

    if (filters.phone) {
      result = result.filter((applicant) =>
        String(applicant.phoneMobile ?? '').includes(filters.phone)
      );
    }

    if (filters.documentType) {
      result = result.filter(
        (applicant) => String(applicant.documentType ?? '') === filters.documentType
      );
    }

    if (sortOrder) {
      result = [...result].sort((a, b) => {
        const aName = String(a.fullName ?? '').toLowerCase();
        const bName = String(b.fullName ?? '').toLowerCase();
        return sortOrder === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
      });
    }

    return result;
  }, [applicants, searchTerm, filters.phone, filters.documentType, sortOrder]);

  const displayStatus = showStatus;

  return (
    <div className="applicants-table-container">
      {searchTerm !== undefined && onSearchChange && (
        <div className="table-search-container">
          <BiSearch className="search-icon" size={16} />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
        </div>
      )}
      <table className="applicants-table">
        <thead>
          <tr>
            <th>
              <div className="th-content">
                <span>Nombres Completos</span>
                <button 
                  className={`sort-header-btn ${sortOrder ? 'active' : ''}`}
                  title={sortOrder === 'asc' ? 'Ordenar Z-A' : sortOrder === 'desc' ? 'Sin orden' : 'Ordenar A-Z'}
                  onClick={() => {
                    if (sortOrder === 'asc') {
                      setSortOrder('desc');
                    } else if (sortOrder === 'desc') {
                      setSortOrder(null);
                    } else {
                      setSortOrder('asc');
                    }
                  }}
                >
                  <BiSortAlt2 size={14} />
                </button>
              </div>
            </th>
            <th>
              <div className="th-content">
                <span>Celular Personal</span>
                <div className="filter-dropdown-container">
                  <button 
                    className={`filter-header-btn ${activeFilter === 'phone' ? 'active' : ''}`}
                    title="Filtrar"
                    onClick={() => setActiveFilter(activeFilter === 'phone' ? null : 'phone')}
                  >
                    <BiFilter size={14} />
                  </button>
                  {activeFilter === 'phone' && (
                    <div className="filter-dropdown">
                      <input
                        type="text"
                        placeholder="Buscar celular..."
                        value={filters.phone}
                        onChange={(e) => handleFilterChange('phone', e.target.value)}
                        className="filter-input"
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              </div>
            </th>
            <th>
              <div className="th-content">
                <span>Tipo de Documento</span>
                <div className="filter-dropdown-container">
                  <button 
                    className={`filter-header-btn ${activeFilter === 'documentType' ? 'active' : ''}`}
                    title="Filtrar"
                    onClick={() => setActiveFilter(activeFilter === 'documentType' ? null : 'documentType')}
                  >
                    <BiFilter size={14} />
                  </button>
                  {activeFilter === 'documentType' && (
                    <div className="filter-dropdown">
                      <select
                        value={filters.documentType}
                        onChange={(e) => handleFilterChange('documentType', e.target.value)}
                        className="filter-select"
                        autoFocus
                      >
                        <option value="">Todos</option>
                        {uniqueDocTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredApplicants.map((applicant) => (
            <ApplicantsTableRow
              key={applicant.id}
              applicant={applicant}
              onEdit={onEdit}
              onHire={onHire}
              onBlacklist={onBlacklist}
              onContract={onContract}
              showStatus={displayStatus}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

