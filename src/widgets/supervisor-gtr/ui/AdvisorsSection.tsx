/**
 * Componentes para la secciÃ³n de Asesores
 * Separados y reutilizables
 */

import React from 'react';
import { Girador } from '@shared/ui/base';
import type { AdvisorDTO } from '@entities/asesor/model';

// Tipo alias para compatibilidad con el cÃ³digo existente
export type Advisor = AdvisorDTO;

interface AdvisorCardProps {
  advisor: Advisor;
  statusBgStyle: (status: string) => string;
  progressFillColor: (status: string) => string;
}

/**
 * AdvisorCard Component
 * 
 * Componente presentacional que muestra una tarjeta de asesor con informaciÃ³n de carga
 * 
 * Responsabilidades:
 * - Mostrar avatar con iniciales del asesor
 * - Mostrar nombre completo y estado (Disponible, Ocupado, Saturado)
 * - Mostrar estadÃ­sticas: leads asignados y gestionados
 * - Mostrar barra de progreso de capacidad utilizada
 * 
 * CÃ¡lculo de progreso:
 * - Se calcula como: (assigned / totalCapacity) * 100
 * - El color de la barra cambia segÃºn el estado del asesor
 * 
 * @component
 * @param {Advisor} advisor - Datos del asesor
 * @param {Function} statusBgStyle - FunciÃ³n que retorna color de fondo para el badge de estado
 * @param {Function} progressFillColor - FunciÃ³n que retorna color de la barra de progreso
 * @returns {JSX.Element} Tarjeta de asesor con informaciÃ³n visual
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
 */
export const AdvisorsGrid: React.FC<AdvisorsGridProps> = ({
  advisors,
  statusBgStyle,
  progressFillColor
}) => {
  return (
    <div className="advisors-grid">
      {advisors.map(advisor => (
        <AdvisorCard
          key={advisor.id}
          advisor={advisor}
          statusBgStyle={statusBgStyle}
          progressFillColor={progressFillColor}
        />
      ))}
    </div>
  );
};

// Alias para compatibilidad
export const AdvisorsSection = AdvisorsGrid;

export default AdvisorsSection;

