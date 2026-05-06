import React from 'react';
import type { PlanResponse } from '@shared/types';
import './PlanDetailsModal.css';

interface PlanDetailsModalProps {
  plan: PlanResponse | null;
  onClose: () => void;
}

export const PlanDetailsModal: React.FC<PlanDetailsModalProps> = ({ plan, onClose }) => {
  if (!plan) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(value);
  };

  return (
    <div className="plan-details-overlay" onClick={onClose}>
      <div className="plan-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="plan-details-header">
          <h2>{plan.nombre}</h2>
          <button className="plan-details-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="plan-details-content">
          {/* Información General */}
          <section className="plan-details-section">
            <h3>📋 Información General</h3>
            <div className="plan-details-grid">
              <div className="plan-detail-item">
                <span className="plan-detail-label">ID:</span>
                <span className="plan-detail-value">{plan.id}</span>
              </div>
              <div className="plan-detail-item">
                <span className="plan-detail-label">Nombre:</span>
                <span className="plan-detail-value">{plan.nombre}</span>
              </div>
              <div className="plan-detail-item">
                <span className="plan-detail-label">Proveedor:</span>
                <span className="plan-detail-value">{plan.nombreProveedor}</span>
              </div>
              <div className="plan-detail-item">
                <span className="plan-detail-label">Zona:</span>
                <span className="plan-detail-value">{plan.nombreZona || 'Sin zona asignada'}</span>
              </div>
              <div className="plan-detail-item">
                <span className="plan-detail-label">Estado:</span>
                <span className={`plan-detail-badge ${plan.activo ? 'active' : 'inactive'}`}>
                  {plan.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </section>

          {/* Precios */}
          <section className="plan-details-section">
            <h3>💰 Precios</h3>
            <div className="plan-details-grid">
              <div className="plan-detail-item">
                <span className="plan-detail-label">Precio Regular:</span>
                <span className="plan-detail-value plan-detail-price">{formatCurrency(plan.precio)}</span>
              </div>
              <div className="plan-detail-item">
                <span className="plan-detail-label">Precio Promocional:</span>
                <span className="plan-detail-value plan-detail-price-promo">
                  {formatCurrency(plan.precioPromocional)}
                </span>
              </div>
              <div className="plan-detail-item">
                <span className="plan-detail-label">Meses Promoción Precio:</span>
                <span className="plan-detail-value">{plan.mesesPromocionPrecio} meses</span>
              </div>
            </div>
          </section>

          {/* Vigencia */}
          <section className="plan-details-section">
            <h3>📅 Vigencia</h3>
            <div className="plan-details-grid">
              <div className="plan-detail-item">
                <span className="plan-detail-label">Desde:</span>
                <span className="plan-detail-value">{plan.vigenciaDesde}</span>
              </div>
              <div className="plan-detail-item">
                <span className="plan-detail-label">Hasta:</span>
                <span className="plan-detail-value">{plan.vigenciaHasta || 'Sin límite'}</span>
              </div>
            </div>
          </section>

          {/* Internet */}
          {plan.internet && (
            <section className="plan-details-section">
              <h3>🌐 Internet</h3>
              <div className="plan-details-grid">
                <div className="plan-detail-item">
                  <span className="plan-detail-label">Velocidad:</span>
                  <span className="plan-detail-value">
                    {plan.internet.velocidad} {plan.internet.unidad}
                  </span>
                </div>
                <div className="plan-detail-item">
                  <span className="plan-detail-label">Tecnología:</span>
                  <span className="plan-detail-value">{plan.internet.tecnologia}</span>
                </div>
                <div className="plan-detail-item">
                  <span className="plan-detail-label">Velocidad Promocional:</span>
                  <span className="plan-detail-value">
                    {plan.velocidadPromocional} {plan.internet.unidad}
                  </span>
                </div>
                <div className="plan-detail-item">
                  <span className="plan-detail-label">Meses Promoción Velocidad:</span>
                  <span className="plan-detail-value">{plan.mesesPromocionVelocidad} meses</span>
                </div>
              </div>
            </section>
          )}

          {/* Televisión */}
          {plan.television && (
            <section className="plan-details-section">
              <h3>📺 Televisión</h3>
              <div className="plan-details-grid">
                <div className="plan-detail-item">
                  <span className="plan-detail-label">Paquete:</span>
                  <span className="plan-detail-value">{plan.television.nombre}</span>
                </div>
                <div className="plan-detail-item">
                  <span className="plan-detail-label">Canales:</span>
                  <span className="plan-detail-value">{plan.television.cantidadCanales}</span>
                </div>
              </div>
            </section>
          )}

          {/* Teléfono */}
          {plan.telefono && (
            <section className="plan-details-section">
              <h3>📞 Teléfono</h3>
              <div className="plan-details-grid">
                <div className="plan-detail-item">
                  <span className="plan-detail-label">Minutos:</span>
                  <span className="plan-detail-value">{plan.telefono.minutos}</span>
                </div>
                <div className="plan-detail-item">
                  <span className="plan-detail-label">Descripción:</span>
                  <span className="plan-detail-value">{plan.telefono.descripcion}</span>
                </div>
              </div>
            </section>
          )}

          {/* Adicionales */}
          {plan.adicionales && plan.adicionales.length > 0 && (
            <section className="plan-details-section">
              <h3>➕ Adicionales ({plan.adicionales.length})</h3>
              <div className="plan-adicionales-list">
                {plan.adicionales.map((adicional, index) => (
                  <div key={index} className="plan-adicional-card">
                    <div className="plan-adicional-header">
                      <strong>{adicional.nombreAdicional}</strong>
                    </div>
                    <div className="plan-adicional-details">
                      <div className="plan-detail-item-small">
                        <span className="plan-detail-label">Cantidad Incluida:</span>
                        <span className="plan-detail-value">{adicional.cantidadIncluida}</span>
                      </div>
                      <div className="plan-detail-item-small">
                        <span className="plan-detail-label">Compra Adicional:</span>
                        <span className="plan-detail-value">
                          {adicional.permiteCompraAdicional ? 'Sí' : 'No'}
                        </span>
                      </div>
                      {adicional.permiteCompraAdicional && (
                        <div className="plan-detail-item-small">
                          <span className="plan-detail-label">Cantidad Máxima:</span>
                          <span className="plan-detail-value">{adicional.cantidadMaximaAdicional}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="plan-details-footer">
          <button className="community-btn primary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
