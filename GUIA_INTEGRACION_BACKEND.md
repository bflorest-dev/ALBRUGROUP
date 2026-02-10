# 🎓 GUÍA COMPLETA: INTEGRACIÓN CON BACKEND Y AUTENTICACIÓN POR TOKENS

## 📚 TABLA DE CONTENIDOS
1. [Conceptos Fundamentales](#conceptos-fundamentales)
2. [¿Qué es un Token?](#qué-es-un-token)
3. [Paso 1: Entender la Autenticación](#paso-1-entender-la-autenticación)
4. [Paso 2: Crear el Servicio de Autenticación](#paso-2-crear-el-servicio-de-autenticación)
5. [Paso 3: Crear el Servicio de API](#paso-3-crear-el-servicio-de-api)
6. [Paso 4: Crear Hooks Personalizados](#paso-4-crear-hooks-personalizados)
7. [Paso 5: Implementar en Componentes](#paso-5-implementar-en-componentes)
8. [Paso 6: Página de Login](#paso-6-página-de-login)
9. [Proteger Rutas](#proteger-rutas)
10. [Manejo de Errores](#manejo-de-errores)

---

## 🧠 CONCEPTOS FUNDAMENTALES

### ¿Qué es una API REST?
Una API REST es un servicio en el servidor que recibe peticiones HTTP y devuelve datos. Tu aplicación React le pregunta al servidor "dame los empleados" y el servidor responde con JSON.

```
Frontend (React)          Backend (Servidor)
    ↓                            ↓
  "Dame empleados"  ←→  Busca en base de datos
                              ↓
                    Devuelve JSON con empleados
```

### ¿Qué es Autenticación?
Es verificar la identidad del usuario. El usuario entra su email y contraseña, y el servidor verifica que sean correctos.

### ¿Qué es Autorización?
Después de autenticar, es permitir o denegar acceso a recursos. Ej: "este usuario puede ver empleados, pero no puede borrarlos".

---

## 🔑 ¿QUÉ ES UN TOKEN?

### Explicación Simple
Un **token** es como un "pase de acceso". El servidor te lo da cuando te logueas. Cada vez que pides datos, muestras el token, y el servidor dice "ok, tienes permiso".

```
1. Usuario escribe email: leonardo@gmail.com
2. Usuario escribe password: ****
3. Envía al servidor
4. Servidor verifica: ✓ datos correctos
5. Servidor crea token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
6. Devuelve token al cliente
7. Cliente guarda token en localStorage
8. En próximas peticiones, envía: "Authorization: Bearer eyJh..."
9. Servidor verifica token: ✓ válido
10. Devuelve datos
```

### Tipos de Tokens

#### JWT (JSON Web Token) - MÁS USADO
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Partes del JWT:**
- **Header**: Tipo de token (JWT) y algoritmo
- **Payload**: Datos del usuario (id, email, rol)
- **Signature**: Firma para verificar que es válido

#### Bearer Token
Simplemente significa "token que se envía en el header Authorization":
```
Authorization: Bearer <token>
```

---

## PASO 1: ENTENDER LA AUTENTICACIÓN

### El Flujo Completo

```mermaid
┌──────────────┐
│  Usuario     │
└──────┬───────┘
       │ 1. Abre navegador, ve página de login
       ↓
┌──────────────────────────────┐
│  Página de Login             │
│  - Input email               │
│  - Input password            │
│  - Botón Entrar              │
└──────┬───────────────────────┘
       │ 2. Usuario llena formulario y click
       ↓
┌──────────────────────────────────────────────┐
│  Función handleLogin() se ejecuta            │
│  - Lee email: leonardo@albru.pe              │
│  - Lee password: ****                        │
│  - Llama a authService.login()               │
└──────┬───────────────────────────────────────┘
       │ 3. Envía petición HTTP POST
       ↓
  INTERNET
       │
       ↓
┌──────────────────────────────────────────────┐
│  BACKEND (Servidor)                          │
│  POST /auth/login                            │
│  - Recibe email y password                   │
│  - Busca usuario en base de datos            │
│  - Verifica contraseña                       │
│  - SI es correcto: genera JWT                │
│  - SI es incorrecto: devuelve error          │
└──────┬───────────────────────────────────────┘
       │ 4. Responde con token
       ↓
  INTERNET
       │
       ↓
┌──────────────────────────────────────────────┐
│  Frontend recibe respuesta                   │
│  {                                           │
│    "token": "eyJhbGciOi...",                 │
│    "user": { "id": 1, "name": "Leo" }        │
│  }                                           │
└──────┬───────────────────────────────────────┘
       │ 5. Guarda token en localStorage
       ↓
┌──────────────────────────────────────────────┐
│  localStorage.setItem('authToken', token)    │
│  Redirige a Dashboard                        │
└──────┬───────────────────────────────────────┘
       │ 6. Usuario ve dashboard
       ↓
┌──────────────────────────────────────────────┐
│  Dashboard carga                             │
│  - Necesita empleados                        │
│  - Lee token de localStorage                 │
│  - Envía: GET /employees                     │
│     Header: Authorization: Bearer <token>    │
└──────┬───────────────────────────────────────┘
       │ 7. Envía petición CON token
       ↓
  INTERNET
       │
       ↓
┌──────────────────────────────────────────────┐
│  BACKEND                                     │
│  GET /employees                              │
│  - Recibe token en header                    │
│  - Verifica que token sea válido             │
│  - SI válido: devuelve empleados             │
│  - SI inválido: devuelve 401                 │
└──────┬───────────────────────────────────────┘
       │ 8. Devuelve datos
       ↓
  INTERNET
       │
       ↓
┌──────────────────────────────────────────────┐
│  Frontend recibe empleados                   │
│  Actualiza estado con setEmployees()         │
│  Componente se renderiza con datos reales    │
└──────────────────────────────────────────────┘
```

---

## PASO 2: CREAR EL SERVICIO DE AUTENTICACIÓN

### Concepto
Un "servicio" es un archivo con funciones reutilizables. El servicio de autenticación maneja todo lo relacionado con login/logout.

### Archivo: `src/services/authService.ts`

```typescript
/**
 * PASO A PASO:
 * 1. Defines funciones para login/logout
 * 2. Guardar/obtener token de localStorage
 * 3. Verificar si usuario está autenticado
 */

// Paso 1: URL de tu backend
const API_BASE_URL = 'https://tu-api.com/api';

// Paso 2: Interfaz para la respuesta del servidor
interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

// Paso 3: Crear el servicio
export const authService = {
  /**
   * LOGIN - Enviar credenciales y obtener token
   * 
   * ¿Qué hace?
   * - Envía email y password al servidor
   * - Recibe token si datos son correctos
   * - Guarda token en navegador
   * 
   * ¿Cómo usarlo?
   * const token = await authService.login('leo@albru.pe', 'password123');
   */
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      // Paso A: Hacer petición POST al servidor
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      // Paso B: Verificar que la respuesta sea exitosa
      if (!response.ok) {
        // Si no es OK (200), obtener mensaje de error
        const error = await response.json();
        throw new Error(error.message || 'Error al iniciar sesión');
      }

      // Paso C: Convertir respuesta a JSON
      const data: LoginResponse = await response.json();

      // Paso D: Guardar token en localStorage
      localStorage.setItem('authToken', data.token);

      // Paso E: Guardar información del usuario
      localStorage.setItem('user', JSON.stringify(data.user));

      // Paso F: Retornar datos al componente
      return data;
    } catch (error) {
      console.error('Error en login:', error);
      throw error; // Lanzar error para que el componente lo maneje
    }
  },

  /**
   * OBTENER TOKEN GUARDADO
   * 
   * ¿Qué hace?
   * - Lee token del localStorage
   * - Devuelve null si no existe
   * 
   * ¿Cómo usarlo?
   * const token = authService.getToken();
   * if (token) { hacer petición autenticada }
   */
  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },

  /**
   * OBTENER USUARIO GUARDADO
   * 
   * ¿Qué hace?
   * - Lee datos del usuario del localStorage
   * - Convierte JSON a objeto
   * 
   * ¿Cómo usarlo?
   * const user = authService.getUser();
   * console.log(user.name); // "Leonardo"
   */
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * VERIFICAR SI ESTÁ AUTENTICADO
   * 
   * ¿Qué hace?
   * - Verifica si hay token guardado
   * 
   * ¿Cómo usarlo?
   * if (authService.isAuthenticated()) {
   *   mostrar dashboard
   * } else {
   *   mostrar login
   * }
   */
  isAuthenticated: (): boolean => {
    return !!authService.getToken();
  },

  /**
   * LOGOUT - Limpiar datos de sesión
   * 
   * ¿Qué hace?
   * - Elimina token del navegador
   * - Elimina datos del usuario
   * - Redirige a login
   * 
   * ¿Cómo usarlo?
   * authService.logout(); // Usuario desconectado
   */
  logout: (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  /**
   * REFRESH TOKEN (Avanzado)
   * - Obtener nuevo token si el anterior expiró
   * - El servidor devuelve nuevo token
   */
  refreshToken: async (): Promise<string> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('No se pudo renovar token');
      }

      const data = await response.json();
      localStorage.setItem('authToken', data.token);
      return data.token;
    } catch (error) {
      authService.logout();
      throw error;
    }
  },
};
```

---

## PASO 3: CREAR EL SERVICIO DE API

### Concepto
El servicio de API es donde haces peticiones a tu backend (obtener empleados, crear, actualizar, etc). Usa el token para autenticarse.

### Archivo: `src/services/employeeService.ts`

```typescript
/**
 * PASO A PASO:
 * 1. Importar tipos
 * 2. Crear función helper para headers con token
 * 3. Crear funciones CRUD (Create, Read, Update, Delete)
 * 4. Usar authService para obtener token
 */

import type { Employee, Statistic } from '../types';
import { authService } from './authService';

const API_BASE_URL = 'https://tu-api.com/api';

/**
 * HELPER - Crear headers con autenticación
 * 
 * ¿Por qué?
 * - Cada petición necesita: Content-Type y Authorization
 * - En lugar de repetir código, lo hacemos aquí
 * 
 * ¿Qué devuelve?
 * {
 *   'Content-Type': 'application/json',
 *   'Authorization': 'Bearer eyJhbGci...'
 * }
 */
const getHeaders = (): HeadersInit => {
  const token = authService.getToken();
  
  // Si no hay token, usuario no está autenticado
  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

/**
 * OBTENER TODOS LOS EMPLEADOS (CON PAGINACIÓN)
 * 
 * HTTP: GET /api/employees?page=1&limit=4
 * 
 * ¿Qué hace?
 * - Obtiene lista de empleados del servidor
 * - Soporta paginación (página y cantidad)
 * 
 * ¿Cómo usarlo?
 * const { employees, total } = await employeeService.fetchEmployees(1, 4);
 * console.log(employees); // Array de empleados
 * console.log(total); // Total de empleados en BD
 */
export const employeeService = {
  fetchEmployees: async (
    page: number = 1,
    limit: number = 4
  ): Promise<{ employees: Employee[]; total: number }> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/employees?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: getHeaders(), // ← Agregar token aquí
        }
      );

      // Verificar si token expiró (respuesta 401)
      if (response.status === 401) {
        authService.logout(); // Desconectar usuario
        throw new Error('Sesión expirada');
      }

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al obtener empleados:', error);
      throw error;
    }
  },

  /**
   * OBTENER UN EMPLEADO POR ID
   * 
   * HTTP: GET /api/employees/123
   * 
   * ¿Cómo usarlo?
   * const employee = await employeeService.fetchEmployeeById('123');
   * console.log(employee.fullName); // "Leonardo"
   */
  fetchEmployeeById: async (id: string): Promise<Employee> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/employees/${id}`,
        {
          method: 'GET',
          headers: getHeaders(),
        }
      );

      if (response.status === 401) authService.logout();
      if (!response.ok) throw new Error(`Error ${response.status}`);

      return await response.json();
    } catch (error) {
      console.error(`Error al obtener empleado ${id}:`, error);
      throw error;
    }
  },

  /**
   * CREAR NUEVO EMPLEADO
   * 
   * HTTP: POST /api/employees
   * Body: { nombre, puesto, ... }
   * 
   * ¿Cómo usarlo?
   * const newEmployee = await employeeService.createEmployee({
   *   fullName: 'Juan García',
   *   position: 'Asesor',
   *   department: 'Ventas',
   *   ...
   * });
   */
  createEmployee: async (
    employee: Omit<Employee, 'id'>
  ): Promise<Employee> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/employees`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(employee),
        }
      );

      if (response.status === 401) authService.logout();
      if (!response.ok) throw new Error(`Error ${response.status}`);

      return await response.json();
    } catch (error) {
      console.error('Error al crear empleado:', error);
      throw error;
    }
  },

  /**
   * ACTUALIZAR EMPLEADO
   * 
   * HTTP: PUT /api/employees/123
   * Body: { fullName: "Nuevo nombre", ... }
   * 
   * ¿Cómo usarlo?
   * await employeeService.updateEmployee('123', { 
   *   fullName: 'Nuevo nombre' 
   * });
   */
  updateEmployee: async (
    id: string,
    updatedData: Partial<Employee>
  ): Promise<Employee> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/employees/${id}`,
        {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(updatedData),
        }
      );

      if (response.status === 401) authService.logout();
      if (!response.ok) throw new Error(`Error ${response.status}`);

      return await response.json();
    } catch (error) {
      console.error(`Error al actualizar empleado ${id}:`, error);
      throw error;
    }
  },

  /**
   * ELIMINAR EMPLEADO
   * 
   * HTTP: DELETE /api/employees/123
   * 
   * ¿Cómo usarlo?
   * await employeeService.deleteEmployee('123');
   */
  deleteEmployee: async (id: string): Promise<void> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/employees/${id}`,
        {
          method: 'DELETE',
          headers: getHeaders(),
        }
      );

      if (response.status === 401) authService.logout();
      if (!response.ok) throw new Error(`Error ${response.status}`);
    } catch (error) {
      console.error(`Error al eliminar empleado ${id}:`, error);
      throw error;
    }
  },

  /**
   * OBTENER ESTADÍSTICAS
   * 
   * HTTP: GET /api/statistics
   * 
   * ¿Cómo usarlo?
   * const stats = await employeeService.fetchStatistics();
   * console.log(stats[0].value); // 125 (total empleados)
   */
  fetchStatistics: async (): Promise<Statistic[]> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/statistics`,
        {
          method: 'GET',
          headers: getHeaders(),
        }
      );

      if (response.status === 401) authService.logout();
      if (!response.ok) throw new Error(`Error ${response.status}`);

      return await response.json();
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  },
};
```

---

## PASO 4: CREAR HOOKS PERSONALIZADOS

### Concepto
Los Hooks son funciones de React que permiten usar estado y efectos. Aquí creamos hooks que usan nuestros servicios y manejan el estado de carga, errores, etc.

### Archivo: `src/hooks/useEmployees.ts`

```typescript
/**
 * HOOK useEmployees
 * 
 * ¿Qué es?
 * Una función que encapsula la lógica para obtener empleados
 * 
 * Beneficios:
 * - Evita repetir código en componentes
 * - Maneja estados: cargando, error, datos
 * - Automático: se ejecuta cuando cambia la página
 */

import { useState, useEffect } from 'react';
import type { Employee } from '../types';
import { employeeService } from '../services/employeeService';

interface UseEmployeesResult {
  employees: Employee[];
  total: number;
  loading: boolean;
  error: string | null;
}

export const useEmployees = (page: number = 1): UseEmployeesResult => {
  // Paso 1: Definir estados
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Paso 2: useEffect - Se ejecuta cuando cambia "page"
  useEffect(() => {
    // Paso 2A: Crear función async para cargar datos
    const loadEmployees = async () => {
      try {
        // Paso 2B: Indicar que estamos cargando
        setLoading(true);
        setError(null);

        // Paso 2C: Llamar servicio para obtener empleados
        const data = await employeeService.fetchEmployees(page, 4);

        // Paso 2D: Guardar en estado
        setEmployees(data.employees);
        setTotal(data.total);
      } catch (err) {
        // Paso 2E: Si hay error, guardarlo
        setError(
          err instanceof Error ? err.message : 'Error desconocido'
        );
        setEmployees([]);
      } finally {
        // Paso 2F: Indicar que terminó de cargar
        setLoading(false);
      }
    };

    // Paso 2G: Ejecutar la función
    loadEmployees();
  }, [page]); // Dependencia: cuando "page" cambia, se ejecuta de nuevo

  // Paso 3: Devolver datos, estado y errores
  return { employees, total, loading, error };
};
```

### Archivo: `src/hooks/useStatistics.ts`

```typescript
import { useState, useEffect } from 'react';
import type { Statistic } from '../types';
import { employeeService } from '../services/employeeService';

export const useStatistics = () => {
  const [statistics, setStatistics] = useState<Statistic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        setLoading(true);
        const data = await employeeService.fetchStatistics();
        setStatistics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error');
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, []);

  return { statistics, loading, error };
};
```

---

## PASO 5: IMPLEMENTAR EN COMPONENTES

### Archivo: `src/components/pages/EmployeeDashboard.tsx`

```typescript
/**
 * CAMBIO: De mockData a API Backend
 * 
 * ANTES:
 * import { mockEmployees } from '../../utils/mockData';
 * const employees = mockEmployees;
 * 
 * AHORA:
 * import { useEmployees } from '../../hooks/useEmployees';
 * const { employees, loading, error } = useEmployees(page);
 */

