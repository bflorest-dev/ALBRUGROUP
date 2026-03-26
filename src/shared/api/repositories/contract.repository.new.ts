/**
 * Contract Repository
 * Capa de acceso a datos para contratos/registros laborales
 * Solo contiene llamadas HTTP puras sin lógica de negocio
 */

import { rrhhHttp } from '@shared/api/clienteHttp';
import type { ContratoResponse, RegistrarContratoRequest, CerrarContratoRequest, ContratoRegistroResponse } from '@shared/types';

export class ContractRepository {
  /**
   * Registrar contrato para un postulante/empleado aprobado
   * POST /rrhh/contratos/{idEmpleado}/registrar
   * Respuesta: ContratoRegistroResponse (incluye contrato + credenciales generadas)
   */
  static async registerContract(
    empleadoId: number,
    contractData: RegistrarContratoRequest
  ): Promise<ContratoRegistroResponse> {
    const response = await rrhhHttp.post<ContratoRegistroResponse>(
      `/contratos/${empleadoId}/registrar`,
      contractData
    );
    return response.data;
  }

  /**
   * Cerrar/cesar contrato de un empleado
   * PATCH /rrhh/contratos/{id}/cesar-contrato
   */
  static async closeContract(
    empleadoId: number,
    closeData: CerrarContratoRequest
  ): Promise<ContratoResponse> {
    const response = await rrhhHttp.patch<ContratoResponse>(
      `/contratos/${empleadoId}/cesar-contrato`,
      closeData
    );
    return response.data;
  }

  /**
   * Obtener contrato vigente de un empleado
   * GET /rrhh/contratos/{id}/vigente
   */
  static async getVigorousContract(empleadoId: number): Promise<ContratoResponse> {
    const response = await rrhhHttp.get<ContratoResponse>(`/contratos/${empleadoId}/vigente`);
    return response.data;
  }

  /**
   * Obtener histórico de contratos de un empleado
   * GET /rrhh/contratos/{id}/historico
   */
  static async getContractHistory(empleadoId: number): Promise<ContratoResponse[]> {
    const response = await rrhhHttp.get<ContratoResponse[]>(`/contratos/${empleadoId}/historico`);
    return response.data;
  }
}
