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
export type ConversionOptionId = 'venta_cerrada' | 'venta_mes_siguiente' | 'instalada';

/**
 * IDs de opciones - REQUIERE SEGUIMIENTO
 */
export type FollowUpOptionId = 
  | 'agendado' 
  | 'consultar_familia' 
  | 'llamada_interrumpida' 
  | 'gestion_chat'
  | 'chancada_sin_ingresar'
  | 'edificio_exclusividad'
  | 'grabado'
  | 'mal_registrado'
  | 'no_contesta'
  | 'no_desea_dar_dni'
  | 'no_desea_grabar'
  | 'pdte_habilitar_condominio'
  | 'pdte_pago_adelantado'
  | 'pdte_score'
  | 'sin_cobertura'
  | 'sin_cto'
  | 'sin_subir'
  | 'en_progreso'
  | 'manchada'
  | 'revisado'
  | 'subida';

/**
 * IDs de opciones - RECHAZO
 */
export type RejectionOptionId = 
  | 'zona_f' 
  | 'vc_desaprobada' 
  | 'no_desea' 
  | 'no_califica'
  | 'desaprobado'
  | 'rescate'
  | 'baja_mala_info_venta'
  | 'baja_mult_deudas'
  | 'baja_no_desea'
  | 'fac_tec_cto_excede_metraje'
  | 'fac_tec_cto_saturado'
  | 'fac_tec_ductos_obstruidos'
  | 'fac_tec_naps_robadas'
  | 'fac_tec_naps_saturadas'
  | 'fac_tec_sin_cobertura'
  | 'fac_tec_sin_cto'
  | 'fac_tec_sin_permiso_vecinos'
  | 'fac_tec_sin_poste_apoyo'
  | 'fac_tec_sin_potencia'
  | 'fac_tec_torre_no_habilitada'
  | 'fac_tec_zona_elevada'
  | 'zona_peligrosa'
  | 'chancada_ingresada'
  | 'flipping'
  | 'posible_fraude'
  | 'sin_instalar'
  | 'anulado'
  | 'duplicado'
  | 'blacklist';

/**
 * IDs de opciones - SIN CONTACTO
 */
export type NoContactOptionId = 'no_contesta' | 'numero_equivocado' | 'buzon' | 'fuera_servicio';

/**
 * IDs de opciones - PROGRAMADOS
 */
export type ProgrammedOptionId = 
  | 'programada'
  | 'reprogramada'
  | 'prog_agendada'
  | 'prog_tec_en_camino'
  | 'prog_iniciada'
  | 'prog_tec_en_casa'
  | 'prog_cancelada'
  | 'prog_sin_cd';

/**
 * Union de todos los IDs de opciones
 */
export type TipificationOptionId = 
  | ConversionOptionId 
  | FollowUpOptionId 
  | RejectionOptionId 
  | NoContactOptionId
  | ProgrammedOptionId;

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
export interface LeadTipificationRecord {
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
  tipification: LeadTipificationRecord;
  message?: string;
}
