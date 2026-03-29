import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@widgets/barra-lateral/ui';
import { Modal } from '@shared/ui';
import { NewApplicantForm } from '@caracteristicas/registrar-postulante/ui';
import { NewEmployeeForm } from '@caracteristicas/registrar-empleado/ui/NewEmployeeForm';
import { ApplicantService } from '@entidades/postulante/model';
import { useRegistrarEmpleadoConContrato } from '@caracteristicas/registrar-empleado/model/useRegistrarEmpleadoConContrato';
import { mapFormToRegistrarEmpleadoRequest } from '@caracteristicas/registrar-empleado/model/mappers/newEmployeeFormDataMapper';
import { useAuth } from '@shared/auth/useAuth';
import { AuthService } from '@shared/services/auth.service';
import { PuestoTrabajoEnum } from '@shared/types';
import { BiUserPlus, BiIdCard } from 'react-icons/bi';
import type { NewApplicantFormData, NewEmployeeFormData, UserProfile, RegistrarContratoRequest } from '@shared/types';
import './AdminPage.css';

type AdminTab = 'postulante' | 'empleado' | 'credenciales';

const AdminPage: React.FC = () => {
  const [tab, setTab] = useState<AdminTab>('postulante');
  const [loading, setLoading] = useState(false);
  const [isApplicantModalOpen, setIsApplicantModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    empleadoId: number;
    puesto: string;
    username?: string;
    password?: string;
    partial?: boolean;
    message?: string;
    createdAt: string;
  }[]>([]);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updatePayload, setUpdatePayload] = useState<{
    empleadoId: number;
    username: string;
    puestoTrabajo: string;
  }>({
    empleadoId: 0,
    username: '',
    puestoTrabajo: PuestoTrabajoEnum.ASESOR_VENTAS,
  });
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  // Usar hook de orquestación de empleado y contrato
  const { loading: employeeLoading, error: employeeError, result: employeeResult, registrar } = useRegistrarEmpleadoConContrato();

  const user = currentUser
    ? ({ name: currentUser.name, role: currentUser.roles?.[0] ?? 'ADMIN' } as UserProfile)
    : undefined;

  const navItems = [
    { label: 'Registrar Postulante', icon: BiUserPlus, active: tab === 'postulante' },
    { label: 'Registrar Empleado', icon: BiIdCard, active: tab === 'empleado' },
    { label: 'Credenciales Generadas', icon: BiUserPlus, active: tab === 'credenciales' },
  ];

  const handleNavClick = (label: string) => {
    if (label.includes('Postulante')) {
      setTab('postulante');
    }
    if (label.includes('Empleado')) {
      setTab('empleado');
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

      // PASO 2: Construir contratoData
      const contratoData: RegistrarContratoRequest = {
        puesto: formData.puesto,
        puestoTrabajo: formData.puesto, // aseguro campo esperable por auth-service
        salario: formData.baseSalary ? parseFloat(formData.baseSalary as any) : undefined,
        fechaInicio: formData.startDate,
        tipoContrato: formData.regimen || 'PLANILLA',
      };

      // PASO 3: Orquestar empleado + contrato
      const resultado = await registrar({
        empleadoData,
        contratoData,
      });

      setGeneratedCredentials(prev => [
        {
          empleadoId: resultado.empleadoId,
          puesto: formData.puesto || '',
          username: resultado.username,
          password: resultado.password,
          partial: resultado.partial,
          message: resultado.message,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);

      // AUTO-LLENAR: el empleadoId del nuevo empleado registrado en el formulario de actualización
      setUpdatePayload(prev => ({
        ...prev,
        empleadoId: resultado.empleadoId,
      }));

      let message = `Empleado registrado correctamente con ID: ${resultado.empleadoId}`;

      if (resultado.partial) {
        message += `\n\nAtención: el contrato se registró, pero no se pudieron generar credenciales en auth-service.`;
      } else if (resultado.username && resultado.password) {
        message += `\n\nCredenciales generadas:\nUsuario: ${resultado.username}\nContraseña: ${resultado.password}`;
      }

      alert(message);
      setIsEmployeeModalOpen(false);
    } catch (error) {
      console.error(error);
      const errorMsg = error instanceof Error ? error.message : 'Error al registrar empleado';
      alert(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleActualizarUsernameRoles = async () => {
    setUpdateLoading(true);
    setUpdateError(null);

    try {
      if (!updatePayload.empleadoId || !updatePayload.username?.trim() || !updatePayload.puestoTrabajo?.trim()) {
        throw new Error('Debe elegir empleado, username y puesto de trabajo.');
      }

      await AuthService.actualizarUsernameRoles(updatePayload.empleadoId, {
        username: updatePayload.username.trim(),
        puestoTrabajo: updatePayload.puestoTrabajo.trim(),
      });

      alert('Actualización de username/roles exitosa, puestoTrabajo incluido.');
      setUpdatePayload(prev => ({ ...prev, username: '' }));
    } catch (error) {
      console.error(error);
      setUpdateError(error instanceof Error ? error.message : 'Error al actualizar credenciales y roles');
      alert(`Error al actualizar username/roles: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-page-container">
      <Sidebar navItems={navItems} onNavClick={handleNavClick} user={user} />

      <div className="admin-content">
        <div className="admin-hero">
          <h1>Panel Administrativo</h1>
          <p>Bienvenido, {currentUser?.name ?? 'Administrador'}.</p>
          <button onClick={handleLogout} className="btn-logout">
            Cerrar sesión
          </button>
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
              <h2>Credenciales Generadas</h2>
              <p>Lista de credenciales y estado de registro para cada puesto.</p>
              {generatedCredentials.length === 0 ? (
                <p>No hay credenciales generadas todavía.</p>
              ) : (
                <>
                  <table className="credentials-table">
                    <thead>
                      <tr>
                        <th>ID Empleado</th>
                        <th>Puesto</th>
                        <th>Usuario</th>
                        <th>Contraseña</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generatedCredentials.map((item, index) => (
                        <tr key={`${item.empleadoId}-${index}`}>
                          <td>{item.empleadoId}</td>
                          <td>{item.puesto}</td>
                          <td>{item.username ?? 'N/A'}</td>
                          <td>{item.password ?? 'N/A'}</td>
                          <td>{item.partial ? `Parcial: ${item.message ?? 'error auth-service'}` : 'OK'}</td>
                          <td>{new Date(item.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="credentials-update-section">
                    <h3>Actualizar username y roles (incluye puestoTrabajo obligatorio)</h3>
                    <div className="form-group">
                      <label>ID Empleado (registrados en esta sesión)</label>
                      <select
                        value={updatePayload.empleadoId}
                        onChange={(e) => setUpdatePayload((prev) => ({ ...prev, empleadoId: Number(e.target.value) }))}
                      >
                        <option value={0}>-- Seleccionar empleado --</option>
                        {generatedCredentials.map((cred) => (
                          <option key={cred.empleadoId} value={cred.empleadoId}>
                            ID: {cred.empleadoId} - {cred.puesto} (Usuario: {cred.username || 'sin generar'})
                          </option>
                        ))}
                      </select>
                      <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                        ⚠️ Nota: Solo se muestran empleados registrados en esta sesión. El empleadoId debe existir en BD.
                      </small>
                    </div>
                    <div className="form-group">
                      <label>Usuario</label>
                      <input
                        type="text"
                        value={updatePayload.username}
                        onChange={(e) => setUpdatePayload((prev) => ({ ...prev, username: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Puesto de Trabajo</label>
                      <select
                        value={updatePayload.puestoTrabajo}
                        onChange={(e) => setUpdatePayload((prev) => ({ ...prev, puestoTrabajo: e.target.value }))}
                      >
                        {Object.values(PuestoTrabajoEnum).map((puesto) => (
                          <option key={puesto} value={puesto}>
                            {puesto.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                    {updateError && <div className="error-message">{updateError}</div>}
                    <button className="btn-primary" onClick={handleActualizarUsernameRoles} disabled={updateLoading}>
                      {updateLoading ? 'Actualizando...' : 'Actualizar Username/Roles'}
                    </button>
                  </div>
                </>
              )}
            </section>
          )}

          {loading && <div className="admin-loading">Procesando...</div>}
        </div>
      </div>

      <Modal
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
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        title="Registrar Empleado"
      >
        <NewEmployeeForm
          onSubmit={async (data) => {
            await handleCrearEmpleado(data);
            setIsEmployeeModalOpen(false);
          }}
          onCancel={() => setIsEmployeeModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default AdminPage;

