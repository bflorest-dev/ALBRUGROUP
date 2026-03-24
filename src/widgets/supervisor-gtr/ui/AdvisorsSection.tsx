/**
 * Componentes para la sección de Asesores
 * Separados y reutilizables
 */

import React from 'react';
// DEPRECATED: Girador fue eliminado
// import { Girador } from '@compartido/ui/atomos/indicadores';
type Girador = any; // Placeholder
import type { AdvisorDTO } from '@compartido/tipos';

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

export default AdvisorsSection;
