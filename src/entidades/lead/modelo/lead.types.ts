/**
 * TIPOS Y DTOs - LEAD
 * 
 * Definición única y centralizada de Lead en toda la aplicación.
 * Todos los hooks, componentes y servicios deben importar desde aquí.
 * 
 * Punto #8: Consistency - DTOs estandarizados, una única fuente de verdad
 */

import type { LeadChannel, LeadFollowUpStatus, LeadTipification, BusinessUnit } from '@compartido/tipos/enums';

/**
 * DTO: LeadDTO (Data Transfer Object)
 * 
 * Representa un lead tal como viene del backend.
 * Estructura completa con todos los campos del servidor.
 * 
 * Cambios entre versiones:
 * - v1.0: Primera versión con 14 campos
 */
export interface LeadDTO {
  // Identificadores
  id: string;

  // Información de origen
  registrationDate: string;           // Fecha de creación del lead (dd/mm/yy)
  registrationTime: string;           // Hora de creación (hh:mm a.m./p.m.)
  campaign: string;                   // Nombre de la campaña de donde vino
  businessUnit: BusinessUnit;         // Unidad de negocio

  // Canal de contacto
  channel: LeadChannel;               // Facebook | Instagram | WhatsApp

  // Información del cliente
  firstName: string;                  // Nombre del cliente
  lastName: string;                   // Apellido del cliente
  phone: string;                      // Teléfono de contacto

  // Estado y categorización
  tipification: LeadTipification;     // Categoría de resultado (0-8)
  followUp: LeadFollowUpStatus;       // Estado en pipeline (Nuevo, En gestión, etc)
  aliasName?: string;                 // Alias o nickname del contacto

  // Asignación
  advisor: string;                    // Nombre del asesor asignado
  advisorArea: string;                // Área geográfica del asesor
  reassignmentCount: number;          // Cuántas veces fue reasignado

  // Metadatos
  createdAt?: string;                 // ISO timestamp de creación
  updatedAt?: string;                 // ISO timestamp de última actualización
  createdBy?: string;                 // ID del usuario que creó el lead
}

/**
 * DTO: CreateLeadRequest
 * 
 * Estructura de datos para crear un nuevo lead.
 * Solo incluye campos que el usuario puede inputear (validados).
 * 
 * Uso: Enviado desde NewLeadForm al backend
 */
export interface CreateLeadRequest {
  phone: string;                      // Validado: teléfono según país (POIS)
  firstName: string;                  // Validado: solo letras, min 2 caracteres
  lastName?: string;                  // Opcional
  campaign: string;                   // Seleccionado de lista
  channel: LeadChannel;               // Seleccionado de lista
  businessUnit: BusinessUnit;         // Seleccionado de lista
  countryCode: string;                // País (POIS) para filtrado de teléfono
}

/**
 * DTO: LeadResponse
 * 
 * Respuesta del servidor después de crear/actualizar un lead.
 * Incluye confirmación y datos del lead procesado.
 */
export interface LeadResponse {
  success: boolean;
  lead: LeadDTO;
  message?: string;
}

/**
 * DTO: LeadFilterCriteria
 * 
 * Parámetros para filtrar/buscar leads desde el cliente.
 * Utilizado por useLeadsFiltering hook.
 */
export interface LeadFilterCriteria {
  searchTerm?: string;                // Búsqueda por nombre o teléfono (case-insensitive)
  channel?: LeadChannel;              // Filtro por canal
  advisor?: string;                   // Filtro por asesor
  campaign?: string;                  // Filtro por campaña
  followUp?: LeadFollowUpStatus;      // Filtro por estado
  tipification?: LeadTipification;    // Filtro por categoría
  dateRange?: {
    from: string;
    to: string;
  };
}

/**
 * DTO: LeadStatistics
 * 
 * Estadísticas calculadas sobre un conjunto de leads.
 * Utilizado para mostrar tarjetas de metricas.
 */
export interface LeadStatistics {
  totalLeads: number;
  newLeads: number;                   // followUp === NUEVO
  leadsInProgress: number;             // followUp === EN_GESTION
  completedLeads: number;             // followUp === GESTIONADO
  assignedLeads: number;              // followUp === ASIGNADO
  conversionRate?: number;            // Porcentaje de preventa completa
  averageHandlingTime?: number;       // Minutos promedio por lead
}

/**
 * Interfaz para formulario de creación de lead
 * Difiere de CreateLeadRequest: incluye el campo "name" que es el teléfono
 * (compatibilidad con formulario existente)
 */
export interface NewLeadFormData {
  pois: string;                       // País (POIS)
  name: string;                       // Teléfono (mal nombrado en formulario)
  campaign: string;                   // Campaña
  channel: string;                    // Canal
  base: string;                       // Base (unidad de negocio)
}

/**
 * Helper type: Extrae solo las claves que son modificables de Lead
 * Útil para DTOs de actualización parcial
 */
export type LeadUpdatePayload = Partial<Omit<LeadDTO, 'id' | 'registrationDate' | 'registrationTime' | 'createdAt' | 'createdBy'>>;

/**
 * Helper: Crear un Lead vacio con valores por defecto
 */
export const createEmptyLead = (): LeadDTO => ({
  id: '',
  registrationDate: '',
  registrationTime: '',
  campaign: '',
  businessUnit: 'Telefonía Hogar' as BusinessUnit,
  channel: 'Facebook' as LeadChannel,
  firstName: '',
  lastName: '',
  phone: '',
  tipification: 'Sin tipificar' as LeadTipification,
  followUp: 'Nuevo' as LeadFollowUpStatus,
  aliasName: '',
  advisor: '',
  advisorArea: '',
  reassignmentCount: 0,
});

/**
 * Helper: Validar que un Lead sea válido
 */
export const isValidLead = (lead: Partial<LeadDTO>): lead is LeadDTO => {
  return !!(
    lead.id &&
    lead.firstName &&
    lead.phone &&
    lead.channel &&
    lead.campaign
  );
};
