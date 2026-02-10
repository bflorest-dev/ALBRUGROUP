/**
 * Componente EmployeeDashboard - Página principal del dashboard
 */

import { useState, useMemo } from 'react';
import { BiDownload, BiSearch } from 'react-icons/bi';
import { StatCard } from '../molecules/StatCard';
import { EmployeeTable } from '../organisms/Tables';
import { Pagination } from '../molecules/Pagination';
import { Modal } from '../molecules/Modal';
import { NewEmployeeForm, EmployeeDetailForm, EmployeeCheckoutForm, ActivateEmployeeModal } from '../organisms/Forms';
import { Header } from '../organisms/Layout/Header';
import { useNotification } from '../../contexts/useNotification';
import { useData } from '../../contexts/DataContext';
import { usePagination } from '../../hooks/usePagination';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import type { Employee, NewEmployeeFormData, EmployeeDetailFormData } from '../../types';
import {
  mockStatistics,
  ITEMS_PER_PAGE,
  TOTAL_ITEMS,
} from '../../utils/mockData';
import './EmployeeDashboard.css';

export const EmployeeDashboard = () => {
  const { employees, setEmployees, addEmployee } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [detailMode, setDetailMode] = useState<'view' | 'edit'>('view');
  const { showSuccess, showError } = useNotification();
  const { handleError } = useErrorHandler();
  
  const pagination = usePagination({
    totalItems: TOTAL_ITEMS,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  // Calcular empleados filtrados por búsqueda (sin paginación)
  const filteredEmployees = useMemo(() => {
    let filtered = employees;

    // Aplicar búsqueda si existe - buscar por nombre, celular y número de documento
    if (searchTerm) {
      filtered = filtered.filter((emp) =>
        emp.fullName.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
        emp.documentNumber?.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
        emp.phoneMobile?.toLowerCase().startsWith(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [searchTerm, employees]);

  // Filtrar y paginar empleados
  const paginatedEmployees = useMemo(() => {
    // Aplicar paginación a los empleados filtrados
    const { startIndex, endIndex } = pagination;
    return filteredEmployees.slice(startIndex, endIndex);
  }, [filteredEmployees, pagination]);

  const handleEmployeeAction = (employee: Employee, action: string) => {
    setSelectedEmployee(employee);
    setDetailMode(action === 'edit' ? 'edit' : 'view');
    setDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmitForm = (formData: NewEmployeeFormData) => {
    try {
      console.log('Nuevo empleado:', formData);

      // Validación adicional
      if (!formData.fullName || formData.fullName.trim().length < 2) {
        throw new Error('El nombre completo debe tener al menos 2 caracteres');
      }

      if (!formData.documentNumber || formData.documentNumber.length < 8) {
        throw new Error('El número de documento debe tener al menos 8 dígitos');
      }

      // Crear nuevo empleado con datos del formulario
      const newEmployee: Employee = {
        id: Math.random().toString(36).substr(2, 9),
        initials: formData.fullName
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        fullName: formData.fullName,
        position: formData.role || '-',
        department: formData.role || '-',
        status: 'ACTIVO' as const,
      documentType: formData.documentType,
      documentNumber: formData.documentNumber,
      nationality: formData.nationality,
      birthDate: formData.birthDate,
      civilStatus: formData.civilStatus,
      hasChildren: formData.hasChildren,
      district: formData.district,
      address: formData.address,
      phoneFixed: formData.phoneFixed,
      phoneMobile: formData.phoneMobile,
      phoneWork: formData.phoneWork,
      personalEmail: formData.personalEmail,
      bank: formData.bank,
      accountNumber: formData.accountNumber,
      interbankNumber: formData.interbankNumber,
      startDate: formData.startDate,
      modality: formData.modality,
      scheduleType: formData.scheduleType,
      googleEmail: formData.googleEmail,
    };
    
    // Agregar el nuevo empleado a través del contexto
    addEmployee(newEmployee);
    setIsModalOpen(false);
    showSuccess(`Empleado ${newEmployee.fullName} registrado exitosamente`);
    } catch (error) {
      // Manejar errores usando el hook useErrorHandler
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al registrar empleado';
      handleError(error instanceof Error ? error : new Error(errorMessage), {
        componentStack: 'EmployeeDashboard.handleSubmitForm'
      });
      showError(`Error: ${errorMessage}`);
    }
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleEditEmployeeSubmit = (formData: EmployeeDetailFormData) => {
    if (!selectedEmployee) return;

    console.log('Empleado actualizado:', formData);
    
    // Actualizar el empleado en la lista
    const updatedEmployees = employees.map(emp => {
      if (emp.id === selectedEmployee.id) {
        return {
          ...emp,
          fullName: formData.fullName || emp.fullName,
          position: formData.position || emp.position,
          department: formData.department || emp.department,
          documentType: formData.documentType || emp.documentType,
          documentNumber: formData.documentNumber || emp.documentNumber,
          nationality: formData.nationality || emp.nationality,
          birthDate: formData.birthDate || emp.birthDate,
          civilStatus: formData.civilStatus || emp.civilStatus,
          hasChildren: formData.hasChildren !== undefined ? formData.hasChildren : emp.hasChildren,
          district: formData.district || emp.district,
          address: formData.address || emp.address,
          phoneFixed: formData.phoneFixed || emp.phoneFixed,
          phoneMobile: formData.phoneMobile || emp.phoneMobile,
          phoneWork: formData.phoneWork || emp.phoneWork,
          personalEmail: formData.personalEmail || emp.personalEmail,
          bank: formData.bank || emp.bank,
          accountNumber: formData.accountNumber || emp.accountNumber,
          interbankNumber: formData.interbankNumber || emp.interbankNumber,
          startDate: formData.startDate || emp.startDate,
          endDate: formData.endDate || emp.endDate,
          modality: formData.modality || emp.modality,
          scheduleType: formData.scheduleType || emp.scheduleType,
          googleEmail: formData.googleEmail || emp.googleEmail,
        };
      }
      return emp;
    });
    
    setEmployees(updatedEmployees);
    setDetailModalOpen(false);
    const employeeName = selectedEmployee.fullName;
    setSelectedEmployee(null);
    showSuccess(`Cambios de ${employeeName} guardados exitosamente`);
  };

  const handleCheckoutEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setCheckoutModalOpen(true);
  };

  const handleCloseCheckoutModal = () => {
    setCheckoutModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleCheckoutSubmit = (checkoutDate: string, checkoutReason: string) => {
    if (!selectedEmployee) return;

    console.log('Empleado dado de baja:', {
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.fullName,
      checkoutDate,
      checkoutReason,
    });
    
    // Actualizar el estado del empleado a INACTIVO
    const updatedEmployees = employees.map(emp => {
      if (emp.id === selectedEmployee.id) {
        return {
          ...emp,
          status: 'INACTIVO' as const,
          endDate: checkoutDate,
        };
      }
      return emp;
    });
    
    setEmployees(updatedEmployees);
    setCheckoutModalOpen(false);
    const employeeName = selectedEmployee.fullName;
    setSelectedEmployee(null);
    showSuccess(`${employeeName} ha sido dado de baja correctamente`);
  };

  const handleActivateEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setActivateModalOpen(true);
  };

  const handleCloseActivateModal = () => {
    setActivateModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleActivateSubmit = (startDate: string, position: string) => {
    if (!selectedEmployee) return;

    console.log('Empleado activado:', {
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.fullName,
      startDate,
      position,
    });
    
    // Actualizar el estado del empleado a ACTIVO con los nuevos datos
    const updatedEmployees = employees.map(emp => {
      if (emp.id === selectedEmployee.id) {
        return {
          ...emp,
          status: 'ACTIVO' as const,
          startDate,
          position,
          endDate: undefined,
        };
      }
      return emp;
    });
    
    setEmployees(updatedEmployees);
    setActivateModalOpen(false);
    const employeeName = selectedEmployee.fullName;
    setSelectedEmployee(null);
    showSuccess(`${employeeName} ha sido activado exitosamente`);
  };

  return (
    <div className="employee-dashboard">
      <Header
        title="Gestión de Empleados"
      />

      <main className="dashboard-content">
        {/* Sección de Estadísticas */}
        <section className="statistics-section">
          <div className="stats-grid">
            {mockStatistics.map((stat, index) => (
              <StatCard key={index} stat={stat} />
            ))}
          </div>
        </section>

        {/* Sección de Directorio */}
        <section className="directory-section">
          <div className="section-header">
            <h2>DIRECTORIO DE PERSONAL</h2>
            <div className="section-controls">
              <div className="search-container">
                <BiSearch className="search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <button className="download-btn" title="Descargar">
                <BiDownload size={18} />
              </button>
            </div>
          </div>

          <EmployeeTable
            employees={paginatedEmployees}
            onAction={handleEmployeeAction}
            onCheckout={handleCheckoutEmployee}
            onActivate={handleActivateEmployee}
          />

          <Pagination
            currentPage={pagination.currentPage}
            totalPages={Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE)}
            totalItems={filteredEmployees.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={pagination.goToPage}
          />
        </section>
      </main>

      <Modal isOpen={isModalOpen} title="Registrar Nuevo Empleado" onClose={handleCloseModal}>
        <NewEmployeeForm onSubmit={handleSubmitForm} onCancel={handleCloseModal} />
      </Modal>

      <Modal 
        isOpen={detailModalOpen} 
        title={detailMode === 'view' ? 'Detalles del Empleado' : 'Editar Empleado'} 
        onClose={handleCloseDetailModal}
      >
        {selectedEmployee && (
          <EmployeeDetailForm
            employee={selectedEmployee}
            onCancel={handleCloseDetailModal}
            onSubmit={handleEditEmployeeSubmit}
            isEditMode={detailMode === 'edit'}
          />
        )}
      </Modal>

      <Modal
        isOpen={checkoutModalOpen}
        title="Dar de Baja a Empleado"
        onClose={handleCloseCheckoutModal}
      >
        {selectedEmployee && (
          <EmployeeCheckoutForm
            employee={selectedEmployee}
            onCancel={handleCloseCheckoutModal}
            onSubmit={handleCheckoutSubmit}
          />
        )}
      </Modal>

      <ActivateEmployeeModal
        isOpen={activateModalOpen}
        employee={selectedEmployee}
        onConfirm={handleActivateSubmit}
        onCancel={handleCloseActivateModal}
      />
    </div>
  );
};
