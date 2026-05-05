import React, { useCallback, useEffect, useState } from 'react';
import { Sidebar } from '@widgets/sidebar/ui';
import { Modal, SessionLogoutButton } from '@shared/ui';
import { NewApplicantForm } from '@features/register-applicant/ui';
import { NewEmployeeForm } from '@features/register-employee/ui/NewEmployeeForm';
import { ApplicantService } from '@entities/applicant/model';
import { EmployeeService } from '@entities/employee/model';
import { useRegistrarEmpleadoConContrato } from '@features/register-employee/model/useRegistrarEmpleadoConContrato';
import { mapFormToRegistrarEmpleadoRequest } from '@features/register-employee/model/mappers/newEmployeeFormDataMapper';
import { useAuth } from '@entities/auth';
import { AuthService } from '@entities/auth/api/auth.service';
import { BiUserPlus, BiIdCard, BiBuildingHouse, BiMoney } from 'react-icons/bi';
import { TipificacionesAdmin } from '@features/typifications/ui/TipificacionesAdmin';
import type { Employee, NewApplicantFormData, NewEmployeeFormData, UserProfile, RegistrarContratoRequest, UsuarioResponse } from '@shared/types';
import { EmpresasContratistasSection } from '@features/admin/ui/EmpresasContratistasSection';
import { PagosSection } from '@features/admin/ui/PagosSection';
import './AdminPage.css';

type AdminTab = 'postulante' | 'empleado' | 'credenciales' | 'tipificaciones' | 'empresas' | 'pagos';

const ADMIN_EMPLOYEE_CACHE_KEY = 'admin_recent_employees';
const MAX_CACHED_ADMIN_EMPLOYEES = 300;
const AUTH_USER_SYNC_RETRY_DELAYS_MS = [0, 600, 1200, 2000, 3200];

const readCachedAdminEmployees = (): Employee[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(ADMIN_EMPLOYEE_CACHE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is Employee => typeof item === 'object' && item !== null);
  } catch {
    return [];
  }
};

const writeCachedAdminEmployees = (employees: Employee[]): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(
      ADMIN_EMPLOYEE_CACHE_KEY,
      JSON.stringify(employees.slice(0, MAX_CACHED_ADMIN_EMPLOYEES))
    );
  } catch {
    // Ignore quota/storage errors; cache is best-effort only.
  }
};

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const isEventuallyConsistentAuthError = (message: string): boolean => {
  const normalizedMessage = message.toLowerCase();
  return normalizedMessage.includes('404') || normalizedMessage.includes('not found');
};