import { useState } from 'react';
import { useEmployees } from '../../hooks/useEmployees';
import { useStatistics } from '../../hooks/useStatistics';
import { Header } from '../layout/Header';
import { EmployeeTable } from '../common/EmployeeTable';
import { StatCard } from '../common/StatCard';
import { Pagination } from '../common/Pagination';
import './EmployeeDashboard.css';

export const EmployeeDashboard = () => {
  // Estado para la página actual
  const [currentPage, setCurrentPage] = useState(1);

  // Hook para obtener empleados
  const { employees, total, loading: employeesLoading, error: employeesError } = useEmployees(currentPage);

  // Hook para obtener estadísticas
  const { statistics, loading: statsLoading, error: statsError } = useStatistics();

  // Calcular total de páginas
  const totalPages = Math.ceil(total / 4);

  // Mientras carga
  if (employeesLoading || statsLoading) {
    return (
      <div className="employee-dashboard">
        <Header title="Gestión de Empleados" />
        <div className="loading">Cargando datos...</div>
      </div>
    );
  }

  // Si hay error
  if (employeesError || statsError) {
    return (
      <div className="employee-dashboard">
        <Header title="Gestión de Empleados" />
        <div className="error">
          Error: {employeesError || statsError}
        </div>
      </div>
    );
  }

  return (
    <div className="employee-dashboard">
      <Header title="Gestión de Empleados" />

      <main className="dashboard-content">
        {/* Sección de Estadísticas - DATOS DEL BACKEND */}
        <section className="statistics-section">
          <div className="stats-grid">
            {statistics.map((stat, index) => (
              <StatCard key={index} stat={stat} />
            ))}
          </div>
        </section>

        {/* Tabla de Empleados - DATOS DEL BACKEND */}
        <section className="table-section">
          <EmployeeTable employees={employees} />
        </section>

        {/* Paginación */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </main>
    </div>
  );
};
```

---

## PASO 6: PÁGINA DE LOGIN

### Archivo: `src/components/pages/LoginPage.tsx`

```typescript
/**
 * NUEVA PÁGINA - Formulario de login
 * 
 * ¿Qué hace?
 * - Muestra inputs para email y password
 * - Envía al servidor
 * - Si OK: guarda token y redirige a dashboard
 * - Si error: muestra mensaje de error
 */

import { useState } from 'react';
import { authService } from '../../services/authService';
import './LoginPage.css';

export const LoginPage = () => {
  // Estados del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manejar el submit del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Llamar al servicio de login
      await authService.login(email, password);

      // Si es exitoso, redirigir a dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      // Si hay error, mostrarlo
      setError(
        err instanceof Error ? err.message : 'Error al iniciar sesión'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Gestión de Empleados</h1>
        <p className="subtitle">Ingresa tus credenciales</p>

        <form onSubmit={handleSubmit}>
          {/* Mostrar error si existe */}
          {error && <div className="error-message">{error}</div>}

          {/* Input Email */}
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="leonardo@albru.pe"
              required
              disabled={loading}
            />
          </div>

          {/* Input Password */}
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          {/* Botón Entrar */}
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Cargando...' : 'Entrar'}
          </button>
        </form>

        <p className="help-text">
          ¿Olvidaste tu contraseña? <a href="/recover">Recuperarla aquí</a>
        </p>
      </div>
    </div>
  );
};
```

### Archivo: `src/components/pages/LoginPage.css`

```css
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
}

