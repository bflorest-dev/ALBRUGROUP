import React, { useState } from 'react';
import { BiPlus } from 'react-icons/bi';
import { Modal } from '@molecules/index';
import { AdvertiserAccountCard, type AdvertiserAccount } from './AdvertiserAccountCard';
import './AdvertiserAccountsSection.css';

interface AdvertiserAccountsFormData {
  name: string;
  accountNumber: string;
}

interface AdvertiserAccountsSectionProps {
  accounts: AdvertiserAccount[];
  onAccountsChange: (accounts: AdvertiserAccount[]) => void;
}

export const AdvertiserAccountsSection: React.FC<AdvertiserAccountsSectionProps> = ({ 
  accounts,
  onAccountsChange
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AdvertiserAccountsFormData>({
    name: '',
    accountNumber: ''
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Validación especial para accountNumber
    if (name === 'accountNumber') {
      // Solo permitir números y máximo 16 dígitos
      const numericValue = value.replace(/\D/g, '').slice(0, 16);
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({ name: '', accountNumber: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (account: AdvertiserAccount) => {
    setIsEditing(true);
    setEditingId(account.id);
    setFormData({ name: account.name, accountNumber: account.accountNumber });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.accountNumber) {
      alert('Por favor completa todos los campos');
      return;
    }

    // Validar que el número de cuenta sea solo números
    if (!/^\d+$/.test(formData.accountNumber)) {
      alert('El número de cuenta debe contener solo dígitos');
      return;
    }

    // Validar que el número de cuenta tenga entre 1 y 16 dígitos
    if (formData.accountNumber.length > 16) {
      alert('El número de cuenta no puede exceder 16 dígitos');
      return;
    }

    if (isEditing && editingId) {
      // Actualizar cuenta existente
      onAccountsChange(accounts.map(acc =>
        acc.id === editingId
          ? { ...acc, name: formData.name, accountNumber: formData.accountNumber }
          : acc
      ));
    } else {
      // Crear nueva cuenta
      const newAccount: AdvertiserAccount = {
        id: `${Date.now()}`,
        name: formData.name,
        accountNumber: formData.accountNumber
      };
      onAccountsChange([newAccount, ...accounts]);
    }

    setIsModalOpen(false);
    setFormData({ name: '', accountNumber: '' });
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta cuenta publicitaria?')) {
      onAccountsChange(accounts.filter(acc => acc.id !== id));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', accountNumber: '' });
    setIsEditing(false);
    setEditingId(null);
  };

  return (
    <div className="advertiser-accounts-section">
      {/* Header */}
      <div className="accounts-section-header">
        <div className="accounts-header-title">
          <h1>Cuentas Publicitarias</h1>
          <p>Gestiona tus cuentas de publicidad digital</p>
        </div>
        <button className="btn-new-account" onClick={handleOpenCreate}>
          <BiPlus size={18} />
          Nueva Cuenta
        </button>
      </div>

      {/* Grid de Cuentas */}
      {accounts.length > 0 ? (
        <div className="accounts-grid">
          {accounts.map((account, index) => (
            <AdvertiserAccountCard
              key={account.id}
              account={account}
              colorIndex={index}
              onDelete={handleDelete}
              onEdit={handleOpenEdit}
            />
          ))}
        </div>
      ) : (
        <div className="accounts-empty-state">
          <div className="empty-state-content">
            <h3>No hay cuentas publicitarias registradas</h3>
            <p>Crea tu primera cuenta para comenzar a gestionar campañas</p>
            <button className="btn-empty-create" onClick={handleOpenCreate}>
              <BiPlus size={20} />
              Crear Primera Cuenta
            </button>
          </div>
        </div>
      )}

      {/* Modal para crear/editar */}
      <Modal
        isOpen={isModalOpen}
        title={isEditing ? 'Editar Cuenta Publicitaria' : 'Nueva Cuenta Publicitaria'}
        onClose={handleCloseModal}
        className="medium"
      >
        <div className="account-form">
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="name">NOMBRE DE LA CUENTA *</label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="ej: Meta Ads - Fibra Hogar"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="accountNumber">NÚMERO DE CUENTA *</label>
              <input
                id="accountNumber"
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleFormChange}
                placeholder="ej: 123456789"
                className="form-input"
                inputMode="numeric"
              />
              <span className="form-helper-text">
                Solo números • Máximo 16 dígitos ({formData.accountNumber.length}/16)
              </span>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn-cancel" onClick={handleCloseModal}>
              Cancelar
            </button>
            <button className="btn-confirm" onClick={handleSave}>
              {isEditing ? 'Actualizar' : 'Crear'} Cuenta
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
