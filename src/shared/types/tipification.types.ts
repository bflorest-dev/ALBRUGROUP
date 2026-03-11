/**
 * TIPOS Y DTOs - TIPIFICACIÓN
 * 
 * Definición de la estructura jerárquica de tipificaciones
 * para ASESOR_BACKOFFICE y otros módulos de gestión de leads.
 * 
 * Estructura: Bloques → Opciones → Valores
 * 
 * Los bloques son:
 * - ✅ CONVERSIÓN EXITOSA (success)
 * - ⏸️  REQUIERE SEGUIMIENTO (pending)
 * - ❌ RECHAZO (rejected)
 * - 📲 SIN CONTACTO (no-contact)
 */

/**
 * Status de un bloque de tipificación
 */
export type TipificationStatus = 'success' | 'pending' | 'rejected' | 'no-contact';

/**
 * IDs de opciones - CONVERSIÓN EXITOSA
 */
export type ConversionOptionId = 'venta_cerrada' | 'venta_mes_siguiente';

/**
 * IDs de opciones - REQUIERE SEGUIMIENTO
 */
export type FollowUpOptionId = 'agendado' | 'consultar_familia' | 'llamada_interrumpida' | 'gestion_chat';

/**
 * IDs de opciones - RECHAZO
 */
export type RejectionOptionId = 'zona_f' | 'vc_desaprobada' | 'no_desea' | 'no_califica';

/**
 * IDs de opciones - SIN CONTACTO
 */
export type NoContactOptionId = 'no_contesta' | 'numero_equivocado' | 'buzon' | 'fuera_servicio';

/**
 * Union de todos los IDs de opciones
 */
export type TipificationOptionId = 
  | ConversionOptionId 
  | FollowUpOptionId 
  | RejectionOptionId 
  | NoContactOptionId;

/**
 * Opción dentro de un bloque de tipificación
 */
export interface TipificationOption {
  id: TipificationOptionId;
  label: string;
  description?: string;
  requiresDate?: boolean;  // Para "Agendado para..."
  requiresNotes?: boolean; // Para notas adicionales
}

/**
 * Bloque de tipificación (contiene múltiples opciones)
 */
export interface TipificationBlock {
  id: string;
  icon: string;
  label: string;
  description?: string;
  color: string;
  status: TipificationStatus;
  options: TipificationOption[];
}

/**
 * Tipificación seleccionada por el asesor para un lead
 */
export interface LeadTipification {
  blockId: string;
  optionId: TipificationOptionId;
  selectedLabel: string;
  scheduledDate?: string;  // Formato: dd/mm/yyyy (si requiere fecha)
  notes?: string;          // Notas adicionales
  tipifiedAt: string;      // ISO timestamp
  tipifiedBy: string;      // ID del asesor que tipificó
}

/**
 * Estado de tipificación de un lead
 */
export type TipificationState = 'pending' | 'tipified' | 'in-progress';

/**
 * Filtros para búsqueda por bloque
 */
export interface TipificationFilter {
  blockId?: string;
  status?: TipificationStatus;
  includeUntipified?: boolean; // Incluir leads sin tipificar
}

/**
 * Datos para actualizar tipificación de un lead
 */
export interface UpdateTipificationRequest {
  leadId: string;
  blockId: string;
  optionId: TipificationOptionId;
  scheduledDate?: string;
  notes?: string;
}

/**
 * Respuesta al actualizar tipificación
 */
export interface UpdateTipificationResponse {
  success: boolean;
  tipification: LeadTipification;
  message?: string;
}
