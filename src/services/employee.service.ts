/**
 * Employee Service
 * Lógica de negocio para empleados
 * Transforma respuestas de la API y maneja lógica específica del dominio
 */

import { EmployeeRepository } from '../repositories/employee.repository';
import { adaptEmpleadoResponseToEmployee } from '../types';
import type { Employee, NewEmployeeFormData, EmpleadoResponse, PageResponse } from '../types';

export class EmployeeService {
  /**
   * Obtener todos los empleados con filtros y paginación
   */
  static async getAllEmployees(params?: {
    q?: string;
    dni?: string;
    celular?: string;
    distrito?: string;
    banco?: string;
    estado?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<{ employees: Employee[]; total: number; totalPages: number }> {
    try {
      const pageResponse = await EmployeeRepository.getAll(params);
      const employees = pageResponse.content.map(adaptEmpleadoResponseToEmployee);
      return {
        employees,
        total: pageResponse.totalElements,
        totalPages: pageResponse.totalPages,
      };
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw new Error('No se pudieron cargar los empleados');
    }
  }

  /**
   * Obtener empleado por número de documento
   */
  static async getEmployeeByDocument(documento: string): Promise<Employee> {
    try {
      const employee = await EmployeeRepository.getByDocument(documento);
      return adaptEmpleadoResponseToEmployee(employee);
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw new Error('No se pudo cargar el empleado');
    }
  }

  /**
   * Búsqueda universal de empleados
   */
  static async searchEmployeesUniversal(dato: string, params?: {
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<{ employees: Employee[]; total: number; totalPages: number }> {
    try {
      const pageResponse = await EmployeeRepository.searchUniversal(dato, params);
      const employees = pageResponse.content.map(adaptEmpleadoResponseToEmployee);
      return {
        employees,
        total: pageResponse.totalElements,
        totalPages: pageResponse.totalPages,
      };
    } catch (error) {
      console.error('Error searching employees:', error);
      throw new Error('Error en la búsqueda de empleados');
    }
  }

  /**
   * Crear nuevo empleado
   */
  static async createEmployee(employeeData: NewEmployeeFormData): Promise<Employee> {
    try {
      // Validar datos antes de enviar
      this.validateEmployeeData(employeeData);

      // Transformar datos si es necesario
      const transformedData = this.prepareEmployeeData(employeeData);

      const newEmployee = await EmployeeRepository.create(transformedData);
      return adaptEmpleadoResponseToEmployee(newEmployee);
    } catch (error) {
      console.error('Error creating employee:', error);
      throw new Error('No se pudo crear el empleado');
    }
  }

  /**
   * Actualizar datos personales
   */
  static async updateEmployeePersonalData(id: number, data: any): Promise<Employee> {
    try {
      const updatedEmployee = await EmployeeRepository.updatePersonalData(id, data);
      return adaptEmpleadoResponseToEmployee(updatedEmployee);
    } catch (error) {
      console.error('Error updating employee:', error);
      throw new Error('No se pudo actualizar el empleado');
    }
  }

  /**
   * Actualizar datos de contacto y ubicación
   */
  static async updateEmployeeContactLocation(id: number, data: any): Promise<Employee> {
    try {
      const updatedEmployee = await EmployeeRepository.updateContactLocation(id, data);
      return adaptEmpleadoResponseToEmployee(updatedEmployee);
    } catch (error) {
      console.error('Error updating employee:', error);
      throw new Error('No se pudo actualizar el empleado');
    }
  }

  /**
   * Actualizar datos financieros
   */
  static async updateEmployeeFinancialData(id: number, data: any): Promise<Employee> {
    try {
      const updatedEmployee = await EmployeeRepository.updateFinancialData(id, data);
      return adaptEmpleadoResponseToEmployee(updatedEmployee);
    } catch (error) {
      console.error('Error updating employee:', error);
      throw new Error('No se pudo actualizar el empleado');
    }
  }

  /**
   * Actualizar datos corporativos
   */
  static async updateEmployeeCorporateData(id: number, data: any): Promise<Employee> {
    try {
      const updatedEmployee = await EmployeeRepository.updateCorporateData(id, data);
      return adaptEmpleadoResponseToEmployee(updatedEmployee);
    } catch (error) {
      console.error('Error updating employee:', error);
      throw new Error('No se pudo actualizar el empleado');
    }
  }

  // Métodos privados para validación

  /**
   * Validar datos del empleado
   */
  private static validateEmployeeData(data: NewEmployeeFormData): void {
    if (!data.nombres?.trim()) {
      throw new Error('Los nombres are requeridos');
    }
    if (!data.apellidos?.trim()) {
      throw new Error('Los apellidos son requeridos');
    }
    if (!data.documentNumber?.trim()) {
      throw new Error('El número de documento es requerido');
    }
    if (!data.documentType) {
      throw new Error('El tipo de documento es requerido');
    }
    if (!data.googleEmail?.trim()) {
      throw new Error('El email corporativo es requerido');
    }
  }

  /**
   * Preparar datos del empleado para envío
   */
  private static prepareEmployeeData(data: NewEmployeeFormData): NewEmployeeFormData {
    return {
      ...data,
      nombres: data.nombres.trim(),
      apellidos: data.apellidos.trim(),
      documentNumber: data.documentNumber.trim(),
      googleEmail: data.googleEmail.trim().toLowerCase(),
      personalEmail: data.personalEmail?.trim().toLowerCase(),
    };
  }
}