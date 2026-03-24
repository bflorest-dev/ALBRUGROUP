/**
 * Componente EmployeeDetailForm (moved to features/RRHH)
 */

import { useState } from 'react';

import type { Employee, EmployeeDetailFormData } from '@compartido/tipos';
import './EmployeeDetailForm.css';

// Constants for select options
const nationalities = ['PERUANO', 'EXTRANJERO'];
const civilStatuses = ['SOLTERO', 'CASADO', 'VIUDO', 'DIVORCIADO'];
const districts = [
  'ANCÓN','ATE','BARRANCO','BREÑA','CARABAYLLO','CERCADO DE LIMA','CHACLACAYO','CHORRILLOS','CIENEGUILLA','COMAS','EL AGUSTINO','INDEPENDENCIA','JESÚS MARÍA','LA MOLINA','LA VICTORIA','LINCE','LOS OLIVOS','LURÍN','LURIGANCHO','MAGDALENA DEL MAR','MIRAFLORES','PACHACÁMAC','PUCUSANA','PUEBLO LIBRE','PUENTE PIEDRA','PUNTA HERMOSA','PUNTA NEGRA','RÍMAC','SAN BARTOLO','SAN BORJA','SAN ISIDRO','SAN JUAN DE LURIGANCHO','SAN JUAN DE MIRAFLORES','SAN LUIS','SAN MARTÍN DE PORRES','SAN MIGUEL','SANTA ANITA','SANTA MARÍA DEL MAR','SANTA ROSA','SANTIAGO DE SURCO','SURQUILLO','VILLA EL SALVADOR','VILLA MARÍA DEL TRIUNFO'
];
const banks = ['BCP','BBVA','INTERBANK','SCOTIABANK'];
const regimens = ['RECIBO POR HONORARIOS', 'PLANILLA'];
const modalities = ['PART TIME', 'SEMI FULL', 'FULL TIME', 'SUPER FULL'];
const seguros = ['SIS', 'ESSALUD'];
const pensions = ['ONP', 'AFP INTEGRA', 'PROFUTURO AFP', 'AFP HABITAD', 'PRIMA AFP'];
const positions = [
  'ASESOR_VENTAS', 'ASESOR_POSTVENTA', 'ASESOR_GTR', 'ASESOR_BACKOFFICE', 'SUPERVISOR_VENTAS', 'SUPERVISOR_POSTVENTA', 'SUPERVISOR_GTR', 'SUPERVISOR_BACKOFFICE', 'CAPACITACION', 'RRHH', 'CONTABILIDAD', 'COMMUNITY', 'DESARROLLADOR', 'RECLUTAMIENTO'
];
const kinships = ['PADRE', 'MADRE', 'TÍO/A', 'ESPOSO/A', 'HERMANO/A', 'ABUELO/A', 'PAREJA', 'OTRO'];
const contractorCompanies = ['ALBRU', 'RUNA'];
const yesNoOptions = ['Sí', 'No'];

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
    const { name, value } = e.target as any;
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
          <label>N°Doc</label>
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
          <input
            type="date"
            name="birthDate"
            value={formData.birthDate || ''}
            onChange={handleChange}
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
              {civilStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          <label>¿Hijos?</label>
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
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          <label>Dirección</label>
          <input
            name="address"
            value={formData.address || ''}
            onChange={handleChange}
            disabled={disabled}
          />
        </div>

        {/* COLUMN 3: INFORMACIÓN LABORAL */}
        <div className="section-group">
          <h3 className="section-title">INFORMACIÓN LABORAL</h3>
          <label>Régimen</label>
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
              {modalities.map(m => <option key={m} value={m}>{m}</option>)}
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
              {positions.map(p => <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
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
          <input
            type="date"
            name="startDate"
            value={formData.startDate || ''}
            onChange={handleChange}
            disabled={disabled}
          />
          <label>Fin</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate || ''}
            onChange={handleChange}
            disabled={disabled}
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
                  {seguros.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
              <label>Pensión</label>
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
        </div>

        {/* COLUMN 4: INFORMACIÓN BANCARIA & TRANSFERENCIA */}
        <div className="section-group">
          <h3 className="section-title">INFORMACIÓN BANCARIA & TRANSFERENCIA</h3>
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
              {banks.map(b => <option key={b} value={b}>{b}</option>)}
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
              {yesNoOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          )}
          {(formData.contractOwnAccount || '').toLowerCase() !== 'sí' && (
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
                  {kinships.map(k => <option key={k} value={k}>{k}</option>)}
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
              {contractorCompanies.map(c => <option key={c} value={c}>{c}</option>)}
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
