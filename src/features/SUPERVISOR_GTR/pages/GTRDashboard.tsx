import { useState, useMemo } from 'react';
import { BiSearch } from 'react-icons/bi';
import { StatCard } from '@molecules/StatCard';
import './GTRDashboard.css';

interface Advisor {
  initials: string;
  firstName: string;
  lastName: string;
  status: 'Disponible' | 'Ocupado' | 'Saturado';
  assigned: number;
  managed: number;
  totalCapacity: number;
}

interface Lead {
  id: string;
  campaign: string;
  businessUnit: string;
  channel: 'Facebook' | 'Instagram' | 'WhatsApp';
  registrationDate: string;
  registrationTime: string;
  firstName: string;
  lastName: string;
  phone: string;
  tipification: string;
  advisor: string;
  advisorArea: string;
  followUp: string;
  reasigned: number;
  alias: string;
}

const mockAdvisors: Advisor[] = [
  {
    initials: 'MA',
    firstName: 'María',
    lastName: 'Antúnez',
    status: 'Disponible',
    assigned: 8,
    managed: 3,
    totalCapacity: 15
  },
  {
    initials: 'JU',
    firstName: 'Juan',
    lastName: 'Urrutia',
    status: 'Ocupado',
    assigned: 12,
    managed: 1,
    totalCapacity: 15
  },
  {
    initials: 'AN',
    firstName: 'Ana',
    lastName: 'Navarro',
    status: 'Disponible',
    assigned: 5,
    managed: 1,
    totalCapacity: 15
  },
  {
    initials: 'CA',
    firstName: 'Carlos',
    lastName: 'Rodríguez',
    status: 'Saturado',
    assigned: 15,
    managed: 1,
    totalCapacity: 15
  }
];

const mockLeads: Lead[] = [
  {
    id: '1',
    campaign: 'Promo Fibra Marzo',
    businessUnit: 'Telefonía Hogar',
    channel: 'Facebook',
    registrationDate: '04/03/26',
    registrationTime: '08:10 a.m.',
    firstName: 'Roberto',
    lastName: 'Sánchez',
    phone: '+51 987 123 456',
    tipification: 'Sin tipificar',
    advisor: 'María',
    advisorArea: 'Norte',
    followUp: 'Nuevo',
    reasigned: 0,
    alias: ''
  },
  {
    id: '2',
    campaign: 'Fibra Empresarial Q1',
    businessUnit: 'Internet Empresas',
    channel: 'Instagram',
    registrationDate: '04/03/26',
    registrationTime: '09:15 a.m.',
    firstName: 'Laura',
    lastName: 'Jiménez',
    phone: '+51 912 345 678',
    tipification: 'Sin tipificar',
    advisor: 'Juan',
    advisorArea: 'Sur',
    followUp: 'Nuevo',
    reasigned: 0,
    alias: ''
  },
  {
    id: '3',
    campaign: 'Promo Fibra Marzo',
    businessUnit: 'Telefonía Hogar',
    channel: 'Facebook',
    registrationDate: '03/03/26',
    registrationTime: '04:30 p.m.',
    firstName: 'Pedro',
    lastName: 'López',
    phone: '+51 945 678 901',
    tipification: '1 - SEGUIMIENTO',
    advisor: 'María',
    advisorArea: 'Norte',
    followUp: 'En gestión',
    reasigned: 0,
    alias: 'MARI.G'
  },
  {
    id: '4',
    campaign: 'Combo TV + Internet',
    businessUnit: 'Telefonía Hogar',
    channel: 'WhatsApp',
    registrationDate: '03/03/26',
    registrationTime: '02:20 p.m.',
    firstName: 'Sofía',
    lastName: 'Ramírez',
    phone: '+51 978 234 567',
    tipification: '2 - AGENDADOS',
    advisor: 'Juan',
    advisorArea: 'Sur',
    followUp: 'En gestión',
    reasigned: 1,
    alias: 'JUAN.P'
  },
  {
    id: '5',
    campaign: 'Promo Fibra Marzo',
    businessUnit: 'Telefonía Hogar',
    channel: 'Facebook',
    registrationDate: '02/03/26',
    registrationTime: '11:00 a.m.',
    firstName: 'Miguel',
    lastName: 'Torres',
    phone: '+51 934 567 890',
    tipification: '7 - PREVENTA COMPLETA',
    advisor: 'Ana',
    advisorArea: 'Centro',
    followUp: 'Gestionado',
    reasigned: 0,
    alias: 'ANA.M'
  },
  {
    id: '6',
    campaign: 'Fibra Empresarial Q1',
    businessUnit: 'Internet Empresas',
    channel: 'Instagram',
    registrationDate: '04/03/26',
    registrationTime: '10:00 a.m.',
    firstName: 'Carmen',
    lastName: 'Vega',
    phone: '+51 956 789 012',
    tipification: 'Sin tipificar',
    advisor: 'Carlos',
    advisorArea: 'Este',
    followUp: 'Nuevo',
    reasigned: 0,
    alias: ''
  },
  {
    id: '7',
    campaign: 'Combo TV + Internet',
    businessUnit: 'Telefonía Hogar',
    channel: 'Facebook',
    registrationDate: '03/03/26',
    registrationTime: '09:45 a.m.',
    firstName: 'Diego',
    lastName: 'Morales',
    phone: '+51 967 890 123',
    tipification: '0 - SIN CONTACTO',
    advisor: 'Carlos',
    advisorArea: 'Este',
    followUp: 'Asignado',
    reasigned: 2,
    alias: 'CARL.R'
  },
  {
    id: '8',
    campaign: 'Plan Familia Marzo',
    businessUnit: 'Móviles',
    channel: 'Instagram',
    registrationDate: '03/03/26',
    registrationTime: '01:30 p.m.',
    firstName: 'Valeria',
    lastName: 'Herrera',
    phone: '+51 923 456 789',
    tipification: '6 - PDTE SCORE/PREVENTA',
    advisor: 'María',
    advisorArea: 'Norte',
    followUp: 'En gestión',
    reasigned: 0,
    alias: 'MARI.G'
  },
  {
    id: '9',
    campaign: 'Retargeting Fibra',
    businessUnit: 'Telefonía Hogar',
    channel: 'Facebook',
    registrationDate: '04/03/26',
    registrationTime: '08:45 a.m.',
    firstName: 'Andrés',
    lastName: 'Castillo',
    phone: '+51 998 765 432',
    tipification: 'Sin tipificar',
    advisor: 'Juan',
    advisorArea: 'Sur',
    followUp: 'Nuevo',
    reasigned: 0,
    alias: ''
  },
  {
    id: '10',
    campaign: 'Promo Fibra Marzo',
    businessUnit: 'Telefonía Hogar',
    channel: 'Facebook',
    registrationDate: '02/03/26',
    registrationTime: '03:10 p.m.',
    firstName: 'Lucía',
    lastName: 'Flores',
    phone: '+51 911 234 567',
    tipification: '3 - RECHAZADO',
    advisor: 'Carlos',
    advisorArea: 'Este',
    followUp: 'Gestionado',
    reasigned: 0,
    alias: 'MARI.G'
  }
];

