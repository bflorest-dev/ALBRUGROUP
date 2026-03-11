/**
 * Componentes para la sección de Leads
 * Separados y reutilizables
 */

import React from 'react';
import { BiSearch, BiPlus } from 'react-icons/bi';
import { Button } from '@atoms/Button';
import { Spinner } from '@atoms/Spinner';
import { DataTable } from '@molecules/DataTable';
import type { DataTableColumn } from '@molecules/DataTable';
import type { LeadDTO } from '@shared/types/lead.types';

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
      <Button variant="primary" className="icon-button" onClick={onRegisterClick}>
        <BiPlus size={18} />
        Registrar Lead
      </Button>
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
 *   channels={['Todos', 'Facebook', 'Instagram', 'WhatsApp']}
 *   // ... más props
 * />
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
    <div className="leads-controls">
      <div className="search-box">
        <BiSearch size={18} />
        <input
          type="text"
          placeholder="Buscar nombre o teléfono"
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>
      <div className="filter-selects">
        <select
          className="form-control"
          value={selectedChannel}
          onChange={e => onChannelChange(e.target.value)}
        >
          {channels.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="form-control"
          value={selectedAdvisor}
          onChange={e => onAdvisorChange(e.target.value)}
        >
          {advisors.map(a => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          className="form-control"
          value={selectedCampaign}
          onChange={e => onCampaignChange(e.target.value)}
        >
          {campaigns.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

interface LeadsTableProps {
  leads: Lead[];
  columns: DataTableColumn<Lead>[];
}

/**
 * LeadsTable Component
 * 
 * Componente presentacional que renderiza una tabla de leads
 * Es un wrapper sobre DataTable que proporciona estructura y estilos
 * 
 * Responsabilidades:
 * - Renderizar tabla con columnas personalizadas
 * - Aplicar clases CSS para filas clickeables
 * - Mantener consistencia visual con el resto de la sección
 * 
 * @component
 * @param {Lead[]} leads - Array de leads a mostrar (ya filtrados)
 * @param {DataTableColumn<Lead>[]} columns - Definición de columnas con accessors
 * @returns {JSX.Element} Tabla de leads renderizada
 * 
 * @example
 * <LeadsTable
 *   leads={filteredLeads}
 *   columns={leadsTableColumns}
 * />
 */
export const LeadsTable: React.FC<LeadsTableProps> = ({ leads, columns }) => {
  return <DataTable columns={columns} data={leads} rowClassName="clickable-row" />;
};

interface LeadsSectionProps {
  leads: Lead[];
  filteredLeads: Lead[];
  columns: DataTableColumn<Lead>[];
  filters: {
    searchTerm: string;
    selectedChannel: string;
    selectedAdvisor: string;
    selectedCampaign: string;
  };
  onFilterChange: {
    onSearchChange: (term: string) => void;
    onChannelChange: (channel: string) => void;
    onAdvisorChange: (advisor: string) => void;
    onCampaignChange: (campaign: string) => void;
  };
  channels: string[];
  advisors: string[];
  campaigns: string[];  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;  onRegisterClick: () => void;
}

/**
 * LeadsSection Component (Container)
 * 
 * Componente contenedor principal que gestiona toda la sección de leads
 * Combina header, filtros, tabla y manejo de loading/error
 * 
 * Estructura de render:
 * 1. LeadsHeader (siempre visible)
 * 2. ESTADO LOADING: Spinner + "Cargando leads..."
 * 3. ESTADO ERROR: Alert rojo + botón "Reintentar"
 * 4. ESTADO SUCCESS: LeadsFilters + LeadsTable
 * 
 * Los estados son mutuamente excluyentes (solo uno aparece a la vez)
 * 
 * Props recibidas:
 * - leads: Array total de leads (sin filtrar)
 * - filteredLeads: Array resultado después de aplicar filtros
 * - columns: Definición de columnas de tabla
 * - filters: Estado actual de filtros (searchTerm, canal, asesor, campaña)
 * - onFilterChange: Callbacks para actualizar cada filtro
 * - isLoading: Flag de carga asincrónica
 * - error: Mensaje de error si ocurrió algo
 * - onRetry: Callback para reintentar la carga
 * 
 * @component
 * @param {Lead[]} leads - Array total de leads del padre
 * @param {Lead[]} filteredLeads - Array filtrado a mostrar en tabla
 * @param {DataTableColumn<Lead>[]} columns - Definición de columnas
 * @param {Object} filters - Estado de filtros
 * @param {Object} onFilterChange - Callbacks de cambio de filtros
 * @param {string[]} channels - Lista de canales disponibles
 * @param {string[]} advisors - Lista de asesores disponibles
 * @param {string[]} campaigns - Lista de campañas disponibles
 * @param {boolean} [isLoading=false] - Flag de carga
 * @param {string | null} [error=null] - Mensaje de error
 * @param {() => void} [onRetry] - Callback de reintentar
 * @param {() => void} onRegisterClick - Callback para crear nuevo lead
 * @returns {JSX.Element} Sección completa de leads con control de estado
 * 
 * @example
 * <LeadsSection
 *   filteredLeads={filteredLeads}
 *   columns={leadsTableColumns}
 *   isLoading={leadsIsLoading}
 *   error={leadsError}
 *   onRetry={refetchLeads}
 *   onRegisterClick={() => setModalOpen(true)}
 * />
 */
export const LeadsSection: React.FC<LeadsSectionProps> = ({
  filteredLeads,
  columns,
  filters,
  onFilterChange,
  channels,
  advisors,
  campaigns,
  isLoading = false,
  error,
  onRetry,
  onRegisterClick,
}) => {
  return (
    <div className="gtr-leads-section">
      <LeadsHeader count={filteredLeads.length} onRegisterClick={onRegisterClick} />
      
      {/* Mostrar spinner mientras carga */}
      {isLoading && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '12px',
          padding: '30px',
          color: '#6b7280'
        }}>
          <Spinner />
          <span>Cargando leads...</span>
        </div>
      )}
      
      {/* Mostrar error si existe */}
      {error && !isLoading && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <strong style={{ color: '#991b1b' }}>Error:</strong>
            <p style={{ color: '#7f1d1d', margin: '4px 0 0 0', fontSize: '14px' }}>
              {error}
            </p>
          </div>
          {onRetry && (
            <Button variant="secondary" onClick={onRetry} style={{ whiteSpace: 'nowrap', marginLeft: '12px' }}>
              Reintentar
            </Button>
          )}
        </div>
      )}
      
      {/* Mostrar contenido solo si no está cargando y no hay error */}
      {!isLoading && !error && (
        <>
          <LeadsFilters
            searchTerm={filters.searchTerm}
            onSearchChange={onFilterChange.onSearchChange}
            selectedChannel={filters.selectedChannel}
            onChannelChange={onFilterChange.onChannelChange}
            selectedAdvisor={filters.selectedAdvisor}
            onAdvisorChange={onFilterChange.onAdvisorChange}
            selectedCampaign={filters.selectedCampaign}
            onCampaignChange={onFilterChange.onCampaignChange}
            channels={channels}
            advisors={advisors}
            campaigns={campaigns}
          />
          <LeadsTable leads={filteredLeads} columns={columns} />
        </>
      )}
    </div>
  );
};
