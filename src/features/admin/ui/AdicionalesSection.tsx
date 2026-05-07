import React, { useState } from 'react';
import { BiPlus, BiTrash, BiPencil } from 'react-icons/bi';
import { Modal } from '@shared/ui';
import type { Adicional } from '../types';
import type { AdminDashboardState } from '../hooks/useAdminDashboard';
import './AdicionalesSection.css';

interface AdicionalesSectionProps {
  state: AdminDashboardState;
}

interface FormData {
  nombre: string;
  precioUnitario: string;
}

const AdicionalesSectionComponent: React.FC<AdicionalesSectionProps> = ({ state }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    precioUnitario: '',
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({ nombre: '', precioUnitario: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (adicional: Adicional) => {
    setIsEditing(true);
    setEditingId(adicional.id ?? null);
    setFormData({
      nombre: adicional.nombre ?? '',
      precioUnitario: adicional.precioUnitario?.toString() ?? '0'
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.nombre || !formData.precioUnitario) {
      alert('Por favor completa todos los campos');
      return;
    }

    const precioUnitario = parseFloat(formData.precioUnitario);
    if (isNaN(precioUnitario) || precioUnitario < 0) {
      alert('El precio debe ser un número válido');
      return;
    }

    if (isEditing && editingId) {
      state.handleUpdateAdicional(editingId, {
        nombre: formData.nombre,
        precioUnitario,
        activo: true,
      });
    } else {
      state.handleCreateAdicional({
        nombre: formData.nombre,
        precioUnitario,
        activo: true,
      });
    }

    setIsModalOpen(false);
    setFormData({ nombre: '', precioUnitario: '' });
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este adicional?')) {
      state.handleDeleteAdicional(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ nombre: '', precioUnitario: '' });
    setIsEditing(false);
    setEditingId(null);
  };

  return (
    <div className="adicionales-section">
      {/* Header */}
      <div className="adicionales-header">
        <div className="adicionales-title">
          <h2>Gestión de Adicionales</h2>
          <p>Crea y administra los adicionales disponibles</p>
        </div>
        <button className="btn-create-adicional" onClick={handleOpenCreate}>
          <BiPlus size={18} />
          Nuevo Adicional
        </button>
      </div>

      {/* Cards Grid */}
      {(state.adicionales?.length ?? 0) > 0 ? (
        <div className="adicionales-grid">
          {(state.adicionales ?? []).map((adicional) => (
            <div key={adicional.id ?? 'adicional-default'} className="adicional-card">
              <div className="card-header">
                <h3 className="card-title">{adicional.nombre}</h3>
                <div className="card-actions">
                  <button
                    className="btn-action edit"
                    onClick={() => handleOpenEdit(adicional)}
                    title="Editar"
                  >
                    <BiPencil size={16} />
                  </button>
                  <button
                    className="btn-action delete"
                    onClick={() => adicional.id && handleDelete(adicional.id)}
                    title="Eliminar"
                  >
                    <BiTrash size={16} />
                  </button>
                </div>
              </div>
              <div className="card-price">
                <span className="price-label">Precio Unitario</span>
                <span className="price-value">S/ {(adicional.precioUnitario ?? 0).toFixed(2)}</span>
              </div>
              <div className="card-status">
                <span className={`status-badge ${adicional.activo ? 'active' : 'inactive'}`}>
                  {adicional.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>❌ No hay adicionales registrados</p>
          <p>Crea tu primer adicional para comenzar</p>
        </div>
      )}

      {/* Modal para crear/editar */}
      <Modal
        className="admin-modal medium"
        isOpen={isModalOpen}
        title={isEditing ? 'Editar Adicional' : 'Nuevo Adicional'}
        onClose={handleCloseModal}
      >
        <div className="modal-form">
          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleFormChange}
              placeholder="Ej: Antivirus, Protección..."
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label>Precio Unitario (S/)</label>
            <input
              type="number"
              name="precioUnitario"
              value={formData.precioUnitario}
              onChange={handleFormChange}
              placeholder="Ej: 29.99"
              step="0.01"
              min="0"
            />
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

export const AdicionalesSection = React.memo(AdicionalesSectionComponent);
