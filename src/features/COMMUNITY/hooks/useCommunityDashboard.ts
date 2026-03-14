import { useState, useMemo, useCallback } from 'react';

/**
 * localStorage Storage Keys
 */
const STORAGE_KEYS = {
  COMPANIES: 'community_companies',
  ADVERTISER_ACCOUNTS: 'community_advertiser_accounts',
  CAMPAIGNS: 'community_campaigns',
};

/**
 * LocalStorage Utility Functions
 */
const storageUtils = {
  saveCompanies: (companies: Company[]) => {
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
  },
  loadCompanies: (): Company[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COMPANIES);
      if (stored) {
        return JSON.parse(stored);
      }
      // First load: initialize with mockups
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(mockCompanies));
      return mockCompanies;
    } catch {
      return mockCompanies;
    }
  },
  
  saveAdvertiserAccounts: (accounts: AdvertiserAccount[]) => {
    localStorage.setItem(STORAGE_KEYS.ADVERTISER_ACCOUNTS, JSON.stringify(accounts));
  },
  loadAdvertiserAccounts: (): AdvertiserAccount[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ADVERTISER_ACCOUNTS);
      if (stored) {
        return JSON.parse(stored);
      }
      // First load: initialize with mockups
      localStorage.setItem(STORAGE_KEYS.ADVERTISER_ACCOUNTS, JSON.stringify(mockAdvertiserAccounts));
      return mockAdvertiserAccounts;
    } catch {
      return mockAdvertiserAccounts;
    }
  },
  
  saveCampaigns: (campaigns: Campaign[]) => {
    localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
  },
  loadCampaigns: (): Campaign[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
      if (stored) {
        return JSON.parse(stored);
      }
      // First load: initialize with mockups
      localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(mockCampaigns));
      return mockCampaigns;
    } catch {
      return mockCampaigns;
    }
  },
  
  clearAll: () => {
    localStorage.removeItem(STORAGE_KEYS.COMPANIES);
    localStorage.removeItem(STORAGE_KEYS.ADVERTISER_ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.CAMPAIGNS);
  }
};

/**
 * Types (Extraídas de CommunityDashboard.tsx)
 */
export interface Campaign {
  id: string;
  date: string;
  time: string;
  businessUnit: string;
  campaignName: string;
  nomEmpresa?: string;
  ctaPublicitaria?: string;
  nomCtaPublicitaria?: string;
  channel: 'Facebook' | 'Instagram' | 'Teléfono Hogar' | 'Internet Empresas' | 'Móviles';
  totalSpent: number;
  preventas: number;
  conversionRate: number;
  status: 'Activa' | 'Pausada';
  impressions?: number;
  clicks?: number;
  reach?: number;
  frequency?: number;
  metaAdsLeads?: number;
  metaAdsLeadsDelta?: number;
  metaAdsQxR?: number;
  driveLeads?: number;
  driveLeadsDelta?: number;
  driveQxR?: number;
  clicsTotal?: number;
  ventasCerradas?: number;
  contacto?: number;
}

export interface Lead {
  id: string;
  name: string;
  status: 'no-contesta' | 'solo-info' | 'interesado' | 'derivado' | 'convertido';
  canal: string;
  fecha: string;
}

export interface Company {
  id: string;
  name: string;
  status: 'ACTIVO' | 'INACTIVO';
  color?: string;
}

export interface AdvertiserAccount {
  id: string;
  name: string;
  accountNumber: string;
}

/**
 * Campaign Calculated Metrics (CPM, CPC, CTR, ROAS)
 * Calculated by useMemo to avoid recalculation on every render
 */
export interface CampaignCalculatedMetrics {
  campaignId: string;
  cpm: string;              // Currency formatted: "S/ X.XX"
  cpc: string;              // Currency formatted: "S/ X.XX"
  ctr: string;              // Percentage formatted: "X.XX%"
  costPerResult: string;    // Currency formatted: "S/ X.XX"
  roas: string;             // Percentage formatted: "X.XX%"
}

/**
 * Mock Data (Extraída de CommunityDashboard.tsx)
 */
