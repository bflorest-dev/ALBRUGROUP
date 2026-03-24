/**
 * Componente ApplicantsTable
 */

import { BiFilter, BiSortAlt2, BiSearch } from 'react-icons/bi';
import type { Applicant } from '@compartido/tipos';
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

export const ApplicantsTable = ({ applicants, onEdit, onHire: _onHire, onBlacklist, onContract: _onContract, showStatus = true, searchTerm, onSearchChange }: ApplicantsTableProps) => {
  const displayStatus = showStatus;
  
  // Skip internal table filtering when data is already paginated from parent
  // Just use the applicants prop directly without the hook's re-filtering
  const hasActiveFilters = false;
  const activeFilter = null;
  const setActiveFilter = (_filter: string | null) => {};
  const sortOrder = null;
  const setSortOrder = (_order: 'asc' | 'desc' | null) => {};
  const handleClearFilters = () => {};
  const handleFilterChange = (_field: string, _value: string) => {};
  const filters = {
    phone: '',
    documentType: '',
    documentNumber: '',
    position: '',
    company: '',
    status: '',
    campaign: '',
  };
  const uniqueDocTypes: string[] = [];
  const uniquePositions: string[] = [];
  const uniqueCampaigns: string[] = [];
  const uniqueCompanies: string[] = [];
  const uniqueStatuses: string[] = [];

  return (
    <div className="applicants-table-container">
      {searchTerm !== undefined && onSearchChange && (
        <div className="table-search-container">
          <BiSearch className="search-icon" size={16} />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={e => onSearchChange!(e.target.value)}
            className="search-input"
          />
        </div>
      )}
      {hasActiveFilters && (
        <div className="active-filters-bar">
          <div className="active-filters-info">
            <span className="filter-count">Mostrando {applicants.length} postulantes</span>
            <button className="clear-all-filters-btn" onClick={handleClearFilters}>
              Limpiar filtros
            </button>
          </div>
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
          {applicants.map((applicant) => (
            <ApplicantsTableRow
              key={applicant.id}
              applicant={applicant}
              onEdit={onEdit}
              onBlacklist={onBlacklist}
              showStatus={displayStatus}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
