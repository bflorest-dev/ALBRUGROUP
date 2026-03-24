/**
 * Componente ApplicantsTable (moved to features/RRHH)
 */

import { BiFilter, BiSortAlt2, BiSearch } from 'react-icons/bi';
import type { Applicant } from '@compartido/tipos';
import './ApplicantsTable.css';
import { ApplicantsTableRow } from './ApplicantsTable/ApplicantsTableRow';

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
            <th>
              <div className="th-content">
                <span>Nº Documento</span>
                <div className="filter-dropdown-container">
                  <button 
                    className={`filter-header-btn ${activeFilter === 'documentNumber' ? 'active' : ''}`}
                    title="Filtrar"
                    onClick={() => setActiveFilter(activeFilter === 'documentNumber' ? null : 'documentNumber')}
                  >
                    <BiFilter size={14} />
                  </button>
                  {activeFilter === 'documentNumber' && (
                    <div className="filter-dropdown">
                      <input
                        type="text"
                        placeholder="Buscar número..."
                        value={filters.documentNumber}
                        onChange={(e) => handleFilterChange('documentNumber', e.target.value)}
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
                <span>Puesto de Interés</span>
                <div className="filter-dropdown-container">
                  <button 
                    className={`filter-header-btn ${activeFilter === 'position' ? 'active' : ''}`}
                    title="Filtrar"
                    onClick={() => setActiveFilter(activeFilter === 'position' ? null : 'position')}
                  >
                    <BiFilter size={14} />
                  </button>
                  {activeFilter === 'position' && (
                    <div className="filter-dropdown">
                      <select
                        value={filters.position}
                        onChange={(e) => handleFilterChange('position', e.target.value)}
                        className="filter-select"
                        autoFocus
                      >
                        <option value="">Todos</option>
                        {uniquePositions.map((pos) => (
                          <option key={pos} value={pos}>{pos.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </th>
            <th>
              <div className="th-content">
                <span>COMPAÑÍA</span>
                <div className="filter-dropdown-container">
                  <button 
                    className={`filter-header-btn ${activeFilter === 'company' ? 'active' : ''}`}
                    title="Filtrar"
                    onClick={() => setActiveFilter(activeFilter === 'company' ? null : 'company')}
                  >
                    <BiFilter size={14} />
                  </button>
                  {activeFilter === 'company' && (
                    <div className="filter-dropdown">
                      <select
                        value={filters.company}
                        onChange={(e) => handleFilterChange('company', e.target.value)}
                        className="filter-select"
                        autoFocus
                      >
                        <option value="">Todas</option>
                        {uniqueCompanies.map((comp) => (
                          <option key={comp} value={comp}>{comp}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </th>

            {displayStatus && (
            <th>
              <div className="th-content">
                <span>STATUS</span>
                <div className="filter-dropdown-container">
                  <button 
                    className={`filter-header-btn ${activeFilter === 'status' ? 'active' : ''}`}
                    title="Filtrar"
                    onClick={() => setActiveFilter(activeFilter === 'status' ? null : 'status')}
                  >
                    <BiFilter size={14} />
                  </button>
                  {activeFilter === 'status' && (
                    <div className="filter-dropdown">
                      <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="filter-select"
                        autoFocus
                      >
                        <option value="">Todos</option>
                        {uniqueStatuses.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </th>
            )}
            <th>
              <div className="th-content">
                <span>CAMPAÑA</span>
                <div className="filter-dropdown-container">
                  <button 
                    className={`filter-header-btn ${activeFilter === 'campaign' ? 'active' : ''}`}
                    title="Filtrar"
                    onClick={() => setActiveFilter(activeFilter === 'campaign' ? null : 'campaign')}
                  >
                    <BiFilter size={14} />
                  </button>
                  {activeFilter === 'campaign' && (
                    <div className="filter-dropdown">
                      <select
                        value={filters.campaign}
                        onChange={(e) => handleFilterChange('campaign', e.target.value)}
                        className="filter-select"
                        autoFocus
                      >
                        <option value="">Todos</option>
                        {uniqueCampaigns.map((camp) => (
                          <option key={camp} value={camp}>{camp}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </th>
            <th>
              <span>Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {applicants.length === 0 ? (
            <tr>
              <td colSpan={displayStatus ? 9 : 8} className="empty-state">
                No hay postulantes que mostrar
              </td>
            </tr>
          ) : (
            applicants.map((applicant) => (
              <ApplicantsTableRow
                key={applicant.id}
                applicant={applicant}
                onEdit={onEdit}
                onHire={_onHire}
                onBlacklist={onBlacklist}
                onContract={_onContract}
                showStatus={displayStatus}
              />
            ))
          )}
        </tbody>
      </table>
      {applicants.length === 0 && (
        <div className="empty-state">
          <p>{hasActiveFilters ? 'No hay postulantes que coincidan con los filtros' : 'No hay postulantes registrados'}</p>
        </div>
      )}
    </div>
  );
};