const mockCompanies: Company[] = [
  { id: '1', name: 'Albrugroup Solutions', status: 'ACTIVO', color: '#10B981' },
  { id: '2', name: 'Digital Marketing Pro', status: 'ACTIVO', color: '#3B82F6' },
  { id: '3', name: 'Legacy Systems Inc', status: 'INACTIVO', color: '#F59E0B' }
];

const mockAdvertiserAccounts: AdvertiserAccount[] = [
  { id: '1', name: 'Meta Ads - Fibra Hogar', accountNumber: '123456789' },
  { id: '2', name: 'Google Ads - Empresas', accountNumber: '987654321' },
  { id: '3', name: 'TikTok Ads - Móviles', accountNumber: '555444333' }
];

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    date: '01/03/2026',
    time: '08:00',
    businessUnit: 'Telefonoía Hogar',
    campaignName: 'Promo Fibra Marzo',
    channel: 'Facebook',
    totalSpent: 12500,
    preventas: 18,
    conversionRate: 14.4,
    status: 'Activa',
    impressions: 45230,
    clicks: 1240,
    reach: 38900,
    frequency: 1.16,
    metaAdsLeads: 4,
    metaAdsLeadsDelta: 0,
    metaAdsQxR: 29.36,
    driveLeads: 5,
    driveLeadsDelta: 0,
    driveQxR: 23.49,
    clicsTotal: 105,
    ventasCerradas: 1,
    contacto: 3
  },
  {
    id: '2',
    date: '01/03/2026',
    time: '10:30',
    businessUnit: 'Internet Empresas',
    campaignName: 'Fibra Empresarial Q1',
    channel: 'Instagram',
    totalSpent: 8200,
    preventas: 11,
    conversionRate: 10.2,
    status: 'Activa',
    impressions: 32100,
    clicks: 890,
    reach: 28500,
    frequency: 1.13,
    clicsTotal: 238,
    ventasCerradas: 1,
    contacto: 28
  },
  {
    id: '3',
    date: '02/03/2026',
    time: '09:00',
    businessUnit: 'Telefonaía Hogar',
    campaignName: 'Combo TV + Internet',
    channel: 'Facebook',
    totalSpent: 6800,
    preventas: 9,
    conversionRate: 8.8,
    status: 'Activa',
    impressions: 28400,
    clicks: 650,
    reach: 25200,
    frequency: 1.13,
    clicsTotal: 435,
    ventasCerradas: 0,
    contacto: 12
  },
  {
    id: '4',
    date: '03/03/2026',
    time: '14:00',
    businessUnit: 'Móviles',
    campaignName: 'Plan Familia Marzo',
    channel: 'Instagram',
    totalSpent: 4500,
    preventas: 6,
    conversionRate: 11.3,
    status: 'Pausada',
    impressions: 15600,
    clicks: 380,
    reach: 14200,
    frequency: 1.10,
    clicsTotal: 99,
    ventasCerradas: 1,
    contacto: 8
  },
  {
    id: '5',
    date: '04/03/2026',
    time: '08:30',
    businessUnit: 'Telefonaía Hogar',
    campaignName: 'Retargeting Fibra',
    channel: 'Facebook',
    totalSpent: 3200,
    preventas: 4,
    conversionRate: 9.5,
    status: 'Activa',
    impressions: 12300,
    clicks: 280,
    reach: 11100,
    frequency: 1.11,
    clicsTotal: 142,
    ventasCerradas: 0,
    contacto: 15
  }
];

const mockLeads: Lead[] = [
  { id: '1', name: 'Juan García', status: 'interesado', canal: 'Facebook', fecha: '2026-03-09' },
  { id: '2', name: 'María López', status: 'derivado', canal: 'Instagram', fecha: '2026-03-08' },
  { id: '3', name: 'Carlos Rodríguez', status: 'no-contesta', canal: 'Facebook', fecha: '2026-03-07' },
  { id: '4', name: 'Ana Martínez', status: 'convertido', canal: 'Instagram', fecha: '2026-03-06' },
  { id: '5', name: 'Pedro Gómez', status: 'solo-info', canal: 'Facebook', fecha: '2026-03-05' },
  { id: '6', name: 'Sofia Sanchez', status: 'interesado', canal: 'Instagram', fecha: '2026-03-04' },
  { id: '7', name: 'Diego Torres', status: 'derivado', canal: 'Facebook', fecha: '2026-03-03' },
  { id: '8', name: 'Laura Perez', status: 'convertido', canal: 'Instagram', fecha: '2026-03-02' },
];

