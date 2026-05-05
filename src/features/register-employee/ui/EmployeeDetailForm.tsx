/**
 * Componente EmployeeDetailForm (moved to features/RRHH)
 */

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { FlatpickrDateInput } from '@shared/ui/date-picker';

import type { Employee, EmployeeDetailFormData } from '@shared/types';
import {
  NacionalidadEnum,
  EstadoCivilEnum,
  DistritoEnum,
  BancoEnum,
  RegimenEnum,
  ModalidadEnum,
  SeguroSaludEnum,
  SistemaPensionesEnum,
  PuestoTrabajoEnum,
  ParentescoEnum,
  EmpresaContratistaEnum,
} from '@shared/types';
import { enumToOptions, formatEnumLabel } from '@shared/utils/enumToOptions';
import './EmployeeDetailForm.css';

// Generate options from enums using the helper
const nacionalidadOptions = enumToOptions(NacionalidadEnum);
const civilStatusOptions = enumToOptions(EstadoCivilEnum);
const distritoOptions = enumToOptions(DistritoEnum);
const bancoOptions = enumToOptions(BancoEnum);
const regimenOptions = enumToOptions(RegimenEnum);
const modalidadOptions = enumToOptions(ModalidadEnum);
const seguroOptions = enumToOptions(SeguroSaludEnum);
const pensionOptions = enumToOptions(SistemaPensionesEnum);
const puestoOptions = enumToOptions(PuestoTrabajoEnum);
const parentescoOptions = enumToOptions(ParentescoEnum);
const empresaContratistaOptions = enumToOptions(EmpresaContratistaEnum);
const yesNoOptions = [
  { value: 'SI', label: 'Sí' },
  { value: 'NO', label: 'No' },
];
const nationalities = ['PERUANO', 'EXTRANJERO'];

interface EmployeeDetailFormProps {
  employee: Employee;
  onCancel: () => void;
  onSubmit?: (formData: EmployeeDetailFormData) => void;
  isEditMode?: boolean;
}

