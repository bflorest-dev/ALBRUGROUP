/**
 * Componentes para la sección de Asesores
 * Separados y reutilizables
 */

import React from 'react';
import { Spinner } from '@atoms/Spinner';
import type { AdvisorDTO } from '@shared/types/advisor.types';

// Tipo alias para compatibilidad con el código existente
export type Advisor = AdvisorDTO;

interface AdvisorCardProps {
  advisor: Advisor;
  statusBgStyle: (status: string) => string;
  progressFillColor: (status: string) => string;
}

/**
 * AdvisorCard Component
 * 
 * Componente presentacional que muestra una tarjeta de asesor con información de carga
 * 
 * Responsabilidades:
 * - Mostrar avatar con iniciales del asesor
 * - Mostrar nombre completo y estado (Disponible, Ocupado, Saturado)
 * - Mostrar estadísticas: leads asignados y gestionados
 * - Mostrar barra de progreso de capacidad utilizada
 * 
 * Cálculo de progreso:
 * - Se calcula como: (assigned / totalCapacity) * 100
 * - El color de la barra cambia según el estado del asesor
 * 
 * @component
 * @param {Advisor} advisor - Datos del asesor
 * @param {Function} statusBgStyle - Función que retorna color de fondo para el badge de estado
 * @param {Function} progressFillColor - Función que retorna color de la barra de progreso
 * @returns {JSX.Element} Tarjeta de asesor con información visual
 * 
 * @example
 * <AdvisorCard
 *   advisor={advisorData}
 *   statusBgStyle={(status) => getColorForStatus(status)}
 *   progressFillColor={(status) => getProgressColor(status)}
 * />
 */
export const AdvisorCard: React.FC<AdvisorCardProps> = ({
  advisor,
  statusBgStyle,
  progressFillColor,
}) => {
  const progressPercentage = (advisor.assignedLeads / advisor.totalCapacity) * 100;

  return (
    <div className="advisor-card">
      <div className="advisor-header">
        <div className="advisor-avatar">{advisor.initials}</div>
        <div className="advisor-info">
          <h3>{advisor.firstName}</h3>
          <p>{advisor.lastName}</p>
        </div>
        <div
          className="advisor-status-badge"
          style={{ '--status-bg': statusBgStyle(advisor.status) } as React.CSSProperties}
        >
          {advisor.status}
        </div>
      </div>
      <div className="advisor-stats">
        <div className="gtr-stat-row">
          <span className="gtr-stat-label">{advisor.assignedLeads} asignados</span>
          <span className="gtr-stat-label">{advisor.managedLeads} gestionados</span>
        </div>
      </div>
      <div className="progress-container">
        <div className="gtr-progress-bar">
          <div
            className="gtr-progress-fill"
            style={{
              width: `${progressPercentage}%`,
              '--fill-color': progressFillColor(advisor.status),
            } as React.CSSProperties}
          />
        </div>
      </div>
    </div>
  );
};

interface AdvisorsGridProps {
  advisors: Advisor[];
  statusBgStyle: (status: string) => string;
  progressFillColor: (status: string) => string;
}

/**
 * AdvisorsGrid Component
 * 
 * Componente contenedor que renderiza una grilla responsiva de tarjetas de asesores
 * 
 * Responsabilidades:
 * - Mapear array de asesores a componentes AdvisorCard
 * - Manejar layout en grilla (CSS Grid o similar)
 * - Mantener consistencia visual de todas las tarjetas
 * 
 * @component
 * @param {Advisor[]} advisors - Array de asesores a mostrar
 * @param {Function} statusBgStyle - Función para color de fondo de estado
 * @param {Function} progressFillColor - Función para color de progreso
 * @returns {JSX.Element} Grilla de tarjetas de asesores
 * 
 * @example
 * <AdvisorsGrid
 *   advisors={advisors}
 *   statusBgStyle={getStatusBgStyle}
 *   progressFillColor={getProgressFillColor}
 * />
 */
export const AdvisorsGrid: React.FC<AdvisorsGridProps> = ({
  advisors,
  statusBgStyle,
  progressFillColor,
}) => {
  return (
    <div className="advisors-grid">
      {advisors.map(advisor => (
        <AdvisorCard
          key={advisor.initials}
          advisor={advisor}
          statusBgStyle={statusBgStyle}
          progressFillColor={progressFillColor}
        />
      ))}
    </div>
  );
};

interface AdvisorsSectionProps {
  advisors: Advisor[];
  statusBgStyle: (status: string) => string;
  progressFillColor: (status: string) => string;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * AdvisorsSection Component (Container)
 * 
 * Componente contenedor principal que maneja la sección completa de asesores
 * Incluye encabezado, manejo de loading/error, y la grilla de asesores
 * 
 * Estados manejados:
 * - Loading: Muestra spinner mientras se cargan los datos
 * - Error: Muestra alert rojo con mensaje de error
 * - Success: Muestra grilla de asesores
 * 
 * El componente asegura que solo un estado sea visible a la vez mediante
 * renderizado condicional.
 * 
 * @component
 * @param {Advisor[]} advisors - Array de asesores a mostrar
 * @param {Function} statusBgStyle - Función para color de fondo de estado
 * @param {Function} progressFillColor - Función para color de progreso
 * @param {boolean} [isLoading=false] - Flag de carga en progreso
 * @param {string | null} [error=null] - Mensaje de error si existe
 * @returns {JSX.Element} Sección completa con header, spinner/error/grid
 * 
 * @example
 * <AdvisorsSection
 *   advisors={mockAdvisors}
 *   statusBgStyle={getStatusBadgeStyle}
 *   progressFillColor={getProgressFillColor}
 *   isLoading={leadsIsLoading}
 *   error={leadsError}
 * />
 */
export const AdvisorsSection: React.FC<AdvisorsSectionProps> = ({
  advisors,
  statusBgStyle,
  progressFillColor,
  isLoading = false,
  error,
}) => {
  return (
    <div className="advisors-section">
      <div className="gtr-section-header">
        <span className="section-icon">👥</span>
        <h2>Carga de Trabajo por Asesor</h2>
      </div>
      
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
          <span>Cargando asesores...</span>
        </div>
      )}
      
      {/* Mostrar error si existe */}
      {error && !isLoading && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          padding: '12px 16px',
          marginBottom: '16px'
        }}>
          <strong style={{ color: '#991b1b' }}>Error:</strong>
          <p style={{ color: '#7f1d1d', margin: '4px 0 0 0', fontSize: '14px' }}>
            {error}
          </p>
        </div>
      )}
      
      {/* Mostrar grid solo si no está cargando y no hay error */}
      {!isLoading && !error && (
        <AdvisorsGrid
          advisors={advisors}
          statusBgStyle={statusBgStyle}
          progressFillColor={progressFillColor}
        />
      )}
    </div>
  );
};
