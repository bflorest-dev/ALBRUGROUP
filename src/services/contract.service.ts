/**
 * Contract Service
 * Lógica de negocio para contratos/registros laborales
 * Transforma datos del formulario UI al formato que espera el backend
 */

import { BaseService } from './base.service';
import { ContractRepository, type ContratoDetalles } from '../repositories/contract.repository';
import { adaptEmpleadoResponseToEmployee } from '../types';
import type { Employee, RegistrarContratoRequest, CerrarContratoRequest } from '../types';

export class ContractService extends BaseService<Employee> {
  /**
   * Registrar contrato para un empleado/postulante
   * Transforma los datos del formulario de contrato al formato del backend
   */
  static async registerContract(
    empleadoId: number,
    contractData: RegistrarContratoRequest
  ): Promise<Employee> {
    return this.executeOperation(
      () => ContractRepository.registerContract(empleadoId, contractData),
      'No se pudo registrar el contrato',
      adaptEmpleadoResponseToEmployee
    );
  }

  /**
   * Cerrar/cesar contrato de un empleado
   * @param empleadoId - ID del empleado
   * @param motivoBaja - Motivo de la baja
   */
  static async closeContract(
    empleadoId: number,
    motivoBaja: string
  ): Promise<Employee> {
    const closeData: CerrarContratoRequest = {
      motivoBaja,
      fechaCierre: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    };

    return this.executeOperation(
      () => ContractRepository.closeContract(empleadoId, closeData),
      'No se pudo cerrar el contrato',
      adaptEmpleadoResponseToEmployee
    );
  }

  /**
   * Obtener detalles del contrato de un empleado
   */
  static async getContractDetails(empleadoId: number): Promise<ContratoDetalles> {
    try {
      return await ContractRepository.getContractDetails(empleadoId);
    } catch (error) {
      throw this.formatError(error, 'No se pudieron cargar los detalles del contrato');
    }
  }
}
