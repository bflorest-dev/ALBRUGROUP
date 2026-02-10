/**
 * Componente HireApplicantForm - Formulario para pasar postulante a empleado
 */

import { useState } from 'react';
import { AVAILABLE_POSITIONS_GROUPED } from '../../../utils/mockData';
import type { HireApplicantFormData, Applicant } from '../../../types';
import './HireApplicantForm.css';

interface HireApplicantFormProps {
  applicant: Applicant;
  onSubmit: (formData: HireApplicantFormData) => void;
  onCancel: () => void;
}

export const HireApplicantForm = ({ applicant, onSubmit, onCancel }: HireApplicantFormProps) => {
  const [formData, setFormData] = useState<HireApplicantFormData>({
    // Información Personal
    fullName: applicant?.fullName || '',
    documentType: 'DNI',
    documentNumber: applicant?.documentNumber || '',
    nationality: 'Peruana',
    birthDate: '',
    civilStatus: 'Soltero',
    hasChildren: false,
    // Información de Contacto
    district: '',
    address: '',
    phoneFixed: '',
    phoneMobile: applicant?.phoneMobile || '',
    phoneWork: '',
    // Información Bancaria
    bank: '',
    accountNumber: '',
    interbankNumber: '',
    baseSalary: '',
    // Información Laboral
    role: applicant?.positionOfInterest || '',
    startDate: '',
    modality: applicant?.modality || '',
    scheduleType: '',
    googleEmail: '',
    applicantId: applicant?.id || '',
  });

  const getAccountNumberMax = (bank: string): number => {
    switch (bank) {
      case 'BCP':
        return 14; // 13 o 14 dígitos
      case 'BBVA':
        return 20; // 18 o 20 dígitos
      case 'Interbank':
        return 13;
      case 'Scotiabank':
        return 12; // 10 a 12 dígitos
      default:
        return 20;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Validar nombre: solo letras y espacios
    if (name === 'fullName') {
      const alphabeticValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      setFormData((prev) => ({
        ...prev,
        [name]: alphabeticValue,
      }));
    }
    // Validar celulares: solo números y máximo 9 dígitos
    else if (name === 'phoneMobile' || name === 'phoneWork') {
      const numericValue = value.replace(/\D/g, '').slice(0, 9);
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
    }
    // Validar teléfono fijo: solo números y máximo 7 dígitos
    else if (name === 'phoneFixed') {
      const numericValue = value.replace(/\D/g, '').slice(0, 7);
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
    }
    // Validar documento: solo números, 8 para DNI y 9 para CE
    else if (name === 'documentNumber') {
      const numericValue = value.replace(/\D/g, '');
      const maxLength = formData.documentType === 'DNI' ? 8 : 9;
      const slicedValue = numericValue.slice(0, maxLength);
      setFormData((prev) => ({
        ...prev,
        [name]: slicedValue,
      }));
    }
    // Validar número de cuenta: solo números, máximo según banco
    else if (name === 'accountNumber') {
      const numericValue = value.replace(/\D/g, '');
      const maxLength = getAccountNumberMax(formData.bank);
      const slicedValue = numericValue.slice(0, maxLength);
      setFormData((prev) => ({
        ...prev,
        [name]: slicedValue,
      }));
    }
    // Validar número interbancario: solo números, máximo 20 dígitos
    else if (name === 'interbankNumber') {
      const numericValue = value.replace(/\D/g, '').slice(0, 20);
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
    }
    // Validar sueldo base: solo números
    else if (name === 'baseSalary') {
      const numericValue = value.replace(/\D/g, '');
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
    }
    // Convertir hasChildren de string a boolean
    else if (name === 'hasChildren') {
      setFormData((prev) => ({
        ...prev,
        [name]: value === 'true',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.documentNumber || !formData.role || !formData.startDate) {
      alert('Por favor completa los campos requeridos');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form className="hire-applicant-form" onSubmit={handleSubmit}>
      <div className="form-columns">
        {/* Columna 1: Información Personal */}
        <div className="form-column">
          <h4>INFORMACIÓN PERSONAL</h4>
          
          <div className="form-group">
            <label htmlFor="fullName">
              NOMBRE COMPLETO <span className="required">*</span>
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              placeholder="Ingrese el nombre completo"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="documentType">TIPO DOCUMENTO</label>
              <select
                id="documentType"
                name="documentType"
                value={formData.documentType}
                onChange={handleChange}
              >
                <option value="DNI">DNI</option>
                <option value="CE">CE</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="documentNumber">
                N° DOCUMENTO <span className="required">*</span>
              </label>
              <input
                type="text"
                id="documentNumber"
                name="documentNumber"
                placeholder="Número de documento"
                value={formData.documentNumber}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nationality">NACIONALIDAD</label>
              <select
                id="nationality"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
              >
                <option value="Peruana">Peruana</option>
                <option value="Extranjera">Extranjera</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="birthDate">FECHA NACIMIENTO</label>
              <input
                type="date"
                id="birthDate"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="civilStatus">ESTADO CIVIL</label>
              <select
                id="civilStatus"
                name="civilStatus"
                value={formData.civilStatus}
                onChange={handleChange}
              >
                <option value="Soltero">Soltero</option>
                <option value="Casado">Casado</option>
                <option value="Divorciado">Divorciado</option>
                <option value="Viudo">Viudo</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="hasChildren">¿TIENE HIJOS?</label>
              <select
                id="hasChildren"
                name="hasChildren"
                value={formData.hasChildren ? 'true' : 'false'}
                onChange={handleChange}
              >
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
            </div>
          </div>
        </div>

        {/* Columna 2: Información de Contacto */}
        <div className="form-column">
          <h4>INFORMACIÓN DE CONTACTO</h4>
          
          <div className="form-group">
            <label htmlFor="district">DISTRITO <span className="required">*</span></label>
            <input
              type="text"
              id="district"
              name="district"
              placeholder="Ingrese el distrito"
              value={formData.district}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">DIRECCIÓN <span className="required">*</span></label>
            <input
              type="text"
              id="address"
              name="address"
              placeholder="Ingrese la dirección"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phoneFixed">TELÉFONO FIJO</label>
            <input
              type="tel"
              id="phoneFixed"
              name="phoneFixed"
              placeholder="Teléfono fijo"
              value={formData.phoneFixed}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phoneMobile">CELULAR PERSONAL</label>
            <input
              type="tel"
              id="phoneMobile"
              name="phoneMobile"
              placeholder="Celular personal"
              value={formData.phoneMobile}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phoneWork">CELULAR TRABAJO</label>
            <input
              type="tel"
              id="phoneWork"
              name="phoneWork"
              placeholder="Celular trabajo"
              value={formData.phoneWork}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Columna 3: Información Bancaria */}
        <div className="form-column">
          <h4>INFORMACIÓN BANCARIA</h4>
          
          <div className="form-group">
            <label htmlFor="bank">BANCO</label>
            <select
              id="bank"
              name="bank"
              value={formData.bank}
              onChange={handleChange}
            >
              <option value="">Seleccionar banco...</option>
              <option value="BCP">BCP</option>
              <option value="BBVA">BBVA</option>
              <option value="Interbank">Interbank</option>
              <option value="Scotiabank">Scotiabank</option>
              <option value="Izipay">Izipay</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="accountNumber">NÚMERO DE CUENTA</label>
            <input
              type="text"
              id="accountNumber"
              name="accountNumber"
              placeholder="Número de cuenta"
              value={formData.accountNumber}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="interbankNumber">N° CUENTA INTERBANCARIA</label>
            <input
              type="text"
              id="interbankNumber"
              name="interbankNumber"
              placeholder="Número interbancario"
              value={formData.interbankNumber}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="baseSalary">SUELDO BASE</label>
            <input
              type="text"
              id="baseSalary"
              name="baseSalary"
              placeholder="Ingrese el sueldo base"
              value={formData.baseSalary}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Columna 4: Información Laboral */}
        <div className="form-column">
          <h4>INFORMACIÓN LABORAL</h4>
          
          <div className="form-group">
            <label htmlFor="role">
              ROL <span className="required">*</span>
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar rol...</option>
              {Object.entries(AVAILABLE_POSITIONS_GROUPED).map(([category, positions]) => (
                <optgroup key={category} label={category}>
                  {positions.map((position) => (
                    <option key={position} value={position}>
                      {category === 'RRHH' || category === 'CONTADOR' || category === 'COMMUNITY' 
                        ? position 
                        : `  ${position}`}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">
                FECHA INGRESO <span className="required">*</span>
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="modality">MODALIDAD <span className="required">*</span></label>
            <select
              id="modality"
              name="modality"
              value={formData.modality}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar modalidad...</option>
              <option value="PART TIME">PART TIME</option>
              <option value="SEMI FULL">SEMI FULL</option>
              <option value="FULL TIME">FULL TIME</option>
              <option value="SUPER FULL">SUPER FULL</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="scheduleType">TIPO DE HORARIO</label>
            <select
              id="scheduleType"
              name="scheduleType"
              value={formData.scheduleType}
              onChange={handleChange}
            >
              <option value="">Seleccionar tipo de horario...</option>
              <option value="PRESENCIAL">PRESENCIAL</option>
              <option value="SEMIPRESENCIAL">SEMIPRESENCIAL</option>
              <option value="REMOTO">REMOTO</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="googleEmail">CORREO GOOGLE (PERFIL CHROME)</label>
            <input
              type="email"
              id="googleEmail"
              name="googleEmail"
              placeholder="correo@dominio.com"
              value={formData.googleEmail}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-hire">
          + REGISTRAR EMPLEADO
        </button>
        <button type="button" className="btn-cancel" onClick={onCancel}>
          CANCELAR
        </button>
      </div>
    </form>
  );
};
