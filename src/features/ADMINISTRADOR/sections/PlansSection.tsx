import React, { useState } from 'react';
import { BiPlus, BiTrash, BiPencil } from 'react-icons/bi';
import { Modal } from '@molecules/index';
import type { Plan, InternetConfig, TeleviConfig, TelefonConfig } from '../types';
import type { AdminDashboardState } from '../hooks/useAdminDashboard';
import './PlansSection.css';

interface PlansSectionProps {
  state: AdminDashboardState;
}

interface FormData {
  nombre: string;
  precio: string;
  vigenciaDesde: string;
  vigenciaHasta: string;
  // Internet
  velocidad: string;
  unidad: 'Mbps' | 'Gbps';
  tecnologia: 'HFC' | 'HPPT';
  // Television
  tvNombre: string;
  cantidadCanales: string;
  // Telefono
  minutos: string;
  descripcion: string;
}

const PlansSectionComponent: React.FC<PlansSectionProps> = ({ state }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    precio: '',
    vigenciaDesde: '',
    vigenciaHasta: '',
    velocidad: '',
    unidad: 'Mbps',
    tecnologia: 'HFC',
    tvNombre: '',
    cantidadCanales: '',
    minutos: '',
    descripcion: '',
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      nombre: '',
      precio: '',
      vigenciaDesde: '',
      vigenciaHasta: '',
      velocidad: '',
      unidad: 'Mbps',
      tecnologia: 'HFC',
      tvNombre: '',
      cantidadCanales: '',
      minutos: '',
      descripcion: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: Plan) => {
    setIsEditing(true);
    setEditingId(plan.id);
    setFormData({
      nombre: plan.nombre,
      precio: plan.precio.toString(),
      vigenciaDesde: plan.vigenciaDesde,
      vigenciaHasta: plan.vigenciaHasta,
      velocidad: plan.internet.velocidad.toString(),
      unidad: plan.internet.unidad,
      tecnologia: plan.internet.tecnologia,
      tvNombre: plan.television.nombre,
      cantidadCanales: plan.television.cantidadCanales.toString(),
      minutos: plan.telefono.minutos.toString(),
      descripcion: plan.telefono.descripcion,
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    // Validaciones básicas
    if (!formData.nombre || !formData.precio || !formData.vigenciaDesde || !formData.vigenciaHasta) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    if (!formData.velocidad || !formData.tvNombre || !formData.cantidadCanales || !formData.minutos) {
      alert('Por favor completa todos los detalles del plan');
      return;
    }

    const precio = parseFloat(formData.precio);
    const velocidad = parseInt(formData.velocidad);
    const cantidadCanales = parseInt(formData.cantidadCanales);
    const minutos = parseInt(formData.minutos);

    if (isNaN(precio) || isNaN(velocidad) || isNaN(cantidadCanales) || isNaN(minutos)) {
      alert('Por favor ingresa números válidos');
      return;
    }

    const planData = {
      nombre: formData.nombre,
      precio,
      vigenciaDesde: formData.vigenciaDesde,
      vigenciaHasta: formData.vigenciaHasta,
      internet: {
        velocidad,
        unidad: formData.unidad,
        tecnologia: formData.tecnologia,
      } as InternetConfig,
      television: {
        nombre: formData.tvNombre,
        cantidadCanales,
      } as TeleviConfig,
      telefono: {
        minutos,
        descripcion: formData.descripcion,
      } as TelefonConfig,
      activo: true,
    };

    if (isEditing && editingId) {
      state.handleUpdatePlan(editingId, planData);
    } else {
      state.handleCreatePlan(planData);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este plan?')) {
      state.handleDeletePlan(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingId(null);
  };

  return (
    <div className="plans-section">
      {/* Header */}
      <div className="plans-header">
        <div className="plans-title">
          <h2>Gestión de Planes</h2>
          <p>Crea y administra los planes disponibles para los clientes</p>
        </div>
        <button className="btn-create-plan" onClick={handleOpenCreate}>
          <BiPlus size={18} />
          Nuevo Plan
        </button>
      </div>

      {/* Plans Grid */}
      {state.plans.length > 0 ? (
        <div className="plans-grid">
          {state.plans.map((plan) => (
            <div key={plan.id} className="plan-card">
              <div className="plan-header">
                <div>
                  <h3 className="plan-name">{plan.nombre}</h3>
                  <p className="plan-price">S/ {plan.precio.toFixed(2)}</p>
                </div>
                <div className="card-actions">
                  <button
                    className="btn-action edit"
                    onClick={() => handleOpenEdit(plan)}
                    title="Editar"
                  >
                    <BiPencil size={16} />
                  </button>
                  <button
                    className="btn-action delete"
                    onClick={() => handleDelete(plan.id)}
                    title="Eliminar"
                  >
                    <BiTrash size={16} />
                  </button>
                </div>
              </div>

              <div className="plan-details">
                {/* Internet */}
                <div className="detail-group">
                  <span className="detail-label">📶 Internet</span>
                  <p className="detail-content">
                    {plan.internet.velocidad} {plan.internet.unidad} • {plan.internet.tecnologia}
                  </p>
                </div>

                {/* Television */}
                <div className="detail-group">
                  <span className="detail-label">📺 Televisión</span>
                  <p className="detail-content">
                    {plan.television.nombre} - {plan.television.cantidadCanales} canales
                  </p>
                </div>

                {/* Telefono */}
                <div className="detail-group">
                  <span className="detail-label">☎️ Teléfono</span>
                  <p className="detail-content">
                    {plan.telefono.minutos} minutos • {plan.telefono.descripcion}
                  </p>
                </div>

                {/* Vigencia */}
                <div className="detail-group">
                  <span className="detail-label">📅 Vigencia</span>
                  <p className="detail-content">
                    {plan.vigenciaDesde} a {plan.vigenciaHasta}
                  </p>
                </div>
              </div>

              <div className="plan-footer">
                <span className={`status-badge ${plan.activo ? 'active' : 'inactive'}`}>
                  {plan.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>📋 No hay planes registrados</p>
          <p>Crea tu primer plan para comenzar</p>
        </div>
      )}

      {/* Modal para crear/editar */}
      <Modal
        isOpen={isModalOpen}
        title={isEditing ? 'Editar Plan' : 'Nuevo Plan'}
        onClose={handleCloseModal}
        className="large"
      >
        <div className="modal-form">
          {/* Básico */}
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
                  placeholder="Ej: Plan Premium"
                  maxLength={50}
                />
              </div>
              <div className="form-group">
                <label>Precio (S/) *</label>
                <input
                  type="number"
                  name="precio"
                  value={formData.precio}
                  onChange={handleFormChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Vigencia Desde *</label>
                <input
                  type="date"
                  name="vigenciaDesde"
                  value={formData.vigenciaDesde}
                  onChange={handleFormChange}
                />
              </div>
              <div className="form-group">
                <label>Vigencia Hasta *</label>
                <input
                  type="date"
                  name="vigenciaHasta"
                  value={formData.vigenciaHasta}
                  onChange={handleFormChange}
                />
              </div>
            </div>
          </div>

          {/* Internet */}
          <div className="form-section">
            <h4>📶 Internet</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Velocidad *</label>
                <input
                  type="number"
                  name="velocidad"
                  value={formData.velocidad}
                  onChange={handleFormChange}
                  placeholder="Ej: 100"
                  min="1"
                />
              </div>
              <div className="form-group">
                <label>Unidad *</label>
                <select name="unidad" value={formData.unidad} onChange={handleFormChange}>
                  <option value="Mbps">Mbps</option>
                  <option value="Gbps">Gbps</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tecnología *</label>
                <select name="tecnologia" value={formData.tecnologia} onChange={handleFormChange}>
                  <option value="HFC">HFC</option>
                  <option value="HPPT">HPPT</option>
                </select>
              </div>
            </div>
          </div>

          {/* Television */}
          <div className="form-section">
            <h4>📺 Televisión</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  name="tvNombre"
                  value={formData.tvNombre}
                  onChange={handleFormChange}
                  placeholder="Ej: Cable Premium"
                  maxLength={50}
                />
              </div>
              <div className="form-group">
                <label>Cantidad de Canales *</label>
                <input
                  type="number"
                  name="cantidadCanales"
                  value={formData.cantidadCanales}
                  onChange={handleFormChange}
                  placeholder="Ej: 150"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Telefono */}
          <div className="form-section">
            <h4>☎️ Teléfono</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Minutos *</label>
                <input
                  type="number"
                  name="minutos"
                  value={formData.minutos}
                  onChange={handleFormChange}
                  placeholder="Ej: 500"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Descripción *</label>
                <input
                  type="text"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleFormChange}
                  placeholder="Ej: Llamadas a nivel nacional"
                  maxLength={50}
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

export const PlansSection = React.memo(PlansSectionComponent);
