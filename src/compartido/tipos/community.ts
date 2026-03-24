/**
 * Community Dashboard Types
 * 
 * Tipos centralizados para el módulo de Community Manager
 * - CommunityDashboardState: Estado completo del dashboard
 * - Interfaces de soporte para métricas, leads y campañas
 */

/**
 * Datos de métricas de una campaña (META ADS o DRIVE)
 * Usados en modales de edición y cálculos de KPIs
 */
export interface CampaignMetric {
  campaignId: string;
  metricType: 'META_ADS' | 'DRIVE';
  cantLeads: number;
  deltaLeads: number;
  spent?: number;
  results?: number;
  reach?: number;
  impressions?: number;
  frequency?: number;
  clicks?: number;
  clicsTotal?: number;
  ventasCerradas?: number;
  contacto?: number;
}

/**
 * Datos de una campaña individual
 * Información básica de identificación y seguimiento
 */
export interface Campaign {
  id: string;
  campaignId?: string;
  campaignName: string;
  name?: string; // Alias de campaignName
  company?: string;
  advertiserAccount?: string;
  accountNumber?: string;
  whatsapp?: string;
  status?: 'active' | 'paused' | 'completed';
}

/**
 * Desglose de leads por campaña y fecha
 * Usado en LeadsManagementSection para mostrar tabla expandible
 */
export interface CampaignLeadsBreakdown {
  campaign: Campaign;
  totalLeads: number;
  convertedLeads: number;
  leadsByDate: Record<string, Array<{ status: string; [key: string]: any }>>;
}

/**
 * Datos siendo editados en modal de métricas
 * Se actualiza incrementalmente a través de handlers individuales
 */
export interface EditMetricsData {
  cantLeads: number;
  deltaLeads: number;
}

/**
 * Datos siendo editados en modal de campaña
 * Contiene todas las métricas editables de una campaña
 */
export interface CampaignEditData {
  spent: number;
  results: number;
  reach: number;
  impressions: number;
  frequency: number;
  clicks: number;
  clicsTotal: number;
  ventasCerradas: number;
  contacto?: number;
}

/**
 * Datos del formulario para crear nueva campaña
 * Estructura genérica que se valida antes de envío
 */
export interface CreateCampaignFormData {
  [key: string]: any;
  campaignName?: string;
  company?: string;
  advertiserAccount?: string;
  accountNumber?: string;
}

/**
 * Campaña seleccionada para edición en modal
 * Referencia al objeto original con id y nombre
 */
export interface SelectedCampaignForEdit extends Campaign {
  campaignId?: string;
  campaignName: string;
}

/**
 * Estado completo del Community Dashboard
 * 
 * Contiene:
 * - Datos necesarios para renderizar UI
 * - Estados de modales y expansiones
 * - Handlers para todas las interacciones
 * 
 * Se pasa como prop única a todos los sub-componentes:
 * - ModalsSection
 * - CampaignsSection
 * - LeadsManagementSection
 * - DashboardSection
 */
export interface CommunityDashboardState {
  // ============================================
  // 📊 DATA PROPERTIES
  // ============================================

  /** Array de todas las campañas disponibles */
  campaigns: Campaign[];

  /** Array de métricas calculadas por campaña */
  campaignMetrics: CampaignMetric[];

  /** Desglose de leads agrupados por campaña y fecha (para tabla expandible) */
  campaignLeadsBreakdown: CampaignLeadsBreakdown[];

  // ============================================
  // 🎛️ MODAL STATE PROPERTIES
  // ============================================

  /** ¿Está abierto el modal de editar métricas (META ADS o DRIVE)? */
  isEditingMetrics: boolean;

  /** ¿Está abierto el modal de editar métricas de campaña? */
  isEditingCampaignMetrics: boolean;

  /** ¿Está abierto el modal de crear nueva campaña? */
  isModalOpen: boolean;

  /** Tipo de métrica que se está editando ('META_ADS' o 'DRIVE') */
  editingMetricsType: string;

