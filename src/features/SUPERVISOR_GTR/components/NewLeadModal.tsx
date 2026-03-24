import React from 'react';
import type { NewLeadFormData } from '@caracteristicas/gestion-leads/modelo/useNewLeadForm';
import { Modal } from '@compartido/ui/moleculas/Modal';
import { Button } from '@compartido/ui/atomos/Button';
import { Spinner } from '@compartido/ui/atomos/Spinner';

/**
 * Mensajes de validación de teléfono por país
 */
const getPhoneValidationMessage = (pois: string): string => {
  const messages: Record<string, string> = {
    '.pe': '📱 Perú: 9 dígitos (ej: 987123456)',
    '.mx': '📱 México: 10 dígitos (ej: 5551234567)',
    '.co': '📱 Colombia: 10 dígitos (ej: 3001234567)',
    '.cl': '📱 Chile: 9 dígitos (ej: 912345678)',
    '.ar': '📱 Argentina: 10 dígitos (ej: 1123456789)',
  };
  return messages[pois] || '📱 Ingrese un número válido';
};

/**
 * Interfaz de props para el modal
 */
interface NewLeadModalProps {
  isOpen: boolean;
  formData: NewLeadFormData;
  errors: Record<string, string>;
  campaigns: string[];
  isSubmitting?: boolean;
  submitError?: string | null;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: () => void;
  onClose: () => void;
}

/**
 * NewLeadModal Component (Container)
 * 
 * Modal para registrar un nuevo lead con formulario validado
 * Maneja estados de envío, validación y errores de servidor
 * 
 * Funcionalidad:
 * - Formulario con 5 campos: País, Teléfono, Campaña, Canal, Base
 * - Validación en tiempo real: marca campos con errores
 * - Validación de teléfono según país seleccionado
 * - Feedback durante envío: botón deshabilitado + spinner
 * - Manejo de errores del servidor con alert rojo
 * 
 * Estados:
 * - Reposo: Formulario normal, botón habilitado
 * - Enviando: Botón deshabilitado con spinner + "Creando..."
 * - Error: Message de error rojo al tope del formulario
 * 
 * Validaciones:
 * - País: Requerido (determina formato de teléfono)
 * - Teléfono (LEAD): Requerido, solo números
 * - Campaña: Requerido, selección de lista
 * - Canal: Requerido (Facebook, Instagram, WhatsApp)
 * - Base: Requerido, selección de lista
 * 
 * @component
 * @param {boolean} isOpen - Control de visibilidad del modal
 * @param {NewLeadFormData} formData - Valores actuales del formulario
 * @param {Record<string, string>} errors - Errores de validación por field
 * @param {string[]} campaigns - Lista de campañas disponibles
 * @param {boolean} [isSubmitting=false] - Flag de envío en progreso
 * @param {string | null} [submitError=null] - Mensaje de error del servidor
 * @param {(e) => void} onFormChange - Handler de cambios en inputs
 * @param {() => void} onSubmit - Callback al hacer clic en botón "Crear"
 * @param {() => void} onClose - Callback al cerrar modal
 * @returns {JSX.Element} Modal con formulario
 * 
 * @example
 * <NewLeadModal
 *   isOpen={isModalOpen}
 *   formData={formData}
 *   errors={errors}
 *   campaigns={campaigns}
 *   isSubmitting={isSubmitting}
 *   submitError={submitError}
 *   onFormChange={handleChange}
 *   onSubmit={handleCreateNewLead}
 *   onClose={handleCloseModal}
 * />
 */
