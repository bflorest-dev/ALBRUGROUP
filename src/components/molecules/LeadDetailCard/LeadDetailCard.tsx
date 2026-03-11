/**
 * LeadDetailCard - Molecule
 * 
 * Tarjeta que muestra los detalles completos de un lead seleccionado
 * Información: Cliente, Datos Personales, Dirección, Plan, Promoción
 */

import React from 'react';
import type { LeadDTO } from '@shared/types';
import './LeadDetailCard.css';

interface LeadDetailCardProps {
  lead: LeadDTO;
}

/**
 * Estructura extendida de lead con información de preventa
 * En la aplicación real, esto vendría del API
 */
interface PreventaLead extends LeadDTO {
  email?: string;
  address?: string;
  province?: string;
  district?: string;
  addressType?: string;
  domicileType?: string;
  planName?: string;
  planPrice?: string;
  planServices?: string[];
  promotionName?: string;
  promotionDiscount?: string;
  promotionDuration?: string;
}

export const LeadDetailCard: React.FC<LeadDetailCardProps> = ({ lead }) => {
  const preventaLead = lead as PreventaLead;

  const StatRow = ({ label, value }: { label: string; value?: string }) => (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value || '-'}</span>
    </div>
  );

  return (
    <div className="lead-detail-card">
      {/* Encabezado con cliente y acciones */}
      <div className="detail-header">
        <div className="client-header">
          <h2 className="client-full-name">
            {preventaLead.firstName} {preventaLead.lastName}
          </h2>
          <p className="client-phone">{preventaLead.phone}</p>
        </div>
        <div className="header-badges">
          <span className="channel-badge">{preventaLead.channel}</span>
          <span className="status-badge">Pendiente</span>
        </div>
      </div>

      {/* Sección: Datos Personales */}
      <section className="detail-section">
        <h3 className="section-title">📋 DATOS PERSONALES</h3>
        <div className="section-content">
          <StatRow label="Email" value={preventaLead.email} />
          <StatRow label="Teléfono" value={preventaLead.phone} />
          <StatRow label="Fecha Registro" value={preventaLead.registrationDate} />
          <StatRow label="Hora Registro" value={preventaLead.registrationTime} />
        </div>
      </section>

      {/* Sección: Dirección */}
      {(preventaLead.address || preventaLead.province) && (
        <section className="detail-section">
          <h3 className="section-title">📍 DIRECCIÓN</h3>
          <div className="section-content">
            <StatRow label="Dirección" value={preventaLead.address} />
            <StatRow label="Tipo Domicilio" value={preventaLead.domicileType} />
            <StatRow label="Provincia" value={preventaLead.province} />
            <StatRow label="Distrito" value={preventaLead.district} />
            <StatRow label="Tipo Vía" value={preventaLead.addressType} />
          </div>
        </section>
      )}

      {/* Sección: Plan Interesado */}
      {preventaLead.planName && (
        <section className="detail-section">
          <h3 className="section-title">💰 PLAN INTERESADO</h3>
          <div className="section-content">
            <StatRow label="Plan" value={preventaLead.planName} />
            <StatRow label="Precio" value={preventaLead.planPrice} />
            {preventaLead.planServices && (
              <div className="stat-row">
                <span className="stat-label">Servicios</span>
                <div className="services-list">
                  {preventaLead.planServices.map((service, idx) => (
                    <span key={idx} className="service-badge">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Sección: Promoción */}
      {preventaLead.promotionName && (
        <section className="detail-section">
          <h3 className="section-title">🎁 PROMOCIÓN</h3>
          <div className="section-content">
            <StatRow label="Nombre" value={preventaLead.promotionName} />
            <StatRow label="Descuento" value={preventaLead.promotionDiscount} />
            <StatRow label="Duración" value={preventaLead.promotionDuration} />
          </div>
        </section>
      )}

      {/* Sección: Información de Campaña */}
      <section className="detail-section">
        <h3 className="section-title">📊 CAMPAÑA Y ORIGEN</h3>
        <div className="section-content">
          <StatRow label="Campaña" value={preventaLead.campaign} />
          <StatRow label="Unidad de Negocio" value={preventaLead.businessUnit} />
          <StatRow label="Asesor" value={preventaLead.advisor} />
          <StatRow label="Área" value={preventaLead.advisorArea} />
        </div>
      </section>
    </div>
  );
};

export default LeadDetailCard;
