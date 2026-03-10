import React, { useState, useMemo } from 'react';
import { BiPlus } from 'react-icons/bi';
import { MetricsPanel, Modal } from '@molecules/index';
import { HeaderActions } from '@molecules/HeaderActions';
import { DataTable } from '@molecules/DataTable';
import type { DataTableColumn } from '@molecules/DataTable';
import './CommunityDashboard.css';

interface Campaign {
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
  // META ADS metrics (read-only)
  metaAdsLeads?: number;
  metaAdsLeadsDelta?: number;
  metaAdsQxR?: number;
  // DRIVE metrics (read-only)
  driveLeads?: number;
  driveLeadsDelta?: number;
  driveQxR?: number;
  // Additional metrics
  clicsTotal?: number;
  ventasCerradas?: number;
  contacto?: number;
}

interface Lead {
  id: string;
  name: string;
  status: 'no-contesta' | 'solo-info' | 'interesado' | 'derivado' | 'convertido';
  canal: string;
  fecha: string;
}

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

export const CommunityDashboard = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [leads] = useState<Lead[]>(mockLeads);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingMetrics, setIsEditingMetrics] = useState(false);
  const [editingMetricsType, setEditingMetricsType] = useState<'META ADS' | 'DRIVE'>('META ADS');
  const [editMetricsData, setEditMetricsData] = useState({ cantLeads: 0, deltaLeads: 0 });
  const [isEditingCampaignMetrics, setIsEditingCampaignMetrics] = useState(false);
  const [selectedCampaignForEdit, setSelectedCampaignForEdit] = useState<Campaign | null>(null);
  const [campaignEditData, setCampaignEditData] = useState({ results: 0, reach: 0, frequency: 0, spent: 0, impressions: 0, clicks: 0, clicsTotal: 0, ventasCerradas: 0, contacto: 0 });
  const [formData, setFormData] = useState({
    campaignName: '',
    nomEmpresa: '',
    ctaPublicitaria: '',
    nomCtaPublicitaria: ''
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOpenEditMetrics = (type: 'META ADS' | 'DRIVE') => {
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
  };

  const handleSaveMetrics = () => {
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
  };

  const handleSaveCampaignMetrics = () => {
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
  };

  const handleCreateCampaign = () => {
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
  };

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

  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);

  const campaignTableColumns: DataTableColumn<Campaign>[] = [
    { header: 'CAMPAÑA', accessor: (c) => <span className="table-cell emphasis">{c.campaignName}</span> },
    { header: 'RESULTADOS', accessor: (c) => c.metaAdsLeads ?? 0, headerClassName: 'table-header-cell center', cellClassName: 'table-cell center' },
    { header: 'ALCANCE', accessor: (c) => (c.reach ?? 0).toLocaleString(), headerClassName: 'table-header-cell center', cellClassName: 'table-cell center' },
    { header: 'FRECUENCIA', accessor: (c) => (c.frequency ?? 0).toFixed(2), headerClassName: 'table-header-cell center', cellClassName: 'table-cell center' },
    { header: 'COSTO/RESULTADO', accessor: (c) => `S/ ${((c.metaAdsLeads || 0) > 0 ? ((c.totalSpent || 0) / (c.metaAdsLeads||0)).toFixed(2) : '0.00')}`, headerClassName: 'table-header-cell center', cellClassName: 'table-cell center' },
    { header: 'IM.GASTADO', accessor: (c) => `S/ ${(c.totalSpent||0).toLocaleString()}`, headerClassName: 'table-header-cell center', cellClassName: 'table-cell center' },
    { header: 'IMPRESIONES', accessor: (c) => (c.impressions ?? 0).toLocaleString(), headerClassName: 'table-header-cell center', cellClassName: 'table-cell center' },
    { header: 'CPM', accessor: (c) => `S/ ${((c.impressions||0)>0?((c.totalSpent||0)/(c.impressions||0)*1000).toFixed(2):'0.00')}`, headerClassName: 'table-header-cell center', cellClassName: 'table-cell center' },
    { header: 'CLICS ENLACE', accessor: (c) => (c.clicks ?? 0).toLocaleString(), headerClassName: 'table-header-cell center', cellClassName: 'table-cell center' },
    { header: 'CPC', accessor: (c) => `S/ ${((c.clicks||0)>0?((c.totalSpent||0)/(c.clicks||0)).toFixed(2):'0.00')}`, headerClassName: 'table-header-cell center', cellClassName: 'table-cell center' },
    { header: 'CTR', accessor: (c) => `${((c.impressions||0)>0?(((c.clicks||0)/(c.impressions||0))*100).toFixed(2):'0.00')}%`, headerClassName: 'table-header-cell center', cellClassName: 'table-cell center' },
    { header: 'CLICS [TODOS]', accessor: (c) => (c.clicsTotal ?? 0).toLocaleString(), headerClassName: 'table-header-cell center', cellClassName: 'table-cell center' },
    { header: 'VENTAS C.', accessor: (c) => c.ventasCerradas ?? 0, headerClassName: 'table-header-cell center highlight-header', cellClassName: 'table-cell center highlight' },
    { header: 'CONTACTO', accessor: (c) => c.contacto ?? 0, headerClassName: 'table-header-cell center highlight-header', cellClassName: 'table-cell center highlight' },
  ];

  const campaignLeadsBreakdown = useMemo(() => {
    return campaigns.map(campaign => {
      const campaignLeads = leads.filter(l => l.canal.toLowerCase().includes(campaign.channel.toLowerCase()) || l.fecha.includes(campaign.date));
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

  return (
    <div className="community-dashboard">
      {/* Header */}
      <div className="community-dashboard-header">
        <div className="community-header-title">
          <h1>Gestión de Community Manager</h1>
          <p>Meta Ads + Seguimiento de Leads</p>
        </div>
        <HeaderActions>
          <button className="btn-new-campaign" onClick={() => setIsModalOpen(true)}>
            <BiPlus size={18} />
            Nueva Campaña
          </button>
        </HeaderActions>
      </div>

      {/* Main Content - Two Columns */}
      <div className="community-dashboard-content">
        {/* Left Panel - Panels de Gestión */}
        <div className="community-left-panel">
          <div className="clickable" onClick={() => handleOpenEditMetrics('META ADS')}>
            <MetricsPanel 
              title="META ADS" 
              metrics={metaAdsMetrics}
              color="#3B82F6"
            />
          </div>
          <div className="clickable" onClick={() => handleOpenEditMetrics('DRIVE')}>
            <MetricsPanel 
              title="DRIVE" 
              metrics={driveMetrics}
              color="#F59E0B"
            />
          </div>
        </div>

        {/* Right Panel - Leads por Campaña */}
        <div className="community-right-panel">
          <div className="card">
            <h3 className="card-heading">GESTIÓN DE LEADS</h3>
            <div className="table-wrapper">
              <table className="table-custom">
                <thead>
                  <tr className="table-header-row">
                    <th className="table-header-cell">CAMPAÑA</th>
                    <th className="table-header-cell center">LEADS</th>
                    <th className="table-header-cell center">CONV.</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignLeadsBreakdown.map(({ campaign, totalLeads, convertedLeads, leadsByDate }) => (
                    <React.Fragment key={campaign.id}>
                      <tr 
                        onClick={() => setExpandedCampaignId(expandedCampaignId === campaign.id ? null : campaign.id)}
                        className={`table-row ${expandedCampaignId === campaign.id ? 'expanded' : ''}`}
                      >
                        <td className="table-cell emphasis">{campaign.campaignName}</td>
                        <td className="table-cell center">{totalLeads}</td>
                        <td className="table-cell center converted">{convertedLeads}</td>
                      </tr>
                      {expandedCampaignId === campaign.id && Object.entries(leadsByDate).map(([date, dateLeads]) => (
                        <tr key={`${campaign.id}-${date}`} className="table-row subrow">
                          <td colSpan={3} className="table-cell">
                            <div className="subrow-info">
                              <strong>{date}</strong>: {dateLeads.length} leads {dateLeads.filter(l => l.status === 'convertido').length > 0 && `(${dateLeads.filter(l => l.status === 'convertido').length} convertidos)`}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Campañas */}
      <div className="campaigns-container">
        <h2 className="campaigns-title">CAMPAÑAS META ADS</h2>
        <DataTable
          columns={campaignTableColumns}
          data={campaigns}
          rowClassName="clickable-row"
        />
      </div>

      {/* Modal para editar metricas de campaña */}
      <Modal
        isOpen={isEditingMetrics}
        title={`Editar ${editingMetricsType}`}
        onClose={() => setIsEditingMetrics(false)}
      >
        <div className="campaign-form">
          <div className="form-section">
            <label>CANT LEADS</label>
            <input 
              type="number" 
              value={editMetricsData.cantLeads}
              onChange={(e) => setEditMetricsData(prev => ({ ...prev, cantLeads: parseInt(e.target.value) || 0 }))}
              className="form-input"
            />

            <label>Δ LEADS</label>
            <input 
              type="number" 
              value={editMetricsData.deltaLeads}
              onChange={(e) => setEditMetricsData(prev => ({ ...prev, deltaLeads: parseInt(e.target.value) || 0 }))}
              className="form-input"
            />
          </div>

          <div className="form-actions">
            <button 
              className="btn-cancel"
              onClick={() => setIsEditingMetrics(false)}
            >
              Cancelar
            </button>
            <button 
              className="btn-confirm"
              onClick={handleSaveMetrics}
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal para editar métricas de campaña */}
      <Modal
        isOpen={isEditingCampaignMetrics}
        title={`Editar ${selectedCampaignForEdit?.campaignName || 'Campaña'}`}
        onClose={() => setIsEditingCampaignMetrics(false)}
        className="large"
      >
        <div className="campaign-form">
          <div className="form-section">
            {/* Columna Izquierda */}
            <div className="form-group">
              <label>IMPORTE GASTADO</label>
              <input 
                type="number" 
                value={campaignEditData.spent}
                onChange={(e) => setCampaignEditData(prev => ({ ...prev, spent: parseInt(e.target.value) || 0 }))}
                className="form-input"
              />

              <label>RESULTADOS</label>
              <input 
                type="number" 
                value={campaignEditData.results}
                onChange={(e) => setCampaignEditData(prev => ({ ...prev, results: parseInt(e.target.value) || 0 }))}
                className="form-input"
              />

              <label>ALCANCE</label>
              <input 
                type="number" 
                value={campaignEditData.reach}
                onChange={(e) => setCampaignEditData(prev => ({ ...prev, reach: parseInt(e.target.value) || 0 }))}
                className="form-input"
              />

              <label>IMPRESIONES</label>
              <input 
                type="number" 
                value={campaignEditData.impressions}
                onChange={(e) => setCampaignEditData(prev => ({ ...prev, impressions: parseInt(e.target.value) || 0 }))}
                className="form-input"
              />
            </div>

            {/* Columna Derecha */}
            <div className="form-group">
              <label>FRECUENCIA</label>
              <input 
                type="number" 
                step="0.01"
                value={campaignEditData.frequency}
                onChange={(e) => setCampaignEditData(prev => ({ ...prev, frequency: parseFloat(e.target.value) || 0 }))}
                className="form-input"
              />

              <label>CLICS</label>
              <input 
                type="number" 
                value={campaignEditData.clicks}
                onChange={(e) => setCampaignEditData(prev => ({ ...prev, clicks: parseInt(e.target.value) || 0 }))}
                className="form-input"
              />

              <label>CLICS [TODOS]</label>
              <input 
                type="number" 
                value={campaignEditData.clicsTotal}
                onChange={(e) => setCampaignEditData(prev => ({ ...prev, clicsTotal: parseInt(e.target.value) || 0 }))}
                className="form-input"
              />

              <label>VENTAS C.</label>
              <input 
                type="number" 
                value={campaignEditData.ventasCerradas}
                onChange={(e) => setCampaignEditData(prev => ({ ...prev, ventasCerradas: parseInt(e.target.value) || 0 }))}
                className="form-input-green"
              />

              <label>CONTACTO</label>
              <input 
                type="number" 
                value={campaignEditData.contacto}
                onChange={(e) => setCampaignEditData(prev => ({ ...prev, contacto: parseInt(e.target.value) || 0 }))}
                className="form-input-green"
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              className="btn-cancel"
              onClick={() => setIsEditingCampaignMetrics(false)}
            >
              Cancelar
            </button>
            <button 
              className="btn-confirm"
              onClick={handleSaveCampaignMetrics}
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal para crear campaña */}
      <Modal
        isOpen={isModalOpen}
        title="Nueva Campaña"
        onClose={() => {
          setIsModalOpen(false);
          setFormData({ campaignName: '', nomEmpresa: '', ctaPublicitaria: '', nomCtaPublicitaria: '' });
        }}
        className="medium"
      >
        <div className="campaign-form">
          <div className="form-section">
            <div className="form-group">
              <label>CAMPAÑA</label>
              <input 
                type="text" 
                name="campaignName" 
                value={formData.campaignName}
                onChange={handleFormChange}
                placeholder="Nombre de la campaña"
                className="form-input"
              />

              <label>CEL. EMPRESA</label>
              <input 
                type="text" 
                name="nomEmpresa" 
                value={formData.nomEmpresa}
                onChange={handleFormChange}
                placeholder="Célula empresa"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>CTA. PUBLICITARIA</label>
              <input 
                type="text" 
                name="ctaPublicitaria" 
                value={formData.ctaPublicitaria}
                onChange={handleFormChange}
                placeholder="Cuenta publicitaria"
                className="form-input"
              />

              <label>NOM. CTA. PUBLICITARIA</label>
              <input 
                type="text" 
                name="nomCtaPublicitaria" 
                value={formData.nomCtaPublicitaria}
                onChange={handleFormChange}
                placeholder="Nombre cuenta publicitaria"
                className="form-input"
              />
            </div>
          </div>

          {/* BOTONES */}
          <div className="form-actions">
            <button 
              className="btn-cancel"
              onClick={() => {
                setIsModalOpen(false);
                setFormData({ campaignName: '', nomEmpresa: '', ctaPublicitaria: '', nomCtaPublicitaria: '' });
              }}
            >
              Cancelar
            </button>
            <button 
              className="btn-confirm"
              onClick={handleCreateCampaign}
            >
              Crear Campaña
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
