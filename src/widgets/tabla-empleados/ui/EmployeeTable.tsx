/**
 * Componente EmployeeTable
 */

import { useState } from 'react';
import type { Employee } from '@shared/types';
import { BiShow, BiPencil, BiFilter, BiSortAlt2 } from 'react-icons/bi';
// DEPRECATED: StatusBadge fue eliminado
// import { StatusBadge } from '@shared/ui/atomos/etiquetas';
type StatusBadge = any; // Placeholder
import './EmployeeTable.css';

interface EmployeeTableProps {
  employees: Employee[];
  onAction?: (employee: Employee, action: string) => void;
  onCheckout?: (employee: Employee) => void;
  onActivate?: (employee: Employee) => void;
  onStatusChange?: (employee: Employee, newStatus: string) => void;
  isInactiveTable?: boolean;
}

export const EmployeeTable = ({ employees, onAction, onStatusChange, isInactiveTable = false }: EmployeeTableProps) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({
    name: '',
    docType: '',
    docNum: '',
    role: '',
    phone: '',
    date: '',
    status: '',
  });

  const handleViewAction = (employee: Employee) => {
    setSelectedEmployeeId(String(employee.id));
    onAction?.(employee, 'view');
  };

  const handleEditAction = (employee: Employee) => {
    setSelectedEmployeeId(String(employee.id));
    onAction?.(employee, 'edit');
  };

  const handleStatusClick = (employee: Employee) => {
    const newStatus = employee.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    onStatusChange?.(employee, newStatus);
  };

  const handleFilterChange = (filterKey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      name: '',
      docType: '',
      docNum: '',
      role: '',
      phone: '',
      date: '',
      status: '',
    });
    setActiveFilter(null);
  };

  let filteredEmployees = employees.filter(emp => {
    if (filters.name && !(emp.fullName ?? '').toLowerCase().includes(filters.name.toLowerCase())) return false;
    if (filters.docType && emp.documentType !== filters.docType) return false;
    if (filters.docNum && !emp.documentNumber?.includes(filters.docNum)) return false;
    if (filters.role && emp.position !== filters.role) return false;
    if (filters.phone && !emp.phoneMobile?.includes(filters.phone)) return false;
    if (filters.date && !emp.startDate?.includes(filters.date)) return false;
    if (filters.status && emp.status !== filters.status) return false;
    return true;
  });

  if (sortOrder) {
    filteredEmployees = [...filteredEmployees].sort((a, b) => {
      const nameA = (a.fullName ?? '').toLowerCase();
      const nameB = (b.fullName ?? '').toLowerCase();
      if (sortOrder === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });
  }

  const uniqueDocTypes = Array.from(new Set(employees.map(e => e.documentType).filter(Boolean)));
  const uniqueRoles = Array.from(new Set(employees.map(e => e.position).filter(Boolean)));
  const uniqueStatuses = Array.from(new Set(employees.map(e => e.status).filter(Boolean)));

  const hasActiveFilters = Object.values(filters).some(f => f !== '');

  return (
    <div className="table-container">
      {hasActiveFilters && (
        <div className="active-filters-bar">
          <div className="active-filters-info">
            <span className="filter-count">Mostrando {filteredEmployees.length} de {employees.length} empleados</span>
            <button className="clear-all-filters-btn" onClick={handleClearFilters}>
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      <table className="employee-table">
        <thead>
          <tr>
            <th>
              <div className="th-content">
                <span>NOMBRE</span>
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
                <span>TIPO DOCUMENTO</span>
                <div className="filter-dropdown-container">
                  <button 
                    className={`filter-header-btn ${activeFilter === 'docType' ? 'active' : ''}`}
                    title="Filtrar"
                    onClick={() => setActiveFilter(activeFilter === 'docType' ? null : 'docType')}
                  >
                    <BiFilter size={14} />
                  </button>
                  {activeFilter === 'docType' && (
                    <div className="filter-dropdown">
                      <select
                        value={filters.docType}
                        onChange={(e) => handleFilterChange('docType', e.target.value)}
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
          {filteredEmployees.map((employee) => (
            <tr key={employee.id} className={selectedEmployeeId === employee.id ? 'selected' : ''}>
              <td className="employee-name">{employee.fullName}</td>
              <td>{employee.documentType}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

