/**
 * EmployeeDashboard (moved copy into features/RRHH/pages)
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { BiDownload, BiSearch, BiUserPlus, BiCheckCircle, BiUser, BiBell, BiLogOut, BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import { useSidebar } from '../../../contexts/SidebarContext';
import { StatCard } from '../../../components/molecules/StatCard';
import { EmployeeTable } from '../components/organisms/Tables';
import { Pagination } from '../../../components/molecules/Pagination';
import { Modal } from '../../../components/molecules/Modal';
import { NewEmployeeForm, NewApplicantForm, EmployeeDetailForm, EmployeeCheckoutForm, ActivateEmployeeModal } from '../components/organisms/Forms';
import { IconButton } from '../../../components/atoms/IconButton';
import { ApplicantsTable } from '../components/organisms/Tables';
import { useNotification } from '../../../contexts/useNotification';
import { usePagination } from '../../../hooks/usePagination';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { EmployeeService } from '../../../services/employee.service';
import { ApplicantService } from '../../../services/applicant.service';
import type { Employee, Applicant, NewEmployeeFormData, EmployeeDetailFormData, Statistic } from '../../../types';
import './EmployeeDashboard.css';

const ITEMS_PER_PAGE = 10;

type RRHHTab = 'postulantes' | 'aceptados' | 'empleados';

const EmployeeContent = () => {
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
    return <div className="loading">Cargando empleados...</div>;
  }

  return (
    <>
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
    </>
  );
};

export const EmployeeDashboard = () => {
  const [activeTab, setActiveTab] = useState<RRHHTab>('postulantes');
  const { collapsed: sidebarCollapsed, toggle: toggleSidebar } = useSidebar();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [acceptedApplicants, setAcceptedApplicants] = useState<Applicant[]>([]);
  const [applicantsLoading, setApplicantsLoading] = useState(true);
  const [newApplicantModalOpen, setNewApplicantModalOpen] = useState(false);
  const [selectedBreak, setSelectedBreak] = useState('');
  const [breakList, setBreakList] = useState<any[]>([]);
  const { showError, showSuccess } = useNotification();
  const { handleError } = useErrorHandler();

  const breakTypes = [
    'INICIO DE BAÑO',
    'FIN DE BAÑO',
    'INICIO DE BREAK',
    'FIN DE BREAK',
  ];

  const handleBreakSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value) {
      const now = new Date();
      const time = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
      const breakItem = {
        id: Date.now(),
        type: value,
        timestamp: time
      };
      setBreakList([...breakList, breakItem]);
      setSelectedBreak('');
    }
  };

  const handleRemoveBreak = (id: number) => {
    setBreakList(breakList.filter((item) => item.id !== id));
  };

  const handleConfirmBreak = () => {
    if (breakList.length === 0) return;
    const breakTypesStr = breakList.map(b => b.type).join(', ');
    const mensaje = `${breakTypesStr} registrado${breakList.length > 1 ? 's' : ''}`;
    showSuccess(mensaje);
    setBreakList([]);
  };

  const getButtonText = () => {
    if (breakList.length === 0) return 'Confirmar';
    const hasInicio = breakList.some(item => item.type.includes('INICIO'));
    const hasFin = breakList.some(item => item.type.includes('FIN'));
    if (hasInicio) return 'Iniciar';
    if (hasFin) return 'Finalizar';
    return 'Confirmar';
  };

  useEffect(() => {
    const loadApplicants = async () => {
      try {
        setApplicantsLoading(true);
        const data = await ApplicantService.getAllApplicants() as any;
        const applicantsList = Array.isArray(data) ? data : data.applicants || [];
        
        // Separar postulantes por estado
        const allApplicants = applicantsList.filter((a: Applicant) => a.status !== 'ACEPTADO');
        const accepted = applicantsList.filter((a: Applicant) => a.status === 'ACEPTADO');
        
        setApplicants(allApplicants);
        setAcceptedApplicants(accepted);
      } catch (error) {
        handleError(error instanceof Error ? error : new Error('Error loading applicants'), {
          componentStack: 'EmployeeDashboard.loadApplicants'
        });
        showError('Error al cargar postulantes');
      } finally {
        setApplicantsLoading(false);
      }
    };

    if (activeTab !== 'empleados') {
      loadApplicants();
    }
  }, [activeTab, handleError, showError]);

  return (
    <div className={`employee-dashboard${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <div className="sidebar">
        <h1 className="sidebar-title">Gestión de RRHH</h1>
        
        <nav className="vertical-menu">
          <button
            className={`menu-item ${activeTab === 'postulantes' ? 'active' : ''}`}
            onClick={() => setActiveTab('postulantes')}
          >
            <BiUserPlus size={20} />
            <span>POSTULANTES</span>
          </button>
          <button
            className={`menu-item ${activeTab === 'aceptados' ? 'active' : ''}`}
            onClick={() => setActiveTab('aceptados')}
          >
            <BiCheckCircle size={20} />
            <span>ACEPTADOS</span>
          </button>
          <button
            className={`menu-item ${activeTab === 'empleados' ? 'active' : ''}`}
            onClick={() => setActiveTab('empleados')}
          >
            <BiUser size={20} />
            <span>EMPLEADOS</span>
          </button>
        </nav>
      </div>

      <header className="dashboard-header">
          <button
            className="icon-btn sidebar-toggle-btn"
            title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
            aria-label={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
            onClick={toggleSidebar}
          >
            {sidebarCollapsed ? <BiChevronRight size={20} /> : <BiChevronLeft size={20} />}
          </button>

          <h2>Gestión de RRHH</h2>
          
          <select
            value={selectedBreak}
            onChange={handleBreakSelect}
            className="break-select"
            disabled={breakList.length > 0}
          >
            <option value="">Seleccionar tipo...</option>
            {breakTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          {breakList.length > 0 && (
            <button className="confirm-btn" onClick={handleConfirmBreak}>
              {getButtonText()}
            </button>
          )}

          <button className="icon-btn notification-btn" title="Notificaciones">
            <BiBell size={20} />
            <span className="notification-badge">3</span>
          </button>
          <button className="icon-btn logout-btn" title="Cerrar sesión">
            <BiLogOut size={20} />
          </button>
        </header>

        {breakList.length > 0 && (
          <div className="break-list-container">
            <ul className="break-list">
              {breakList.map((item) => (
                <li key={item.id} className="break-item">
                  <span className="break-type">{item.type}</span>
                  <span className="break-time">{item.timestamp}</span>
                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveBreak(item.id)}
                    title="Eliminar"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <main className="dashboard-content">
          {/* Contenido según pestaña */}
          {activeTab === 'empleados' && <EmployeeContent />}
          
          {activeTab === 'postulantes' && applicantsLoading && (
            <div className="loading">Cargando postulantes...</div>
          )}
          
          {activeTab === 'postulantes' && !applicantsLoading && (
            <section className="directory-section">
              <div className="section-header">
                <h2>POSTULANTES NUEVOS</h2>
                <div className="section-controls">
                  <IconButton aria-label="Descargar" title="Descargar" className="download-btn" size="md">
                    <BiDownload size={18} />
                  </IconButton>

                  <IconButton aria-label="Nuevo postulante" title="Nuevo postulante" variant="primary" className="add-applicant-btn" size="md" onClick={() => setNewApplicantModalOpen(true)}>
                    <BiUserPlus size={18} />
                  </IconButton>
                </div>
              </div>

              <ApplicantsTable 
                applicants={applicants}
                onEdit={(_applicant: Applicant) => {}}
                onHire={(_applicant: Applicant) => {}}
                onBlacklist={(_applicant: Applicant) => {}}
              />

              <Modal isOpen={newApplicantModalOpen} title="Registrar Nuevo Postulante" onClose={() => setNewApplicantModalOpen(false)}>
                <NewApplicantForm
                  onSubmit={async (formData) => {
                    try {
                      const newApplicant = await ApplicantService.createApplicant(formData);
                      setApplicants(prev => [...prev, newApplicant]);
                      setNewApplicantModalOpen(false);
                      showSuccess(`Postulante ${newApplicant.fullName} registrado exitosamente`);
                    } catch (error) {
                      const errorMessage = error instanceof Error ? error.message : 'Error al crear postulante';
                      handleError(error instanceof Error ? error : new Error(errorMessage), {
                        componentStack: 'EmployeeDashboard.handleNewApplicantSubmit'
                      });
                      showError(`Error: ${errorMessage}`);
                    }
                  }}
                  onCancel={() => setNewApplicantModalOpen(false)}
                />
              </Modal>
            </section>
          )}
          
          {activeTab === 'aceptados' && applicantsLoading && (
            <div className="loading">Cargando aceptados...</div>
          )}
          
          {activeTab === 'aceptados' && !applicantsLoading && (
            <section className="directory-section">
              <div className="section-header">
                <h2>POSTULANTES ACEPTADOS</h2>
                <div className="section-controls">
                  <button className="download-btn" title="Descargar">
                    <BiDownload size={18} />
                  </button>
                </div>
              </div>
              <ApplicantsTable 
                applicants={acceptedApplicants}
                onEdit={(_applicant: Applicant) => {}}
                onHire={(_applicant: Applicant) => {}}
                onBlacklist={(_applicant: Applicant) => {}}
              />
            </section>
          )}
        </main>
    </div>
  );
};