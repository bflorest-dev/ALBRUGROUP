/**
 * useRegistrarEmpleadoConContrato
 * 
 * Orquestador de flujo completo: empleado → contrato
 * 
 * Esta lógica debe estar en la capa FEATURE (no en pages)
 * porque coordina múltiples servicios de negocio en secuencia.
 * 
 * FSD Layer: features/registrar-empleado/model
 * Pattern: Custom hook
 */

import { useState } from 'react';
import { EmployeeService } from '@entidades/empleado/model';
import { ContractService } from '@entidades/contrato/model';
import type { RegistrarContratoRequest } from '@shared/types';
import type { RegistrarEmpleadoRequest } from '@entidades/empleado/model';

export interface RegistrarEmpleadoConContratoPayload {
  empleadoData: RegistrarEmpleadoRequest;
  contratoData: RegistrarContratoRequest;
}

export interface RegistroEmpleadoResult {
  empleadoId: number;
  username?: string;
  password?: string;
  success: boolean;
  partial?: boolean; // true si el contrato puede estar registrado pero faltó creación de credenciales
  message?: string; // detalles de éxito parcial o error de sincronización
}

export interface UseRegistarEmpleadoConContratoState {
  loading: boolean;
  error: string | null;
  result: RegistroEmpleadoResult | null;
}

/**
 * Hook que orquesta el flujo de registro empleado + contrato
 * 
 * Flujo:
 * 1. POST /rrhh/empleados → obtener empleadoId
 * 2. POST /rrhh/contratos/{idEmpleado}/registrar → registrar contrato y credenciales
 * 3. Retornar resultado o error
 * 
 * Si paso 1 falla: NO ejecutar paso 2
 * Si paso 2 falla: Empleado quedó creado pero sin contrato (requiere manejo de estado)
 */
export function useRegistrarEmpleadoConContrato() {
  const [state, setState] = useState<UseRegistarEmpleadoConContratoState>({
    loading: false,
    error: null,
    result: null,
  });

  const registrar = async (payload: RegistrarEmpleadoConContratoPayload) => {
    setState({ loading: true, error: null, result: null });

    try {
      // ═════════════════════════════════════════════════════════════════════
      // PASO 1: Registrar Empleado
      // ═════════════════════════════════════════════════════════════════════
      const empleadoResponse = await EmployeeService.createEmployee(payload.empleadoData);
      
      if (!empleadoResponse.id) {
        throw new Error('El servidor no devolvió un ID de empleado');
      }

      // Convertir empleadoId a number
      const empleadoId = typeof empleadoResponse.id === 'string' 
        ? parseInt(empleadoResponse.id, 10) 
        : empleadoResponse.id;

      // ═════════════════════════════════════════════════════════════════════
      // PASO 2: Registrar Contrato (usa el idEmpleado del paso anterior)
      // ═════════════════════════════════════════════════════════════════════
      try {
        const contratoResponse = await ContractService.registerContract(empleadoId, payload.contratoData);

        const result: RegistroEmpleadoResult = {
          empleadoId,
          username: contratoResponse.credenciales?.username,
          password: contratoResponse.credenciales?.password,
          success: true,
        };

        setState({ loading: false, error: null, result });
        return result;
      } catch (contractError) {
        // Codigo 403 / auth-service no encontrado → parcial: empleado + contrato puede estar creado, pero no se generan credenciales
        const isAuthServiceError =
          (contractError && typeof contractError === 'object' && 'message' in contractError &&
            String((contractError as any).message).includes('auth-service')) ||
          (contractError && typeof contractError === 'object' && 'code' in contractError &&
            (contractError as any).code === 'Forbidden');

        if (isAuthServiceError) {
          const partialResult: RegistroEmpleadoResult = {
            empleadoId,
            success: false,
            partial: true,
            message: 'El contrato se registró, pero no se pudieron generar credenciales en auth-service.',
          };
          setState({
            loading: false,
            error: partialResult.message ?? 'El contrato se registró, pero no se pudieron generar credenciales en auth-service.',
            result: partialResult,
          });
          return partialResult;
        }

        throw contractError;
      }


    } catch (err) {
      // ═════════════════════════════════════════════════════════════════════
      // ERROR: Capturar y reporte
      // ═════════════════════════════════════════════════════════════════════
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido en el registro';
      
      setState({
        loading: false,
        error: errorMsg,
        result: null,
      });

      throw err;
    }
  };

  const resetState = () => {
    setState({ loading: false, error: null, result: null });
  };

  return {
    ...state,
    registrar,
    resetState,
  };
}
