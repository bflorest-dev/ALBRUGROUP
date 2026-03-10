import { useState, useMemo } from 'react';
import { BiPhone, BiLogoWhatsapp } from 'react-icons/bi';
import { StatCard } from '@molecules/StatCard';
import './SalesAdvisorDashboard.css';

interface Lead {
  id: string;
  number: number;
  assignmentDate: string;
  assignmentTime: string;
  clientName: string;
  email: string;
  phone: string;
  channel: string;
  tipification: string;
  subtipification: string;
  followUp: string;
  followUpStatus: 'En gestión' | 'Gestionado';
}

const TIPIFICATION_CATEGORIES = [
  {
    id: '0',
    name: 'SIN CONTACTO',
    color: '#6B7280',
    subcategories: ['NO CONTESTA', 'Nº EQUIVOCADO', 'FUERA DE SERVICIO', 'BUZÓN']
  },
  {
    id: '1',
    name: 'SEGUIMIENTO',
    color: '#3B82F6',
    count: 1,
    subcategories: ['SOLO INFO', 'SEGUIMIENTO', 'GESTIÖN x CHAT', 'LLAMADA INTERRUMPIDA']
  },
  {
    id: '2',
    name: 'AGENDADOS',
    color: '#8B5CF6',
    subcategories: ['FIN DE MES', 'CONSULTARA CON FAMILIAR', 'AGENDADO', 'PRÓX x AGENDADO']
  },
  {
    id: '3',
    name: 'RECHAZADO',
    color: '#EF4444',
    count: 1,
    subcategories: ['ZONA F', 'VC DESAPROBADA', 'NO DESEA', 'NO CALIFICA', 'CON PROGRAMACIÓN']
  },
  {
    id: '4',
    name: 'REITERADO',
    color: '#F59E0B',
    subcategories: ['ND PUBLICIDAD', 'DOBLE CLICK']
  },
  {
    id: '5',
    name: 'SIN FACILIDADES',
    color: '#06B6D4',
    subcategories: ['SIN CTO', 'SIN COBERTURA', 'SERVICIO ACTIVO', 'EDIFICIO SIN LIBERAR']
  },
  {
    id: '6',
    name: 'PDTE SCORE/PREVENTA',
    color: '#EC4899',
    count: 1,
    subcategories: ['PREVENTA', 'PDTE SCORE']
  },
  {
    id: '7',
    name: 'PREVENTA COMPLETA',
    color: '#10B981',
    subcategories: ['VENTA CERRADA', 'VC MES SIGUIENTE']
  },
  {
    id: '8',
    name: 'LISTA NEGRA',
    color: '#1F2937',
    subcategories: ['LISTA NEGRA']
  }
];

const mockLeads: Lead[] = [
  {
    id: '1',
    number: 1,
    assignmentDate: '04/03/26',
    assignmentTime: '00:00 a.m.',
    clientName: 'Pedro López',
    email: 'pedro@email.com',
    phone: '+51 945 678 901',
    channel: 'Facebook',
    tipification: '1 - SEGUIMIENTO',
    subtipification: 'SEGUIMIENTO',
    followUp: 'Seguimiento',
    followUpStatus: 'En gestión'
  },
  {
    id: '2',
    number: 2,
    assignmentDate: '03/03/26',
    assignmentTime: '02:00 p.m.',
    clientName: 'Valeria Herrera',
    email: 'valeria@email.com',
    phone: '+51 923 456 789',
    channel: 'Instagram',
    tipification: '6 - PDTE SCORE/PREVENTA',
    subtipification: 'PDTE SCORE',
    followUp: 'Seguimiento',
    followUpStatus: 'En gestión'
  },
  {
    id: '3',
    number: 3,
    assignmentDate: '02/03/26',
    assignmentTime: '04:00 p.m.',
    clientName: 'Lucia Flores',
    email: 'lucia@email.com',
    phone: '+51 911 234 567',
    channel: 'Facebook',
    tipification: '3 - RECHAZADO',
    subtipification: 'NO CALIFICA',
    followUp: 'Seguimiento',
    followUpStatus: 'Gestionado'
  }
];

