/**
 * Componentes para la sección de Leads
 * Separados y reutilizables
 */

import React from 'react';
import { BiSearch, BiPlus } from 'react-icons/bi';
import { Boton, Girador } from '@compartido/ui/base';
import type { LeadDTO } from '@compartido/tipos';

// Tipo alias para compatibilidad con el código existente
type Lead = LeadDTO;

interface LeadsHeaderProps {
  count: number;
  onRegisterClick: () => void;
}

/**
 * LeadsHeader Component
 * 
 * Componente presentacional simple que muestra el encabezado de la sección
 * Incluye título con contador de leads y botón para crear nuevo lead
 * 
 * Responsabilidades:
 * - Mostrar contador dinámico de leads (filtra los mostrados)
 * - Disparar evento al hacer clic en botón "Registrar Lead"
 * 
 * @component
 * @param {number} count - Cantidad de leads a mostrar en el título
 * @param {() => void} onRegisterClick - Callback al hacer clic en botón registrar
 * @returns {JSX.Element} Header con título y botón
 * 
 * @example
 * <LeadsHeader count={15} onRegisterClick={() => setModalOpen(true)} />
 */
export const LeadsHeader: React.FC<LeadsHeaderProps> = ({ count, onRegisterClick }) => {
  return (
    <div className="leads-header">
      <div className="header-title">
        <h2>Tabla de Leads ({count})</h2>
      </div>
      <Boton variant="primary" className="icon-button" onClick={onRegisterClick}>
        <BiPlus size={18} />
        Registrar Lead
      </Boton>
    </div>
  );
};

interface LeadsFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedChannel: string;
  onChannelChange: (channel: string) => void;
  selectedAdvisor: string;
  onAdvisorChange: (advisor: string) => void;
  selectedCampaign: string;
  onCampaignChange: (campaign: string) => void;
  channels: string[];
  advisors: string[];
  campaigns: string[];
}

/**
 * LeadsFilters Component
 * 
 * Componente para búsqueda y filtrado de leads
 * Incluye input de búsqueda y 3 dropdowns de filtros
 * 
 * Funcionalidad:
 * - Búsqueda de texto: filtra en tiempo real mientras escribes
 * - Filtros independientes: Canal, Asesor, Campaña
 * - onChange callbacks para cada filtro
 * 
 * Nota: Los valores reales se calculan en useLeadsFiltering del componente padre
 * Este componente solo renderiza y dispara eventos
 * 
 * @component
 * @param {string} searchTerm - Valor actual de búsqueda
 * @param {(term: string) => void} onSearchChange - Callback al cambiar búsqueda
 * @param {string} selectedChannel - Canal seleccionado
 * @param {(channel: string) => void} onChannelChange - Callback al cambiar canal
 * @param {string} selectedAdvisor - Asesor seleccionado
 * @param {(advisor: string) => void} onAdvisorChange - Callback al cambiar asesor
 * @param {string} selectedCampaign - Campaña seleccionada
 * @param {(campaign: string) => void} onCampaignChange - Callback al cambiar campaña
 * @param {string[]} channels - Lista de canales disponibles
 * @param {string[]} advisors - Lista de asesores disponibles
 * @param {string[]} campaigns - Lista de campañas disponibles
 * @returns {JSX.Element} Controles de búsqueda y filtros
 * 
 * @example
 * <LeadsFilters
 *   searchTerm={filters.searchTerm}
 *   onSearchChange={setSearchTerm}
 *   selectedChannel={filters.selectedChannel}
 */
export const LeadsFilters: React.FC<LeadsFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedChannel,
  onChannelChange,
  selectedAdvisor,
  onAdvisorChange,
  selectedCampaign,
  onCampaignChange,
  channels,
  advisors,
  campaigns,
}) => {
  return (
    <div className="leads-filters">
      <div className="filter-group">
        <BiSearch size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Buscar leads..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>
      
      <select value={selectedChannel} onChange={(e) => onChannelChange(e.target.value)} className="filter-select">
        <option value="">Todos los canales</option>
        {channels.map(ch => <option key={ch} value={ch}>{ch}</option>)}
      </select>

      <select value={selectedAdvisor} onChange={(e) => onAdvisorChange(e.target.value)} className="filter-select">
        <option value="">Todos los asesores</option>
        {advisors.map(adv => <option key={adv} value={adv}>{adv}</option>)}
      </select>

      <select value={selectedCampaign} onChange={(e) => onCampaignChange(e.target.value)} className="filter-select">
        <option value="">Todas las campañas</option>
        {campaigns.map(camp => <option key={camp} value={camp}>{camp}</option>)}
      </select>
    </div>
  );
};

/**
 * LeadsSection - Componente contenedor que agrupa Header y Filters
 * Alias para compatibilidad con imports existentes
 */
export const LeadsSection = LeadsFilters;

export default LeadsSection;
