/**
 * Employee Repository
 * Capa de acceso a datos para empleados
 * Solo contiene llamadas HTTP puras sin lógica de negocio
 */

import { http, type ApiResponse } from '../api/http';
import type { Employee, NewEmployeeFormData } from '../types';

// Tipos específicos para las respuestas de la API
export type EmployeeApiResponse = ApiResponse<Employee>;
export type EmployeesApiResponse = ApiResponse<Employee[]>;
export type CreateEmployeeApiResponse = ApiResponse<Employee>;
export type UpdateEmployeeApiResponse = ApiResponse<Employee>;
export type DeleteEmployeeApiResponse = ApiResponse<void>;

export class EmployeeRepository {
  /**
   * Obtener todos los empleados
   */
  static async getAll(): Promise<Employee[]> {
    const response = await http.get<EmployeesApiResponse>('/employees');
    return response.data.data;
  }

  /**
   * Obtener empleado por ID
   */
  static async getById(id: string): Promise<Employee> {
    const response = await http.get<EmployeeApiResponse>(`/employees/${id}`);
    return response.data.data;
  }

  /**
   * Crear nuevo empleado
   */
  static async create(employeeData: NewEmployeeFormData): Promise<Employee> {
    const response = await http.post<CreateEmployeeApiResponse>('/employees', employeeData);
    return response.data.data;
  }

  /**
   * Actualizar empleado existente
   */
  static async update(id: string, employeeData: Partial<Employee>): Promise<Employee> {
    const response = await http.put<UpdateEmployeeApiResponse>(`/employees/${id}`, employeeData);
    return response.data.data;
  }

  /**
   * Eliminar empleado
   */
  static async delete(id: string): Promise<void> {
    await http.delete<DeleteEmployeeApiResponse>(`/employees/${id}`);
  }

  /**
   * Buscar empleados por término
   */
  static async search(searchTerm: string): Promise<Employee[]> {
    const response = await http.get<EmployeesApiResponse>(`/employees/search`, {
      params: { q: searchTerm }
    });
    return response.data.data;
  }

  /**
   * Cambiar estado del empleado (activar/desactivar)
   */
  static async toggleStatus(id: string): Promise<Employee> {
    const response = await http.patch<EmployeeApiResponse>(`/employees/${id}/toggle-status`);
    return response.data.data;
  }

  /**
   * Obtener estadísticas de empleados
   */
  static async getStatistics(): Promise<{ total: number; active: number; inactive: number }> {
    const response = await http.get<ApiResponse<{ total: number; active: number; inactive: number }>>('/employees/statistics');
    return response.data.data;
  }
}