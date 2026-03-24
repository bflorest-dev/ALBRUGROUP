/**
 * Contract Repository
 * Capa de acceso a datos para contratos/registros laborales
 * Solo contiene llamadas HTTP puras sin lógica de negocio
 */

import { rrhhHttp } from '../api/http';
import type { EmpleadoResponse, RegistrarContratoRequest, CerrarContratoRequest } from '@compartido/tipos';

export interface ContratoDetalles {
  id: number;
  empleadoId: number;
  regimen: string;
  modalidad: string;
  sueldo: number;
  fechaInicio: string;
  fechaFin?: string;
  estado: string;
}

export class ContractRepository {
  /**
   * Registrar contrato para un postulante/empleado aprobado
   * POST /contratos/{id}/registrar
   */
  static async registerContract(
    empleadoId: number,
    contractData: RegistrarContratoRequest
  ): Promise<EmpleadoResponse> {
    const response = await rrhhHttp.post<EmpleadoResponse>(
      `/contratos/${empleadoId}/registrar`,
      contractData
    );
    return response.data;
  }

  /**
   * Cerrar/cesar contrato de un empleado
   * PATCH /contratos/{id}/cesar-contrato
   */
  static async closeContract(
    empleadoId: number,
    closeData: CerrarContratoRequest
  ): Promise<EmpleadoResponse> {
    const response = await rrhhHttp.patch<EmpleadoResponse>(
      `/contratos/${empleadoId}/cesar-contrato`,
      closeData
    );
    return response.data;
  }

  /**
   * Obtener detalles del contrato de un empleado
   * GET /contratos/{id}
   */
  static async getContractDetails(empleadoId: number): Promise<ContratoDetalles> {
    const response = await rrhhHttp.get<ContratoDetalles>(`/contratos/${empleadoId}`);
    return response.data;
  }
}
