/**
 * Contract Repository
 * Capa de acceso a datos para contratos/registros laborales
 * Solo contiene llamadas HTTP puras sin lógica de negocio
 * 
 * FSD Layer: entities/contrato/api
 */

import { rrhhHttp } from '@shared/api/clienteHttp';
import type { EmpleadoResponse, RegistrarContratoRequest, CerrarContratoRequest, ContratoRegistroResponse } from '@shared/types';

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
   * POST /rrhh/contratos/{idEmpleado}/registrar
   * 
   * Respuesta: ContratoRegistroResponse (incluye contrato + credenciales generadas)
   * Puede retornar 403 si auth-service no está disponible (parcial éxito)
   */
  static async registerContract(
    empleadoId: number,
    contractData: RegistrarContratoRequest
  ): Promise<ContratoRegistroResponse> {
    try {
      const response = await rrhhHttp.post<ContratoRegistroResponse>(
        `/contratos/${empleadoId}/registrar`,
        contractData
      );
      
      return response.data;
    } catch (error) {
      // El interceptor global ya loguea el error
      // El service lo interpretará como error parcial si es 403
      throw error;
    }
  }

  /**
   * Cerrar/cesar contrato de un empleado
   * PATCH /rrhh/contratos/{id}/cesar-contrato
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
   * GET /rrhh/contratos/{id} (o vigente)
   */
  static async getContractDetails(empleadoId: number): Promise<ContratoDetalles> {
    const response = await rrhhHttp.get<ContratoDetalles>(`/contratos/${empleadoId}`);
    return response.data;
  }
}