export const SalesAdvisorDashboard = () => {
  const [leads] = useState<Lead[]>(mockLeads);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleTipifyClick = (lead: Lead) => {
    setSelectedLead(lead);
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLead(null);
    setSelectedCategory(null);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // Calcular estadísticas
  const statistics = useMemo(() => {
    return [
      {
        label: 'Leads Nuevos',
        value: leads.length,
        color: '#06B6D4'
      },
      {
        label: 'Sin Gestionar',
        value: leads.filter(l => l.tipification.includes('SIN CONTACTO')).length,
      },
      {
        label: 'Gestionados del Día',
        value: leads.filter(l => l.tipification.includes('SEGUIMIENTO')).length,
        color: '#3B82F6'
      },
      {
        label: 'Preventas',
        value: leads.filter(l => l.tipification.includes('PREVENTA')).length,
        color: '#10B981'
      }
    ];
  }, [leads]);

  return (
    <div className="sales-advisor-dashboard">
      {/* Estadísticas */}
      <div className="statistics-grid">
        {statistics.map((stat, index) => (
          <StatCard key={index} stat={stat} />
        ))}
      </div>

      {/* Tabla de Leads */}
      <div className="leads-section">
        <h2>Mis Leads Asignados ({leads.length})</h2>
        <div className="table-container">
          <table className="leads-table">
            <thead>
              <tr>
                <th>FECHA ASIGNACIÓN</th>
                <th>NOMBRE CLIENTE</th>
                <th>TELÉFONO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="date-cell">
                    <div className="date">{lead.assignmentDate}</div>
                    <div className="time">{lead.assignmentTime}</div>
                  </td>
                  <td>
                    <div className="client-info">
                      <div className="avatar">{lead.clientName.substring(0, 2).toUpperCase()}</div>
                      <div>
                        <div className="client-name">{lead.clientName}</div>
                        <div className="client-email">{lead.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{lead.phone}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn call-btn" title="Llamar">
                        <BiPhone size={16} />
                        Llamar
                      </button>
                      <button className="action-btn whatsapp-btn" title="WhatsApp">
                        <BiLogoWhatsapp size={16} />
                        WhatsApp
                      </button>
                      <button 
                        className="action-btn tipify-btn" 
                        title="Tipificar"
                        onClick={() => handleTipifyClick(lead)}
                      >
                        Tipificar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guía de Tipificación */}
      <div className="tipification-guide">
        <h2>Guía de Tipificación</h2>
        <div className="guide-grid">
          {TIPIFICATION_CATEGORIES.map(category => (
            <div key={category.id} className="guide-card">
              <div className="guide-header" style={{ '--category-color': category.color } as React.CSSProperties }>
                <h3>{category.name}</h3>
                {category.count && <span className="category-count">{category.count}</span>}
              </div>
              <div className="guide-content">
                <ul>
                  {category.subcategories.map((sub, index) => (
                    <li key={index}>• {sub}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Tipificación */}
      {isModalOpen && selectedLead && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="tipify-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tipificar Lead</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ✕
              </button>
            </div>
            <div className="modal-content">
              <div className="lead-info">
                <p className="lead-name">{selectedLead.clientName}</p>
                <p className="lead-phone">{selectedLead.phone}</p>
              </div>

              <div className="steps-header">
                <span className={`step ${!selectedCategory ? 'active' : ''}`}>
                  1. Categoría
                </span>
                <span className="separator">›</span>
                <span className={`step ${selectedCategory ? 'active' : ''}`}>
                  2. Subtipificación
                </span>
              </div>

              {!selectedCategory ? (
                <div className="categories-list">
                  <p className="section-title">Selecciona la categoría principal:</p>
                  {TIPIFICATION_CATEGORIES.map(category => (
                    <button
                      key={category.id}
                      className="category-btn"
                      style={{ '--category-color': category.color } as React.CSSProperties }
                      onClick={() => handleCategorySelect(category.id)}
                    >
                      <span className="category-number">
                        {category.id}
                      </span>
                      <span className="category-name">{category.name}</span>
                      <span className="arrow">›</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="subcategories-list">
                  <button className="back-btn" onClick={() => setSelectedCategory(null)}>
                    ‹ Atrás
                  </button>
                  <p className="section-title">
                    Selecciona la subcategoría:
                  </p>
                  {TIPIFICATION_CATEGORIES.find(c => c.id === selectedCategory)?.subcategories.map((sub, index) => (
                    <button key={index} className="subcategory-btn">
                      • {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