const CHANNEL_COLORS: Record<string, string> = {
  'Facebook': '#3B82F6',
  'Instagram': '#EC4899',
  'WhatsApp': '#10B981'
};

export const GTRDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('Todos');
  const [selectedAdvisor, setSelectedAdvisor] = useState('Todos');
  const [selectedCampaign, setSelectedCampaign] = useState('Todas las campañas');

  const channels = ['Todos', 'Facebook', 'Instagram', 'WhatsApp'];
  const advisors = ['Todos', 'María', 'Juan', 'Ana', 'Carlos'];
  const campaigns = ['Todas las campañas', 'Promo Fibra Marzo', 'Fibra Empresarial Q1', 'Combo TV + Internet', 'Plan Familia Marzo', 'Retargeting Fibra'];

  const statistics = useMemo(() => [
    { label: 'Total Leads', value: 10, unit: '', color: '#6B7280' },
    { label: 'Nuevos', value: 4, unit: '', color: '#3B82F6' },
    { label: 'Asignados', value: 1, unit: '', color: '#8B5CF6' },
    { label: 'En Gestión', value: 3, unit: '', color: '#F59E0B' },
    { label: 'Gestionados', value: 2, unit: '', color: '#10B981' }
  ], []);

  const filteredLeads = useMemo(() => {
    return mockLeads.filter(lead => {
      const matchesChannel = selectedChannel === 'Todos' || lead.channel === selectedChannel;
      const matchesAdvisor = selectedAdvisor === 'Todos' || lead.advisor === selectedAdvisor;
      const matchesCampaign = selectedCampaign === 'Todas las campañas' || lead.campaign === selectedCampaign;
      const matchesSearch = lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           lead.phone.includes(searchTerm);
      return matchesChannel && matchesAdvisor && matchesCampaign && matchesSearch;
    });
  }, [searchTerm, selectedChannel, selectedAdvisor, selectedCampaign]);

  const getStatusBadgeStyle = (status: string) => {
    const styles: Record<string, string> = {
      'Disponible': '#D1FAE5',
      'Ocupado': '#FEF3C7',
      'Saturado': '#FEE2E2'
    };
    return styles[status] || '#F3F4F6';
  };

  const getTipificationColor = (tipification: string): string => {
    if (tipification.startsWith('Sin tipificar')) return '#FFA500';
    if (tipification.includes('SEGUIMIENTO')) return '#3B82F6';
    if (tipification.includes('AGENDADOS')) return '#F59E0B';
    if (tipification.includes('PREVENTA')) return '#10B981';
    if (tipification.includes('RECHAZADO')) return '#EF4444';
    if (tipification.includes('PDTE SCORE')) return '#EC4899';
    if (tipification.includes('SIN CONTACTO')) return '#6B7280';
    return '#9CA3AF';
  };

  return (
    <div className="gtr-dashboard">
      {/* Statistics */}
      <div className="statistics-grid">
        {statistics.map((stat, index) => (
          <StatCard key={index} stat={stat} />
        ))}
      </div>

      {/* Carga de Trabajo por Asesor */}
      <div className="advisors-section">
        <div className="section-header">
          <span className="section-icon">👥</span>
          <h2>Carga de Trabajo por Asesor</h2>
        </div>
        <div className="advisors-grid">
          {mockAdvisors.map((advisor) => (
            <div key={advisor.initials} className="advisor-card">
              <div className="advisor-header">
                <div className="advisor-avatar">{advisor.initials}</div>
                <div className="advisor-info">
                  <h3>{advisor.firstName}</h3>
                  <p>{advisor.lastName}</p>
                </div>
                <div
                  className="advisor-status-badge"
                  style={{ backgroundColor: getStatusBadgeStyle(advisor.status) }}
                >
                  {advisor.status}
                </div>
              </div>
              <div className="advisor-stats">
                <div className="stat-row">
                  <span className="stat-label">{advisor.assigned} asignados</span>
                  <span className="stat-label">{advisor.managed} gestionados</span>
                </div>
              </div>
              <div className="progress-container">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(advisor.assigned / advisor.totalCapacity) * 100}%`,
                      backgroundColor: advisor.status === 'Disponible' ? '#10B981' : 
                                       advisor.status === 'Ocupado' ? '#F59E0B' : '#EF4444'
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leads Table */}
      <div className="leads-section">
        <div className="leads-header">
          <h2>Tabla de Leads ({filteredLeads.length})</h2>
          <div className="leads-controls">
            <div className="search-box">
              <BiSearch size={18} />
              <input
                type="text"
                placeholder="Buscar nombre o teléfono"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-selects">
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
              >
                {channels.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={selectedAdvisor}
                onChange={(e) => setSelectedAdvisor(e.target.value)}
              >
                {advisors.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
              >
                {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="table-container">
          <table className="leads-table">
            <thead>
              <tr>
                <th>CAMPAÑA</th>
                <th>CANAL</th>
                <th>FECHA REGISTRO</th>
                <th>LEAD</th>
                <th>TIPIFICACIÓN</th>
                <th>ASESOR</th>
                <th>SEGUIMIENTO</th>
                <th>REASIG.</th>
                <th>ALIAS</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <div className="campaign-cell">
                      <strong>{lead.campaign}</strong>
                      <small>{lead.businessUnit}</small>
                    </div>
                  </td>
                  <td>
                    <span
                      className="channel-badge"
                      style={{ backgroundColor: CHANNEL_COLORS[lead.channel] + '20', color: CHANNEL_COLORS[lead.channel] }}
                    >
                      {lead.channel}
                    </span>
                  </td>
                  <td>
                    <div className="date-cell">
                      <span>{lead.registrationDate}</span>
                      <small>{lead.registrationTime}</small>
                    </div>
                  </td>
                  <td>
                    <div className="lead-cell">
                      <strong>{lead.firstName}</strong>
                      <strong>{lead.lastName}</strong>
                      <small>{lead.phone}</small>
                    </div>
                  </td>
                  <td>
                    <span
                      className="tipification-badge"
                      style={{ color: getTipificationColor(lead.tipification) }}
                    >
                      {lead.tipification}
                    </span>
                  </td>
                  <td>
                    <div className="advisor-cell">
                      <strong>{lead.advisor}</strong>
                      <small>{lead.advisorArea}</small>
                    </div>
                  </td>
                  <td>
                    <span className="followup-badge">{lead.followUp}</span>
                  </td>
                  <td className="reasigned-cell">{lead.reasigned}</td>
                  <td>{lead.alias}</td>
                  <td className="actions-cell">
                    <button className="action-btn view-btn">Ver</button>
                    <button className="action-btn assign-btn">Asignar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
