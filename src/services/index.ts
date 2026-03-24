/**
 * Services Layer - Lógica de negocio del frontend
 * 
 * MIGRACIÓN FSD (FASE 6):
 * Los servicios se han movido a sus features correspondientes.
 * Re-exportamos desde nuevas ubicaciones para compatibilidad.
 */

export { EmployeeService } from '@caracteristicas/registrar-empleado/api';
export { ApplicantService } from '@caracteristicas/registrar-postulante/api';
export { ErrorLogger, useErrorLogger, type ErrorLogEntry, type ErrorMetrics } from './errorLogger';