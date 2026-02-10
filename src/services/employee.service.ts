/**
 * Employee Service
 * Lógica de negocio para empleados
 * Transforma respuestas de la API y maneja lógica específica del dominio
 */

import { EmployeeRepository } from '../repositories/employee.repository';
import type { Employee, NewEmployeeFormData, Statistic } from '../types';

export class EmployeeService {
  /**
   * Obtener todos los empleados con transformación de datos
   */
  static async getAllEmployees(): Promise<Employee[]> {
    try {
      const employees = await EmployeeRepository.getAll();
      return this.transformEmployees(employees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw new Error('No se pudieron cargar los empleados');
    }
  }

  /**
   * Obtener empleado por ID
   */
  static async getEmployeeById(id: string): Promise<Employee> {
    try {
      const employee = await EmployeeRepository.getById(id);
      return this.transformEmployee(employee);
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw new Error('No se pudo cargar el empleado');
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
      return this.transformEmployee(newEmployee);
    } catch (error) {
      console.error('Error creating employee:', error);
      throw new Error('No se pudo crear el empleado');
    }
  }

  /**
   * Actualizar empleado
   */
  static async updateEmployee(id: string, employeeData: Partial<Employee>): Promise<Employee> {
    try {
      const updatedEmployee = await EmployeeRepository.update(id, employeeData);
      return this.transformEmployee(updatedEmployee);
    } catch (error) {
      console.error('Error updating employee:', error);
      throw new Error('No se pudo actualizar el empleado');
    }
  }

  /**
   * Eliminar empleado
   */
  static async deleteEmployee(id: string): Promise<void> {
    try {
      await EmployeeRepository.delete(id);
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw new Error('No se pudo eliminar el empleado');
    }
  }

  /**
   * Buscar empleados
   */
  static async searchEmployees(searchTerm: string): Promise<Employee[]> {
    try {
      const employees = await EmployeeRepository.search(searchTerm);
      return this.transformEmployees(employees);
    } catch (error) {
      console.error('Error searching employees:', error);
      throw new Error('Error en la búsqueda de empleados');
    }
  }

  /**
   * Cambiar estado del empleado
   */
  static async toggleEmployeeStatus(id: string): Promise<Employee> {
    try {
      const employee = await EmployeeRepository.toggleStatus(id);
      return this.transformEmployee(employee);
    } catch (error) {
      console.error('Error toggling employee status:', error);
      throw new Error('No se pudo cambiar el estado del empleado');
    }
  }

  /**
   * Obtener estadísticas de empleados
   */
  static async getEmployeeStatistics(): Promise<Statistic[]> {
    try {
      const stats = await EmployeeRepository.getStatistics();

      // Transformar a formato de Statistic usado en la UI
      return [
        {
          label: 'TOTAL EMPLEADOS',
          value: stats.total,
        },
        {
          label: 'ACTIVOS',
          value: stats.active,
        },
        {
          label: 'INACTIVOS',
          value: stats.inactive,
        },
      ];
    } catch (error) {
      console.error('Error fetching employee statistics:', error);
      throw new Error('No se pudieron cargar las estadísticas');
    }
  }

  // Métodos privados para transformación y validación

  /**
   * Transformar lista de empleados
   */
  private static transformEmployees(employees: Employee[]): Employee[] {
    return employees.map(employee => this.transformEmployee(employee));
  }

  /**
   * Transformar empleado individual
   */
  private static transformEmployee(employee: Employee): Employee {
    return {
      ...employee,
      // Aquí se pueden hacer transformaciones adicionales
      // Por ejemplo, formatear fechas, calcular campos derivados, etc.
      fullName: employee.fullName?.trim() || '',
      initials: this.generateInitials(employee.fullName),
    };
  }

  /**
   * Generar iniciales del nombre
   */
  private static generateInitials(fullName: string): string {
    if (!fullName) return '';
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  /**
   * Validar datos del empleado
   */
  private static validateEmployeeData(data: NewEmployeeFormData): void {
    if (!data.fullName?.trim()) {
      throw new Error('El nombre completo es requerido');
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
      fullName: data.fullName.trim(),
      documentNumber: data.documentNumber.trim(),
      googleEmail: data.googleEmail.trim().toLowerCase(),
      personalEmail: data.personalEmail?.trim().toLowerCase(),
    };
  }
}