import React, { useState } from 'react';
import { BiPlus } from 'react-icons/bi';
import { Modal } from '@molecules/index';
import { CompanyCard, type Company } from './CompanyCard';
import './CompaniesSection.css';

interface CompaniesFormData {
  name: string;
  color: string;
}

interface CompaniesSectionProps {
  companies: Company[];
  onCompaniesChange: (companies: Company[]) => void;
}

export const CompaniesSection: React.FC<CompaniesSectionProps> = ({ 
  companies,
  onCompaniesChange 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CompaniesFormData>({
    name: '',
    color: '#10B981'
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
    setEditingCompanyId(null);
    setFormData({ name: '', color: '#10B981' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (company: Company) => {
    setIsEditing(true);
    setEditingCompanyId(company.id);
    setFormData({ 
      name: company.name, 
      color: company.color || '#10B981' 
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Por favor completa el nombre de la compañía');
      return;
    }

    if (isEditing && editingCompanyId) {
      // Editar compañía existente
      onCompaniesChange(companies.map(comp =>
        comp.id === editingCompanyId
          ? { ...comp, name: formData.name, color: formData.color }
          : comp
      ));
    } else {
      // Crear nueva compañía
      const newCompany: Company = {
        id: `${Date.now()}`,
        name: formData.name,
        status: 'ACTIVO',
        color: formData.color
      };
      onCompaniesChange([newCompany, ...companies]);
    }

    setIsModalOpen(false);
    setFormData({ name: '', color: '#10B981' });
    setIsEditing(false);
    setEditingCompanyId(null);
  };

  const handleStatusChange = (id: string, newStatus: 'ACTIVO' | 'INACTIVO') => {
    onCompaniesChange(companies.map(comp =>
      comp.id === id
        ? { ...comp, status: newStatus }
        : comp
    ));
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta compañía?')) {
      onCompaniesChange(companies.filter(comp => comp.id !== id));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', color: '#10B981' });
    setIsEditing(false);
    setEditingCompanyId(null);
  };

  return (
    <div className="companies-section">
      {/* Header */}
      <div className="companies-section-header">
        <div className="companies-header-title">
          <h1>Empresas</h1>
          <p>Gestiona las compañías registradas en el sistema</p>
        </div>
        <button className="btn-new-company" onClick={handleOpenCreate}>
          <BiPlus size={18} />
          Nueva Empresa
        </button>
      </div>

      {/* Grid de Empresas */}
      {companies.length > 0 ? (
        <div className="companies-grid">
          {companies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onStatusChange={handleStatusChange}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="companies-empty-state">
          <div className="empty-state-content">
            <h3>No hay compañías registradas</h3>
            <p>Crea tu primera compañía para comenzar a gestionar tus negocios</p>
            <button className="btn-empty-create" onClick={handleOpenCreate}>
              <BiPlus size={20} />
              Crear Primera Empresa
            </button>
          </div>
        </div>
      )}

      {/* Modal para crear/editar */}
      <Modal
        isOpen={isModalOpen}
        title={isEditing ? 'Editar Compañía' : 'Nueva Compañía'}
        onClose={handleCloseModal}
        className="medium"
      >
        <div className="company-form">
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="name">NOMBRE DE LA COMPAÑÍA *</label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="ej: Albrugroup Solutions"
                className="form-input"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="color">COLOR DE LA EMPRESA</label>
              <div className="color-picker-wrapper">
                <input
                  id="color"
                  type="color"
                  name="color"
                  value={formData.color}
                  onChange={handleFormChange}
                  className="color-picker-input"
                />
                <span className="color-code">{formData.color}</span>
              </div>
            </div>

            <div className="form-info">
              <p>
                <strong>Nota:</strong> El estado se asignará automáticamente como <strong>ACTIVO</strong>.
                Puedes cambiar el estado después desde la tarjeta de la compañía.
              </p>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn-cancel" onClick={handleCloseModal}>
              Cancelar
            </button>
            <button className="btn-confirm" onClick={handleSave}>
              {isEditing ? 'Actualizar' : 'Crear'} Compañía
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