const AdminPage: React.FC = () => {
  const [tab, setTab] = useState<AdminTab>('postulante');
  const [loading, setLoading] = useState(false);
  const [isApplicantModalOpen, setIsApplicantModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [empleadosList, setEmpleadosList] = useState<Employee[]>([]);
  const [empleadosLoading, setEmpleadosLoading] = useState(false);
  const [empleadosError, setEmpleadosError] = useState<string | null>(null);
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<number | null>(null);
  const [employeeUserDetails, setEmployeeUserDetails] = useState<Record<number, UsuarioResponse>>({});
  const [employeeUserLoadingId, setEmployeeUserLoadingId] = useState<number | null>(null);
  const [employeeFeedbackModal, setEmployeeFeedbackModal] = useState<{ title: string; message: string } | null>(null);
  const { currentUser } = useAuth();
  
  // Usar hook de orquestación de empleado y contrato
  const { registrar } = useRegistrarEmpleadoConContrato();

  const user = currentUser
    ? ({ name: currentUser.name, role: currentUser.roles?.[0] ?? 'ADMIN' } as UserProfile)
    : undefined;

  const navItems = [
    { label: 'Registrar Postulante', icon: BiUserPlus, active: tab === 'postulante' },
    { label: 'Registrar Empleado', icon: BiIdCard, active: tab === 'empleado' },
    { label: 'Credenciales Generadas', icon: BiUserPlus, active: tab === 'credenciales' },
    { label: 'Tipificaciones', icon: BiIdCard, active: tab === 'tipificaciones' },
    { label: 'Empresas Contratistas', icon: BiBuildingHouse, active: tab === 'empresas' },
    { label: 'Pagos', icon: BiMoney, active: tab === 'pagos' },
  ];

  const resolveEmpleadoId = useCallback((empleado: Employee): number => {
    const rawId = empleado.id ?? empleado['empleadoId'];
    return Number(rawId);
  }, []);

  const mergeEmployeesById = useCallback((...groups: Employee[][]): Employee[] => {
    const uniqueById = new Map<number, Employee>();

    groups.flat().forEach((empleado) => {
      const id = resolveEmpleadoId(empleado);
      if (!Number.isFinite(id) || id <= 0 || uniqueById.has(id)) {
        return;
      }
      uniqueById.set(id, empleado);
    });

    return Array.from(uniqueById.values()).sort((a, b) => resolveEmpleadoId(b) - resolveEmpleadoId(a));
  }, [resolveEmpleadoId]);

  const fetchEmployeeUserWithRetry = useCallback(
    async (
      empleadoId: number,
      options?: { suppressFinalError?: boolean }
    ): Promise<UsuarioResponse | null> => {
      let lastError: Error | null = null;

      for (const retryDelay of AUTH_USER_SYNC_RETRY_DELAYS_MS) {
        if (retryDelay > 0) {
          await wait(retryDelay);
        }

        try {
          const usuario = await AuthService.obtenerUsuarioPorEmpleadoId(empleadoId);
          setEmployeeUserDetails((prev) => ({ ...prev, [empleadoId]: usuario }));
          return usuario;
        } catch (error) {
          const normalizedError =
            error instanceof Error
              ? error
              : new Error('No se pudo obtener el usuario por ID de empleado.');

          lastError = normalizedError;

          if (!isEventuallyConsistentAuthError(normalizedError.message)) {
            throw normalizedError;
          }
        }
      }

      if (!options?.suppressFinalError && lastError) {
        throw lastError;
      }

      return null;
    },
    []
  );

  const handleNavClick = (label: string) => {
    if (label.includes('Postulante')) {
      setTab('postulante');
      return;
    }
    if (label.includes('Empleado')) {
      setTab('empleado');
      return;
    }
    if (label.includes('Credenciales')) {
      setTab('credenciales');
      return;
    }
    if (label.includes('Tipificaciones')) {
      setTab('tipificaciones');
      return;
    }
    if (label.includes('Empresas Contratistas')) {
      setTab('empresas');
      return;
    }
    if (label.includes('Pagos')) {
      setTab('pagos');
      return;
    }
  };

  const handleCrearPostulante = async (formData: NewApplicantFormData) => {
    setLoading(true);
    try {
      await ApplicantService.createApplicant(formData);
      alert('Postulante creado correctamente');
    } catch (error) {
      console.error(error);
      alert('Error al registrar postulante. Revisa los datos e intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearEmpleado = async (formData: NewEmployeeFormData) => {
    setLoading(true);
    try {
      // PASO 1: Mapear datos de UI a DTO de backend (explícito, sin spread)
      const empleadoData = mapFormToRegistrarEmpleadoRequest(formData);

      const sueldoBase = Number(formData.sueldoBase);

      if (Number.isNaN(sueldoBase) || sueldoBase < 0) {
        throw new Error('sueldoBase debe ser un número mayor o igual a 0');
      }

      // PASO 2: Construir contratoData
      const contratoData: RegistrarContratoRequest = {
        puestoTrabajo: formData.puestoTrabajo,
        regimen: formData.regimen,
        modalidad: formData.modalidad,
        seguroSalud: formData.seguroSalud,
        sistemaPensiones: formData.sistemaPensiones,
        sueldoBase,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin?.trim() || undefined,

        // Legacy payload fields for backward compatibility in downstream services.
        puesto: formData.puestoTrabajo,
        salario: sueldoBase,
        tipoContrato: formData.regimen,
      };

      // PASO 3: Orquestar empleado + contrato
      const resultado = await registrar({
        empleadoData,
        contratoData,
      });

      setEmpleadosList((prev) => {
        const nuevoEmpleado: Employee = {
          id: resultado.empleadoId,
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          fullName: `${formData.nombres} ${formData.apellidos}`.trim(),
          numeroDocumento: formData.numeroDocumento,
          correoPersonal: formData.correoPersonal,
        };

        const merged = mergeEmployeesById([nuevoEmpleado], prev);
        writeCachedAdminEmployees(merged);
        return merged;
      });

      if (!resultado.partial && resultado.username) {
        const createdUsername = resultado.username;

        setEmployeeUserDetails((prev) => ({
          ...prev,
          [resultado.empleadoId]: {
            id: resultado.empleadoId,
            username: createdUsername,
            email: formData.correoPersonal,
            empleadoId: resultado.empleadoId,
            nombreCompleto: `${formData.nombres} ${formData.apellidos}`.trim(),
            dni: formData.numeroDocumento || undefined,
            activo: true,
            roles: prev[resultado.empleadoId]?.roles ?? [],
          },
        }));

        // Sync eventual consistency between rrhh and auth services.
        void fetchEmployeeUserWithRetry(resultado.empleadoId, { suppressFinalError: true });
      }

      /**
       * TODO: CREDENCIALES - Pendiente de implementación completa
       * Decisión de producto confirmada:
       * - Modal con botón "Copiar" para el admin (mejora UX sobre alert)
       * - Página de bienvenida en primer login del usuario nuevo con credenciales
       * - Envío de credenciales por email al usuario
       * Ver ticket: [agregar referencia cuando se cree]
       *
       * Por ahora: mostrar credenciales en alert() legible
       */
      
      let message = `ID Empleado: ${resultado.empleadoId}`;

      if (resultado.partial) {
        message += `\n\nATENCION:`;
        message += `\nEl contrato se registro, pero no se pudieron generar credenciales en auth-service.`;
        message += `\nDetalles: ${resultado.message || 'error auth-service'}`;
      } else if (resultado.username && resultado.password) {
        message += `\n\nCREDENCIALES GENERADAS:`;
        message += `\nUsuario: ${resultado.username}`;
        message += `\nContrasena: ${resultado.password}`;
        message += `\n\nGuarda estas credenciales.`;
        message += `\nEl usuario recibira un email de bienvenida (pendiente).`;
      }

      setEmployeeFeedbackModal({
        title: 'Empleado registrado correctamente',
        message,
      });
      setIsEmployeeModalOpen(false);
    } catch (error) {
      console.error(error);
      const errorMsg = error instanceof Error ? error.message : 'Error al registrar empleado';
      setEmployeeFeedbackModal({
        title: 'Error al registrar empleado',
        message: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab !== 'credenciales') return;
    let active = true;

    const loadEmployees = async () => {
      setEmpleadosLoading(true);
      setEmpleadosError(null);
      try {
        const response = await EmployeeService.getAllEmployees({ page: 0, size: 5000, sort: 'id,desc' });
        const allItems = response.items;
        const cachedItems = readCachedAdminEmployees();

        if (!active) return;
        setEmpleadosList((prev) => {
          const merged = mergeEmployeesById(allItems, cachedItems, prev);
          writeCachedAdminEmployees(merged);
          return merged;
        });
      } catch {
        if (!active) return;
        setEmpleadosError('No se pudieron cargar los empleados.');
        const cachedItems = readCachedAdminEmployees();
        setEmpleadosList((prev) => mergeEmployeesById(cachedItems, prev));
      } finally {
        if (active) setEmpleadosLoading(false);
      }
    };

    loadEmployees();

    return () => {
      active = false;
    };
  }, [tab, mergeEmployeesById]);

  const handleToggleEmployeeUser = async (empleado: Employee) => {
    const empleadoId = resolveEmpleadoId(empleado);
    if (!Number.isFinite(empleadoId) || empleadoId <= 0) {
      setEmpleadosError('No se pudo resolver un ID valido para este empleado.');
      return;
    }

    if (expandedEmployeeId === empleadoId) {
      setExpandedEmployeeId(null);
      return;
    }

    setExpandedEmployeeId(empleadoId);

    if (employeeUserDetails[empleadoId]) {
      return;
    }

    setEmployeeUserLoadingId(empleadoId);
    setEmpleadosError(null);

    try {
      await fetchEmployeeUserWithRetry(empleadoId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo obtener el usuario por ID de empleado.';
      setEmpleadosError(message);
    } finally {
      setEmployeeUserLoadingId(null);
    }
  };

  return (
    <div className="admin-page-container">
      <Sidebar navItems={navItems} onNavClick={handleNavClick} user={user} />

      <div className="admin-content">
        <div className="admin-hero">
          <div>
            <h1>Panel Administrativo</h1>
            <p>Bienvenido, {currentUser?.name ?? 'Administrador'}.</p>
          </div>
          <SessionLogoutButton />
        </div>

        <div className="admin-section">
          {tab === 'postulante' && (
            <section>
              <h2>Registrar Postulante</h2>
              <p>Completa los datos para registrar un nuevo postulante.</p>
              <button className="btn-primary" onClick={() => setIsApplicantModalOpen(true)}>
                Registrar Postulante
              </button>
            </section>
          )}

          {tab === 'empleado' && (
            <section>
              <h2>Registrar Empleado</h2>
              <p>Completa los datos para registrar un nuevo empleado.</p>
              <button className="btn-primary" onClick={() => setIsEmployeeModalOpen(true)}>
                Registrar Empleado
              </button>
            </section>
          )}

          {tab === 'credenciales' && (
            <section>
              <div className="credentials-update-section">
                <h3>Usuarios de Empleados</h3>
                
                {empleadosLoading ? (
                  <div className="admin-loading">Cargando empleados...</div>
                ) : (
                  <>
                    {empleadosError && <div className="error-message">{empleadosError}</div>}
                    <div className="employee-list">
                      {empleadosList.map((empleado) => {
                        const empleadoId = resolveEmpleadoId(empleado);
                        if (!Number.isFinite(empleadoId) || empleadoId <= 0) {
                          return null;
                        }
                        const detail = employeeUserDetails[empleadoId];
                        const fullName = (empleado.fullName ?? `${empleado.nombres ?? ''} ${empleado.apellidos ?? ''}`).trim() || `Empleado ${empleadoId}`;
                        const selected = expandedEmployeeId === empleadoId;

                        return (
                          <div key={empleadoId} className={`employee-card ${selected ? 'expanded' : ''}`}>
                            <button
                              type="button"
                              className="employee-card-header"
                              onClick={() => handleToggleEmployeeUser(empleado)}
                            >
                              <span>{fullName} (ID: {empleadoId})</span>
                              <span className="employee-card-badge">{selected ? 'Ocultar detalle' : 'Ver detalle'}</span>
                            </button>

                            {selected && (
                              <div className="employee-card-details">
                                {employeeUserLoadingId === empleadoId ? (
                                  <p className="admin-loading">Consultando usuario...</p>
                                ) : detail ? (
                                  <>
                                    <div className="employee-detail-row"><strong>Username:</strong> {detail.username}</div>
                                    <div className="employee-detail-row"><strong>Email:</strong> {detail.email}</div>
                                    <div className="employee-detail-row"><strong>DNI:</strong> {detail.dni ?? 'No disponible'}</div>
                                  </>
                                ) : (
                                  <div className="employee-detail-row">No se encontró usuario para este empleado.</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

            </section>
          )}

          {tab === 'tipificaciones' && (
            <section>
              <h2>Administración de Tipificaciones</h2>
              <TipificacionesAdmin />
            </section>
          )}

          {tab === 'empresas' && <EmpresasContratistasSection />}

          {tab === 'pagos' && <PagosSection />}

          {loading && <div className="admin-loading">Procesando...</div>}
        </div>
      </div>

      <Modal
        className="admin-modal"
        isOpen={isApplicantModalOpen}
        onClose={() => setIsApplicantModalOpen(false)}
        title="Registrar Postulante"
      >
        <NewApplicantForm
          onSubmit={async (data) => {
            await handleCrearPostulante(data);
            setIsApplicantModalOpen(false);
          }}
        />
      </Modal>

      <Modal
        className="admin-modal"
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        title="Registrar Empleado"
        size="full"
      >
        <NewEmployeeForm
          onSubmit={async (data) => {
            await handleCrearEmpleado(data);
          }}
          onCancel={() => setIsEmployeeModalOpen(false)}
        />
      </Modal>

      <Modal
        className="admin-modal"
        isOpen={employeeFeedbackModal !== null}
        onClose={() => setEmployeeFeedbackModal(null)}
        title={employeeFeedbackModal?.title}
        size="md"
      >
        <div className="admin-feedback-modal-content">
          <pre className="admin-feedback-modal-message">
            {employeeFeedbackModal?.message}
          </pre>
          <div className="admin-feedback-modal-actions">
            <button className="btn-primary" onClick={() => setEmployeeFeedbackModal(null)}>
              Aceptar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminPage;

