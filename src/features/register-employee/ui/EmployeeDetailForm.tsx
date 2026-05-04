/**
 * Componente EmployeeDetailForm (moved to features/RRHH)
 * Migrado al Design System con componentes reutilizables
 */

import React, { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { FlatpickrDateInput } from '@shared/ui/date-picker';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { cn } from '@shared/lib/utils';

import type { Employee, EmployeeDetailFormData } from '@shared/types';
import {
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
import { enumToOptions } from '@shared/utils/enumToOptions';

// Generate options from enums using the helper
// TODO: Migrar opciones a hooks reutilizables si se repite
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

/**
 * Componente de campo de formulario reutilizable
 */
interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({ label, children, required }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-foreground">
      {label} {required && <span className="text-destructive">*</span>}
    </label>
    {children}
  </div>
);

/**
 * Componente de input reutilizable
 */
interface FormInputProps {
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
}

const FormInput: React.FC<FormInputProps> = ({ 
  name, 
  value, 
  onChange, 
  disabled, 
  type = 'text',
  placeholder 
}) => (
  <input
    name={name}
    type={type}
    value={value}
    onChange={onChange}
    disabled={disabled}
    placeholder={placeholder}
    className={cn(
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
      'file:border-0 file:bg-transparent file:text-sm file:font-medium',
      'placeholder:text-muted-foreground',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50'
    )}
  />
);

/**
 * Componente de select reutilizable
 */
interface FormSelectProps {
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

const FormSelect: React.FC<FormSelectProps> = ({ 
  name, 
  value, 
  onChange, 
  disabled, 
  options,
  placeholder = 'Seleccione...'
}) => (
  <select
    name={name}
    value={value}
    onChange={onChange}
    disabled={disabled}
    className={cn(
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50'
    )}
  >
    <option value="">{placeholder}</option>
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

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
    if (name === 'hasChildren' || name === 'contractOwnAccount') {
      newVal = value === 'SI';
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* COLUMN 1: EMPLEADO */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">EMPLEADO</h3>
            <Badge variant="secondary" size="sm">Solo lectura</Badge>
          </div>
          
          <FormField label="Nombres">
            <FormInput
              name="nombres"
              value={formData.nombres || ''}
              onChange={handleChange}
              disabled={true}
            />
          </FormField>
          
          <FormField label="Apellidos">
            <FormInput
              name="apellidos"
              value={formData.apellidos || ''}
              onChange={handleChange}
              disabled={true}
            />
          </FormField>
          
          <FormField label="Tipo Doc.">
            <FormInput
              name="documentType"
              value={formData.documentType || ''}
              onChange={handleChange}
              disabled={true}
            />
          </FormField>
          
          <FormField label="N° Documento">
            <FormInput
              name="documentNumber"
              value={formData.documentNumber || ''}
              onChange={handleChange}
              disabled={true}
            />
          </FormField>
        </div>

        {/* COLUMN 2: DATOS PERSONALES & CONTACTO */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground pb-2 border-b border-border">
            DATOS PERSONALES & CONTACTO
          </h3>
          
          <FormField label="Fecha Nac.">
            <FlatpickrDateInput
              name="birthDate"
              value={formData.birthDate || ''}
              onChange={(value) => setFormData((prev) => ({ ...prev, birthDate: value }))}
              disabled={disabled}
            />
          </FormField>
          
          <FormField label="Nacionalidad">
            {disabled ? (
              <FormInput
                name="nationality"
                value={formData.nationality || ''}
                onChange={handleChange}
                disabled
              />
            ) : (
              <FormSelect
                name="nationality"
                value={formData.nationality || ''}
                onChange={handleChange}
                options={nationalities.map(n => ({ value: n, label: n }))}
              />
            )}
          </FormField>
          
          <FormField label="Estado Civil">
            {disabled ? (
              <FormInput
                name="civilStatus"
                value={formData.civilStatus || ''}
                onChange={handleChange}
                disabled
              />
            ) : (
              <FormSelect
                name="civilStatus"
                value={formData.civilStatus || ''}
                onChange={handleChange}
                options={civilStatusOptions}
              />
            )}
          </FormField>
          
          <FormField label="¿Hijos?">
            {disabled ? (
              <FormInput
                name="hasChildren"
                value={formData.hasChildren ? 'SI' : 'NO'}
                onChange={handleChange}
                disabled
              />
            ) : (
              <FormSelect
                name="hasChildren"
                value={formData.hasChildren ? 'SI' : 'NO'}
                onChange={handleChange}
                options={yesNoOptions}
              />
            )}
          </FormField>
          
          <FormField label="Celular">
            <FormInput
              name="phoneMobile"
              value={formData.phoneMobile || ''}
              onChange={handleChange}
              disabled={disabled}
            />
          </FormField>
          
          <FormField label="Email">
            <FormInput
              name="personalEmail"
              type="email"
              value={formData.personalEmail || ''}
              onChange={handleChange}
              disabled={disabled}
            />
          </FormField>
          
          <FormField label="Distrito">
            {disabled ? (
              <FormInput
                name="district"
                value={formData.district || ''}
                onChange={handleChange}
                disabled
              />
            ) : (
              <FormSelect
                name="district"
                value={formData.district || ''}
                onChange={handleChange}
                options={distritoOptions}
              />
            )}
          </FormField>
          
          <FormField label="Dirección">
            <FormInput
              name="address"
              value={formData.address || ''}
              onChange={handleChange}
              disabled={disabled}
            />
          </FormField>
        </div>

        {/* COLUMN 3: INFORMACIÓN LABORAL */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground pb-2 border-b border-border">
            INFORMACIÓN LABORAL
          </h3>
          
          <FormField label="Régimen">
            {disabled ? (
              <FormInput
                name="contractRegimen"
                value={(formData as unknown as { contractRegimen?: string }).contractRegimen || ''}
                onChange={handleChange}
                disabled
              />
            ) : (
              <FormSelect
                name="contractRegimen"
                value={(formData as unknown as { contractRegimen?: string }).contractRegimen || ''}
                onChange={handleChange}
                options={regimenOptions}
              />
            )}
          </FormField>
          
          <FormField label="Modalidad">
            {disabled ? (
              <FormInput
                name="contractModalidad"
                value={(formData as unknown as { contractModalidad?: string }).contractModalidad || ''}
                onChange={handleChange}
                disabled
              />
            ) : (
              <FormSelect
                name="contractModalidad"
                value={(formData as unknown as { contractModalidad?: string }).contractModalidad || ''}
                onChange={handleChange}
                options={modalidadOptions}
              />
            )}
          </FormField>
          
          <FormField label="Puesto">
            {disabled ? (
              <FormInput
                name="position"
                value={(formData.position || '').replace(/_/g, ' ')}
                onChange={handleChange}
                disabled
              />
            ) : (
              <FormSelect
                name="position"
                value={formData.position || ''}
                onChange={handleChange}
                options={puestoOptions}
              />
            )}
          </FormField>
          
          <FormField label="Sueldo">
            <FormInput
              name="baseSalary"
              type="number"
              value={String(formData.baseSalary || '')}
              onChange={handleChange}
              disabled={disabled}
            />
          </FormField>
          
          <FormField label="Fecha Inicio">
            <FlatpickrDateInput
              name="startDate"
              value={formData.startDate || ''}
              onChange={(value) => setFormData((prev) => ({ ...prev, startDate: value }))}
              disabled={disabled}
            />
          </FormField>
          
          <FormField label="Fecha Fin">
            <FlatpickrDateInput
              name="endDate"
              value={formData.endDate || ''}
              onChange={(value) => setFormData((prev) => ({ ...prev, endDate: value }))}
              disabled={disabled}
              minDate={formData.startDate || undefined}
            />
          </FormField>
          
          {((formData as unknown as { contractRegimen?: string }).contractRegimen || '').toUpperCase() === 'PLANILLA' && (
            <>
              <FormField label="Seguro">
                {disabled ? (
                  <FormInput
                    name="contractSeguro"
                    value={(formData as unknown as { contractSeguro?: string }).contractSeguro || ''}
                    onChange={handleChange}
                    disabled
                  />
                ) : (
                  <FormSelect
                    name="contractSeguro"
                    value={(formData as unknown as { contractSeguro?: string }).contractSeguro || ''}
                    onChange={handleChange}
                    options={seguroOptions}
                  />
                )}
              </FormField>
              
              <FormField label="Pensión">
                {disabled ? (
                  <FormInput
                    name="contractPension"
                    value={(formData as unknown as { contractPension?: string }).contractPension || ''}
                    onChange={handleChange}
                    disabled
                  />
                ) : (
                  <FormSelect
                    name="contractPension"
                    value={(formData as unknown as { contractPension?: string }).contractPension || ''}
                    onChange={handleChange}
                    options={pensionOptions}
                  />
                )}
              </FormField>
            </>
          )}
        </div>

        {/* COLUMN 4: INFORMACIÓN BANCARIA & TRANSFERENCIA */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground pb-2 border-b border-border">
            INFORMACIÓN BANCARIA & TRANSFERENCIA
          </h3>
          
          <FormField label="Banco">
            {disabled ? (
              <FormInput
                name="bank"
                value={formData.bank || ''}
                onChange={handleChange}
                disabled
              />
            ) : (
              <FormSelect
                name="bank"
                value={formData.bank || ''}
                onChange={handleChange}
                options={bancoOptions}
              />
            )}
          </FormField>
          
          <FormField label="Cuenta">
            <FormInput
              name="accountNumber"
              value={formData.accountNumber || ''}
              onChange={handleChange}
              disabled={disabled}
            />
          </FormField>
          
          <FormField label="Interbancaria">
            <FormInput
              name="interbankNumber"
              value={formData.interbankNumber || ''}
              onChange={handleChange}
              disabled={disabled}
            />
          </FormField>
          
          <FormField label="¿Cuenta propia?">
            {disabled ? (
              <FormInput
                name="contractOwnAccount"
                value={formData.contractOwnAccount ? 'SI' : 'NO'}
                onChange={handleChange}
                disabled
              />
            ) : (
              <FormSelect
                name="contractOwnAccount"
                value={formData.contractOwnAccount ? 'SI' : 'NO'}
                onChange={handleChange}
                options={yesNoOptions}
              />
            )}
          </FormField>
          
          {formData.contractOwnAccount !== true && (
            <FormField label="Parentesco">
              {disabled ? (
                <FormInput
                  name="contractKinship"
                  value={formData.contractKinship || ''}
                  onChange={handleChange}
                  disabled
                />
              ) : (
                <FormSelect
                  name="contractKinship"
                  value={formData.contractKinship || ''}
                  onChange={handleChange}
                  options={parentescoOptions}
                />
              )}
            </FormField>
          )}
          
          <FormField label="Celular Transferencia">
            <FormInput
              name="contractCellularTransfer"
              value={formData.contractCellularTransfer || ''}
              onChange={handleChange}
              disabled={disabled}
            />
          </FormField>
          
          <FormField label="Empresa Contratista">
            {disabled ? (
              <FormInput
                name="contractorCompany"
                value={formData.contractorCompany || ''}
                onChange={handleChange}
                disabled
              />
            ) : (
              <FormSelect
                name="contractorCompany"
                value={formData.contractorCompany || ''}
                onChange={handleChange}
                options={empresaContratistaOptions}
              />
            )}
          </FormField>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-border">
        <Button type="button" variant="outline" onClick={handleCancel}>
          {editMode ? 'CANCELAR' : 'CERRAR'}
        </Button>
        {editMode && (
          <Button type="submit">
            GUARDAR
          </Button>
        )}
      </div>
    </form>
  );
};
