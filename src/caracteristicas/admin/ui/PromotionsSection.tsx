import React, { useState } from 'react';
import { BiPlus, BiTrash, BiPencil } from 'react-icons/bi';
import { Modal } from '@compartido/ui/base';
import type { Promocion } from '../types';
import type { AdminDashboardState } from '../hooks/useAdminDashboard';
import './PromotionsSection.css';

interface PromotionsSectionProps {
  state: AdminDashboardState;
}

interface FormData {
  nombre: string;
  tipo: 'INTERNO' | 'EXTERNO';
  zona: string;
  tipoVenta: 'NATURAL' | 'JURIDICA';
  descuento: boolean;
  porcentajeDescuento: string;
  cantidadMeses: string;
  fechaInicio: string;
  fechaFin: string;
}

const PromotionsSectionComponent: React.FC<PromotionsSectionProps> = ({ state }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    tipo: 'INTERNO',
    zona: '',
    tipoVenta: 'NATURAL',
    descuento: false,
    porcentajeDescuento: '',
    cantidadMeses: '',
    fechaInicio: '',
    fechaFin: '',
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    setFormData(prev => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      nombre: '',
      tipo: 'INTERNO',
      zona: '',
      tipoVenta: 'NATURAL',
      descuento: false,
      porcentajeDescuento: '',
      cantidadMeses: '',
      fechaInicio: '',
      fechaFin: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (promocion: Promocion) => {
    setIsEditing(true);
    setEditingId(promocion.id);
    setFormData({
      nombre: promocion.nombre,
      tipo: promocion.tipo,
      zona: promocion.zona,
      tipoVenta: promocion.tipoVenta,
      descuento: promocion.descuento,
      porcentajeDescuento: promocion.porcentajeDescuento?.toString() || '',
      cantidadMeses: promocion.cantidadMeses.toString(),
      fechaInicio: promocion.fechaInicio,
      fechaFin: promocion.fechaFin,
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    // Validaciones básicas
    if (!formData.nombre || !formData.zona || !formData.cantidadMeses || !formData.fechaInicio || !formData.fechaFin) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    if (formData.descuento && !formData.porcentajeDescuento) {
      alert('Por favor ingresa el porcentaje de descuento');
      return;
    }

    const cantidadMeses = parseInt(formData.cantidadMeses);
    const porcentajeDescuento = formData.descuento ? parseFloat(formData.porcentajeDescuento) : undefined;

    if (isNaN(cantidadMeses)) {
      alert('Por favor ingresa un número válido para cantidad de meses');
      return;
    }

    if (formData.descuento && (isNaN(porcentajeDescuento as number) || (porcentajeDescuento as number) < 0 || (porcentajeDescuento as number) > 100)) {
      alert('Por favor ingresa un porcentaje válido (0-100)');
      return;
    }

    const promocionData = {
      nombre: formData.nombre,
      tipo: formData.tipo,
      zona: formData.zona,
      tipoVenta: formData.tipoVenta,
      descuento: formData.descuento,
      porcentajeDescuento: porcentajeDescuento as (number | undefined),
      cantidadMeses,
      fechaInicio: formData.fechaInicio,
      fechaFin: formData.fechaFin,
      activa: true,
    };

    if (isEditing && editingId) {
      state.handleUpdatePromotion(editingId, promocionData);
    } else {
      state.handleCreatePromotion(promocionData);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta promoción?')) {
      state.handleDeletePromotion(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingId(null);
  };

  // Helper function to format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="promotions-section">
      {/* Header */}
      <div className="promotions-header">
        <div className="promotions-title">
          <h2>Gestión de Promociones</h2>
          <p>Crea y administra las promociones disponibles para los clientes</p>
        </div>
        <button className="btn-create-promotion" onClick={handleOpenCreate}>
          <BiPlus size={18} />
          Nueva Promoción
        </button>
      </div>

      {/* Promotions Table/Grid */}
      {state.promotions.length > 0 ? (
        <div className="promotions-container">
          <div className="promotions-list">
            {state.promotions.map((promo) => (
              <div key={promo.id} className="promotion-row">
                <div className="promo-main-info">
                  <h3 className="promo-name">{promo.nombre}</h3>
                  <div className="promo-badges">
                    <span className={`badge tipo ${promo.tipo.toLowerCase()}`}>
                      {promo.tipo}
                    </span>
                    <span className={`badge tipoVenta ${promo.tipoVenta.toLowerCase()}`}>
                      {promo.tipoVenta}
                    </span>
                    {promo.descuento && (
                      <span className="badge descuento">
                        -{promo.porcentajeDescuento}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="promo-details">
                  <div className="detail-item">
                    <span className="detail-label">📍 Zona</span>
                    <span className="detail-value">{promo.zona}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">📅 Vigencia</span>
                    <span className="detail-value">
                      {formatDate(promo.fechaInicio)} - {formatDate(promo.fechaFin)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">📆 Meses</span>
                    <span className="detail-value">{promo.cantidadMeses}</span>
                  </div>
                </div>

                <div className="promo-actions">
                  <button
                    className="btn-action edit"
                    onClick={() => handleOpenEdit(promo)}
                    title="Editar"
                  >
                    <BiPencil size={16} />
                  </button>
                  <button
                    className="btn-action delete"
                    onClick={() => handleDelete(promo.id)}
                    title="Eliminar"
                  >
                    <BiTrash size={16} />
                  </button>
                </div>

                <div className="promo-status">
                  <span className={`status-badge ${promo.activa ? 'active' : 'inactive'}`}>
                    {promo.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <p>🎉 No hay promociones registradas</p>
          <p>Crea tu primera promoción para comenzar</p>
        </div>
      )}

      {/* Modal para crear/editar */}
      <Modal
        isOpen={isModalOpen}
        title={isEditing ? 'Editar Promoción' : 'Nueva Promoción'}
        onClose={handleCloseModal}
      >
        <div className="modal-form">
          {/* Basic Info */}
          <div className="form-section">
            <h4>Información Básica</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleFormChange}
                  placeholder="Ej: Promoción Verano 2024"
                  maxLength={50}
                />
              </div>
              <div className="form-group">
                <label>Tipo *</label>
                <select name="tipo" value={formData.tipo} onChange={handleFormChange}>
                  <option value="INTERNO">Interno</option>
                  <option value="EXTERNO">Externo</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Zona *</label>
                <input
                  type="text"
                  name="zona"
                  value={formData.zona}
                  onChange={handleFormChange}
                  placeholder="Ej: Lima Centro"
                  maxLength={50}
                />
              </div>
              <div className="form-group">
                <label>Tipo de Venta *</label>
                <select name="tipoVenta" value={formData.tipoVenta} onChange={handleFormChange}>
                  <option value="NATURAL">Natural</option>
                  <option value="JURIDICA">Jurídica</option>
                </select>
              </div>
            </div>
          </div>

          {/* Descuento */}
          <div className="form-section">
            <h4>Descuento</h4>
            <div className="form-group checkbox">
              <input
                type="checkbox"
                id="descuento"
                name="descuento"
                checked={formData.descuento}
                onChange={handleFormChange}
              />
              <label htmlFor="descuento">¿Incluir descuento?</label>
            </div>

            {formData.descuento && (
              <div className="form-row">
                <div className="form-group">
                  <label>Porcentaje de Descuento (%)</label>
                  <input
                    type="number"
                    name="porcentajeDescuento"
                    value={formData.porcentajeDescuento}
                    onChange={handleFormChange}
                    placeholder="0-100"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Duración */}
          <div className="form-section">
            <h4>Duración</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Cantidad de Meses *</label>
                <input
                  type="number"
                  name="cantidadMeses"
                  value={formData.cantidadMeses}
                  onChange={handleFormChange}
                  placeholder="Ej: 12"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Fechas */}
          <div className="form-section">
            <h4>Vigencia</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Fecha de Inicio *</label>
                <input
                  type="date"
                  name="fechaInicio"
                  value={formData.fechaInicio}
                  onChange={handleFormChange}
                />
              </div>
              <div className="form-group">
                <label>Fecha de Fin *</label>
                <input
                  type="date"
                  name="fechaFin"
                  value={formData.fechaFin}
                  onChange={handleFormChange}
                />
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button className="btn-cancel" onClick={handleCloseModal}>
              Cancelar
            </button>
            <button className="btn-save" onClick={handleSave}>
              {isEditing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export const PromotionsSection = React.memo(PromotionsSectionComponent);
