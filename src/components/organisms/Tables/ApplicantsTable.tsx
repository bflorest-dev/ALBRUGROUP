/**
 * Componente ApplicantsTable - Tabla de postulantes
 */

import { useState } from 'react';
import { BiEdit, BiCheckCircle, BiBlock, BiFilter, BiSortAlt2 } from 'react-icons/bi';
import type { Applicant } from '../../../types';
import './ApplicantsTable.css';

interface ApplicantsTableProps {
  applicants: Applicant[];
  onEdit: (applicant: Applicant) => void;
  onHire: (applicant: Applicant) => void;
  onBlacklist: (applicant: Applicant) => void;
}

export const ApplicantsTable = ({ applicants, onEdit, onHire, onBlacklist }: ApplicantsTableProps) => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({
    name: '',
    documentType: '',
    documentNumber: '',
    position: '',
    phone: '',
    modality: '',
    campaign: '',
  });

  const handleFilterChange = (filterKey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      name: '',
      documentType: '',
      documentNumber: '',
      position: '',
      phone: '',
      modality: '',
      campaign: '',
    });
    setActiveFilter(null);
  };

  // Aplicar filtros a los postulantes
  let filteredApplicants = applicants.filter(app => {
    if (filters.name && !app.fullName.toLowerCase().includes(filters.name.toLowerCase())) return false;
    if (filters.documentType && app.documentType !== filters.documentType) return false;
    if (filters.documentNumber && !app.documentNumber.includes(filters.documentNumber)) return false;
    if (filters.position && app.positionOfInterest !== filters.position) return false;
    if (filters.phone && !app.phoneMobile.includes(filters.phone)) return false;
    if (filters.modality && app.modality !== filters.modality) return false;
    if (filters.campaign && app.campaign !== filters.campaign) return false;
    return true;
  });

  // Aplicar ordenamiento
  if (sortOrder) {
    filteredApplicants = [...filteredApplicants].sort((a, b) => {
      const aName = a.fullName.toLowerCase();
      const bName = b.fullName.toLowerCase();
      return sortOrder === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
    });
  }

  const hasActiveFilters = Object.values(filters).some(f => f !== '');

  // Obtener valores únicos para los selects
  const uniqueDocTypes = Array.from(new Set(applicants.map(app => app.documentType)));
  const uniquePositions = Array.from(new Set(applicants.map(app => app.positionOfInterest)));
  const uniqueModalities = Array.from(new Set(applicants.map(app => app.modality)));
  const uniqueCampaigns = Array.from(new Set(applicants.map(app => app.campaign)));
  return (
    <div className="applicants-table-container">
      {/* Panel de filtros activos */}
      {hasActiveFilters && (
        <div className="active-filters-bar">
          <div className="active-filters-info">
            <span className="filter-count">Mostrando {filteredApplicants.length} de {applicants.length} postulantes</span>
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
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </th>
            <th>
              <div className="th-content">
                <span>Modalidad</span>
                <div className="filter-dropdown-container">
                  <button 
                    className={`filter-header-btn ${activeFilter === 'modality' ? 'active' : ''}`}
                    title="Filtrar"
                    onClick={() => setActiveFilter(activeFilter === 'modality' ? null : 'modality')}
                  >
                    <BiFilter size={14} />
                  </button>
                  {activeFilter === 'modality' && (
                    <div className="filter-dropdown">
                      <select
                        value={filters.modality}
                        onChange={(e) => handleFilterChange('modality', e.target.value)}
                        className="filter-select"
                        autoFocus
                      >
                        <option value="">Todos</option>
                        {uniqueModalities.map((mod) => (
                          <option key={mod} value={mod}>{mod}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </th>
            <th>
              <div className="th-content">
                <span>Campaña</span>
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
          {filteredApplicants.map((applicant, index) => (
            <tr key={applicant.id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
              <td className="cell-name">
                <div className="name-with-avatar">
                  <div className="avatar">
                    {applicant.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <span>{applicant.fullName}</span>
                </div>
              </td>
              <td>{applicant.phoneMobile}</td>
              <td>{applicant.documentType}</td>
              <td>{applicant.documentNumber}</td>
              <td>{applicant.positionOfInterest}</td>
              <td>{applicant.modality}</td>
              <td>{applicant.campaign}</td>
              <td className="cell-actions">
                <button
                  className="action-btn edit-btn"
                  onClick={() => onEdit(applicant)}
                  title="Editar postulante"
                >
                  <BiEdit size={18} />
                </button>
                <button
                  className="action-btn hire-btn"
                  onClick={() => onHire(applicant)}
                  title="Pasar a empleado"
                >
                  <BiCheckCircle size={18} />
                </button>
                <button
                  className="action-btn blacklist-btn"
                  onClick={() => onBlacklist(applicant)}
                  title="Pasar a lista negra"
                >
                  <BiBlock size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredApplicants.length === 0 && (
        <div className="empty-state">
          <p>{hasActiveFilters ? 'No hay postulantes que coincidan con los filtros' : 'No hay postulantes registrados'}</p>
        </div>
      )}
    </div>
  );
};
