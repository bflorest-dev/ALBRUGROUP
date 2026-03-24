/**
 * Servicio de Empleados
 * Lógica de negocio para empleados
 * Transforma respuestas de la API y maneja lógica específica del dominio
 */

import { BaseService } from '@compartido/api/servicioBase';
import { EmployeeRepository } from '@compartido/api';
import { adaptEmpleadoResponseToEmployee } from '@compartido/tipos';
import type { Employee, NewEmployeeFormData, EmployeeDetailFormData } from '@compartido/tipos';
import { validateDataOrThrow, NewEmployeeFormDataSchema } from '@compartido/validacion';

type UpdateDataType = 'personal' | 'contact' | 'financial' | 'corporate';

export class EmployeeService extends BaseService<Employee> {
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
  }): Promise<{ items: Employee[]; total: number; totalPages: number }> {
    return this.executePagedOperation(
      () => EmployeeRepository.getAll(params),
      'No se pudieron cargar los empleados',
      adaptEmpleadoResponseToEmployee
    ).then(result => ({ items: result.items, total: result.total, totalPages: result.totalPages }));
  }

  /**
   * Obtener empleado por número de documento
   */
  static async getEmployeeByDocument(documento: string): Promise<Employee> {
    return this.executeOperation(
      () => EmployeeRepository.getByDocument(documento),
      'No se pudo cargar el empleado',
      adaptEmpleadoResponseToEmployee
    );
  }

  /**
   * Búsqueda universal de empleados
   */
  static async searchEmployeesUniversal(dato: string, params?: {
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<{ items: Employee[]; total: number; totalPages: number }> {
    return this.executePagedOperation(
      () => EmployeeRepository.searchUniversal(dato, params),
      'Error en la búsqueda de empleados',
      adaptEmpleadoResponseToEmployee
    ).then(result => ({ items: result.items, total: result.total, totalPages: result.totalPages }));
  }

  /**
   * Crear nuevo empleado
   */
  static async createEmployee(employeeData: NewEmployeeFormData): Promise<Employee> {
    // Validar y normalizar datos con Zod
    const validatedData = validateDataOrThrow(NewEmployeeFormDataSchema, employeeData);

    return this.executeOperation(
      () => EmployeeRepository.create(validatedData),
      'No se pudo crear el empleado',
      adaptEmpleadoResponseToEmployee
    );
  }

  /**
   * Actualizar datos del empleado por tipo
   * Consolida updateEmployeePersonalData, updateEmployeeContactLocation,
   * updateEmployeeFinancialData, updateEmployeeCorporateData en un solo método
   */
  static async updateEmployee(
    id: number,
    data: Partial<EmployeeDetailFormData>,
    updateType: UpdateDataType = 'personal'
  ): Promise<Employee> {
    const repositoryMap = {
      personal: () => EmployeeRepository.updatePersonalData(id, data),
      contact: () => EmployeeRepository.updateContactLocation(id, data),
      financial: () => EmployeeRepository.updateFinancialData(id, data),
      corporate: () => EmployeeRepository.updateCorporateData(id, data),
    };

    return this.executeOperation(
      repositoryMap[updateType],
      `No se pudo actualizar datos ${updateType}`,
      adaptEmpleadoResponseToEmployee
    );
  }

  /**
   * Métodos legacycompat: deprecated, usar updateEmployee() con tipo
   * Se mantienen por compatibilidad temporal
   * @deprecated use updateEmployee(id, data, 'personal')
   */
  static async updateEmployeePersonalData(id: number, data: Partial<EmployeeDetailFormData>): Promise<Employee> {
    return this.updateEmployee(id, data, 'personal');
  }

  /**
   * @deprecated use updateEmployee(id, data, 'contact')
   */
  static async updateEmployeeContactLocation(id: number, data: Partial<EmployeeDetailFormData>): Promise<Employee> {
    return this.updateEmployee(id, data, 'contact');
  }

  /**
   * @deprecated use updateEmployee(id, data, 'financial')
   */
  static async updateEmployeeFinancialData(id: number, data: Partial<EmployeeDetailFormData>): Promise<Employee> {
    return this.updateEmployee(id, data, 'financial');
  }

  /**
   * @deprecated use updateEmployee(id, data, 'corporate')
   */
  static async updateEmployeeCorporateData(id: number, data: Partial<EmployeeDetailFormData>): Promise<Employee> {
    return this.updateEmployee(id, data, 'corporate');
  }
}
