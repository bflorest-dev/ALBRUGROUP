/**
 * EJEMPLOS DE INTEGRACIÓN CON API
 * 
 * Este archivo contiene ejemplos de cómo integrar la aplicación
 * con un backend real, reemplazando los datos mockeados.
 */

/* eslint-disable react-refresh/only-export-components */

const API_BASE_URL = 'https://api.example.com/api';

/**
 * Obtener lista de empleados
 */
export const fetchEmployees = async (
  page: number = 1,
  itemsPerPage: number = 4
): Promise<{ employees: Employee[]; total: number }> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/employees?page=${page}&limit=${itemsPerPage}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return {
      employees: data.data,
      total: data.total,
    };
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
};

/**
 * Obtener estadísticas
 */
export const fetchStatistics = async (): Promise<Statistic[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/statistics`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching statistics:', error);
    throw error;
  }
};

/**
 * Obtener empleado por ID
 */
export const fetchEmployeeById = async (id: string): Promise<Employee> => {
  try {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching employee ${id}:`, error);
    throw error;
  }
};

/**
 * Crear nuevo empleado
 */
export const createEmployee = async (
  employee: Omit<Employee, 'id'>
): Promise<Employee> => {
  try {
    const response = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employee),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating employee:', error);
    throw error;
  }
};

/**
 * Actualizar empleado
 */
export const updateEmployee = async (
  id: string,
  employee: Partial<Employee>
): Promise<Employee> => {
  try {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employee),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating employee ${id}:`, error);
    throw error;
  }
};

/**
 * Eliminar empleado
 */
export const deleteEmployee = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.error(`Error deleting employee ${id}:`, error);
    throw error;
  }
};

// ============================================================================
// 2. HOOK PERSONALIZADO - src/hooks/useFetchEmployees.ts
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

interface UseFetchEmployeesOptions {
  page?: number;
  itemsPerPage?: number;
}

interface UseFetchEmployeesResult {
  employees: Employee[];
  total: number;
  loading: boolean;
  error: Error | null;
}

export const useFetchEmployees = ({
  page = 1,
  itemsPerPage = 4,
}: UseFetchEmployeesOptions = {}): UseFetchEmployeesResult => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await fetchEmployees(page, itemsPerPage);
        setEmployees(data.employees);
        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, [page, itemsPerPage]);

  return { employees, total, loading, error };
};

// ============================================================================
// 3. USO EN COMPONENTE - src/components/pages/EmployeeDashboard.tsx
// ============================================================================

import { useState } from 'react';
import { StatCard, EmployeeTable, Pagination } from '../common';
import { Header } from '../layout/Header';
import { usePagination } from '../../hooks/usePagination';
import { useFetchEmployees } from '../../hooks/useFetchEmployees';
import { mockStatistics } from '../../utils/mockData';

export const EmployeeDashboardWithAPI = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  // Obtener empleados del API
  const { employees, total, loading, error } = useFetchEmployees({
    page: currentPage,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  const pagination = usePagination({
    totalItems: total,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  if (error) {
    return (
      <div className="error-container">
        <p>Error al cargar los datos: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="employee-dashboard">
      <Header
        title="Gestión de Empleados"
      />

      <main className="dashboard-content">
        {/* Estadísticas */}
        <section className="statistics-section">
          <div className="stats-grid">
            {mockStatistics.map((stat, index) => (
              <StatCard key={index} stat={stat} />
            ))}
          </div>
        </section>

        {/* Tabla */}
        <section className="directory-section">
          <div className="section-header">
            <h2>DIRECTORIO DE PERSONAL</h2>
          </div>

          {loading ? (
            <div className="loading">Cargando empleados...</div>
          ) : (
            <>
              <EmployeeTable employees={employees} />
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                itemsPerPage={pagination.itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </section>
      </main>
    </div>
  );
};

// ============================================================================
// 4. EJEMPLO CON AXIOS (alternativa a fetch)
// ============================================================================

import axios, { AxiosError } from 'axios';

const API = axios.create({
  baseURL: 'https://api.example.com/api',
  timeout: 10000,
});

// Interceptor para agregar token de autenticación
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores
API.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expirado, redirigir a login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const employeeServiceWithAxios = {
  fetchEmployees: async (page: number, limit: number) => {
    const { data } = await API.get('/employees', { params: { page, limit } });
    return data;
  },

  fetchStatistics: async () => {
    const { data } = await API.get('/statistics');
    return data;
  },

  createEmployee: async (employee: Omit<Employee, 'id'>) => {
    const { data } = await API.post('/employees', employee);
    return data;
  },

  updateEmployee: async (id: string, employee: Partial<Employee>) => {
    const { data } = await API.put(`/employees/${id}`, employee);
    return data;
  },

  deleteEmployee: async (id: string) => {
    await API.delete(`/employees/${id}`);
  },
};

// ============================================================================
// 5. MANEJO DE ERRORES Y LOADING
// ============================================================================

interface DataState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export const useAsync = <T,>(
  asyncFunction: () => Promise<T>,
  immediate = true
): DataState<T> & { execute: () => Promise<void> } => {
  const [state, setState] = useState<DataState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await asyncFunction();
      setState({ data: response, loading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return { ...state, execute };
};

// ============================================================================
// NOTAS IMPORTANTES
// ============================================================================

/**
 * 1. AUTENTICACIÓN:
 *    - Guardar token en localStorage/sessionStorage
 *    - Enviar token en header Authorization
 *    - Manejar expiración de token (401)
 *
 * 2. MANEJO DE ERRORES:
 *    - Mostrar mensajes al usuario
 *    - Registrar errores en consola (desarrollo)
 *    - Enviar a logging service (producción)
 *
 * 3. OPTIMIZACIÓN:
 *    - Usar React Query o SWR para caché automático
 *    - Implementar debouncing en búsquedas
 *    - Cachear datos cuando sea posible
 *
 * 4. SEGURIDAD:
 *    - Validar datos en servidor
 *    - Sanitizar entrada del usuario
 *    - Usar HTTPS siempre
 *    - Implementar CORS correctamente
 *
 * 5. TESTING:
 *    - Mockear fetch/axios en tests
 *    - Probar casos de error y loading
 *    - Usar MSW (Mock Service Worker) para tests
 */
