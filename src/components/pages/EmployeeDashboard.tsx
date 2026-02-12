/**
 * Componente EmployeeDashboard - Página principal del dashboard
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { BiDownload, BiSearch } from 'react-icons/bi';
import { StatCard } from '../molecules/StatCard';
import { EmployeeTable } from '../organisms/Tables';
import { Pagination } from '../molecules/Pagination';
import { Modal } from '../molecules/Modal';
import { NewEmployeeForm, EmployeeDetailForm, EmployeeCheckoutForm, ActivateEmployeeModal } from '../organisms/Forms';
import { Header } from '../organisms/Layout/Header';
import { useNotification } from '../../contexts/useNotification';
import { usePagination } from '../../hooks/usePagination';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { EmployeeService } from '../../services/employee.service';
import type { Employee, NewEmployeeFormData, EmployeeDetailFormData, Statistic } from '../../types';
import './EmployeeDashboard.css';

const ITEMS_PER_PAGE = 10;

export const EmployeeDashboard = () => {
  // Estado para empleados y estadísticas
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [statistics, setStatistics] = useState<Statistic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [detailMode, setDetailMode] = useState<'view' | 'edit'>('view');

  // Hooks
  const { showSuccess, showError } = useNotification();
  const { handleError } = useErrorHandler();

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const employeesData = await EmployeeService.getAllEmployees();
      
      // Extraer empleados del objeto paginado
      const employees = Array.isArray(employeesData) ? employeesData : employeesData.employees || [];
      setEmployees(employees);
      
      // Calcular estadísticas localmente (el backend no tiene endpoint para esto)
      const total = employees.length;
      const active = employees.filter(e => e.status === 'ACTIVO').length;
      const inactive = total - active;
      
      setStatistics([
        { label: 'TOTAL EMPLEADOS', value: total },
        { label: 'ACTIVOS', value: active },
        { label: 'INACTIVOS', value: inactive },
      ]);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Error cargando datos'), {
        componentStack: 'EmployeeDashboard.loadInitialData'
      });
      showError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  }, [handleError, showError]);

  const pagination = usePagination({
    totalItems: employees.length,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Calcular empleados filtrados por búsqueda
  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;

    return employees.filter((emp) =>
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.documentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phoneMobile?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, employees]);

  // Filtrar y paginar empleados
  const paginatedEmployees = useMemo(() => {
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

  const handleSubmitForm = async (formData: NewEmployeeFormData) => {
    try {
      const newEmployee = await EmployeeService.createEmployee(formData);

      // Actualizar estado local
      setEmployees(prev => [...prev, newEmployee]);

      // Actualizar estadísticas localmente
      const total = [...employees, newEmployee].length;
      const active = [...employees, newEmployee].filter(e => e.status === 'ACTIVO').length;
      const inactive = total - active;
      
      setStatistics([
        { label: 'TOTAL EMPLEADOS', value: total },
        { label: 'ACTIVOS', value: active },
        { label: 'INACTIVOS', value: inactive },
      ]);

      setIsModalOpen(false);
      showSuccess(`Empleado ${newEmployee.fullName} registrado exitosamente`);
    } catch (error) {
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

  const handleEditEmployeeSubmit = async (formData: EmployeeDetailFormData) => {
    if (!selectedEmployee) return;

    try {
      const updatedEmployee = await EmployeeService.updateEmployee(selectedEmployee.id, formData);

      // Actualizar estado local
      setEmployees(prev => prev.map(emp =>
        emp.id === selectedEmployee.id ? updatedEmployee : emp
      ));

      setDetailModalOpen(false);
      setSelectedEmployee(null);
      showSuccess(`Cambios de ${updatedEmployee.fullName} guardados exitosamente`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar empleado';
      handleError(error instanceof Error ? error : new Error(errorMessage), {
        componentStack: 'EmployeeDashboard.handleEditEmployeeSubmit'
      });
      showError(`Error: ${errorMessage}`);
    }
  };

  const handleCheckoutEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setCheckoutModalOpen(true);
  };

  const handleCloseCheckoutModal = () => {
    setCheckoutModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleCheckoutSubmit = async (checkoutDate: string, checkoutReason: string) => {
    if (!selectedEmployee) return;

    try {
      // Aquí iría la lógica para dar de baja al empleado
      // Por ahora, solo actualizamos localmente
      const updatedEmployee = {
        ...selectedEmployee,
        status: 'INACTIVO' as const,
        endDate: checkoutDate,
        checkoutReason: checkoutReason,
      };

      await EmployeeService.updateEmployee(selectedEmployee.id, updatedEmployee);

      setEmployees(prev => prev.map(emp =>
        emp.id === selectedEmployee.id ? updatedEmployee : emp
      ));

      // Actualizar estadísticas localmente
      const updatedEmployees = employees.map(emp =>
        emp.id === selectedEmployee.id ? updatedEmployee : emp
      );
      const total = updatedEmployees.length;
      const active = updatedEmployees.filter(e => e.status === 'ACTIVO').length;
      const inactive = total - active;
      
      setStatistics([
        { label: 'TOTAL EMPLEADOS', value: total },
        { label: 'ACTIVOS', value: active },
        { label: 'INACTIVOS', value: inactive },
      ]);

      setCheckoutModalOpen(false);
      setSelectedEmployee(null);
      showSuccess(`Empleado ${selectedEmployee.fullName} dado de baja exitosamente`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al dar de baja al empleado';
      handleError(error instanceof Error ? error : new Error(errorMessage), {
        componentStack: 'EmployeeDashboard.handleCheckoutSubmit'
      });
      showError(`Error: ${errorMessage}`);
    }
  };

  const handleActivateEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setActivateModalOpen(true);
  };

  const handleCloseActivateModal = () => {
    setActivateModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleActivateSubmit = async () => {
    if (!selectedEmployee) return;

    try {
      // Cambiar estado del empleado a ACTIVO localmente
      const activatedEmployee = {
        ...selectedEmployee,
        status: 'ACTIVO' as const,
      };

      setEmployees(prev => prev.map(emp =>
        emp.id === selectedEmployee.id ? activatedEmployee : emp
      ));

      // Actualizar estadísticas localmente
      const updatedEmployees = employees.map(emp =>
        emp.id === selectedEmployee.id ? activatedEmployee : emp
      );
      const total = updatedEmployees.length;
      const active = updatedEmployees.filter(e => e.status === 'ACTIVO').length;
      const inactive = total - active;
      
      setStatistics([
        { label: 'TOTAL EMPLEADOS', value: total },
        { label: 'ACTIVOS', value: active },
        { label: 'INACTIVOS', value: inactive },
      ]);

      setActivateModalOpen(false);
      setSelectedEmployee(null);
      showSuccess(`Empleado ${activatedEmployee.fullName} activado exitosamente`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al activar empleado';
      handleError(error instanceof Error ? error : new Error(errorMessage), {
        componentStack: 'EmployeeDashboard.handleActivateSubmit'
      });
      showError(`Error: ${errorMessage}`);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <Header />
        <main className="dashboard-content">
          <div className="loading">Cargando empleados...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="employee-dashboard">
      <Header
        title="Gestión de Empleados"
      />

      <main className="dashboard-content">
        {/* Sección de Estadísticas */}
        <section className="statistics-section">
          <div className="stats-grid">
            {statistics.map((stat, index) => (
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