.login-container {
  background: white;
  border-radius: 10px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

.login-container h1 {
  margin: 0 0 10px;
  color: #333;
  text-align: center;
}

.subtitle {
  color: #666;
  text-align: center;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #2563EB;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.login-button {
  width: 100%;
  padding: 12px;
  background: #2563EB;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s;
}

.login-button:hover {
  background: #1D4ED8;
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 5px;
  margin-bottom: 20px;
  border-left: 4px solid #c33;
}

.help-text {
  text-align: center;
  color: #666;
  font-size: 14px;
  margin-top: 20px;
}

.help-text a {
  color: #2563EB;
  text-decoration: none;
  font-weight: bold;
}
```

---

## PASO 7: PROTEGER RUTAS

### Concepto
No todos pueden acceder al dashboard. Si no están autenticados, redirigirlos a login.

### Archivo: `src/components/ProtectedRoute.tsx`

```typescript
/**
 * COMPONENTE ProtectedRoute
 * 
 * ¿Qué es?
 * Un componente que envuelve rutas protegidas
 * 
 * ¿Cómo funciona?
 * - Si hay token: muestra el componente
 * - Si no hay token: redirige a login
 */

import { ReactNode } from 'react';
import { authService } from '../services/authService';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute = ({ 
  children, 
  requiredRole 
}: ProtectedRouteProps) => {
  // Verificar si está autenticado
  if (!authService.isAuthenticated()) {
    window.location.href = '/login';
    return null;
  }

  // (Opcional) Verificar rol del usuario
  if (requiredRole) {
    const user = authService.getUser();
    if (user?.role !== requiredRole) {
      window.location.href = '/unauthorized';
      return null;
    }
  }

  return <>{children}</>;
};
```

### Uso en App.tsx

```typescript
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './components/pages/LoginPage';
import { EmployeeDashboard } from './components/pages/EmployeeDashboard';

function App() {
  return (
    <>
      {/* Ruta pública */}
      <Route path="/login" element={<LoginPage />} />

      {/* Ruta protegida - Solo si hay token */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <EmployeeDashboard />
          </ProtectedRoute>
        } 
      />
    </>
  );
}
```

---

## PASO 8: MANEJO DE ERRORES

### Errores Comunes y Soluciones

#### Error 401 - Token Expirado
```typescript
// En getHeaders():
if (response.status === 401) {
  // Opción 1: Logout automático
  authService.logout();
  
  // Opción 2: Intentar renovar token
  try {
    const newToken = await authService.refreshToken();
    // Reintentar petición con nuevo token
  } catch (err) {
    authService.logout();
  }
}
```

#### Error 403 - Permiso Denegado
```typescript
if (response.status === 403) {
  throw new Error('No tienes permiso para realizar esta acción');
}
```

#### Error 500 - Error del Servidor
```typescript
if (response.status >= 500) {
  throw new Error('Error del servidor. Intenta más tarde');
}
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

- [ ] Crear archivo `src/services/authService.ts`
- [ ] Crear archivo `src/services/employeeService.ts`
- [ ] Crear hook `src/hooks/useEmployees.ts`
- [ ] Crear hook `src/hooks/useStatistics.ts`
- [ ] Crear página `src/components/pages/LoginPage.tsx`
- [ ] Crear estilos `src/components/pages/LoginPage.css`
- [ ] Crear `src/components/ProtectedRoute.tsx`
- [ ] Actualizar `EmployeeDashboard.tsx` para usar hooks
- [ ] Cambiar URL de `API_BASE_URL` a tu servidor real
- [ ] Probar login con credenciales
- [ ] Probar obtener empleados del backend
- [ ] Probar logout
- [ ] Probar renovación de token

---

## 🧪 PRUEBA PASO A PASO

### 1. Verificar que los archivos existan
```bash
# En terminal de VS Code
ls src/services/
ls src/hooks/
```

### 2. Verificar errores de TypeScript
```bash
npm run lint
```

### 3. Probar en navegador
```bash
npm run dev
```

### 4. Abrir DevTools y revisar
- **Console**: Sin errores rojos
- **Network**: Ver peticiones HTTP
- **Application**: Verificar localStorage con token

### 5. Probar flujo completo
1. Ir a `http://localhost:5173/login`
2. Ingresar credenciales (las que proporcione tu backend)
3. Click en "Entrar"
4. Debe redirigir a dashboard
5. Debe mostrar empleados del servidor

---

## 📚 RESUMEN DE CONCEPTOS

| Concepto | Qué es | Dónde |
|----------|--------|-------|
| **Token JWT** | Identificador de sesión | localStorage |
| **Bearer Token** | Formato para enviar token | Header `Authorization` |
| **Servicio** | Archivo con funciones reutilizables | `src/services/` |
| **Hook** | Función React que encapsula lógica | `src/hooks/` |
| **Estado** | Datos que cambian en el componente | `useState()` |
| **Efecto** | Acciones que se ejecutan en ciertos momentos | `useEffect()` |
| **Fetch** | Realizar peticiones HTTP | Métodos GET, POST, etc |
| **localStorage** | Almacenar datos en navegador | Persistente entre sesiones |

---

## 🎯 PRÓXIMOS PASOS

1. **Implementar refresh token automático** - Renovar token antes de que expire
2. **Agregar rol-based access** - Diferentes permisos según rol del usuario
3. **Manejar errores globales** - Context API o zustand para errores globales
4. **Agregar re-intentos** - Si falla una petición, reintentar automáticamente
5. **Encriptación de password** - En el backend (nunca en frontend)
6. **Two-factor authentication** - Seguridad adicional
7. **Logout en pestañas múltiples** - Si cierras sesión en una pestaña, cerrar en todas

---

¡Ahora estás listo para integrar tu backend! 🚀