export const NewLeadModal: React.FC<NewLeadModalProps> = ({
  isOpen,
  formData,
  errors,
  campaigns,
  isSubmitting = false,
  submitError,
  onFormChange,
  onSubmit,
  onClose,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      title="Registrar Nuevo Lead - Solo números por país"
      onClose={onClose}
      className="small"
    >
      <div className="modal-content">
        {/* Error al enviar */}
        {submitError && (
          <div className="alert alert-error" style={{ marginBottom: '15px' }}>
            <strong>Error:</strong> {submitError}
            <button 
              style={{ marginLeft: '10px', cursor: 'pointer', color: '#dc2626' }}
              onClick={() => {}}
            >
              ✕
            </button>
          </div>
        )}
        {/* Fila 1: PAÍS + LEAD */}
        <div className="form-grid grid-1-2">
          <div>
            <label className="form-label">PAÍS {errors.pois && <span className="error-text">*</span>}</label>
            <select
              name="pois"
              value={formData.pois}
              onChange={onFormChange}
              className={`form-control ${errors.pois ? 'input-error' : ''}`}
            >
              <option value="">País</option>
              <option value=".pe">🇵🇪 Perú</option>
              <option value=".mx">🇲🇽 México</option>
              <option value=".co">🇨🇴 Colombia</option>
              <option value=".cl">🇨🇱 Chile</option>
              <option value=".ar">🇦🇷 Argentina</option>
              <option value=".br">🇧🇷 Brasil</option>
              <option value=".ve">🇻🇪 Venezuela</option>
              <option value=".ec">🇪🇨 Ecuador</option>
              <option value=".bo">🇧🇴 Bolivia</option>
              <option value=".py">🇵🇾 Paraguay</option>
              <option value=".uy">🇺🇾 Uruguay</option>
              <option value=".gt">🇬🇹 Guatemala</option>
              <option value=".sv">🇸🇻 El Salvador</option>
              <option value=".hn">🇭🇳 Honduras</option>
              <option value=".ni">🇳🇮 Nicaragua</option>
              <option value=".cr">🇨🇷 Costa Rica</option>
              <option value=".pa">🇵🇦 Panamá</option>
              <option value=".do">🇩🇴 República Dominicana</option>
              <option value=".cu">🇨🇺 Cuba</option>
              <option value=".es">🇪🇸 España</option>
            </select>
            {errors.pois && <small className="error-message">{errors.pois}</small>}
          </div>

          <div>
            <label className="form-label">LEAD {errors.name && <span className="error-text">*</span>}</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={onFormChange}
              placeholder="Solo números"
              className={`form-control ${errors.name ? 'input-error' : ''}`}
            />
            {formData.pois && !errors.name && (
              <small className="validation-msg">
                {getPhoneValidationMessage(formData.pois)}
              </small>
            )}
            {errors.name && <small className="error-message">{errors.name}</small>}
          </div>
        </div>

        {/* Fila 2: CAMPAÑA */}
        <div>
          <label className="form-label">CAMPAÑA {errors.campaign && <span className="error-text">*</span>}</label>
          <select
            name="campaign"
            value={formData.campaign}
            onChange={onFormChange}
            className={`form-control ${errors.campaign ? 'input-error' : ''}`}
          >
            <option value="">Seleccionar campaña</option>
            {campaigns.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.campaign && <small className="error-message">{errors.campaign}</small>}
        </div>

        {/* Fila 3: CANAL + BASE */}
        <div className="form-grid grid-1-1">
          <div>
            <label className="form-label">CANAL {errors.channel && <span className="error-text">*</span>}</label>
            <select
              name="channel"
              value={formData.channel}
              onChange={onFormChange}
              className={`form-control ${errors.channel ? 'input-error' : ''}`}
            >
              <option value="">Seleccionar canal</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="WhatsApp">WhatsApp</option>
            </select>
            {errors.channel && <small className="error-message">{errors.channel}</small>}
          </div>

          <div>
            <label className="form-label">BASE {errors.base && <span className="error-text">*</span>}</label>
            <select
              name="base"
              value={formData.base}
              onChange={onFormChange}
              className={`form-control ${errors.base ? 'input-error' : ''}`}
            >
              <option value="">Seleccionar base</option>
              <option value="WSP">WSP</option>
              <option value="MSN">MSN</option>
              <option value="Referido">Referido</option>
              <option value="Masivo">Masivo</option>
            </select>
            {errors.base && <small className="error-message">{errors.base}</small>}
          </div>
        </div>
      </div>

      <div className="modal-actions">
        <Button variant="ghost" className="flex-1" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button variant="primary" className="flex-1" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Spinner />
              Creando...
            </span>
          ) : (
            'Crear Lead'
          )}
        </Button>
      </div>

      <style>{`
        .error-text {
          color: #ef4444;
          margin-left: 4px;
        }

        .error-message {
          color: #dc3545;
          font-size: 12px;
          margin-top: 5px;
          display: block;
        }

        .validation-msg {
          color: #059669;
          font-size: 12px;
          margin-top: 5px;
          display: block;
        }

        .form-control.input-error {
          border-color: #ef4444;
          background-color: #fcefef;
        }

        .form-grid {
          display: grid;
          gap: 15px;
          margin-bottom: 15px;
        }

        .grid-1-2 {
          grid-template-columns: 1fr 1fr;
        }

        .grid-1-1 {
          grid-template-columns: 1fr 1fr;
        }

        .form-label {
          display: block;
          font-weight: 500;
          margin-bottom: 5px;
          font-size: 14px;
          color: #374151;
        }
      `}</style>
    </Modal>
  );
};
