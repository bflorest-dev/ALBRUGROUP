/**
 * EmployeeDashboard (moved copy into features/RRHH/pages)
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { BiDownload, BiSearch, BiUserPlus, BiCheckCircle, BiUser, BiBell, BiLogOut, BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import { useSidebar } from '@contexts/SidebarContext';
import { StatCard } from '@molecules/StatCard';
import { EmployeeTable } from '../components/organisms/Tables';
import { Pagination } from '@molecules/Pagination';
import { Modal } from '@molecules/Modal';
import { NewEmployeeForm, NewApplicantForm, EditApplicantForm, EmployeeDetailForm, EmployeeCheckoutForm, ActivateEmployeeModal } from '../components/organisms/Forms';
import { IconButton } from '@atoms/IconButton';
import { ApplicantsTable } from '../components/organisms/Tables';
import { useNotification } from '@contexts/useNotification';
import { usePagination } from '@hooks/usePagination';
import { useErrorHandler } from '@hooks/useErrorHandler';
import { loadApplicantsFromStorage, saveApplicantsToStorage, loadEmployeesFromStorage, saveEmployeesToStorage } from '@utils/localStorage';
import type { Employee, Applicant, NewEmployeeFormData, EmployeeDetailFormData, Statistic, EditApplicantFormData, EmployeeStatus } from '@types';
import { FeatureErrorBoundary } from '@components/utilities';
import { ErrorLogger } from '@services';
import type { ErrorInfo } from 'react';
import './EmployeeDashboard.css';

const ITEMS_PER_PAGE = 10;

type RRHHTab = 'postulantes' | 'aprobados' | 'empleados' | 'inactivos';

const InactiveEmployeeContent = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailMode, setDetailMode] = useState<'view' | 'edit'>('view');
  const [lastModifiedEmployeeId, setLastModifiedEmployeeId] = useState<string | null>(null);

  const { showSuccess, showError } = useNotification();
  const { handleError } = useErrorHandler();

  const loadInactiveEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const stored = loadEmployeesFromStorage();
      let list: Employee[] = Array.isArray(stored)
        ? (stored as Employee[]).map(emp => ({ ...emp, status: emp.status || 'ACTIVO' }))
        : [];

      const apps = loadApplicantsFromStorage();
      if (apps && Array.isArray(apps)) {
        const inactiveApplicants = apps
          .filter(a => a.status?.toUpperCase() === 'INACTIVO')
          .map(a => {
            const initials =
              (a.nombres?.[0] || '').toUpperCase() +
              (a.apellidos?.[0] || '').toUpperCase();

            return {
              id: a.id,
              initials,
              fullName: a.fullName,
              nombres: a.nombres || '',
              apellidos: a.apellidos || '',
              documentType: a.documentType || '',
              documentNumber: a.documentNumber || '',
              nationality: a.nationality || '',
              birthDate: a.birthDate || '',
              civilStatus: a.civilStatus || '',
              hasChildren: a.hasChildren || false,
              personalEmail: a.personalEmail || '',
              phoneMobile: a.phoneMobile || '',
              bank: a.bank || '',
              accountNumber: a.accountNumber || '',
              interbankNumber: a.interbankNumber || '',
              startDate: a.contractStartDate || '',
              position: a.positionOfInterest || '',
              department: '',
              status: 'INACTIVO',
              district: a.district || '',
              address: a.address || '',
              contractRegimen: a.contractRegimen || '',
              contractModalidad: a.contractModalidad || '',
              contractSeguro: a.contractSeguro || '',
              contractPension: a.contractPension || '',
              baseSalary: a.contractSalary ? String(a.contractSalary) : '',
              contractOwnAccount: a.contractOwnAccount || '',
              contractKinship: a.contractKinship || '',
              contractCellularTransfer: a.contractCellularTransfer || '',
              contractorCompany: a.contractorCompany || '',
            } as Employee;
          });

        const seen = new Set<string>();
        list = [...list, ...inactiveApplicants].filter(emp => {
          if (seen.has(emp.id)) return false;
          seen.add(emp.id);
          return true;
        });
      }

      // Filter only inactive employees
      const inactiveList = list.filter(emp => emp.status === 'INACTIVO');
      setEmployees(inactiveList);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Error cargando datos locales'), {
        componentStack: 'InactiveEmployeeContent.loadInactiveEmployees'
      });
      showError('Error al cargar los empleados inactivos');
    } finally {
      setLoading(false);
    }
  }, [handleError, showError]);

  const pagination = usePagination({
    totalItems: employees.length,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  useEffect(() => {
    loadInactiveEmployees();
  }, [loadInactiveEmployees]);

  // Escuchar cambios de estado de empleados
  useEffect(() => {
    const handleStatusChanged = (event: any) => {
      const { employeeId, newStatus } = event.detail;
      setEmployees(prev => {
        return prev.map(emp => 
          emp.id === employeeId ? { ...emp, status: newStatus } : emp
        );
      });
    };
    window.addEventListener('employeeStatusChanged', handleStatusChanged);
    return () => window.removeEventListener('employeeStatusChanged', handleStatusChanged);
  }, []);

  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;

    const term = searchTerm.toLowerCase();
    return employees.filter((emp) =>
      emp.fullName.toLowerCase().includes(term) ||
      emp.documentNumber?.toLowerCase().includes(term) ||
      emp.phoneMobile?.toLowerCase().includes(term)
    );
  }, [searchTerm, employees]);

  const paginatedEmployees = useMemo(() => {
    const { startIndex, endIndex } = pagination;
    return filteredEmployees.slice(startIndex, endIndex);
  }, [filteredEmployees, pagination]);

  useEffect(() => {
    if (lastModifiedEmployeeId) {
      const idx = filteredEmployees.findIndex(e => e.id === lastModifiedEmployeeId);
      if (idx !== -1) {
        const page = Math.floor(idx / pagination.itemsPerPage) + 1;
        pagination.goToPage(page);
      }
      setLastModifiedEmployeeId(null);
    }
  }, [filteredEmployees, lastModifiedEmployeeId, pagination]);

  const handleEmployeeAction = (employee: Employee, action: string) => {
    setSelectedEmployee(employee);
    setDetailMode(action === 'edit' ? 'edit' : 'view');
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleEditEmployeeSubmit = (formData: EmployeeDetailFormData) => {
    if (!selectedEmployee) return;

    const updatedEmployee: Employee = {
      ...selectedEmployee,
      ...formData,
      fullName: `${formData.nombres || selectedEmployee.nombres} ${formData.apellidos || selectedEmployee.apellidos}`,
    } as Employee;

    setEmployees(prev => {
      const updated = prev.map(emp =>
        emp.id === selectedEmployee.id ? updatedEmployee : emp
      );
      saveEmployeesToStorage(updated);
      return updated;
    });
    setLastModifiedEmployeeId(selectedEmployee.id);

    setDetailModalOpen(false);
    setSelectedEmployee(null);
    showSuccess(`Cambios de ${updatedEmployee.fullName} guardados`);
  };

  const handleStatusChange = (employee: Employee, newStatus: string) => {
    const updatedEmployee: Employee = {
      ...employee,
      status: newStatus as EmployeeStatus,
    };

    setEmployees(prev => {
      const updated = prev.map(emp =>
        emp.id === employee.id ? updatedEmployee : emp
      );
      saveEmployeesToStorage(updated);
      return updated;
    });

    const apps = loadApplicantsFromStorage();
    if (apps && Array.isArray(apps)) {
      const updatedApps = apps.map(a =>
        a.id === employee.id ? { ...a, status: newStatus } : a
      );
      saveApplicantsToStorage(updatedApps);
    }

    showSuccess(`Estado de ${employee.fullName} cambiado a ${newStatus}`);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('employeeStatusChanged', { detail: { employeeId: employee.id, newStatus } }));
    }, 50);
  };

  return (
    <section className="directory-section">
      <div className="employee-section-header">
        <h2>EMPLEADOS INACTIVOS</h2>
        <div className="section-controls">
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">Cargando empleados inactivos...</div>
      ) : (
        <>
          <EmployeeTable
            employees={paginatedEmployees}
            onAction={handleEmployeeAction}
            onStatusChange={handleStatusChange}
            isInactiveTable={true}
          />
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE)}
            totalItems={filteredEmployees.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={pagination.goToPage}
          />
        </>
      )}

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
    </section>
  );
};

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
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [detailMode, setDetailMode] = useState<'view' | 'edit'>('view');
  const [pendingStatusChangeEmployee, setPendingStatusChangeEmployee] = useState<Employee | null>(null);
  const [selectedDismissalReason, setSelectedDismissalReason] = useState<string>('');

  // Hooks
  const { showSuccess, showError } = useNotification();
  const { handleError } = useErrorHandler();
  // keep track of last edited applicant so pagination stays on its page
  const [lastModifiedEmployeeId, setLastModifiedEmployeeId] = useState<string | null>(null);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      // load existing employees from local storage, fallback to empty
      const stored = loadEmployeesFromStorage();
      // stored employees may already carry a status (e.g. ACTIVO);
      // fall back to ACTIVO if none is provided. previously we forced
      // APROBADO which meant the directory always came up empty.
      let list: Employee[] = Array.isArray(stored)
        ? (stored as Employee[]).map(emp => ({ ...emp, status: emp.status || 'ACTIVO' }))
        : [];

      // additionally include any applicants that have been marked "APROBADO" so
      // that the "EMPLEADOS" tab shows those records as well.  This satisfies the
      // requirement de cargar todos los status APROBADO en el apartado empleados.
      const apps = loadApplicantsFromStorage();
      if (apps && Array.isArray(apps)) {
        const approvedApplicants = apps
          // include both approved and contracted applicants so employees tab
          // doesn't lose records when status changes during the contact process
          .filter(a => {
            const st = a.status?.toUpperCase();
            return st === 'APROBADO' || st === 'ACTIVO';
          })
          .map(a => {
            // build a minimal Employee object from the applicant
            const initials =
              (a.nombres?.[0] || '').toUpperCase() +
              (a.apellidos?.[0] || '').toUpperCase();

            const derivedStatus = a.status?.toUpperCase() === 'ACTIVO' ? 'ACTIVO' : 'APROBADO';

            return {
              id: a.id,
              initials,
              fullName: a.fullName,
              nombres: a.nombres || '',
              apellidos: a.apellidos || '',
              documentType: a.documentType || '',
              documentNumber: a.documentNumber || '',
              nationality: a.nationality || '',
              birthDate: a.birthDate || '',
              civilStatus: a.civilStatus || '',
              hasChildren: a.hasChildren || false,
              personalEmail: a.personalEmail || '',
              phoneMobile: a.phoneMobile || '',
              bank: a.bank || '',
              accountNumber: a.accountNumber || '',
              interbankNumber: a.interbankNumber || '',
              startDate: a.contractStartDate || '',
              position: a.positionOfInterest || '',
              department: '',
              status: derivedStatus,
              district: a.district || '',
              address: a.address || '',
              contractRegimen: a.contractRegimen || '',
              contractModalidad: a.contractModalidad || '',
              contractSeguro: a.contractSeguro || '',
              contractPension: a.contractPension || '',
              baseSalary: a.contractSalary ? String(a.contractSalary) : '',
              contractOwnAccount: a.contractOwnAccount || '',
              contractKinship: a.contractKinship || '',
              contractCellularTransfer: a.contractCellularTransfer || '',
              contractorCompany: a.contractorCompany || '',
            } as Employee;
          });

        // merge with existing employees, dedupe by id
        const seen = new Set<string>();
        list = [...list, ...approvedApplicants].filter(emp => {
          if (seen.has(emp.id)) return false;
          seen.add(emp.id);
          return true;
        });
      }

      setEmployees(list);
      // Count only ACTIVO employees for the statistic  
      const activeEmployeesCount = list.filter(emp => emp.status === 'ACTIVO').length;
      setStatistics([
        { label: 'TOTAL EMPLEADOS', value: activeEmployeesCount },
      ]);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Error cargando datos locales'), {
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

  // Escuchar cambios de estado de empleados
  useEffect(() => {
    const handleStatusChanged = (event: any) => {
      const { employeeId, newStatus } = event.detail;
      setEmployees(prev => {
        return prev.map(emp => 
          emp.id === employeeId ? { ...emp, status: newStatus } : emp
        );
      });
    };
    window.addEventListener('employeeStatusChanged', handleStatusChanged);
    return () => window.removeEventListener('employeeStatusChanged', handleStatusChanged);
  }, []);

  // Calcular empleados filtrados por búsqueda
  const filteredEmployees = useMemo(() => {
    // always only show active employees
    let list = employees.filter(emp => emp.status === 'ACTIVO');

    if (!searchTerm) return list;

    const term = searchTerm.toLowerCase();
    return list.filter((emp) =>
      emp.fullName.toLowerCase().includes(term) ||
      emp.documentNumber?.toLowerCase().includes(term) ||
      emp.phoneMobile?.toLowerCase().includes(term)
    );
  }, [searchTerm, employees]);

  // Filtrar y paginar empleados
  const paginatedEmployees = useMemo(() => {
    const { startIndex, endIndex } = pagination;
    return filteredEmployees.slice(startIndex, endIndex);
  }, [filteredEmployees, pagination]);

  // when an employee is modified, jump to that employee's page
  useEffect(() => {
    if (lastModifiedEmployeeId) {
      const idx = filteredEmployees.findIndex(e => e.id === lastModifiedEmployeeId);
      if (idx !== -1) {
        const page = Math.floor(idx / pagination.itemsPerPage) + 1;
        pagination.goToPage(page);
      }
      setLastModifiedEmployeeId(null);
    }
  }, [filteredEmployees, lastModifiedEmployeeId, pagination]);

  const handleEmployeeAction = (employee: Employee, action: string) => {
    setSelectedEmployee(employee);
    setDetailMode(action === 'edit' ? 'edit' : 'view');
    setDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmitForm = (formData: NewEmployeeFormData) => {
    // almacenamiento local
    const initials =
      (formData.nombres[0] || '').toUpperCase() +
      (formData.apellidos[0] || '').toUpperCase();

    const newEmployee: Employee = {
      id: `${Date.now()}`,
      initials,
      fullName: `${formData.nombres} ${formData.apellidos}`,
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      documentType: formData.documentType,
      documentNumber: formData.documentNumber,
      nationality: formData.nationality,
      birthDate: formData.birthDate,
      civilStatus: formData.civilStatus,
      hasChildren: formData.hasChildren,
      personalEmail: formData.personalEmail,
      phoneMobile: formData.phoneMobile,
      bank: formData.bank,
      accountNumber: formData.accountNumber,
      interbankNumber: formData.interbankNumber,
      startDate: formData.startDate,
      position: formData.role,
      department: '',
      status: 'ACTIVO',
      // contract extras stored for completeness
      contractRegimen: formData.regimen,
      contractModalidad: formData.modality,
      contractSeguro: formData.seguro,
      contractPension: formData.pension,
      baseSalary: formData.baseSalary,
    } as Employee;

    setEmployees(prev => {
      const updated = [...prev, newEmployee];
      saveEmployeesToStorage(updated);
      // actualizar estadísticas inmediatamente
      setStatistics([{ label: 'TOTAL EMPLEADOS', value: updated.length }]);
      return updated;
    });
    setIsModalOpen(false);
    showSuccess(`Empleado ${newEmployee.fullName} registrado`);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleEditEmployeeSubmit = (formData: EmployeeDetailFormData) => {
    if (!selectedEmployee) return;

    const updatedEmployee: Employee = {
      ...selectedEmployee,
      ...formData,
      fullName: `${formData.nombres || selectedEmployee.nombres} ${formData.apellidos || selectedEmployee.apellidos}`,
    } as Employee;

    setEmployees(prev => {
      const updated = prev.map(emp =>
        emp.id === selectedEmployee.id ? updatedEmployee : emp
      );
      saveEmployeesToStorage(updated);
      return updated;
    });
    setLastModifiedEmployeeId(selectedEmployee.id);

    setDetailModalOpen(false);
    setSelectedEmployee(null);
    showSuccess(`Cambios de ${updatedEmployee.fullName} guardados`);
  };

  const handleCheckoutEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setCheckoutModalOpen(true);
  };

  const handleStatusChange = (employee: Employee, newStatus: string) => {
    // If changing from ACTIVO to INACTIVO, show reason modal first
    if (employee.status === 'ACTIVO' && newStatus === 'INACTIVO') {
      setPendingStatusChangeEmployee(employee);
      setSelectedDismissalReason('');
      setReasonModalOpen(true);
      return;
    }

    // For other status changes, proceed directly
    proceedWithStatusChange(employee, newStatus);
  };

  const proceedWithStatusChange = (employee: Employee, newStatus: string, dismissalReason?: string) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const updatedEmployee: Employee = {
      ...employee,
      status: newStatus as EmployeeStatus,
      ...(newStatus === 'INACTIVO' && { endDate: today }),
      ...(dismissalReason && { dismissalReason }),
    };

    setEmployees(prev => {
      const updated = prev.map(emp =>
        emp.id === employee.id ? updatedEmployee : emp
      );
      saveEmployeesToStorage(updated);
      return updated;
    });

    // Also update in applicants if this employee came from applicants
    const apps = loadApplicantsFromStorage();
    if (apps && Array.isArray(apps)) {
      const updatedApps = apps.map(a =>
        a.id === employee.id ? { ...a, status: newStatus, ...(newStatus === 'INACTIVO' && { endDate: today }), ...(dismissalReason && { dismissalReason }) } : a
      );
      saveApplicantsToStorage(updatedApps);
    }

    showSuccess(`Estado de ${employee.fullName} cambiado a ${newStatus}`);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('employeeStatusChanged', { detail: { employeeId: employee.id, newStatus } }));
    }, 50);
  };

  const handleConfirmDismissalReason = () => {
    if (!pendingStatusChangeEmployee || !selectedDismissalReason) return;
    setReasonModalOpen(false);
    proceedWithStatusChange(pendingStatusChangeEmployee, 'INACTIVO', selectedDismissalReason);
    setPendingStatusChangeEmployee(null);
  };

  const handleCloseCheckoutModal = () => {
    setCheckoutModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleCheckoutSubmit = (checkoutDate: string, checkoutReason: string) => {
    if (!selectedEmployee) return;

    try {
      const updatedEmployee = {
        ...selectedEmployee,
        endDate: checkoutDate,
        checkoutReason: checkoutReason,
      };

      setEmployees(prev => {
        const updated = prev.map(emp =>
          emp.id === selectedEmployee.id ? updatedEmployee : emp
        );
        saveEmployeesToStorage(updated);
        // actualizar estadísticas según nuevo array
        setStatistics([{ label: 'TOTAL EMPLEADOS', value: updated.length }]);
        return updated;
      });

      setCheckoutModalOpen(false);
      setSelectedEmployee(null);
      showSuccess(`Empleado ${selectedEmployee.fullName} dado de baja`);
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
        // status change removed
      };

      setEmployees(prev => prev.map(emp =>
        emp.id === selectedEmployee.id ? activatedEmployee : emp
      ));

      // Actualizar estadísticas localmente
      const updatedEmployees = employees.map(emp =>
        emp.id === selectedEmployee.id ? activatedEmployee : emp
      );
      const total = updatedEmployees.length;
      setStatistics([
        { label: 'TOTAL EMPLEADOS', value: total },
      ]);

      setActivateModalOpen(false);
      setSelectedEmployee(null);
      showSuccess(`Empleado ${activatedEmployee.fullName} activado`);
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
        <div className="employee-section-header">
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
            <IconButton
              aria-label="Nuevo empleado"
              title="Nuevo empleado"
              variant="primary"
              className="add-employee-btn"
              size="md"
              onClick={() => setIsModalOpen(true)}
            >
              <BiUserPlus size={18} />
            </IconButton>
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
          onStatusChange={handleStatusChange}
        />

        <Pagination
          currentPage={pagination.currentPage}
          totalPages={Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE)}
          totalItems={filteredEmployees.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={pagination.goToPage}
        />
      </section>

      <Modal
        isOpen={isModalOpen}
        title="Registrar Nuevo Empleado"
        className="contract-modal"        // reuse contract-modal styling
        onClose={handleCloseModal}
      >
        <NewEmployeeForm onSubmit={handleSubmitForm} onCancel={handleCloseModal} />
      </Modal>
      {/* NOTE: edit applicant modal has been moved to parent EmployeeDashboard */}

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

      <Modal
        isOpen={reasonModalOpen}
        title="Motivo de Baja"
        className="dismissal-modal"
        onClose={() => {
          setReasonModalOpen(false);
          setPendingStatusChangeEmployee(null);
          setSelectedDismissalReason('');
        }}
      >
        <div className="dismissal-reason-modal">
          <p>Selecciona el motivo de baja del empleado:</p>
          <div className="reason-options">
            {[
              'Bajo desempeño',
              'Faltas disciplinarias',
              'Incumplimiento de políticas internas',
              'Reestructuración o motivos organizacionales',
              'Conducta grave',
              'Mejores oportunidades',
              'Condiciones laborales',
              'Clima laboral',
              'Motivos personales',
              'Desmotivación'
            ].map((reason) => (
              <label key={reason} className="reason-option">
                <input
                  type="radio"
                  name="dismissal-reason"
                  value={reason}
                  checked={selectedDismissalReason === reason}
                  onChange={(e) => setSelectedDismissalReason(e.target.value)}
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>
          <div className="modal-actions">
            <button 
              className="btn-cancel"
              onClick={() => {
                setReasonModalOpen(false);
                setPendingStatusChangeEmployee(null);
                setSelectedDismissalReason('');
              }}
            >
              Cancelar
            </button>
            <button 
              className="btn-confirm"
              onClick={handleConfirmDismissalReason}
              disabled={!selectedDismissalReason}
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

const EmployeeDashboardContent = () => {
  const [activeTab, setActiveTab] = useState<RRHHTab>('postulantes');
  const { collapsed: sidebarCollapsed, toggle: toggleSidebar, setCollapsed: setSidebarCollapsed } = useSidebar();

  // collapse the sidebar automatically on narrow viewports so the roster/content has
  // maximum horizontal space; reopen it when the window is wide again
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarCollapsed]);

  const headerTitle = activeTab === 'postulantes'
    ? 'POSTULANTES'
    : activeTab === 'aprobados'
    ? 'APROBADOS'
    : activeTab === 'empleados'
    ? 'EMPLEADOS'
    : 'INACTIVOS';

  const ACCEPTED_STATUSES = ['POR_CONTRATAR']; // unify acceptance status (internally POR_CONTRATAR from training approval)
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [acceptedApplicants, setAcceptedApplicants] = useState<Applicant[]>([]);
  const [applicantsLoading, setApplicantsLoading] = useState(true);
  const [newApplicantModalOpen, setNewApplicantModalOpen] = useState(false);
  
  // Pagination state
  const [currentPagePostulantes, setCurrentPagePostulantes] = useState(1);
  const [currentPageAprobados, setCurrentPageAprobados] = useState(1);
  const ITEMS_PER_PAGE = 10;
  // keep track of last edited applicant so pagination can stay on its page
  const [lastModifiedId, setLastModifiedId] = useState<string | null>(null);

  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [currentContractId, setCurrentContractId] = useState<string | null>(null);
  const [contractData, setContractData] = useState({
    nationality: '',
    birthDate: '',
    civilStatus: '',
    hasChildren: '',
    personalEmail: '',
    district: '',
    address: '',
    bank: '',
    accountNumber: '',
    interbankNumber: '',
    ownAccount: '',
    kinship: '',
    cellularTransfer: '',
    contractorCompany: '',
    regimen: '',
    modalidad: '',
    seguro: '',
    pension: '',
    salary: '',
    startDate: ''
  });

  // applicant whose contract is being edited/created (for employee data section)
  const [currentContractApplicant, setCurrentContractApplicant] = useState<Applicant | null>(null);

  // lists used in contract modal
  const documentTypes = ['DNI', 'CE'];
  const nationalities = ['PERUANO', 'EXTRANJERO'];
  const civilStatuses = ['SOLTERO', 'CASADO', 'VIUDO', 'DIVORCIADO'];
  const yesNo = ['Sí', 'No'];
  const districts = [
    'ANCÓN','ATE','BARRANCO','BREÑA','CARABAYLLO','CERCADO DE LIMA','CHACLACAYO','CHORRILLOS','CIENEGUILLA','COMAS','EL AGUSTINO','INDEPENDENCIA','JESÚS MARÍA','LA MOLINA','LA VICTORIA','LINCE','LOS OLIVOS','LURÍN','LURIGANCHO','MAGDALENA DEL MAR','MIRAFLORES','PACHACÁMAC','PUCUSANA','PUEBLO LIBRE','PUENTE PIEDRA','PUNTA HERMOSA','PUNTA NEGRA','RÍMAC','SAN BARTOLO','SAN BORJA','SAN ISIDRO','SAN JUAN DE LURIGANCHO','SAN JUAN DE MIRAFLORES','SAN LUIS','SAN MARTÍN DE PORRES','SAN MIGUEL','SANTA ANITA','SANTA MARÍA DEL MAR','SANTA ROSA','SANTIAGO DE SURCO','SURQUILLO','VILLA EL SALVADOR','VILLA MARÍA DEL TRIUNFO'
  ];
  const banks = ['BCP','BBVA','INTERBANK','SCOTIABANK'];

  // flujos de lista negra (mantener después de edicion state)
  const [isBlacklistModalOpen, setIsBlacklistModalOpen] = useState(false);
  const [currentBlacklistApplicant, setCurrentBlacklistApplicant] = useState<Applicant | null>(null);

  // break tracking state (separado de la edición)
  const [selectedBreak, setSelectedBreak] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [startedBanho, setStartedBanho] = useState(false);
  const [startedBreak, setStartedBreak] = useState(false);

  const { showError, showSuccess } = useNotification();
  const { handleError } = useErrorHandler();

  // edición de postulante (global para todos los tabs)
  const [isEditApplicantModalOpen, setIsEditApplicantModalOpen] = useState(false);
  const [selectedApplicantForEdit, setSelectedApplicantForEdit] = useState<Applicant | null>(null);

  useEffect(() => { console.log('EmployeeDashboard outer edit modal open?', isEditApplicantModalOpen); }, [isEditApplicantModalOpen]);
  useEffect(() => { console.log('EmployeeDashboard outer sel applicant', selectedApplicantForEdit); }, [selectedApplicantForEdit]);

  const handleEditApplicant = (applicant: Applicant) => {
    console.log('EmployeeDashboard outer handleEditApplicant', applicant);
    setSelectedApplicantForEdit(applicant);
    setTimeout(() => setIsEditApplicantModalOpen(true), 0);
  };

  const handleCloseEditApplicant = () => {
    console.log('EmployeeDashboard outer handleCloseEditApplicant');
    setIsEditApplicantModalOpen(false);
    setSelectedApplicantForEdit(null);
  };

  const handleEditApplicantSubmit = async (formData: EditApplicantFormData) => {
    if (!selectedApplicantForEdit) return;
    const updatedApplicant: Applicant = {
      ...selectedApplicantForEdit,
      ...formData,
      fullName: `${formData.nombres} ${formData.apellidos}`,
    };

    // update both lists if the applicant exists there
    // and build new arrays to use for storage in the same order
    let updatedApplicantsArr = applicants;
    let updatedAcceptedArr = acceptedApplicants;

    updatedApplicantsArr = applicants.map(a =>
      a.id === updatedApplicant.id ? updatedApplicant : a
    );

    updatedAcceptedArr = acceptedApplicants.map(a =>
      a.id === updatedApplicant.id ? updatedApplicant : a
    );

    setApplicants(updatedApplicantsArr);
    setAcceptedApplicants(updatedAcceptedArr);
    setLastModifiedId(updatedApplicant.id);

    // persist using the updated arrays (order unchanged)
    saveApplicantsToStorage([...updatedApplicantsArr, ...updatedAcceptedArr]);

    setIsEditApplicantModalOpen(false);
    setSelectedApplicantForEdit(null);
    showSuccess(`Postulante ${formData.nombres} ${formData.apellidos} actualizado`);
  };

  const handleBlacklistApplicant = (applicant: Applicant) => {
    setApplicants(prev => {
      const updated = prev.map(a =>
        a.id === applicant.id ? { ...a, status: 'LISTA_NEGRA' } : a
      );
      // persist changes (keep accepted separated)
      const acceptedStored = acceptedApplicants;
      saveApplicantsToStorage([...updated, ...acceptedStored]);
      return updated;
    });
    showSuccess(`Postulante ${applicant.fullName} añadido a lista negra`);
  };

  const openBlacklistModal = (applicant: Applicant) => {
    setCurrentBlacklistApplicant(applicant);
    setIsBlacklistModalOpen(true);
  };

  const confirmBlacklist = () => {
    if (currentBlacklistApplicant) {
      handleBlacklistApplicant(currentBlacklistApplicant);
    }
    setIsBlacklistModalOpen(false);
    setCurrentBlacklistApplicant(null);
  };


  const handleContractChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setContractData(prev => {
      const updated = { ...prev, [name]: value };
      // si se selecciona RECIBO POR HONORARIOS, resetear seguro y pensión
      if (name === 'regimen' && value === 'RECIBO POR HONORARIOS') {
        updated.seguro = '';
        updated.pension = '';
      }
      return updated;
    });
  };

  const handleCellularTransferChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Solo permitir números y máximo 9 dígitos
    const filtered = value.replace(/\D/g, '').slice(0, 9);
    setContractData(prev => ({ ...prev, cellularTransfer: filtered }));
  };

  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Solo permitir números
    let filtered = value.replace(/\D/g, '');
    
    // Determinar máximo de dígitos según el banco
    const maxDigits = {
      'BCP': 14,
      'BBVA': 18,
      'INTERBANK': 13,
      'SCOTIABANK': 10
    };
    
    const currentBank = contractData.bank as keyof typeof maxDigits;
    const max = maxDigits[currentBank] || 20; // Default 20 si no hay banco seleccionado
    
    filtered = filtered.slice(0, max);
    setContractData(prev => ({ ...prev, accountNumber: filtered }));
  };

  const handleInterbankNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Solo permitir números y máximo 20 dígitos
    const filtered = value.replace(/\D/g, '').slice(0, 20);
    setContractData(prev => ({ ...prev, interbankNumber: filtered }));
  };

  const handleOpenContractModal = (applicant: Applicant) => {
    setCurrentContractId(applicant.id);
    setCurrentContractApplicant(applicant);
    // load all data (employee + contract) so user can edit them
    setContractData({
      nationality: applicant.nationality ?? '',
      birthDate: applicant.birthDate ?? '',
      civilStatus: applicant.civilStatus ?? '',
      hasChildren: applicant.hasChildren ? 'Sí' : 'No',
      personalEmail: applicant.personalEmail ?? '',
      district: applicant.district ?? '',
      address: applicant.address ?? '',
      bank: applicant.bank ?? '',
      accountNumber: applicant.accountNumber ?? '',
      interbankNumber: applicant.interbankNumber ?? '',
      ownAccount: applicant.contractOwnAccount ?? '',
      kinship: applicant.contractKinship ?? '',
      cellularTransfer: applicant.contractCellularTransfer ?? '',
      contractorCompany: applicant.contractorCompany ?? '',
      regimen: applicant.contractRegimen ?? '',
      modalidad: applicant.contractModalidad ?? '',
      seguro: applicant.contractSeguro ?? '',
      pension: applicant.contractPension ?? '',
      salary: applicant.contractSalary != null ? String(applicant.contractSalary) : '',
      startDate: applicant.contractStartDate ?? ''
    });
    setIsContractModalOpen(true);
  };

  const handleContractSubmit = () => {
    if (!currentContractId) return;

    console.log('handleContractSubmit - contractData:', contractData);
    console.log('handleContractSubmit - currentContractApplicant:', currentContractApplicant);

    // Previously we forced a bunch of fields to be filled before the modal
    // could be confirmed.  That made it impossible to hire somebody when the
    // user only wanted to persist the minimal info, which in turn prevented the
    // new record from ever appearing in the employee table.  Remove all
    // validation here – we simply update the applicant and add the employee.

    setAcceptedApplicants(prev => {
      const updated = prev.map(a =>
        a.id === currentContractId
          ? {
              ...a,
              status: 'ACTIVO',
              nationality: contractData.nationality,
              birthDate: contractData.birthDate,
              civilStatus: contractData.civilStatus,
              hasChildren: contractData.hasChildren === 'Sí',
              personalEmail: contractData.personalEmail,
              district: contractData.district,
              address: contractData.address,
              bank: contractData.bank,
              accountNumber: contractData.accountNumber,
              interbankNumber: contractData.interbankNumber,
              contractOwnAccount: contractData.ownAccount,
              contractKinship: contractData.kinship,
              contractCellularTransfer: contractData.cellularTransfer,
              contractorCompany: contractData.contractorCompany as any,
              contractRegimen: contractData.regimen as any,
              contractModalidad: contractData.modalidad as any,
              contractSeguro: contractData.seguro as any,
              contractPension: contractData.pension as any,
              contractSalary: contractData.salary ? Number(contractData.salary) : undefined,
              contractStartDate: contractData.startDate || undefined,
            }
          : a
      );
      // persist both lists
      const all = [...applicants.filter(x=>x.id!==currentContractId), ...updated];
      saveApplicantsToStorage(all);
      return updated;
    });

    // add a parallel employee record so the "Empleados" tab updates immediately
    if (currentContractApplicant) {
      const newEmp: Employee = {
        id: currentContractApplicant.id,
        initials:
          (currentContractApplicant.nombres?.[0] || '').toUpperCase() +
          (currentContractApplicant.apellidos?.[0] || '').toUpperCase(),
        fullName: currentContractApplicant.fullName,
        nombres: currentContractApplicant.nombres,
        apellidos: currentContractApplicant.apellidos,
        documentType: currentContractApplicant.documentType,
        documentNumber: currentContractApplicant.documentNumber,
        nationality: contractData.nationality,
        birthDate: contractData.birthDate,
        civilStatus: contractData.civilStatus,
        hasChildren: contractData.hasChildren === 'Sí',
        personalEmail: contractData.personalEmail,
        phoneMobile: currentContractApplicant.phoneMobile,
        bank: contractData.bank,
        accountNumber: contractData.accountNumber,
        interbankNumber: contractData.interbankNumber,
        startDate: contractData.startDate,
        district: contractData.district,
        address: contractData.address,
        // contract fields
        contractRegimen: contractData.regimen as any,
        contractModalidad: contractData.modalidad as any,
        baseSalary: contractData.salary ? contractData.salary : '',
        
        position: currentContractApplicant.positionOfInterest || '',
        // department/email/phoneFixed are intentionally omitted (not needed)
        status: 'ACTIVO',
      } as Employee;

      console.log('handleContractSubmit - newEmp:', newEmp);

      // Note: Employee data is handled by EmployeeContent via loadInitialData
      // which reads from localStorage and applicants context
    }

    setIsContractModalOpen(false);
    setCurrentContractId(null);
    showSuccess('Empleado contratado exitosamente');
  };

  const breakTypes = [
    'INICIO DE BAÑO',
    'FIN DE BAÑO',
    'INICIO DE BREAK',
    'FIN DE BREAK',
  ];

  const handleBreakSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) return;
    const now = new Date();
    const time = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    const nowDate = new Date();
    if (value.includes('INICIO')) {
      setStartTime(nowDate);
      showSuccess(`Inicio baño ${time}`);
      if (value.includes('BAÑO')) {
        setStartedBanho(true);
      } else if (value.includes('BREAK')) {
        setStartedBreak(true);
      }
    } else if (value.includes('FIN')) {
      if (startTime) {
        const diffMs = nowDate.getTime() - startTime.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        showSuccess(`Duración ${hours}h ${mins}m`);
      } else {
        showSuccess(`Fin baño ${time}`);
      }
      setStartTime(null);
      if (value.includes('BAÑO')) {
        setStartedBanho(false);
      } else if (value.includes('BREAK')) {
        setStartedBreak(false);
      }
    }

    setSelectedBreak('');
  };


  useEffect(() => {
    const loadApplicants = async () => {
      try {
        setApplicantsLoading(true);
        // load exclusively from local storage; if nothing stored, start empty
        const stored = loadApplicantsFromStorage();
        if (stored && Array.isArray(stored)) {
          const storedNew = stored.filter((a: Applicant) => !ACCEPTED_STATUSES.includes(a.status || ''));
          setApplicants(storedNew);
          const storedAccepted = stored.filter((a: Applicant) => ACCEPTED_STATUSES.includes(a.status || ''));
          setAcceptedApplicants(storedAccepted);
        } else {
          setApplicants([]);
          setAcceptedApplicants([]);
        }
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

    // reload whenever any other component signals an update
    const listener = () => {
      if (activeTab !== 'empleados') {
        loadApplicants();
      }
    };
    window.addEventListener('applicantsUpdated', listener);
    return () => {
      window.removeEventListener('applicantsUpdated', listener);
    };
  }, [activeTab, handleError, showError]);

  // Pagination logic for postulantes tab
  const paginatedPostulantes = useMemo(() => {
    const startIndex = (currentPagePostulantes - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return applicants.slice(startIndex, endIndex);
  }, [applicants, currentPagePostulantes]);

  // Pagination logic for aprobados tab
  const paginatedAprobados = useMemo(() => {
    const startIndex = (currentPageAprobados - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return acceptedApplicants.slice(startIndex, endIndex);
  }, [acceptedApplicants, currentPageAprobados]);

  // Reset pagination when tab changes
  useEffect(() => {
    setCurrentPagePostulantes(1);
    setCurrentPageAprobados(1);
  }, [activeTab]);

  // keep edited applicant in view by moving to its page (postulantes)
  useEffect(() => {
    if (lastModifiedId && activeTab === 'postulantes') {
      const idx = applicants.findIndex(a => a.id === lastModifiedId);
      if (idx !== -1) {
        const page = Math.floor(idx / ITEMS_PER_PAGE) + 1;
        setCurrentPagePostulantes(page);
      }
      setLastModifiedId(null);
    }
  }, [applicants, lastModifiedId, activeTab]);

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
            className={`menu-item ${activeTab === 'aprobados' ? 'active' : ''}`}
            onClick={() => setActiveTab('aprobados')}
          >
            <BiCheckCircle size={20} />
            <span>APROBADOS</span>
          </button>
          <button
            className={`menu-item ${activeTab === 'empleados' ? 'active' : ''}`}
            onClick={() => setActiveTab('empleados')}
          >
            <BiUser size={20} />
            <span>EMPLEADOS</span>
          </button>
          <button
            className={`menu-item ${activeTab === 'inactivos' ? 'active' : ''}`}
            onClick={() => setActiveTab('inactivos')}
          >
            <BiUser size={20} />
            <span>INACTIVOS</span>
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

          <h2 className="header-title">{headerTitle}</h2>
          
          <select
            value={selectedBreak}
            onChange={handleBreakSelect}
            className="break-select"
          >
            <option value="">Seleccionar tipo...</option>
            {breakTypes.map((type) => (
              <option
                key={type}
                value={type}
                disabled={
                  (type.includes('FIN DE BAÑO') && !startedBanho) ||
                  (type.includes('FIN DE BREAK') && !startedBreak)
                }
              >
                {type}
              </option>
            ))}
          </select>


          <button className="icon-btn notification-btn" title="Notificaciones">
            <BiBell size={20} />
            <span className="notification-badge">3</span>
          </button>
          <button className="icon-btn logout-btn" title="Cerrar sesión">
            <BiLogOut size={20} />
          </button>
        </header>

        
        <main className="employee-dashboard-content">
          {/* Contenido según pestaña */}
          {activeTab === 'empleados' && <EmployeeContent />}
          
          {activeTab === 'inactivos' && <InactiveEmployeeContent />}
          
          {activeTab === 'postulantes' && applicantsLoading && (
            <div className="loading">Cargando postulantes...</div>
          )}
          
          {activeTab === 'postulantes' && !applicantsLoading && (
            <section className="directory-section">
              <div className="employee-section-header">
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
                applicants={paginatedPostulantes}
                onEdit={handleEditApplicant}
                onBlacklist={openBlacklistModal}  /* solo lista negra */
              />
              <Pagination
                currentPage={currentPagePostulantes}
                totalPages={Math.ceil(applicants.length / ITEMS_PER_PAGE)}
                totalItems={applicants.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPagePostulantes}
              />
              <Modal isOpen={newApplicantModalOpen} title="Registrar Nuevo Postulante" onClose={() => setNewApplicantModalOpen(false)}>
                <NewApplicantForm
                  onSubmit={(formData) => {
                    // Normalizar datos para validación (remover espacios extras y caracteres especiales)
                    const nombres = formData.nombres?.trim() || '';
                    const apellidos = formData.apellidos?.trim() || '';
                    const fullName = `${nombres} ${apellidos}`.trim();
                    const phoneMobileNormalized = formData.phoneMobile?.replace(/\s+/g, '').trim() || '';
                    const docNumberNormalized = formData.documentNumber?.trim() || '';
                    
                    // Validación 1: Verificar duplicado de CELULAR (independientemente del nombre)
                    if (phoneMobileNormalized !== '') {
                      const duplicateByPhoneOnly = applicants.find(a => {
                        const existingPhoneNormalized = a.phoneMobile?.replace(/\s+/g, '').trim() || '';
                        return existingPhoneNormalized === phoneMobileNormalized;
                      });
                      
                      if (duplicateByPhoneOnly) {
                        showError(`El celular ${formData.phoneMobile} ya está registrado en el sistema.`);
                        return;
                      }
                    }
                    
                    // Validación 2: Verificar duplicado de NOMBRE COMPLETO
                    if (fullName !== '') {
                      const duplicateByNameOnly = applicants.find(a => {
                        const existingFullName = `${a.nombres?.trim() || ''} ${a.apellidos?.trim() || ''}`.trim();
                        return existingFullName.toLowerCase() === fullName.toLowerCase();
                      });
                      
                      if (duplicateByNameOnly) {
                        showError(`El postulante "${fullName}" ya existe en el sistema.`);
                        return;
                      }
                    }
                    
                    // Validación 3: Verificar duplicado de DOCUMENTO
                    if (docNumberNormalized !== '') {
                      const duplicateByDoc = applicants.find(a => 
                        a.documentNumber?.trim() === docNumberNormalized
                      );
                      
                      if (duplicateByDoc) {
                        showError(`Un postulante con el documento nº ${formData.documentNumber} (${formData.documentType}) ya existe en el sistema.`);
                        return;
                      }
                    }

                    // local creation
                    const newApplicant: Applicant = {
                      id: `${Date.now()}`,
                      fullName: fullName,
                      nombres: nombres,
                      apellidos: apellidos,
                      phoneMobile: phoneMobileNormalized,
                      documentType: formData.documentType,
                      documentNumber: docNumberNormalized,
                      positionOfInterest: formData.positionOfInterest,
                      modality: '',
                      campaign: formData.campaign,
                      company: formData.company,
                      status: 'POR_RECLUTAR',
                    };
                    setApplicants(prev => {
                      const updated = [...prev, newApplicant];
                      saveApplicantsToStorage(updated);
                      return updated;
                    });
                    setNewApplicantModalOpen(false);
                    showSuccess(`Postulante ${newApplicant.fullName} registrado exitosamente`);
                  }}
                  onCancel={() => setNewApplicantModalOpen(false)}
                />
              </Modal>

              {/* Modal para editar postulante desde esta vista */}
            </section>
          )}
          
          {activeTab === 'aprobados' && applicantsLoading && (
            <div className="loading">Cargando aprobados...</div>
          )}
          
          {activeTab === 'aprobados' && !applicantsLoading && (
            <section className="directory-section">
              <div className="employee-section-header">
                <h2>POSTULANTES APROBADOS</h2>
                <div className="section-controls">
                  <button className="download-btn" title="Descargar">
                    <BiDownload size={18} />
                  </button>
                </div>
              </div>
              <ApplicantsTable 
                applicants={paginatedAprobados}
                onEdit={handleEditApplicant}
                onContract={handleOpenContractModal}
                /* blacklist not available for aprobados */
                showStatus={false}
              />
              <Pagination
                currentPage={currentPageAprobados}
                totalPages={Math.ceil(acceptedApplicants.length / ITEMS_PER_PAGE)}
                totalItems={acceptedApplicants.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPageAprobados}
              />
            </section>
          )}
        </main>

        {/* global edit-postulante modal (visible on any tab) */}
        <Modal
          isOpen={isEditApplicantModalOpen}
          title="Editar Postulante"
          onClose={handleCloseEditApplicant}
        >
          {selectedApplicantForEdit ? (
            <EditApplicantForm
              applicant={selectedApplicantForEdit}
              onSubmit={handleEditApplicantSubmit}
              onCancel={handleCloseEditApplicant}
              disabledFields={
                activeTab === 'aprobados'
                  ? ['id','nombres','apellidos','phoneMobile','documentType','documentNumber','company','campaign']
                  : undefined
              }
            />
          ) : (
            <div>No hay postulante seleccionado</div>
          )}
        </Modal>

        {/* global contract modal */}
        <Modal
          isOpen={isContractModalOpen}
          title="Datos de Contrato"
          className="contract-modal"
          onClose={() => { setIsContractModalOpen(false); setCurrentContractApplicant(null); }}
        >
          <div className="contract-form">
            {/* COLUMN 1: EMPLEADO */}
            <div className="section-group disabled">
              <h3 className="section-title">EMPLEADO</h3>
              <label>Nombres</label>
              <input type="text" value={currentContractApplicant?.nombres || ''} disabled />
              <label>Apellidos</label>
              <input type="text" value={currentContractApplicant?.apellidos || ''} disabled />
              <label>Doc.</label>
              <select value={currentContractApplicant?.documentType || ''} disabled>
                <option value="">Seleccione...</option>
                {documentTypes.map(dt => <option key={dt} value={dt}>{dt}</option>)}
              </select>
              <label>N°Doc</label>
              <input type="text" value={currentContractApplicant?.documentNumber || ''} disabled />
            </div>

            {/* COLUMN 2: DATOS PERSONALES & CONTACTO */}
            <div className="section-group">
              <h3 className="section-title">DATOS PERSONALES & CONTACTO</h3>
              <label>Fecha Nac.</label>
              <input type="date" name="birthDate" value={contractData.birthDate} onChange={handleContractChange} />
              <label>Nacionalidad</label>
              <select name="nationality" value={contractData.nationality} onChange={handleContractChange}>
                <option value="">Seleccione...</option>
                {nationalities.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <label>Estado Civil</label>
              <select name="civilStatus" value={contractData.civilStatus} onChange={handleContractChange}>
                <option value="">Seleccione...</option>
                {civilStatuses.map(cs => <option key={cs} value={cs}>{cs}</option>)}
              </select>
              <label>¿Hijos?</label>
              <select name="hasChildren" value={contractData.hasChildren} onChange={handleContractChange}>
                {yesNo.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <label>Celular</label>
              <input type="text" value={currentContractApplicant?.phoneMobile || ''} disabled />
              <label>Email</label>
              <input type="email" name="personalEmail" value={contractData.personalEmail} onChange={handleContractChange} />
              <label>Distrito</label>
              <select name="district" value={contractData.district} onChange={handleContractChange}>
                <option value="">Seleccione...</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <label>Dirección</label>
              <input type="text" name="address" value={contractData.address} onChange={handleContractChange} />
            </div>

            {/* COLUMN 3: INFORMACIÓN LABORAL */}
            <div className="section-group">
              <h3 className="section-title">INFORMACIÓN LABORAL</h3>
              <label>Régimen</label>
              <select name="regimen" value={contractData.regimen} onChange={handleContractChange}>
                <option value="">Seleccione...</option>
                <option value="RECIBO POR HONORARIOS">RxH</option>
                <option value="PLANILLA">PLANILLA</option>
              </select>
              {contractData.regimen === 'PLANILLA' && (
                <>
                  <label>Seguro</label>
                  <select name="seguro" value={contractData.seguro} onChange={handleContractChange}>
                    <option value="">Seleccione...</option>
                    <option value="SIS">SIS</option>
                    <option value="ESSALUD">ESSALUD</option>
                  </select>
                  <label>Pensión</label>
                  <select name="pension" value={contractData.pension} onChange={handleContractChange}>
                    <option value="">Seleccione...</option>
                    <option value="ONP">ONP</option>
                    <option value="AFP INTEGRA">AFP INT.</option>
                    <option value="AFP PROFUTURO">AFP PRO.</option>
                    <option value="AFP HABITAT">AFP HAB.</option>
                    <option value="AFP PRIMA">AFP PRIMA</option>
                  </select>
                </>
              )}
              <label>Modalidad</label>
              <select name="modalidad" value={contractData.modalidad} onChange={handleContractChange}>
                <option value="">Seleccione...</option>
                <option value="PART TIME">PART TIME</option>
                <option value="SEMI FULL">SEMI FULL</option>
                <option value="FULL TIME">FULL TIME</option>
                <option value="SUPER FULL">SUPER FULL</option>
              </select>
              <label>Puesto</label>
              <input type="text" value={(currentContractApplicant?.positionOfInterest || '').replace(/_/g, ' ')} disabled />
              <label>Campaña</label>
              <input type="text" value={currentContractApplicant?.campaign || ''} disabled />
              <label>Compañía</label>
              <input type="text" value={currentContractApplicant?.company || ''} disabled />
              <label>Inicio</label>
              <input name="startDate" type="date" value={contractData.startDate} onChange={handleContractChange} />
              <label>Sueldo</label>
              <div className="salary-input-group">
                <span className="salary-symbol">S/.</span>
                <input name="salary" type="number" value={contractData.salary} onChange={handleContractChange} />
              </div>
            </div>

            {/* COLUMN 4: INFORMACIÓN BANCARIA & TRANSFERENCIA */}
            <div className="section-group">
              <h3 className="section-title">INFORMACIÓN BANCARIA & TRANSFERENCIA</h3>
              <label>Cuenta propia?</label>
              <select name="ownAccount" value={contractData.ownAccount} onChange={handleContractChange}>
                <option value="">Seleccione...</option>
                <option value="Sí">Sí</option>
                <option value="No">No</option>
              </select>
              {contractData.ownAccount !== 'Sí' && (
                <>
                  <label>Parentesco</label>
                  <select name="kinship" value={contractData.kinship} onChange={handleContractChange}>
                    <option value="">Seleccione...</option>
                    <option value="PADRE">PADRE</option>
                    <option value="MADRE">MADRE</option>
                    <option value="TÍO/A">TÍO/A</option>
                    <option value="ESPOSO/A">ESPOSO/A</option>
                    <option value="HERMANO/A">HERMANO/A</option>
                    <option value="ABUELO/A">ABUELO/A</option>
                    <option value="PAREJA">PAREJA</option>
                    <option value="OTRO">OTRO</option>
                  </select>
                </>
              )}
              <label>Banco</label>
              <select name="bank" value={contractData.bank} onChange={handleContractChange}>
                <option value="">Seleccione...</option>
                {banks.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <label>Cuenta</label>
              <input type="text" name="accountNumber" value={contractData.accountNumber} onChange={handleAccountNumberChange} />
              <label>Interbancaria</label>
              <input type="text" name="interbankNumber" value={contractData.interbankNumber} onChange={handleInterbankNumberChange} />
              <label>Celular Transferencia</label>
              <input type="text" name="cellularTransfer" value={contractData.cellularTransfer} onChange={handleCellularTransferChange} maxLength={9} />
              <label>Empresa Contratista</label>
              <select name="contractorCompany" value={contractData.contractorCompany} onChange={handleContractChange}>
                <option value="">Seleccione...</option>
                <option value="ALBRU">ALBRU</option>
                <option value="RUNA">RUNA</option>
              </select>
            </div>

            <div className="modal-actions">
              <button onClick={() => setIsContractModalOpen(false)}>Cancelar</button>
              <button onClick={handleContractSubmit}>Confirmar</button>
            </div>
          </div> {/* end contract-form */}
        </Modal>

        {/* blacklist confirmation modal */}
        <Modal
          isOpen={isBlacklistModalOpen}
          title="Confirmación"
          onClose={() => setIsBlacklistModalOpen(false)}
        >
          <p>Seguro de pasar a <span className="blacklist-name">{currentBlacklistApplicant?.fullName}</span> a lista negra?</p>
          <div className="modal-actions">
            <button onClick={() => setIsBlacklistModalOpen(false)}>Cancelar</button>
            <button onClick={confirmBlacklist}>Confirmar</button>
          </div>
        </Modal>
    </div>
  );
};

export const EmployeeDashboard: React.FC = () => {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    ErrorLogger.logError('EmployeeDashboard', error, {
      componentStack: errorInfo.componentStack,
      feature: 'RRHH'
    });
  };

  return (
    <FeatureErrorBoundary featureName="RRHH" onError={handleError}>
      <EmployeeDashboardContent />
    </FeatureErrorBoundary>
  );
};