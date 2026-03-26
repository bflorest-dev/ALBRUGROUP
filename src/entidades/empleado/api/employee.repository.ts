/**
 * Employee Repository
 * Capa de acceso a datos para empleados
 * Solo contiene llamadas HTTP puras sin lógica de negocio
 * 
 * FSD Layer: entities/empleado/api
 */

import { http } from '@shared/api/clienteHttp';
import type { EmpleadoResponse, PageResponse, NewEmployeeFormData, EmployeeDetailFormData } from '@shared/types';
import type { RegistrarEmpleadoRequest } from '../model/index';

// Tipos específicos para las respuestas de la API
export type EmployeesPageResponse = PageResponse<EmpleadoResponse>;
export type EmployeeResponse = EmpleadoResponse;
export type CreateEmployeeResponse = EmpleadoResponse;
export type UpdateEmployeeResponse = EmpleadoResponse;

export class EmployeeRepository {
  /**
   * Obtener todos los empleados con filtros y paginación
   * GET /rrhh/empleados
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
   * Obtener empleado por número de documento
   * GET /rrhh/empleados/{documento}/numero-documento
   */
  static async getByDocument(documento: string): Promise<EmpleadoResponse> {
    const response = await http.get<EmployeeResponse>(`/empleados/${documento}/numero-documento`);
    return response.data;
  }

  /**
   * Búsqueda universal de empleados
   * GET /rrhh/empleados/{dato}/universal
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
   * POST /rrhh/empleados
   * @param employeeData - RegistrarEmpleadoRequest (DTO mapeado, no FormData)
   */
  static async create(employeeData: RegistrarEmpleadoRequest): Promise<EmpleadoResponse> {
    const response = await http.post<CreateEmployeeResponse>('/empleados', employeeData);
    return response.data;
  }

  /**
   * Actualizar datos personales
   * PATCH /rrhh/empleados/{id}/datos-personales
   */
  static async updatePersonalData(id: number, data: Partial<EmployeeDetailFormData>): Promise<EmpleadoResponse> {
    const response = await http.patch<UpdateEmployeeResponse>(`/empleados/${id}/datos-personales`, data);
    return response.data;
  }

  /**
   * Actualizar datos de contacto y ubicación
   * PATCH /rrhh/empleados/{id}/datos-contacto-ubicacion
   */
  static async updateContactLocation(id: number, data: Partial<EmployeeDetailFormData>): Promise<EmpleadoResponse> {
    const response = await http.patch<UpdateEmployeeResponse>(`/empleados/${id}/datos-contacto-ubicacion`, data);
    return response.data;
  }

  /**
   * Actualizar datos financieros
   * PATCH /rrhh/empleados/{id}/datos-financieros
   */
  static async updateFinancialData(id: number, data: Partial<EmployeeDetailFormData>): Promise<EmpleadoResponse> {
    const response = await http.patch<UpdateEmployeeResponse>(`/empleados/${id}/datos-financieros`, data);
    return response.data;
  }

  /**
   * Actualizar datos corporativos
   * PATCH /rrhh/empleados/{id}/datos-corporativos
   */
  static async updateCorporateData(id: number, data: Partial<EmployeeDetailFormData>): Promise<EmpleadoResponse> {
    const response = await http.patch<UpdateEmployeeResponse>(`/empleados/${id}/datos-corporativos`, data);
    return response.data;
  }
}
