/**
 * Componente EmployeeDetailForm (moved to features/RRHH)
 */

import { useState } from 'react';

import type { Employee, EmployeeDetailFormData } from '@types';
import './EmployeeDetailForm.css';

// Constants for select options
const nationalities = ['PERUANO', 'EXTRANJERO'];
const civilStatuses = ['SOLTERO', 'CASADO', 'VIUDO', 'DIVORCIADO'];
const districts = [
  'ANCÓN','ATE','BARRANCO','BREÑA','CARABAYLLO','CERCADO DE LIMA','CHACLACAYO','CHORRILLOS','CIENEGUILLA','COMAS','EL AGUSTINO','INDEPENDENCIA','JESÚS MARÍA','LA MOLINA','LA VICTORIA','LINCE','LOS OLIVOS','LURÍN','LURIGANCHO','MAGDALENA DEL MAR','MIRAFLORES','PACHACÁMAC','PUCUSANA','PUEBLO LIBRE','PUENTE PIEDRA','PUNTA HERMOSA','PUNTA NEGRA','RÍMAC','SAN BARTOLO','SAN BORJA','SAN ISIDRO','SAN JUAN DE LURIGANCHO','SAN JUAN DE MIRAFLORES','SAN LUIS','SAN MARTÍN DE PORRES','SAN MIGUEL','SANTA ANITA','SANTA MARÍA DEL MAR','SANTA ROSA','SANTIAGO DE SURCO','SURQUILLO','VILLA EL SALVADOR','VILLA MARÍA DEL TRIUNFO'
];
const banks = ['BCP','BBVA','INTERBANK','SCOTIABANK','BANCO DE LA NACION'];
const regimens = ['RECIBO POR HONORARIOS', 'PLANILLA'];
const modalities = ['PART TIME', 'SEMI FULL', 'FULL TIME', 'SUPER FULL'];
const seguros = ['SIS', 'ESSALUD'];
const pensions = ['ONP', 'AFP INTEGRA', 'PROFUTURO AFP', 'AFP HABITAD', 'PRIMA AFP'];
const positions = [
  'ASESOR_VENTAS', 'ASESOR_POSTVENTA', 'ASESOR_GTR', 'ASESOR_BACKOFFICE', 'SUPERVISOR_VENTAS', 'SUPERVISOR_POSTVENTA', 'SUPERVISOR_GTR', 'SUPERVISOR_BACKOFFICE', 'CAPACITACION', 'RRHH', 'CONTABILIDAD', 'COMMUNITY', 'DESARROLLADOR', 'RECLUTAMIENTO'
];
const statuses = ['ACTIVO', 'INACTIVO'];

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as any;
    let newVal: any = value;
    if (name === 'hasChildren') {
      newVal = value === 'SI' || value === true;
    }
    setFormData(prev => ({ ...prev, [name]: newVal }));
  };

  const handleSubmit = (e: React.FormEvent) => {
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
        {/* personal info column */}
        <div className="section-group">
          <h3 className="section-title">DATOS PERSONALES</h3>
          <label>NOMBRES</label>
          <input
            name="nombres"
            value={formData.nombres || ''}
            onChange={handleChange}
            disabled={disabled}
          />
          <label>APELLIDOS</label>
          <input
            name="apellidos"
            value={formData.apellidos || ''}
            onChange={handleChange}
            disabled={disabled}
          />
          <label>TIPO DE DOCUMENTO</label>
          {disabled ? (
            <input
              value={formData.documentType || ''}
              disabled
            />
          ) : (
            <select
              name="documentType"
              value={formData.documentType || ''}
              onChange={handleChange}
            >
              <option value="">Seleccione...</option>
              <option value="DNI">DNI</option>
              <option value="CE">CE</option>
            </select>
          )}
          <label>NÚMERO DE DOCUMENTO</label>
          <input
            name="documentNumber"
            value={formData.documentNumber || ''}
            onChange={handleChange}
            disabled={disabled}
          />
          <label>NACIONALIDAD</label>
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
          <label>FECHA DE NACIMIENTO</label>
          <input
            type="date"
            name="birthDate"
            value={formData.birthDate || ''}
            onChange={handleChange}
            disabled={disabled}
          />
          <label>ESTADO CIVIL</label>
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
              {civilStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          <label>¿TIENE HIJOS?</label>
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
              <option value="SI">SI</option>
              <option value="NO">NO</option>
            </select>
          )}
        </div>

        {/* contact & location */}
        <div className="section-group">
          <h3 className="section-title">CONTACTO</h3>
          <label>CELULAR PERSONAL</label>
          <input
            name="phoneMobile"
            value={formData.phoneMobile || ''}
            onChange={handleChange}
            disabled={disabled}
          />
          <label>CORREO PERSONAL</label>
          <input
            name="personalEmail"
            value={formData.personalEmail || ''}
            onChange={handleChange}
            disabled={disabled}
          />
          <h3 className="section-title">UBICACIÓN</h3>
          <label>DISTRITO</label>
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
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          <label>DIRECCIÓN</label>
          <input
            name="address"
            value={formData.address || ''}
            onChange={handleChange}
            disabled={disabled}
          />
          <h3 className="section-title">BANCOS</h3>
          <label>BANCO</label>
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
              {banks.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          )}
          <label>CUENTA BANCARIA</label>
          <input
            name="accountNumber"
            value={formData.accountNumber || ''}
            onChange={handleChange}
            disabled={disabled}
          />
          <label>CUENTA INTERBANCARIA</label>
          <input
            name="interbankNumber"
            value={formData.interbankNumber || ''}
            onChange={handleChange}
            disabled={disabled}
          />
        </div>

        {/* contract / job */}
        <div className="section-group">
          <h3 className="section-title">CONTRATO</h3>
          <label>REGIMEN</label>
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
              {regimens.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          )}
          <label>MODALIDAD</label>
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
              {modalities.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
          {((formData as any).contractRegimen || '').toUpperCase() === 'PLANILLA' && (
            <>
              <label>SEGURO</label>
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
                  {seguros.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
              <label>PENSION</label>
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
                  {pensions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              )}
            </>
          )}
          <label>SUELDO BASE</label>
          <input
            name="baseSalary"
            value={formData.baseSalary || ''}
            onChange={handleChange}
            disabled={disabled}
          />
          <label>FECHA INICIO</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate || ''}
            onChange={handleChange}
            disabled={disabled}
          />
          <label>FECHA FIN</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate || ''}
            onChange={handleChange}
            disabled={disabled}
          />
        </div>

        {/* extra details */}
        <div className="section-group">
          <h3 className="section-title">DETALLES</h3>
          <label>PUESTO</label>
          {disabled ? (
            <input
              value={formData.position || ''}
              disabled
            />
          ) : (
            <select
              name="position"
              value={formData.position || ''}
              onChange={handleChange}
            >
              <option value="">Seleccione...</option>
              {positions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          )}
          <label>ESTADO</label>
          {disabled ? (
            <input
              value={formData.status || ''}
              disabled
            />
          ) : (
            <select
              name="status"
              value={formData.status || ''}
              onChange={handleChange}
            >
              <option value="">Seleccione...</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
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