  /** Campaña seleccionada para edición en el modal de campañas */
  selectedCampaignForEdit?: SelectedCampaignForEdit | null;

  /** ID de la campaña expandida en la tabla de leads (null si ninguna expandida) */
  expandedCampaignId: string | null;

  // ============================================
  // 📝 FORM DATA PROPERTIES
  // ============================================

  /** Datos del formulario en modal de editar métricas */
  editMetricsData: EditMetricsData;

  /** Datos del formulario en modal de editar campaña */
  campaignEditData: CampaignEditData;

  /** Datos del formulario en modal de crear campaña */
  formData: CreateCampaignFormData;

  // ============================================
  // 🔧 HANDLER SETTERS (Modal State)
  // ============================================

  /** Abre/cierra el modal de editar métricas */
  setIsEditingMetrics: (value: boolean) => void;

  /** Abre/cierra el modal de editar métricas de campaña */
  setIsEditingCampaignMetrics: (value: boolean) => void;

  // ============================================
  // 🔧 HANDLER MODAL ACTIONS
  // ============================================

  /** Abre el modal de crear nueva campaña */
  handleToggleModalOpen: () => void;

  /** Cierra el modal de crear nueva campaña */
  handleToggleModalClose: () => void;

  /** Cierra el modal de crear nueva campaña (alias o variante) */
  handleCloseCreateModal: () => void;

  /** Cierra el modal de editar métricas */
  handleCloseEditMetricsModal: () => void;

  /** Cierra el modal de editar métricas de campaña */
  handleCloseEditCampaignMetricsModal: () => void;

  /** Guarda los cambios de métricas editadas */
  handleSaveMetrics: () => void;

  /** Guarda los cambios de campaña editada */
  handleSaveCampaignMetrics: () => void;

  // ============================================
  // 🔧 HANDLER METRICS EDIT (Modal de editar metricas)
  // ============================================

  /** Actualiza el campo CANT LEADS en modal de editar métricas */
  handleEditMetricsCantLeadsChange: (value: string | number) => void;

  /** Actualiza el campo Δ LEADS (deltaLeads) en modal de editar métricas */
  handleEditMetricsDeltaLeadsChange: (value: string | number) => void;

  // ============================================
  // 🔧 HANDLER CAMPAIGN EDIT (Modal de editar campaña)
  // ============================================

  /** Actualiza el campo IMPORTE GASTADO */
  handleCampaignSpentChange: (value: string | number) => void;

  /** Actualiza el campo RESULTADOS */
  handleCampaignResultsChange: (value: string | number) => void;

  /** Actualiza el campo ALCANCE */
  handleCampaignReachChange: (value: string | number) => void;

  /** Actualiza el campo IMPRESIONES */
  handleCampaignImpressionsChange: (value: string | number) => void;

  /** Actualiza el campo FRECUENCIA */
  handleCampaignFrequencyChange: (value: string | number) => void;

  /** Actualiza el campo CLICS */
  handleCampaignClicksChange: (value: string | number) => void;

  /** Actualiza el campo CLICS [TODOS] */
  handleCampaignClicsTotalChange: (value: string | number) => void;

  /** Actualiza el campo VENTAS CERRADAS */
  handleCampaignVentasCerradasChange: (value: string | number) => void;

  /** Actualiza el campo CONTACTO */
  handleCampaignContactoChange: (value: string | number) => void;

  // ============================================
  // 🔧 HANDLER FORM (Modal de crear campaña)
  // ============================================

  /** Actualiza campos del formulario de crear campaña */
  handleFormChange: (field: string, value: any) => void;

  /** Crea una nueva campaña y cierra el modal */
  handleCreateCampaign: () => void;

  // ============================================
  // 🔧 HANDLER TABLE EXPANSION (LeadsManagementSection)
  // ============================================

  /** Expande/contrae filas de leads por fecha en la tabla */
  handleToggleExpandCampaign: (campaignId: string) => void;
}