/**
 * Custom Hook - useCommunityDashboard
 * 
 * Centraliza toda la lógica de estado, handlers y computed values
 * que antes estaban dispersos en el componente CommunityDashboard
 * 
 * Refactorización Problema #2: CommunityDashboard (CRÍTICO)
 */
export const useCommunityDashboard = () => {
  // ==================== STATE ====================
  
  // Sección activa en el menú
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  
  // Data principal - Cargar del localStorage
  const [companies, setCompaniesState] = useState<Company[]>(() => storageUtils.loadCompanies());
  const [advertiserAccounts, setAdvertiserAccountsState] = useState<AdvertiserAccount[]>(() => storageUtils.loadAdvertiserAccounts());
  const [campaigns, setCampaignsState] = useState<Campaign[]>(() => storageUtils.loadCampaigns());
  const [leads] = useState<Lead[]>(mockLeads);
  
  // Wrapper para setCompanies que también guarda en localStorage
  const setCompanies = useCallback((updater: Company[] | ((prev: Company[]) => Company[])) => {
    setCompaniesState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      storageUtils.saveCompanies(next);
      return next;
    });
  }, []);
  
  // Wrapper para setAdvertiserAccounts que también guarda en localStorage
  const setAdvertiserAccounts = useCallback((updater: AdvertiserAccount[] | ((prev: AdvertiserAccount[]) => AdvertiserAccount[])) => {
    setAdvertiserAccountsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      storageUtils.saveAdvertiserAccounts(next);
      return next;
    });
  }, []);
  
  // Wrapper para setCampaigns que también guarda en localStorage
  const setCampaigns = useCallback((updater: Campaign[] | ((prev: Campaign[]) => Campaign[])) => {
    setCampaignsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      storageUtils.saveCampaigns(next);
      return next;
    });
  }, []);
  
  // Modal: Crear Campaña
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    campaignName: '',
    nomEmpresa: '',
    ctaPublicitaria: '',
    nomCtaPublicitaria: ''
  });
  
  // Modal: Editar Metricas (META ADS o DRIVE)
  const [isEditingMetrics, setIsEditingMetrics] = useState(false);
  const [editingMetricsType, setEditingMetricsType] = useState<'META ADS' | 'DRIVE'>('META ADS');
  const [editMetricsData, setEditMetricsData] = useState({ cantLeads: 0, deltaLeads: 0 });
  
  // Modal: Editar Metricas de Campaña
  const [isEditingCampaignMetrics, setIsEditingCampaignMetrics] = useState(false);
  const [selectedCampaignForEdit, setSelectedCampaignForEdit] = useState<Campaign | null>(null);
  const [campaignEditData, setCampaignEditData] = useState({
    results: 0,
    reach: 0,
    frequency: 0,
    spent: 0,
    impressions: 0,
    clicks: 0,
    clicsTotal: 0,
    ventasCerradas: 0,
    contacto: 0
  });
  
  // Tabla: Lead expandido
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);

  // ==================== COMPUTED VALUES - useMemo ====================
  
  /**
   * META ADS Metrics - Calcula totales de campaña
   * Depende de: campaigns
   */
  const metaAdsMetrics = useMemo(() => {
    const totalCantLeads = campaigns.reduce((sum, c) => sum + (c.metaAdsLeads || 0), 0);
    const totalLeadsDelta = campaigns.reduce((sum, c) => sum + (c.metaAdsLeadsDelta || 0), 0);
    const avgQxR = campaigns.length > 0 
      ? (campaigns.reduce((sum, c) => sum + (c.metaAdsQxR || 0), 0) / campaigns.length).toFixed(2)
      : '0.00';

    return [
      { label: 'CANT LEADS', value: totalCantLeads.toLocaleString() },
      { label: 'Δ LEADS', value: totalLeadsDelta.toLocaleString() },
      { label: 'Q x R', value: `S/ ${avgQxR}` },
    ];
  }, [campaigns]);

  /**
   * DRIVE Metrics - Calcula totales de campaña
   * Depende de: campaigns
   */
  const driveMetrics = useMemo(() => {
    const totalCantLeads = campaigns.reduce((sum, c) => sum + (c.driveLeads || 0), 0);
    const totalLeadsDelta = campaigns.reduce((sum, c) => sum + (c.driveLeadsDelta || 0), 0);
    const avgQxR = campaigns.length > 0 
      ? (campaigns.reduce((sum, c) => sum + (c.driveQxR || 0), 0) / campaigns.length).toFixed(2)
      : '0.00';

    return [
      { label: 'CANT LEADS', value: totalCantLeads.toLocaleString() },
      { label: 'Δ LEADS', value: totalLeadsDelta.toLocaleString() },
      { label: 'Q x R', value: `S/ ${avgQxR}` },
    ];
  }, [campaigns]);

  /**
   * Campaign Leads Breakdown - Agrupa leads por campaña y fecha
   * Depende de: campaigns, leads
   */
  const campaignLeadsBreakdown = useMemo(() => {
    return campaigns.map(campaign => {
      const campaignLeads = leads.filter(l => 
        l.canal.toLowerCase().includes(campaign.channel.toLowerCase()) || 
        l.fecha.includes(campaign.date)
      );
      const leadsByDate = campaignLeads.reduce((acc, lead) => {
        if (!acc[lead.fecha]) acc[lead.fecha] = [];
        acc[lead.fecha].push(lead);
        return acc;
      }, {} as Record<string, typeof leads>);
      
      return {
        campaign,
        totalLeads: campaignLeads.length,
        convertedLeads: campaignLeads.filter(l => l.status === 'convertido').length,
        leadsByDate
      };
    });
  }, [campaigns, leads]);

  /**
   * PROBLEMA #4: Campaign Calculated Metrics
   * 
   * Calcula métricas complejas para cada campaña:
   * - CPM (Costo Por Mil): (spend / impressions) * 1000
   * - CPC (Costo Por Click): spend / clicks
   * - CTR (Click-Through Rate): (clicks / impressions) * 100
   * - Cost per Result: spend / metaAdsLeads
   * - ROAS (Return on Ad Spend): (ventasCerradas * 100) / spend
   * 
   * Se memoiza para evitar recalcular en cada render
   * Depende de: campaigns
   */
  const campaignMetrics = useMemo(() => {
    return campaigns.map(campaign => {
      // CPM: Cost Per Thousand Impressions
      const cpm = (campaign.impressions || 0) > 0 
        ? ((campaign.totalSpent || 0) / (campaign.impressions || 0) * 1000).toFixed(2)
        : '0.00';

      // CPC: Cost Per Click
      const cpc = (campaign.clicks || 0) > 0
        ? ((campaign.totalSpent || 0) / (campaign.clicks || 0)).toFixed(2)
        : '0.00';

      // CTR: Click-Through Rate
      const ctr = (campaign.impressions || 0) > 0
        ? (((campaign.clicks || 0) / (campaign.impressions || 0)) * 100).toFixed(2)
        : '0.00';

      // Cost per Result (Costo/Resultado)
      const costPerResult = (campaign.metaAdsLeads || 0) > 0
        ? ((campaign.totalSpent || 0) / (campaign.metaAdsLeads || 0)).toFixed(2)
        : '0.00';

      // ROAS: Return On Ad Spend (Ventas Cerradas / Spend)
      const roas = (campaign.totalSpent || 0) > 0
        ? (((campaign.ventasCerradas || 0) * 100) / (campaign.totalSpent || 0)).toFixed(2)
        : '0.00';

      return {
        campaignId: campaign.id,
        cpm: `S/ ${cpm}`,
        cpc: `S/ ${cpc}`,
        ctr: `${ctr}%`,
        costPerResult: `S/ ${costPerResult}`,
        roas: `${roas}%`
      } as CampaignCalculatedMetrics;
    });
  }, [campaigns]);

  // ==================== EVENT HANDLERS ====================

  /**
   * Form change handler para el modal de crear campaña
   */
  const handleFormChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    },
    []
  );

  /**
   * Abre el modal de editar métricas (META ADS o DRIVE)
   */
  const handleOpenEditMetrics = useCallback(
    (type: 'META ADS' | 'DRIVE') => {
      setEditingMetricsType(type);
      if (type === 'META ADS') {
        const totalCantLeads = campaigns.reduce((sum, c) => sum + (c.metaAdsLeads || 0), 0);
        const totalLeadsDelta = campaigns.reduce((sum, c) => sum + (c.metaAdsLeadsDelta || 0), 0);
        setEditMetricsData({ cantLeads: totalCantLeads, deltaLeads: totalLeadsDelta });
      } else {
        const totalCantLeads = campaigns.reduce((sum, c) => sum + (c.driveLeads || 0), 0);
        const totalLeadsDelta = campaigns.reduce((sum, c) => sum + (c.driveLeadsDelta || 0), 0);
        setEditMetricsData({ cantLeads: totalCantLeads, deltaLeads: totalLeadsDelta });
      }
      setIsEditingMetrics(true);
    },
    [campaigns]
  );

  /**
   * Guarda las métricas editadas (META ADS o DRIVE)
   */
  const handleSaveMetrics = useCallback(() => {
    const perCampaign = campaigns.length > 0 ? Math.floor(editMetricsData.cantLeads / campaigns.length) : 0;
    const perCampaignDelta = campaigns.length > 0 ? Math.floor(editMetricsData.deltaLeads / campaigns.length) : 0;

    setCampaigns(prev => prev.map(c => {
      if (editingMetricsType === 'META ADS') {
        return {
          ...c,
          metaAdsLeads: perCampaign,
          metaAdsLeadsDelta: perCampaignDelta
        };
      } else {
        return {
          ...c,
          driveLeads: perCampaign,
          driveLeadsDelta: perCampaignDelta
        };
      }
    }));
    setIsEditingMetrics(false);
  }, [editMetricsData, editingMetricsType, campaigns.length]);

  /**
   * Guarda las métricas editadas de una campaña específica
   */
  const handleSaveCampaignMetrics = useCallback(() => {
    if (!selectedCampaignForEdit) return;
    setCampaigns(prev => prev.map(c => 
      c.id === selectedCampaignForEdit.id
        ? {
            ...c,
            metaAdsLeads: campaignEditData.results,
            reach: campaignEditData.reach,
            frequency: campaignEditData.frequency,
            totalSpent: campaignEditData.spent,
            impressions: campaignEditData.impressions,
            clicks: campaignEditData.clicks,
            clicsTotal: campaignEditData.clicsTotal,
            ventasCerradas: campaignEditData.ventasCerradas,
            contacto: campaignEditData.contacto
          }
        : c
    ));
    setIsEditingCampaignMetrics(false);
    setSelectedCampaignForEdit(null);
  }, [selectedCampaignForEdit, campaignEditData]);

  /**
   * Crea una nueva campaña
   */
  const handleCreateCampaign = useCallback(() => {
    if (!formData.campaignName || !formData.nomEmpresa || !formData.ctaPublicitaria || !formData.nomCtaPublicitaria) {
      alert('Por favor completa todos los campos');
      return;
    }

    const newCampaign: Campaign = {
      id: `${Date.now()}`,
      date: new Date().toLocaleDateString('es-PE'),
      time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      businessUnit: '',
      campaignName: formData.campaignName,
      nomEmpresa: formData.nomEmpresa,
      ctaPublicitaria: formData.ctaPublicitaria,
      nomCtaPublicitaria: formData.nomCtaPublicitaria,
      channel: 'Facebook',
      totalSpent: 0,
      preventas: 0,
      conversionRate: 0,
      status: 'Activa',
      metaAdsLeads: 0,
      metaAdsLeadsDelta: 0,
      metaAdsQxR: 0,
      driveLeads: 0,
      driveLeadsDelta: 0,
      driveQxR: 0
    };

    setCampaigns(prev => [newCampaign, ...prev]);
    setIsModalOpen(false);
    setFormData({ campaignName: '', nomEmpresa: '', ctaPublicitaria: '', nomCtaPublicitaria: '' });
  }, [formData]);

  /**
   * Cierra el modal de crear campaña y limpia formData
   */
  const handleCloseCreateModal = useCallback(() => {
    setIsModalOpen(false);
    setFormData({ campaignName: '', nomEmpresa: '', ctaPublicitaria: '', nomCtaPublicitaria: '' });
  }, []);

  /**
   * Abre el modal de editar métricas de campaña
   */
  const handleOpenEditCampaignMetrics = useCallback((campaign: Campaign) => {
    setSelectedCampaignForEdit(campaign);
    setCampaignEditData({
      results: campaign.metaAdsLeads || 0,
      reach: campaign.reach || 0,
      frequency: campaign.frequency || 0,
      spent: campaign.totalSpent || 0,
      impressions: campaign.impressions || 0,
      clicks: campaign.clicks || 0,
      clicsTotal: campaign.clicsTotal || 0,
      ventasCerradas: campaign.ventasCerradas || 0,
      contacto: campaign.contacto || 0
    });
    setIsEditingCampaignMetrics(true);
  }, []);

  /**
   * ========== PROBLEMA #3: INPUT HANDLERS ==========
   * 
   * Handlers optimizados con useCallback para evitar
   * crear nuevas funciones en cada render
   * 
   * Esto previene romper React.memo en componentes
   * y mejora performance de inputs con onChange
   */

  // Edit Metrics Handlers (Modal 1: META ADS/DRIVE)
  const handleEditMetricsCantLeadsChange = useCallback(
    (value: string) => {
      setEditMetricsData(prev => ({
        ...prev,
        cantLeads: parseInt(value) || 0
      }));
    },
    []
  );

  const handleEditMetricsDeltaLeadsChange = useCallback(
    (value: string) => {
      setEditMetricsData(prev => ({
        ...prev,
        deltaLeads: parseInt(value) || 0
      }));
    },
    []
  );

  // Edit Campaign Metrics Handlers (Modal 2: 10 campos)
  const handleCampaignSpentChange = useCallback(
    (value: string) => {
      setCampaignEditData(prev => ({
        ...prev,
        spent: parseInt(value) || 0
      }));
    },
    []
  );

  const handleCampaignResultsChange = useCallback(
    (value: string) => {
      setCampaignEditData(prev => ({
        ...prev,
        results: parseInt(value) || 0
      }));
    },
    []
  );

  const handleCampaignReachChange = useCallback(
    (value: string) => {
      setCampaignEditData(prev => ({
        ...prev,
        reach: parseInt(value) || 0
      }));
    },
    []
  );

  const handleCampaignImpressionsChange = useCallback(
    (value: string) => {
      setCampaignEditData(prev => ({
        ...prev,
        impressions: parseInt(value) || 0
      }));
    },
    []
  );

  const handleCampaignFrequencyChange = useCallback(
    (value: string) => {
      setCampaignEditData(prev => ({
        ...prev,
        frequency: parseFloat(value) || 0
      }));
    },
    []
  );

  const handleCampaignClicksChange = useCallback(
    (value: string) => {
      setCampaignEditData(prev => ({
        ...prev,
        clicks: parseInt(value) || 0
      }));
    },
    []
  );

  const handleCampaignClicsTotalChange = useCallback(
    (value: string) => {
      setCampaignEditData(prev => ({
        ...prev,
        clicsTotal: parseInt(value) || 0
      }));
    },
    []
  );

  const handleCampaignVentasCerradasChange = useCallback(
    (value: string) => {
      setCampaignEditData(prev => ({
        ...prev,
        ventasCerradas: parseInt(value) || 0
      }));
    },
    []
  );

  const handleCampaignContactoChange = useCallback(
    (value: string) => {
      setCampaignEditData(prev => ({
        ...prev,
        contacto: parseInt(value) || 0
      }));
    },
    []
  );

  // Modal Close Handlers
  const handleCloseEditMetricsModal = useCallback(
    () => setIsEditingMetrics(false),
    []
  );

  const handleCloseEditCampaignMetricsModal = useCallback(
    () => {
      setIsEditingCampaignMetrics(false);
      setSelectedCampaignForEdit(null);
    },
    []
  );

  // Modal Toggle Handlers
  const handleToggleModalOpen = useCallback(
    () => setIsModalOpen(true),
    []
  );

  const handleToggleModalClose = useCallback(
    () => setIsModalOpen(false),
    []
  );

  // Expand/Collapse Campaign Handler
  const handleToggleExpandCampaign = useCallback(
    (campaignId: string) => {
      setExpandedCampaignId(prev => prev === campaignId ? null : campaignId);
    },
    []
  );

  // Edit Metrics Toggle Handlers
  const handleToggleEditMetricsOpen = useCallback(
    (type: 'META ADS' | 'DRIVE') => {
      handleOpenEditMetrics(type);
    },
    [handleOpenEditMetrics]
  );

  const handleToggleEditCampaignMetricsOpen = useCallback(
    (campaign: Campaign) => {
      handleOpenEditCampaignMetrics(campaign);
    },
    [handleOpenEditCampaignMetrics]
  );

  // ==================== RETURN INTERFACE ====================

  return {
    // Section Navigation
    activeSection,
    setActiveSection,

    // Data
    companies,
    setCompanies,
    advertiserAccounts,
    setAdvertiserAccounts,
    campaigns,
    setCampaigns,
    leads,

    // Modal: Create Campaign
    isModalOpen,
    setIsModalOpen,
    formData,
    setFormData,

    // Modal: Edit Metrics
    isEditingMetrics,
    setIsEditingMetrics,
    editingMetricsType,
    setEditingMetricsType,
    editMetricsData,
    setEditMetricsData,

    // Modal: Edit Campaign Metrics
    isEditingCampaignMetrics,
    setIsEditingCampaignMetrics,
    selectedCampaignForEdit,
    setSelectedCampaignForEdit,
    campaignEditData,
    setCampaignEditData,

    // Table: Expanded Campaign
    expandedCampaignId,
    setExpandedCampaignId,

    // Computed Values
    metaAdsMetrics,
    driveMetrics,
    campaignLeadsBreakdown,
    campaignMetrics,  // Problema #4: CPM, CPC, CTR, ROAS, Cost per Result

    // Event Handlers
    handleFormChange,
    handleOpenEditMetrics,
    handleSaveMetrics,
    handleSaveCampaignMetrics,
    handleCreateCampaign,
    handleCloseCreateModal,
    handleOpenEditCampaignMetrics,
    
    // Problema #3: Input Handlers (useCallback optimized)
    handleEditMetricsCantLeadsChange,
    handleEditMetricsDeltaLeadsChange,
    handleCampaignSpentChange,
    handleCampaignResultsChange,
    handleCampaignReachChange,
    handleCampaignImpressionsChange,
    handleCampaignFrequencyChange,
    handleCampaignClicksChange,
    handleCampaignClicsTotalChange,
    handleCampaignVentasCerradasChange,
    handleCampaignContactoChange,
    handleCloseEditMetricsModal,
    handleCloseEditCampaignMetricsModal,
    handleToggleModalOpen,
    handleToggleModalClose,
    handleToggleExpandCampaign,
    handleToggleEditMetricsOpen,
    handleToggleEditCampaignMetricsOpen,
    
    // Storage Management
    clearAllData: storageUtils.clearAll,
    resetToMockData: () => {
      setCompanies(mockCompanies);
      setAdvertiserAccounts(mockAdvertiserAccounts);
      setCampaigns(mockCampaigns);
    },
  };
};

/**
 * Type para el retorno del hook (útil para TypeScript)
 */
export type CommunityDashboardState = ReturnType<typeof useCommunityDashboard>;
