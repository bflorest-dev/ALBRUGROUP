/**
 * Contract Service
 * Lógica de negocio para contratos/registros laborales
 * Transforma datos del formulario UI al formato que espera el backend
 * 
 * FSD Layer: entities/contrato/model
 */

import { BaseService } from '@shared/lib/base.service';
import { ContractRepository, type ContratoDetalles } from '@shared/api/repositories/contract.repository';
import { adaptEmpleadoResponseToEmployee } from '@shared/types';
import type { Employee, RegistrarContratoRequest, CerrarContratoRequest, ContratoRegistroResponse } from '@shared/types';

export class ContractService extends BaseService<Employee> {
  /**
   * Registrar contrato para un empleado/postulante
   * POST /rrhh/contratos/{idEmpleado}/registrar
   * 
   * Respuesta: ContratoRegistroResponse (contrato + credenciales generadas)
   */
  static async registerContract(
    empleadoId: number | string,
    contractData: RegistrarContratoRequest
  ): Promise<ContratoRegistroResponse> {
    if (!empleadoId) {
      throw new Error('El ID del empleado es requerido para registrar un contrato');
    }

    return this.executeOperation(
      () => ContractRepository.registerContract(Number(empleadoId), contractData),
      'No se pudo registrar el contrato'
    );
  }

  /**
   * Cerrar/cesar contrato de un empleado
   * PATCH /rrhh/contratos/{id}/cesar-contrato
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
   * GET /rrhh/contratos/{id}
   */
  static async getContractDetails(empleadoId: number): Promise<ContratoDetalles> {
    try {
      return await ContractRepository.getContractDetails(empleadoId);
    } catch (error) {
      throw this.formatError(error, 'No se pudieron cargar los detalles del contrato');
    }
  }
}
