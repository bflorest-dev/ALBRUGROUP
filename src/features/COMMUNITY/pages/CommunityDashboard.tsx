import { useState, useMemo } from 'react';
import { BiPlus } from 'react-icons/bi';
import { FaFacebook, FaInstagram } from 'react-icons/fa';
import { StatCard } from '@molecules/StatCard';
import './CommunityDashboard.css';

interface Campaign {
  id: string;
  date: string;
  time: string;
  businessUnit: string;
  campaignName: string;
  channel: 'Facebook' | 'Instagram' | 'Teléfono Hogar' | 'Internet Empresas' | 'Móviles';
  totalSpent: number;
  preventas: number;
  conversionRate: number;
  status: 'Activa' | 'Pausada';
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
    status: 'Activa'
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
    status: 'Activa'
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
    status: 'Activa'
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
    status: 'Pausada'
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
    status: 'Activa'
  }
];

const CHANNEL_COLORS: Record<string, string> = {
  'Facebook': '#3B82F6',
  'Instagram': '#EC4899',
  'Teléfono Hogar': '#8B5CF6',
  'Internet Empresas': '#06B6D4',
  'Móviles': '#F59E0B'
};

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  'Facebook': <FaFacebook />,
  'Instagram': <FaInstagram />,
  'Teléfono Hogar': null,
  'Internet Empresas': null,
  'Móviles': null
};

export const CommunityDashboard = () => {
  const [campaigns] = useState<Campaign[]>(mockCampaigns);
  const [selectedFilter, setSelectedFilter] = useState<string>('Todos');

  const filters = ['Todos', 'Facebook', 'Instagram', 'Teléfono Hogar', 'Internet Empresas', 'Móviles'];

  const filteredCampaigns = useMemo(() => {
    if (selectedFilter === 'Todos') return campaigns;
    return campaigns.filter(c => c.channel === selectedFilter);
  }, [campaigns, selectedFilter]);

  const statistics = useMemo(() => {
    const activeCampaigns = campaigns.filter(c => c.status === 'Activa').length;
    const totalSpent = campaigns.reduce((sum, c) => sum + c.totalSpent, 0);
    const totalPreventas = campaigns.reduce((sum, c) => sum + c.preventas, 0);
    const avgConversion = (campaigns.reduce((sum, c) => sum + c.conversionRate, 0) / campaigns.length).toFixed(1);
    const costPerPreventa = (totalSpent / totalPreventas).toFixed(0);

    return [
      {
        label: 'Campañas Activas',
        value: activeCampaigns,
        percentage: parseInt(((activeCampaigns / campaigns.length) * 100).toFixed(0))
      },
      {
        label: 'Gasto Total',
        value: totalSpent,
        percentage: 100
      },
      {
        label: 'Total Preventas',
        value: totalPreventas,
        percentage: 100
      },
      {
        label: '% Conv. Promedio',
        value: parseFloat(avgConversion),
        percentage: 100
      },
      {
        label: 'Costo/Preventa',
        value: parseInt(costPerPreventa),
        percentage: 100
      }
    ];
  }, [campaigns]);

  const channelBreakdown = useMemo(() => {
    const breakdown: Record<string, { spent: number; preventas: number; conversion: number; count: number }> = {};
    
    campaigns.forEach(campaign => {
      if (!breakdown[campaign.channel]) {
        breakdown[campaign.channel] = { spent: 0, preventas: 0, conversion: 0, count: 0 };
      }
      breakdown[campaign.channel].spent += campaign.totalSpent;
      breakdown[campaign.channel].preventas += campaign.preventas;
      breakdown[campaign.channel].conversion += campaign.conversionRate;
      breakdown[campaign.channel].count += 1;
    });

    // Calcular conversión promedio
    Object.keys(breakdown).forEach(channel => {
      breakdown[channel].conversion = breakdown[channel].conversion / breakdown[channel].count;
    });

    return breakdown;
  }, [campaigns]);

  return (
    <div className="community-dashboard">
      {/* Estadísticas */}
      <div className="statistics-grid">
        {statistics.map((stat, index) => (
          <StatCard key={index} stat={stat} />
        ))}
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="filters-left">
          <span className="filter-label">Filtrar:</span>
          {filters.map(filter => (
            <button
              key={filter}
              className={`filter-btn ${selectedFilter === filter ? 'active' : ''}`}
              onClick={() => setSelectedFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
        <button className="btn-new-campaign">
          <BiPlus size={18} />
          Nueva Campaña
        </button>
      </div>

      {/* Tabla de Campañas */}
      <div className="campaigns-section">
        <h2>Tabla de Campañas META ({campaigns.length})</h2>
        <div className="table-container">
          <table className="campaigns-table">
            <thead>
              <tr>
                <th>FECHA</th>
                <th>HORA</th>
                <th>U. NEGOCIO</th>
                <th>CAMPAÑA</th>
                <th>CANAL</th>
                <th>GASTO TOTAL</th>
                <th>CANT. PREVENTAS</th>
                <th>% CONVERSIÓN</th>
                <th>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td>{campaign.date}</td>
                  <td>{campaign.time}</td>
                  <td>{campaign.businessUnit}</td>
                  <td>{campaign.campaignName}</td>
                  <td>
                    <span 
                      className="channel-badge"
                      style={{ backgroundColor: CHANNEL_COLORS[campaign.channel] + '20', color: CHANNEL_COLORS[campaign.channel] }}
                    >
                      {CHANNEL_ICONS[campaign.channel] && (
                        <span className="channel-icon">
                          {CHANNEL_ICONS[campaign.channel]}
                        </span>
                      )}
                      {campaign.channel}
                    </span>
                  </td>
                  <td>S/ {campaign.totalSpent.toLocaleString()}</td>
                  <td className="preventas-cell">{campaign.preventas}</td>
                  <td>
                    <span className={`conversion-badge ${campaign.conversionRate > 10 ? 'up' : 'down'}`}>
                      {campaign.conversionRate}%
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${campaign.status.toLowerCase()}`}>
                      {campaign.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="totals-row">
          <div className="totals-cell">TOTALES</div>
          <div className="totals-cell"></div>
          <div className="totals-cell"></div>
          <div className="totals-cell"></div>
          <div className="totals-cell"></div>
          <div className="totals-cell">S/ {campaigns.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}</div>
          <div className="totals-cell">{campaigns.reduce((sum, c) => sum + c.preventas, 0)}</div>
          <div className="totals-cell">{(campaigns.reduce((sum, c) => sum + c.conversionRate, 0) / campaigns.length).toFixed(1)}%</div>
          <div className="totals-cell"></div>
        </div>
      </div>

      {/* Breakdown por Canales */}
      <div className="channels-breakdown">
        {Object.entries(channelBreakdown).map(([channel, data]) => (
          <div key={channel} className="channel-card" style={{ borderLeftColor: CHANNEL_COLORS[channel] }}>
            <h3 style={{ color: CHANNEL_COLORS[channel] }}>{channel}</h3>
            <p className="channel-subtitle">{data.count} campaña{data.count > 1 ? 's' : ''} ({data.count} activa{data.count > 1 ? 's' : ''})</p>
            <div className="channel-stats">
              <div className="channel-stat">
                <span className="stat-label">Gasto</span>
                <span className="stat-value">S/ {data.spent.toLocaleString()}</span>
              </div>
              <div className="channel-stat">
                <span className="stat-label">Preventas</span>
                <span className="stat-value">{data.preventas}</span>
              </div>
              <div className="channel-stat">
                <span className="stat-label">Conv.</span>
                <span className="stat-value" style={{ color: '#10B981' }}>{data.conversion.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