export const EmployeeDetailForm = ({ employee, onCancel, onSubmit, isEditMode = false }: EmployeeDetailFormProps) => {
  const [editMode, setEditMode] = useState(isEditMode);
  const [formData, setFormData] = useState<EmployeeDetailFormData>({
    ...employee,
  });

  console.log('EmployeeDetailForm - employee:', employee);
  console.log('EmployeeDetailForm - formData:', formData);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target as HTMLInputElement | HTMLSelectElement;
    let newVal: unknown = value;
    if (name === 'hasChildren') {
      newVal = value === 'SI' || value === true;
    }
    setFormData(prev => ({ ...prev, [name]: newVal }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);
    setEditMode(false);
  };

  const handleCancel = () => {
    setEditMode(false);
    onCancel();
  };

  const disabled = !editMode;

  return (
    <form className="employee-detail-form" onSubmit={handleSubmit}>
      <div className="form-sections-detail">
        {/* COLUMN 1: EMPLEADO */}
        <div className="section-group disabled">
          <h3 className="section-title">EMPLEADO</h3>
          <label>Nombres</label>
          <input
            name="nombres"
            value={formData.nombres || ''}
            onChange={handleChange}
            disabled={true}
          />
          <label>Apellidos</label>
          <input
            name="apellidos"
            value={formData.apellidos || ''}
            onChange={handleChange}
            disabled={true}
          />
          <label>Doc.</label>
          <input
            value={formData.documentType || ''}
            disabled={true}
          />
          <label>NÂ°Doc</label>
          <input
            name="documentNumber"
            value={formData.documentNumber || ''}
            onChange={handleChange}
            disabled={true}
          />
        </div>

        {/* COLUMN 2: DATOS PERSONALES & CONTACTO */}
        <div className="section-group">
          <h3 className="section-title">DATOS PERSONALES & CONTACTO</h3>
          <label>Fecha Nac.</label>
          <FlatpickrDateInput
            name="birthDate"
            value={formData.birthDate || ''}
            onChange={(value) => setFormData((prev) => ({ ...prev, birthDate: value }))}
            disabled={disabled}
          />
          <label>Nacionalidad</label>
          {disabled ? (
            <input
              value={formData.nationality || ''}
              disabled
            />
          ) : (
            <select
              name="nationality"
              value={formData.nationality || ''}
              onChange={handleChange}
            >
              <option value="">Seleccione...</option>
              {nationalities.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          )}
          <label>Estado Civil</label>
          {disabled ? (
            <input
              value={formData.civilStatus || ''}
              disabled
            />
          ) : (
            <select
              name="civilStatus"
              value={formData.civilStatus || ''}
              onChange={handleChange}
            >
              <option value="">Seleccione...</option>
              {civilStatusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          )}
          <label>Â¿Hijos?</label>
          {disabled ? (
            <input
              value={formData.hasChildren ? 'SI' : 'NO'}
              disabled
            />
          ) : (
            <select
              name="hasChildren"
              value={formData.hasChildren ? 'SI' : 'NO'}
              onChange={handleChange}
            >
              <option value="">Seleccione...</option>
              {yesNoOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          )}
          <label>Celular</label>
          <input
            name="phoneMobile"
            value={formData.phoneMobile || ''}
            onChange={handleChange}
            disabled={disabled}
          />
          <label>Email</label>
          <input
            name="personalEmail"
            value={formData.personalEmail || ''}
            onChange={handleChange}
            disabled={disabled}
          />
          <label>Distrito</label>
          {disabled ? (
            <input
              value={formData.district || ''}
              disabled
            />
          ) : (
            <select
              name="district"
              value={formData.district || ''}
              onChange={handleChange}
            >
              <option value="">Seleccione...</option>
              {distritoOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          )}
          <label>DirecciÃ³n</label>
          <input
            name="address"
            value={formData.address || ''}
            onChange={handleChange}
            disabled={disabled}
          />
        </div>

        {/* COLUMN 3: INFORMACIÃ“N LABORAL */}
        <div className="section-group">
          <h3 className="section-title">INFORMACIÃ“N LABORAL</h3>
          <label>RÃ©gimen</label>
          {disabled ? (
            <input
              value={(formData as any).contractRegimen || ''}
              disabled
            />
          ) : (
            <select
              name="contractRegimen"
              value={(formData as any).contractRegimen || ''}
              onChange={handleChange}
            >
              <option value="">Seleccione...</option>
              {regimenOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          )}
          <label>Modalidad</label>
          {disabled ? (
            <input
              value={(formData as any).contractModalidad || ''}
              disabled
            />
          ) : (
            <select
              name="contractModalidad"
              value={(formData as any).contractModalidad || ''}
              onChange={handleChange}
            >
              <option value="">Seleccione...</option>
              {modalidadOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          )}
          <label>Puesto</label>
          {disabled ? (
            <input
              value={(formData.position || '').replace(/_/g, ' ')}
              disabled
            />
          ) : (
            <select
              name="position"
              value={formData.position || ''}
              onChange={handleChange}
            >
              <option value="">Seleccione...</option>
              {puestoOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          )}
          <label>Sueldo</label>
          <input
            name="baseSalary"
            value={formData.baseSalary || ''}
            onChange={handleChange}
            disabled={disabled}
          />
          <label>Inicio</label>
          <FlatpickrDateInput
            name="startDate"
            value={formData.startDate || ''}
            onChange={(value) => setFormData((prev) => ({ ...prev, startDate: value }))}
            disabled={disabled}
          />
          <label>Fin</label>
          <FlatpickrDateInput
            name="endDate"
            value={formData.endDate || ''}
            onChange={(value) => setFormData((prev) => ({ ...prev, endDate: value }))}
            disabled={disabled}
            minDate={formData.startDate || undefined}
          />
          {((formData as any).contractRegimen || '').toUpperCase() === 'PLANILLA' && (
            <>
              <label>Seguro</label>
              {disabled ? (
                <input
                  value={(formData as any).contractSeguro || ''}
                  disabled
                />
              ) : (
                <select
                  name="contractSeguro"
                  value={(formData as any).contractSeguro || ''}
                  onChange={handleChange}
                >
                  <option value="">Seleccione...</option>
                  {seguroOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              )}
              <label>PensiÃ³n</label>
              {disabled ? (
                <input
                  value={(formData as any).contractPension || ''}
                  disabled
                />
              ) : (
                <select
                  name="contractPension"
                  value={(formData as any).contractPension || ''}
                  onChange={handleChange}
                >
                  <option value="">Seleccione...</option>
                  {pensionOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              )}
            </>
          )}
        </div>

        {/* COLUMN 4: INFORMACIÃ“N BANCARIA & TRANSFERENCIA */}
        <div className="section-group">
          <h3 className="section-title">INFORMACIÃ“N BANCARIA & TRANSFERENCIA</h3>
          <label>Banco</label>
          {disabled ? (
            <input
              value={formData.bank || ''}
              disabled
            />
          ) : (
            <select
              name="bank"
              value={formData.bank || ''}
              onChange={handleChange}
            >
              <option value="">Seleccione...</option>
              {bancoOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          )}
          <label>Cuenta</label>
          <input
            name="accountNumber"
            value={formData.accountNumber || ''}
            onChange={handleChange}
            disabled={disabled}
          />
          <label>Interbancaria</label>
          <input
            name="interbankNumber"
            value={formData.interbankNumber || ''}
            onChange={handleChange}
            disabled={disabled}
          />
          <label>Cuenta propia?</label>
          {disabled ? (
            <input
              value={formData.contractOwnAccount || ''}
              disabled
            />
          ) : (
            <select
              name="contractOwnAccount"
              value={formData.contractOwnAccount || ''}
              onChange={handleChange}
            >
              <option value="">Seleccione...</option>
              {yesNoOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          )}
          {(formData.contractOwnAccount || '').toLowerCase() !== 'sÃ­' && (
            <>
              <label>Parentesco</label>
              {disabled ? (
                <input
                  value={formData.contractKinship || ''}
                  disabled
                />
              ) : (
                <select
                  name="contractKinship"
                  value={formData.contractKinship || ''}
                  onChange={handleChange}
                >
                  <option value="">Seleccione...</option>
                  {parentescoOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              )}
            </>
          )}
          <label>Celular Transferencia</label>
          <input
            name="contractCellularTransfer"
            value={formData.contractCellularTransfer || ''}
            onChange={handleChange}
            disabled={disabled}
          />
          <label>Empresa Contratista</label>
          {disabled ? (
            <input
              value={formData.contractorCompany || ''}
              disabled
            />
          ) : (
            <select
              name="contractorCompany"
              value={formData.contractorCompany || ''}
              onChange={handleChange}
            >
              <option value="">Seleccione...</option>
              {empresaContratistaOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          )}
        </div>
      </div>
      <div className="form-actions-detail">
        <button type="button" className="btn-cancel" onClick={handleCancel}>
          {editMode ? 'CANCELAR' : 'CERRAR'}
        </button>
        {editMode && (
          <button type="submit" className="btn-submit">
            GUARDAR
          </button>
        )}
      </div>
    </form>
  );
};

