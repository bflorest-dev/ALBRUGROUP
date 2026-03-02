/**
 * Componente NewEmployeeForm (moved to features/RRHH)
 */

import { useState } from 'react';
import type { NewEmployeeFormData } from '@types';
import './NewEmployeeForm.css';

interface NewEmployeeFormProps {
  onSubmit: (formData: NewEmployeeFormData) => void;
  onCancel: () => void;
}

export const NewEmployeeForm = ({ onSubmit, onCancel }: NewEmployeeFormProps) => {
  // list of districts for select
  const districts = [
    'ANCÓN','ATE','BARRANCO','BREÑA','CARABAYLLO','CERCADO DE LIMA','CHACLACAYO','CHORRILLOS','CIENEGUILLA','COMAS','EL AGUSTINO','INDEPENDENCIA','JESÚS MARÍA','LA MOLINA','LA VICTORIA','LINCE','LOS OLIVOS','LURÍN','LURIGANCHO','MAGDALENA DEL MAR','MIRAFLORES','PACHACÁMAC','PUCUSANA','PUEBLO LIBRE','PUENTE PIEDRA','PUNTA HERMOSA','PUNTA NEGRA','RÍMAC','SAN BARTOLO','SAN BORJA','SAN ISIDRO','SAN JUAN DE LURIGANCHO','SAN JUAN DE MIRAFLORES','SAN LUIS','SAN MARTÍN DE PORRES','SAN MIGUEL','SANTA ANITA','SANTA MARÍA DEL MAR','SANTA ROSA','SANTIAGO DE SURCO','SURQUILLO','VILLA EL SALVADOR','VILLA MARÍA DEL TRIUNFO'
  ];

  // available roles and companies
  const roles = [
    'DESARROLLADOR','RRHH','CAPACITACION','RECLUTAMIENTO','CONTABILIDAD',
    'COMMUNITY','SUPERVISOR_VENTAS','ASESOR_VENTAS','SUPERVISOR_BACKOFFICE',
    'ASESOR_BACKOFFICE','SUPERVISOR_GTR','ASESOR_GTR','SUPERVISOR_POSTVENTA',
    'ASESOR_POSTVENTA'
  ];
  const companies = ['CLARO','WIN'];

  const [formData, setFormData] = useState<NewEmployeeFormData>({
    nombres: '',
    apellidos: '',
    documentType: 'DNI',
    documentNumber: '',
    nationality: 'PERUANO',
    birthDate: '',
    civilStatus: 'SOLTERO',
    hasChildren: false, // stored boolean; select shows SI/NO
    district: '',
    address: '',
    phoneMobile: '',
    bank: '',
    accountNumber: '',
    interbankNumber: '',
    baseSalary: '',
    role: '',
    startDate: '',
    modality: '',
    scheduleType: '',
    personalEmail: '',
    // optional contract fields
    regimen: '',
    seguro: '',
    pension: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as any;
    let newVal: any = value;
    if (name === 'hasChildren') {
      // convert select value to boolean
      newVal = value === 'SI';
    } else if (name === 'role') {
      newVal = value;
      if (value === 'DESARROLLADOR' || value === 'CONTABILIDAD') {
        // auto assign ALBRU and clear any previous selection
        setFormData(prev => ({...prev, role: newVal, company: 'ALBRU'}));
        return;
      } else {
        // selecting other role: clear company so user must pick
        setFormData(prev => ({...prev, role: newVal, company: ''}));
        return;
      }
    } else if (name === 'company') {
      newVal = value;
    } else if (name === 'documentNumber' ||
               name === 'phoneMobile' ||
               name === 'accountNumber' ||
               name === 'interbankNumber') {
      // strip non-digits for all numeric fields
      newVal = value.replace(/\D/g, '');
      // enforce max lengths depending on field
      if (name === 'phoneMobile') {
        newVal = newVal.slice(0,9);
      } else if (name === 'accountNumber') {
        const limits: Record<string, number> = {
          BCP: 14,
          BBVA: 18,
          INTERBANK: 13,
          SCOTIABANK: 10
        };
        const lim = limits[formData.bank] || Infinity;
        newVal = newVal.slice(0, lim);
      } else if (name === 'interbankNumber') {
        newVal = newVal.slice(0,20);
      }
    } else if (type === 'checkbox') {
      newVal = checked;
    }
    setFormData(prev => ({
      ...prev,
      [name]: newVal,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // verify document number length matches type
    const len = formData.documentNumber.length;
    if (formData.documentType === 'DNI' && len !== 8) {
      alert('DNI debe tener 8 dígitos');
      return;
    }
    if (formData.documentType === 'CE' && len !== 9) {
      alert('CE debe tener 9 dígitos');
      return;
    }
    // company required for roles other than Dev/Contabilidad
    if (formData.role && formData.role !== 'DESARROLLADOR' && formData.role !== 'CONTABILIDAD') {
      if (!formData.company) {
        alert('Debe seleccionar una compañía');
        return;
      }
    }
    onSubmit(formData);
  };

  return (
    <form className="employee-form contract-form" onSubmit={handleSubmit}>
      {/* personal info column */}
      <div className="section-group">
        <h3 className="section-title">DATOS PERSONALES</h3>
        <label>NOMBRES</label>
        <input name="nombres" value={formData.nombres} onChange={handleChange} />
        <label>APELLIDOS</label>
        <input name="apellidos" value={formData.apellidos} onChange={handleChange} />
        <label>TIPO DE DOCUMENTO</label>
        <select name="documentType" value={formData.documentType} onChange={handleChange}>
          <option value="DNI">DNI</option>
          <option value="CE">CE</option>
        </select>
        <label>NÚMERO DE DOCUMENTO</label>
        <input
          name="documentNumber"
          value={formData.documentNumber}
          onChange={handleChange}
          maxLength={formData.documentType === 'CE' ? 9 : 8}
          pattern="\d*"
          inputMode="numeric"
        />
        <label>NACIONALIDAD</label>
        <select name="nationality" value={formData.nationality} onChange={handleChange}>
          <option value="">Seleccione...</option>
          <option value="PERUANO">PERUANO</option>
          <option value="EXTRANJERO">EXTRANJERO</option>
        </select>
        <label>FECHA DE NACIMIENTO</label>
        <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} />
        <label>ESTADO CIVIL</label>
        <select name="civilStatus" value={formData.civilStatus} onChange={handleChange}>
          <option value="">Seleccione...</option>
          <option value="SOLTERO">SOLTERO</option>
          <option value="CASADO">CASADO</option>
          <option value="VIUDO">VIUDO</option>
          <option value="DIVORCIADO">DIVORCIADO</option>
        </select>
        <label>¿TIENE HIJOS?</label>
        <select name="hasChildren" value={formData.hasChildren ? 'SI' : 'NO'} onChange={handleChange}>
          <option value="">Seleccione...</option>
          <option value="SI">SI</option>
          <option value="NO">NO</option>
        </select>
      </div>

      {/* contact + banks column (max 9 controls) */}
      <div className="section-group">
        <h3 className="section-title">CONTACTO</h3>
        <label>DISTRITO</label>
        <select name="district" value={formData.district} onChange={handleChange}>
          <option value="">Seleccione...</option>
          {districts.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <label>DIRECCIÓN</label>
        <input name="address" value={formData.address} onChange={handleChange} />
        <label>CELULAR PERSONAL</label>
        <input
          name="phoneMobile"
          value={formData.phoneMobile}
          onChange={handleChange}
          pattern="\d*"
          inputMode="numeric"
          maxLength={9}
        />
        <label>CORREO PERSONAL</label>
        <input name="personalEmail" value={formData.personalEmail} onChange={handleChange} />
        <h3 className="section-title">BANCOS</h3>
        <label>BANCO</label>
        <select name="bank" value={formData.bank} onChange={handleChange}>
          <option value="">Seleccione...</option>
          <option value="BCP">BCP</option>
          <option value="BBVA">BBVA</option>
          <option value="INTERBANK">INTERBANK</option>
          <option value="SCOTIABANK">SCOTIABANK</option>
        </select>
        <label>CUENTA BANCARIA</label>
        <input
          name="accountNumber"
          value={formData.accountNumber}
          onChange={handleChange}
          pattern="\d*"
          inputMode="numeric"
        />
        <label>CUENTA INTERBANCARIA</label>
        <input
          name="interbankNumber"
          value={formData.interbankNumber}
          onChange={handleChange}
          pattern="\d*"
          inputMode="numeric"
        />
      </div>

      {/* contract column with added role/email to keep other groups <=9 */}
      <div className="section-group">
        {/* role/company at top of this column */}
        <h3 className="section-title">ROL</h3>
        <label>ROL</label>
        <select name="role" value={formData.role} onChange={handleChange}>
          <option value="">Seleccione...</option>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {formData.role && formData.role !== 'DESARROLLADOR' && formData.role !== 'CONTABILIDAD' ? (
          <>
            <label>COMPAÑÍA</label>
            <select name="company" value={formData.company || ''} onChange={handleChange}>
              <option value="">Seleccione...</option>
              {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </>
        ) : (
          formData.role === 'DESARROLLADOR' || formData.role === 'CONTABILIDAD' ? (
            <input type="hidden" name="company" value="ALBRU" />
          ) : null
        )}

        <h3 className="section-title">CONTRATO</h3>
        <label>REGIMEN</label>
        <select
          name="regimen"
          value={formData.regimen || ''}
          onChange={handleChange}
        >
          <option value="">Seleccione...</option>
          <option value="RECIBO POR HONORARIOS">RECIBO POR HONORARIOS</option>
          <option value="PLANILLA">PLANILLA</option>
        </select>

        <label>MODALIDAD</label>
        <select
          name="modality"
          value={formData.modality || ''}
          onChange={handleChange}
        >
          <option value="">Seleccione...</option>
          <option value="PART TIME">PART TIME</option>
          <option value="SEMI FULL">SEMI FULL</option>
          <option value="FULL TIME">FULL TIME</option>
          <option value="SUPER FULL">SUPER FULL</option>
        </select>

        {formData.regimen === 'PLANILLA' && (
          <>
            <label>SEGURO DE SALUD</label>
            <select
              name="seguro"
              value={formData.seguro || ''}
              onChange={handleChange}
            >
              <option value="">Seleccione...</option>
              <option value="SIS">SIS</option>
              <option value="ESSALUD">ESSALUD</option>
            </select>

            <label>SISTEMA PENSIONES</label>
            <select
              name="pension"
              value={formData.pension || ''}
              onChange={handleChange}
            >
              <option value="">Seleccione...</option>
              <option value="ONP">ONP</option>
              <option value="AFP INTEGRA">AFP INTEGRA</option>
              <option value="AFP PROFUTURO">AFP PROFUTURO</option>
              <option value="AFP HABITAT">AFP HABITAT</option>
              <option value="AFP PRIMA">AFP PRIMA</option>
            </select>
          </>
        )}

        <label>SUELDO BASE</label>
        <input
          type="number"
          name="baseSalary"
          value={formData.baseSalary || ''}
          onChange={handleChange}
        />

        <label>FECHA DE INICIO</label>
        <input
          type="date"
          name="startDate"
          value={formData.startDate || ''}
          onChange={handleChange}
        />

      </div>
      <div className="modal-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>CANCELAR</button>
        <button type="submit" className="btn-submit">GUARDAR</button>
      </div>
    </form>
  );
};