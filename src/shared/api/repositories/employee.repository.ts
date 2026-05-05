/**
 * Employee Repository
 * Capa de acceso a datos para empleados
 * Solo contiene llamadas HTTP puras sin lÃ³gica de negocio
 */

import { http } from '@shared/api/httpClient';
import type { EmpleadoResponse, PageResponse, NewEmployeeFormData, EmployeeDetailFormData, RegistrarEmpleadoRequest } from '@shared/types';

// Tipos especÃ­ficos para las respuestas de la API
export type EmployeesPageResponse = PageResponse<EmpleadoResponse>;
export type EmployeeResponse = EmpleadoResponse;
export type CreateEmployeeResponse = EmpleadoResponse;
export type UpdateEmployeeResponse = EmpleadoResponse;

export class EmployeeRepository {
  /**
   * Obtener todos los empleados con filtros y paginaciÃ³n
   */
  static async getAll(params?: {
    q?: string;
    dni?: string;
    celular?: string;
    distrito?: string;
    banco?: string;
    estado?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PageResponse<EmpleadoResponse>> {
    const response = await http.get<EmployeesPageResponse>('/empleados', { params });
    return response.data;
  }

  /**
   * Obtener empleado por nÃºmero de documento
   */
  static async getByDocument(documento: string): Promise<EmpleadoResponse> {
    const response = await http.get<EmployeeResponse>(`/empleados/${documento}/numero-documento`);
    return response.data;
  }

  /**   * Obtener empleado por ID
   */
  static async getById(id: number): Promise<EmpleadoResponse> {
    const response = await http.get<EmployeeResponse>(`/empleados/${id}`);
    return response.data;
  }

  /**   * BÃºsqueda universal de empleados
   */
  static async searchUniversal(dato: string, params?: {
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PageResponse<EmpleadoResponse>> {
    const response = await http.get<EmployeesPageResponse>(`/empleados/${dato}/universal`, { params });
    return response.data;
  }

  /**
   * Crear nuevo empleado
   * @param employeeData - RegistrarEmpleadoRequest (DTO mapeado, no FormData)
   */
  static async create(employeeData: RegistrarEmpleadoRequest): Promise<EmpleadoResponse> {
    const response = await http.post<CreateEmployeeResponse>('/empleados', employeeData);
    return response.data;
  }

  /**
   * Actualizar datos personales
   */
  static async updatePersonalData(id: number, data: Partial<EmployeeDetailFormData>): Promise<EmpleadoResponse> {
    const response = await http.patch<UpdateEmployeeResponse>(`/empleados/${id}/datos-personales`, data);
    return response.data;
  }

  /**
   * Actualizar datos de contacto y ubicaciÃ³n
   */
  static async updateContactLocation(id: number, data: Partial<EmployeeDetailFormData>): Promise<EmpleadoResponse> {
    const response = await http.patch<UpdateEmployeeResponse>(`/empleados/${id}/datos-contacto-ubicacion`, data);
    return response.data;
  }

  /**
   * Actualizar datos financieros
   */
  static async updateFinancialData(id: number, data: Partial<EmployeeDetailFormData>): Promise<EmpleadoResponse> {
    const response = await http.patch<UpdateEmployeeResponse>(`/empleados/${id}/datos-financieros`, data);
    return response.data;
  }

  /**
   * Actualizar datos corporativos
   */
  static async updateCorporateData(id: number, data: Partial<EmployeeDetailFormData>): Promise<EmpleadoResponse> {
    const response = await http.patch<UpdateEmployeeResponse>(`/empleados/${id}/datos-corporativos`, data);
    return response.data;
  }
}
