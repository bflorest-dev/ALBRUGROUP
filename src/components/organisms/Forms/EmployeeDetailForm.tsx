/**
 * Componente EmployeeDetailForm - Formulario para ver/editar detalles de empleado
 */

import { useState } from 'react';
import { AVAILABLE_POSITIONS_GROUPED } from '../../../utils/mockData';
import type { Employee, EmployeeDetailFormData } from '../../../types';
import './EmployeeDetailForm.css';

interface EmployeeDetailFormProps {
  employee: Employee;
  onCancel: () => void;
  onSubmit?: (formData: EmployeeDetailFormData) => void;
  isEditMode?: boolean;
}

export const EmployeeDetailForm = ({ 
  employee, 
  onCancel,
  onSubmit,
  isEditMode = false
}: EmployeeDetailFormProps) => {
  const [editMode, setEditMode] = useState(isEditMode);
  const [formData, setFormData] = useState<EmployeeDetailFormData>({
    nombres: employee.nombres || '',
    apellidos: employee.apellidos || '',
    documentType: employee.documentType || '',
    documentNumber: employee.documentNumber || '',
    nationality: employee.nationality || '',
    birthDate: employee.birthDate || '',
    civilStatus: employee.civilStatus || '',
    hasChildren: employee.hasChildren || false,
    district: employee.district || '',
    address: employee.address || '',
    phoneFixed: employee.phoneFixed || '',
    phoneMobile: employee.phoneMobile || '',
    phoneWork: employee.phoneWork || '',
    personalEmail: employee.personalEmail || '',
    bank: employee.bank || '',
    accountNumber: employee.accountNumber || '',
    interbankNumber: employee.interbankNumber || '',
    baseSalary: employee.baseSalary || '',
    startDate: employee.startDate || '',
    endDate: employee.endDate || '',
    modality: employee.modality || '',
    scheduleType: employee.scheduleType || '',
    googleEmail: employee.googleEmail || '',
    position: employee.position || '',
    department: employee.department || '',
    status: employee.status || 'ACTIVO',
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
    const { name, value, type } = e.target;
    const inputElement = e.target as HTMLInputElement;
    
    // Validar nombre: solo letras y espacios
    if (name === 'nombres' || name === 'apellidos') {
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
    } else if (name === 'hasChildren') {
      setFormData((prev) => ({
        ...prev,
        [name]: value === 'true',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? inputElement.checked : value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
    setEditMode(false);
  };

  const handleCancel = () => {
    setEditMode(false);
    setFormData({
      nombres: employee.nombres || '',
      apellidos: employee.apellidos || '',
      documentType: employee.documentType || '',
      documentNumber: employee.documentNumber || '',
      nationality: employee.nationality || '',
      birthDate: employee.birthDate || '',
      civilStatus: employee.civilStatus || '',
      hasChildren: employee.hasChildren || false,
      district: employee.district || '',
      address: employee.address || '',
      phoneFixed: employee.phoneFixed || '',
      phoneMobile: employee.phoneMobile || '',
      phoneWork: employee.phoneWork || '',
      personalEmail: employee.personalEmail || '',
      bank: employee.bank || '',
      accountNumber: employee.accountNumber || '',
      interbankNumber: employee.interbankNumber || '',
      baseSalary: employee.baseSalary || '',
      startDate: employee.startDate || '',
      endDate: employee.endDate || '',
      modality: employee.modality || '',
      scheduleType: employee.scheduleType || '',
      googleEmail: employee.googleEmail || '',
      position: employee.position || '',
      department: employee.department || '',
      status: employee.status || 'ACTIVO',
    });
    onCancel();
  };

  const renderValue = (value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No';
    }
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(value).toLocaleDateString('es-PE');
    }
    return String(value);
  };

  const renderField = (fieldName: string, type: string = 'text') => {
    if (editMode) {
      const value = formData[fieldName as keyof typeof formData];
      const inputValue = typeof value === 'boolean' ? '' : (value || '');
      return (
        <input
          type={type}
          name={fieldName}
          value={inputValue}
          onChange={handleChange}
          className="form-input"
        />
      );
    }
    return <p className="value">{renderValue(formData[fieldName as keyof typeof formData])}</p>;
  };

  return (
    <form className="employee-detail-form" onSubmit={handleSubmit}>
      <div className="form-content">
        <div className="employee-header">
          <div className="employee-avatar-large">{employee.initials}</div>
          <div className="employee-header-info">
            <h2>{employee.fullName}</h2>
            <p className="position">{employee.position}</p>
            <p className="department">{employee.department}</p>
          </div>
        </div>

        <div className="form-sections-detail">
          {/* Información Personal */}
          <div className="form-section-detail">
            <h3>Información Personal</h3>

            <div className="form-row">
              <div className="form-item">
                <label>NOMBRES</label>
                {editMode ? renderField('nombres') : <p className="value">{renderValue(formData.nombres)}</p>}
              </div>
              <div className="form-item">
                <label>APELLIDOS</label>
                {editMode ? renderField('apellidos') : <p className="value">{renderValue(formData.apellidos)}</p>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-item">
                <label>TIPO DOCUMENTO</label>
                {editMode ? (
                  <select
                    name="documentType"
                    value={formData.documentType}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="DNI">DNI</option>
                    <option value="CE">CE</option>
                  </select>
                ) : (
                  <p className="value">{renderValue(formData.documentType)}</p>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-item">
                <label>N° DOCUMENTO</label>
                {editMode ? renderField('documentNumber') : <p className="value">{renderValue(formData.documentNumber)}</p>}
              </div>
              <div className="form-item">
                <label>NACIONALIDAD</label>
                {editMode ? (
                  <select
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="Peruana">Peruana</option>
                    <option value="Extranjera">Extranjera</option>
                  </select>
                ) : (
                  <p className="value">{renderValue(formData.nationality)}</p>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-item">
                <label>FECHA NACIMIENTO</label>
                {editMode ? renderField('birthDate', 'date') : <p className="value">{renderValue(formData.birthDate)}</p>}
              </div>
              <div className="form-item">
                <label>ESTADO CIVIL</label>
                {editMode ? (
                  <select
                    name="civilStatus"
                    value={formData.civilStatus}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="Soltero">Soltero</option>
                    <option value="Casado">Casado</option>
                    <option value="Divorciado">Divorciado</option>
                    <option value="Viudo">Viudo</option>
                  </select>
                ) : (
                  <p className="value">{renderValue(formData.civilStatus)}</p>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-item">
                <label>¿TIENE HIJOS?</label>
                {editMode ? (
                  <select
                    name="hasChildren"
                    value={formData.hasChildren ? 'true' : 'false'}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="false">No</option>
                    <option value="true">Sí</option>
                  </select>
                ) : (
                  <p className="value">{renderValue(formData.hasChildren)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="form-section-detail">
            <h3>Información de Contacto</h3>

            <div className="form-row">
              <div className="form-item">
                <label>DISTRITO</label>
                {editMode ? renderField('district') : <p className="value">{renderValue(formData.district)}</p>}
              </div>
              <div className="form-item">
                <label>DIRECCIÓN</label>
                {editMode ? renderField('address') : <p className="value">{renderValue(formData.address)}</p>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-item">
                <label>TELÉFONO FIJO</label>
                {editMode ? renderField('phoneFixed') : <p className="value">{renderValue(formData.phoneFixed)}</p>}
              </div>
              <div className="form-item">
                <label>EMAIL PERSONAL</label>
                {editMode ? renderField('personalEmail', 'email') : <p className="value">{renderValue(formData.personalEmail)}</p>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-item">
                <label>CELULAR PERSONAL</label>
                {editMode ? renderField('phoneMobile') : <p className="value">{renderValue(formData.phoneMobile)}</p>}
              </div>
              <div className="form-item">
                <label>CELULAR TRABAJO</label>
                {editMode ? renderField('phoneWork') : <p className="value">{renderValue(formData.phoneWork)}</p>}
              </div>
            </div>
          </div>

          {/* Información Bancaria */}
          <div className="form-section-detail">
            <h3>Información Bancaria</h3>

            <div className="form-row">
              <div className="form-item">
                <label>BANCO</label>
                {editMode ? (
                  <select
                    name="bank"
                    value={formData.bank}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="BCP">BCP</option>
                    <option value="INTERBANK">INTERBANK</option>
                    <option value="BBVA">BBVA</option>
                    <option value="SCOTIABANK">SCOTIABANK</option>
                    <option value="OTROS">OTROS</option>
                  </select>
                ) : (
                  <p className="value">{renderValue(formData.bank)}</p>
                )}
              </div>
              <div className="form-item">
                <label>N° CUENTA</label>
                {editMode ? renderField('accountNumber') : <p className="value">{renderValue(formData.accountNumber)}</p>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-item">
                <label>N° CUENTA INTERBANCARIA</label>
                {editMode ? renderField('interbankNumber') : <p className="value">{renderValue(formData.interbankNumber)}</p>}
              </div>
              <div className="form-item">
                <label>SUELDO BASE</label>
                {editMode ? renderField('baseSalary') : <p className="value">{renderValue(formData.baseSalary)}</p>}
              </div>
            </div>
          </div>

          {/* Información Laboral */}
          <div className="form-section-detail">
            <h3>Información Laboral</h3>

            <div className="form-row">
              <div className="form-item">
                <label>FECHA DE INGRESO</label>
                {editMode ? renderField('startDate', 'date') : <p className="value">{renderValue(formData.startDate)}</p>}
              </div>
              <div className="form-item">
                <label>FECHA DE BAJA</label>
                {editMode ? renderField('endDate', 'date') : <p className="value">{renderValue(formData.endDate)}</p>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-item">
                <label>MODALIDAD <span className="required">*</span></label>
                {editMode ? (
                  <select
                    name="modality"
                    value={formData.modality}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    <option value="">Seleccionar modalidad...</option>
                    <option value="PART TIME">PART TIME</option>
                    <option value="SEMI FULL">SEMI FULL</option>
                    <option value="FULL TIME">FULL TIME</option>
                    <option value="SUPER FULL">SUPER FULL</option>
                  </select>
                ) : (
                  <p className="value">{renderValue(formData.modality)}</p>
                )}
              </div>
              <div className="form-item">
                <label>ROL</label>
                {editMode ? (
                  <select
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    className="form-input"
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
                ) : (
                  <p className="value">{renderValue(formData.position)}</p>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-item">
                <label>TIPO DE HORARIO</label>
                {editMode ? (
                  <select
                    name="scheduleType"
                    value={formData.scheduleType}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="">Seleccionar tipo de horario...</option>
                    <option value="PRESENCIAL">PRESENCIAL</option>
                    <option value="SEMIPRESENCIAL">SEMIPRESENCIAL</option>
                    <option value="REMOTO">REMOTO</option>
                  </select>
                ) : (
                  <p className="value">{renderValue(formData.scheduleType)}</p>
                )}
              </div>
              <div className="form-item">
                <label>CORREO GOOGLE</label>
                {editMode ? renderField('googleEmail', 'email') : <p className="value">{renderValue(formData.googleEmail)}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="form-actions-detail">
        {editMode ? (
          <>
            <button type="submit" className="btn-submit">
              ✓ Guardar Cambios
            </button>
            <button type="button" className="btn-cancel" onClick={handleCancel}>
              Cancelar
            </button>
          </>
        ) : (
          <button type="button" className="btn-close" onClick={onCancel}>
            Cerrar
          </button>
        )}
      </div>
    </form>
  );
};
