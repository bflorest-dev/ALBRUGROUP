import React, { useState } from 'react';
import { useDevRole } from '../../../contexts/DevRoleContext';
import type { Role } from '../../../shared/types';
import { LoginForm } from './LoginForm';
import type { LoginFormData } from './LoginForm';
import { login } from '../services';
import './LoginForm.css';

/**
 * DEV_FORCE_ROLE
 *
 * Solo en desarrollo: fuerza una vista específica después del login
 * independientemente del rol que devuelva el backend.
 *
 * Útil cuando el backend solo tiene usuario ADMINISTRADOR pero necesitas
 * desarrollar y probar otra vista (ej: RRHH).
 *
 * Cambia este valor para probar distintas vistas:
 *   'RRHH' | 'RECLUTAMIENTO' | 'CAPACITACION' | 'ADMINISTRADOR' | null
 *
 * Ponlo en null cuando ya tengas usuarios con roles correctos en el backend.
 */
const DEV_FORCE_ROLE: Role | null = import.meta.env.DEV ? 'RRHH' : null;

// Validar si un string es una Role válida
const isValidRole = (value: string): value is Role => {
  const validRoles: Role[] = [
    'ADMINISTRADOR',
    'DESARROLLADOR',
    'LOGIN',
    'RRHH',
    'RECLUTAMIENTO',
    'CAPACITACION',
    'CONTABILIDAD',
    'COMMUNITY',
    'SUPERVISOR_VENTAS',
    'ASESOR_VENTAS',
    'SUPERVISOR_BACKOFFICE',
    'ASESOR_BACKOFFICE',
    'SUPERVISOR_GTR',
    'ASESOR_GTR',
    'SUPERVISOR_POSTVENTA',
    'ASESOR_POSTVENTA',
  ];
  return validRoles.includes(value as Role);
};

export const LoginPage: React.FC = () => {
  const { setSelectedRole } = useDevRole();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);
    
    console.log('[LoginPage] 🔐 Iniciando login...');
    console.log('[LoginPage]   - Username:', data.username);
    console.log('[LoginPage]   - Password: ***');
    
    try {
      const response = await login(data);
      
      console.log('[LoginPage] ✅ LOGIN EXITOSO');
      console.log('[LoginPage]   - Username:', response.username);
      console.log('[LoginPage]   - Nombre:', response.nombreCompleto);
      console.log('[LoginPage]   - Roles:', response.roles);
      console.log('[LoginPage]   - EmpleadoId:', response.empleadoId);

      // En dev: DEV_FORCE_ROLE sobreescribe el rol del backend.
      const backendRole = response.roles?.find(isValidRole) || 'RRHH';
      const userRole: Role = DEV_FORCE_ROLE ?? backendRole;
      
      console.log('[LoginPage] Rol backend:', backendRole, '-> Rol asignado:', userRole);
      
      // setTimeout pequeño para permitir que AuthService termine de guardar en localStorage
      setTimeout(() => {
        setSelectedRole(userRole);
      }, 100);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al autenticar';
      setError(errorMessage);
      
      console.error('[LoginPage] ❌ ERROR en login');
      console.error('[LoginPage]   - Mensaje:', errorMessage);
      console.error('[LoginPage]   - Error completo:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-box">
        <LoginForm onSubmit={handleSubmit} loading={loading} />
        {error && (
          <div className="login-error" role="alert">
            {error}
          </div>
        )}
        {import.meta.env.DEV && (
          <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666', textAlign: 'center' }}>
            <p>🔧 Modo desarrollo activo</p>
            <p>Usa credenciales: usuario y contraseña proporcionadas por el backend</p>
          </div>
        )}
      </div>
    </div>
  );
};