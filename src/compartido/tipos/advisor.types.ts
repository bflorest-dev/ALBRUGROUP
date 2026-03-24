/**
 * TIPOS Y DTOs - ADVISOR
 * 
 * Definición única y centralizada de Advisor/Asesor en toda la aplicación.
 * 
 * Punto #8: Consistency - DTOs estandarizados, una única fuente de verdad
 */

import type { AdvisorStatus, AdvisorArea } from './enums';

/**
 * DTO: AdvisorDTO (Data Transfer Object)
 * 
 * Representa un asesor/advisor tal como viene del backend.
 * Contiene información del asesor y su carga de trabajo.
 */
export interface AdvisorDTO {
  // Identificadores
  id: string;
  initials: string;                   // 2 caracteres iniciales (ej: MA, JU, AN)

  // Información personal
  firstName: string;                  // Nombre del asesor
  lastName: string;                   // Apellido del asesor
  email?: string;                     // Email de contacto
  phone?: string;                     // Teléfono

  // Ubicación y área
  area: AdvisorArea;                  // Norte, Sur, Centro, Este, Oeste
  location?: string;                  // Ciudad o punto físico

  // Capacidad y carga de trabajo
  status: AdvisorStatus;              // Disponible, Ocupado, Saturado (calculado)
  totalCapacity: number;              // Máximo de leads que puede manejar
  assignedLeads: number;              // Leads actualmente asignados
  managedLeads: number;               // Leads completados/gestionados
  utilizationRate?: number;           // Porcentaje de capacidad utilizada

  // Estado
  isActive: boolean;                  // Si el asesor está activo/disponible
  joinDate?: string;                  // Fecha de ingreso
  lastActivityDate?: string;          // Último acceso al sistema

  // Metadatos
  createdAt?: string;                 // ISO timestamp
  updatedAt?: string;                 // ISO timestamp
}

/**
 * DTO: AdvisorSummary
 * 
 * Versión simplificada de AdvisorDTO para listados y componentes.
 * Contiene solo la información esencial.
 */
export interface AdvisorSummary {
  id: string;
  initials: string;
  firstName: string;
  lastName: string;
  area: AdvisorArea;
  status: AdvisorStatus;
  utilizationRate: number;            // 0-100
}

/**
 * DTO: AdvisorPerformance
 * 
 * Estadísticas de desempeño de un asesor.
 * Utilizado para reporte y dashboards.
 */
export interface AdvisorPerformance {
  advisorId: string;
  period: string;                     // ej: '2026-03'
  totalLeadsHandled: number;
  convertedLeads: number;
  conversionRate: number;
  averageHandlingTime: number;        // minutos
  customerSatisfaction?: number;      // rating 0-5
  qualityScore?: number;              // rating 0-100
}

/**
 * DTO: CreateAdvisorRequest
 * 
 * Datos para crear un nuevo asesor admin.
 */
export interface CreateAdvisorRequest {
  firstName: string;
  lastName: string;
  email: string;
  area: AdvisorArea;
  totalCapacity: number;
  phone?: string;
}

/**
 * DTO: UpdateAdvisorRequest
 * 
 * Datos parciales para actualizar un asesor.
 */
export interface UpdateAdvisorRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  area?: AdvisorArea;
  totalCapacity?: number;
  phone?: string;
  isActive?: boolean;
}

/**
 * Helper: Calcular estado de asesor basado en utilización
 * Punto #4 Complexity: Esta función es llamada frecuentemente, optimizada con simple if-else
 */
export const calculateAdvisorStatus = (
  assignedLeads: number,
  totalCapacity: number
): AdvisorStatus => {
  const utilizationRate = (assignedLeads / totalCapacity) * 100;

  if (utilizationRate < 50) return 'Disponible';
  if (utilizationRate < 90) return 'Ocupado';
  return 'Saturado';
};

/**
 * Helper: Calcular tasa de utilización
 */
export const calculateUtilizationRate = (
  assignedLeads: number,
  totalCapacity: number
): number => {
  return Math.round((assignedLeads / totalCapacity) * 100);
};

/**
 * Helper: Crear un Advisor vacío con valores por defecto
 */
export const createEmptyAdvisor = (): AdvisorDTO => ({
  id: '',
  initials: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  area: 'Norte' as AdvisorArea,
  location: '',
  status: 'Disponible' as AdvisorStatus,
  totalCapacity: 15,
  assignedLeads: 0,
  managedLeads: 0,
  utilizationRate: 0,
  isActive: true,
});

/**
 * Helper: Convertir AdvisorDTO a AdvisorSummary
 */
export const advisorToSummary = (advisor: AdvisorDTO): AdvisorSummary => ({
  id: advisor.id,
  initials: advisor.initials,
  firstName: advisor.firstName,
  lastName: advisor.lastName,
  area: advisor.area,
  status: advisor.status,
  utilizationRate: advisor.utilizationRate || 0,
});

/**
 * Helper: Validar que un Advisor sea válido
 */
export const isValidAdvisor = (advisor: Partial<AdvisorDTO>): advisor is AdvisorDTO => {
  return !!(
    advisor.id &&
    advisor.firstName &&
    advisor.lastName &&
    advisor.area &&
    advisor.totalCapacity
  );
};

/**
 * Helper: Obtener fullName de advisor
 */
export const getAdvisorFullName = (advisor: Pick<AdvisorDTO, 'firstName' | 'lastName'>): string => {
  return `${advisor.firstName} ${advisor.lastName}`.trim();
};

/**
 * Interface para props de componentes de Advisor
 * Reutilizable en múltiples componentes
 */
export interface AdvisorCardProps {
  advisor: AdvisorDTO;
  compact?: boolean;
  showPerformance?: boolean;
  onClick?: (advisorId: string) => void;
}
