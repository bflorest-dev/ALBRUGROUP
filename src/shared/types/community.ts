export interface CommunityMetric {
  id: string;
  name: string;
  value: number;
}

export interface CampaignSummary {
  id: string;
  name: string;
  campaignName: string;
  leads: number;
  conversionRate: number;
}

export interface EditMetricsData {
  cantLeads: number;
  deltaLeads: number;
}

export interface CampaignEditData {
  spent: number;
  results: number;
  reach: number;
  impressions: number;
  frequency: number;
  clicks: number;
  clicsTotal: number;
  ventasCerradas: number;
  contacto: number;
}

export interface NewCampaignFormData {
  campaignName: string;
  nomEmpresa: string;
  ctaPublicitaria: string;
  nomCtaPublicitaria: string;
}

export interface CampaignLeadBreakdown {
  campaign: CampaignSummary;
  totalLeads: number;
  convertedLeads: number;
  leadsByDate: Record<string, Array<{ id: string; status: string }>>;
}

export interface CommunityDashboardState {
  metrics: CommunityMetric[];
  campaigns: CampaignSummary[];
  campaignMetrics: Array<{ campaignId: string; [key: string]: any }>;
  campaignLeadsBreakdown: CampaignLeadBreakdown[];
  totalLeads: number;
  convertedLeads: number;
  activeUsers: number;

  // Modals state
  isEditingMetrics: boolean;
  setIsEditingMetrics: (value: boolean) => void;
  editingMetricsType: string;
  editMetricsData: EditMetricsData;
  handleEditMetricsCantLeadsChange: (value: string) => void;
  handleEditMetricsDeltaLeadsChange: (value: string) => void;
  handleCloseEditMetricsModal: () => void;
  handleSaveMetrics: () => void;

  isEditingCampaignMetrics: boolean;
  setIsEditingCampaignMetrics: (value: boolean) => void;
  selectedCampaignForEdit?: CampaignSummary;
  campaignEditData: CampaignEditData;
  handleCampaignSpentChange: (value: string) => void;
  handleCampaignResultsChange: (value: string) => void;
  handleCampaignReachChange: (value: string) => void;
  handleCampaignImpressionsChange: (value: string) => void;
  handleCampaignFrequencyChange: (value: string) => void;
  handleCampaignClicksChange: (value: string) => void;
  handleCampaignClicsTotalChange: (value: string) => void;
  handleCampaignVentasCerradasChange: (value: string) => void;
  handleCampaignContactoChange: (value: string) => void;
  handleCloseEditCampaignMetricsModal: () => void;
  handleSaveCampaignMetrics: () => void;

  isModalOpen: boolean;
  handleCloseCreateModal: () => void;
  formData: NewCampaignFormData;
  handleFormChange: (field: string, value: string) => void;
  handleToggleModalClose: () => void;
  handleToggleModalOpen: () => void;
  handleCreateCampaign: () => void;

  expandedCampaignId?: string;
  handleToggleExpandCampaign: (campaignId: string) => void;
}
