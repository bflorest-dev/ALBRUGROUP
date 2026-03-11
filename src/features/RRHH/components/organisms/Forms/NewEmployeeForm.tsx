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
  const campaigns = ['COMPUTRABAJO', 'INDEED', 'REFERIDO', 'TIKTOK', 'FACEBOOK', 'LINKEDIN'];
  const kinships = ['PADRE', 'MADRE', 'TÍO/A', 'ESPOSO/A', 'HERMANO/A', 'ABUELO/A', 'PAREJA', 'OTRO'];
  const contractorCompanies = ['ALBRU', 'RUNA'];
  const yesNoOptions = ['Sí', 'No'];

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
    endDate: '',
    modality: '',
    scheduleType: '',
    personalEmail: '',
    campaign: '',
    // optional contract fields
    regimen: '',
    seguro: '',
    pension: '',
    contractOwnAccount: '',
    contractKinship: '',
    contractCellularTransfer: '',
    contractorCompany: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target as any;
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
               name === 'interbankNumber' ||
               name === 'contractCellularTransfer') {
      // strip non-digits for all numeric fields
      newVal = value.replace(/\D/g, '');
      // enforce max lengths depending on field
      if (name === 'phoneMobile') {
        newVal = newVal.slice(0,9);
      } else if (name === 'contractCellularTransfer') {
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
      <div className="form-sections-contract">
        {/* COLUMN 1: EMPLEADO */}
        <div className="section-group">
          <h3 className="new-employee-section-title">EMPLEADO</h3>
          <label>Nombres</label>
          <input name="nombres" value={formData.nombres} onChange={handleChange} />
          <label>Apellidos</label>
          <input name="apellidos" value={formData.apellidos} onChange={handleChange} />
          <label>Doc.</label>
          <select name="documentType" value={formData.documentType} onChange={handleChange}>
            <option value="DNI">DNI</option>
            <option value="CE">CE</option>
          </select>
          <label>N°Doc</label>
          <input
            name="documentNumber"
            value={formData.documentNumber}
            onChange={handleChange}
            maxLength={formData.documentType === 'CE' ? 9 : 8}
            pattern="\d*"
            inputMode="numeric"
          />
        </div>

        {/* COLUMN 2: DATOS PERSONALES & CONTACTO */}
        <div className="section-group">
          <h3 className="new-employee-section-title">DATOS PERSONALES & CONTACTO</h3>
          <label>Nacionalidad</label>
          <select name="nationality" value={formData.nationality} onChange={handleChange}>
            <option value="">Seleccione...</option>
            <option value="PERUANO">PERUANO</option>
            <option value="EXTRANJERO">EXTRANJERO</option>
          </select>
          <label>Fecha Nac.</label>
          <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} />
          <label>Estado Civil</label>
          <select name="civilStatus" value={formData.civilStatus} onChange={handleChange}>
            <option value="">Seleccione...</option>
            <option value="SOLTERO">SOLTERO</option>
            <option value="CASADO">CASADO</option>
            <option value="VIUDO">VIUDO</option>
            <option value="DIVORCIADO">DIVORCIADO</option>
          </select>
          <label>¿Hijos?</label>
          <select name="hasChildren" value={formData.hasChildren ? 'SI' : 'NO'} onChange={handleChange}>
            <option value="">Seleccione...</option>
            <option value="SI">SI</option>
            <option value="NO">NO</option>
          </select>
          <label>Celular</label>
          <input
            name="phoneMobile"
            value={formData.phoneMobile}
            onChange={handleChange}
            pattern="\d*"
            inputMode="numeric"
            maxLength={9}
          />
          <label>Email</label>
          <input name="personalEmail" value={formData.personalEmail} onChange={handleChange} />
          <label>Distrito</label>
          <select name="district" value={formData.district} onChange={handleChange}>
            <option value="">Seleccione...</option>
            {districts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <label>Dirección</label>
          <input name="address" value={formData.address} onChange={handleChange} />
        </div>

        {/* COLUMN 3: INFORMACIÓN LABORAL */}
        <div className="section-group">
          <h3 className="new-employee-section-title">INFORMACIÓN LABORAL</h3>
          <label>Régimen</label>
          <select
            name="regimen"
            value={formData.regimen || ''}
            onChange={handleChange}
          >
            <option value="">Seleccione...</option>
            <option value="RECIBO POR HONORARIOS">RECIBO POR HONORARIOS</option>
            <option value="PLANILLA">PLANILLA</option>
          </select>
          {formData.regimen === 'PLANILLA' && (
            <>
              <label>Seguro</label>
              <select
                name="seguro"
                value={formData.seguro || ''}
                onChange={handleChange}
              >
                <option value="">Seleccione...</option>
                <option value="SIS">SIS</option>
                <option value="ESSALUD">ESSALUD</option>
              </select>
              <label>Pensión</label>
              <select
                name="pension"
                value={formData.pension || ''}
                onChange={handleChange}
              >
                <option value="">Seleccione...</option>
                <option value="ONP">ONP</option>
                <option value="AFP INTEGRA">AFP INTEGRA</option>
                <option value="PROFUTURO AFP">PROFUTURO AFP</option>
                <option value="AFP HABITAD">AFP HABITAD</option>
                <option value="PRIMA AFP">PRIMA AFP</option>
              </select>
            </>
          )}
          <label>Modalidad</label>
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
          <label>Puesto</label>
          <select name="role" value={formData.role} onChange={handleChange}>
            <option value="">Seleccione...</option>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {formData.role && formData.role !== 'DESARROLLADOR' && formData.role !== 'CONTABILIDAD' ? (
            <>
              <label>Compañía</label>
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
          <label>Campaña</label>
          <select name="campaign" value={formData.campaign || ''} onChange={handleChange}>
            <option value="">Seleccionar campaña</option>
            {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <label>Sueldo</label>
          <input
            type="number"
            name="baseSalary"
            value={formData.baseSalary || ''}
            onChange={handleChange}
          />
          <label>Inicio</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate || ''}
            onChange={handleChange}
          />
          <label>Fin</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate || ''}
            onChange={handleChange}
          />
        </div>

        {/* COLUMN 4: INFORMACIÓN BANCARIA & TRANSFERENCIA */}
        <div className="section-group">
          <h3 className="new-employee-section-title">INFORMACIÓN BANCARIA & TRANSFERENCIA</h3>
          <label>Banco</label>
          <select name="bank" value={formData.bank} onChange={handleChange}>
            <option value="">Seleccione...</option>
            <option value="BCP">BCP</option>
            <option value="BBVA">BBVA</option>
            <option value="INTERBANK">INTERBANK</option>
            <option value="SCOTIABANK">SCOTIABANK</option>
          </select>
          <label>Cuenta</label>
          <input
            name="accountNumber"
            value={formData.accountNumber}
            onChange={handleChange}
            pattern="\d*"
            inputMode="numeric"
          />
          <label>Interbancaria</label>
          <input
            name="interbankNumber"
            value={formData.interbankNumber}
            onChange={handleChange}
            pattern="\d*"
            inputMode="numeric"
          />
          <label>Cuenta propia?</label>
          <select name="contractOwnAccount" value={formData.contractOwnAccount || ''} onChange={handleChange}>
            <option value="">Seleccione...</option>
            {yesNoOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <label>Parentesco</label>
          <select name="contractKinship" value={formData.contractKinship || ''} onChange={handleChange}>
            <option value="">Seleccione...</option>
            {kinships.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <label>Celular Transferencia</label>
          <input
            name="contractCellularTransfer"
            value={formData.contractCellularTransfer}
            onChange={handleChange}
            pattern="\d*"
            inputMode="numeric"
          />
          <label>Empresa Contratista</label>
          <select name="contractorCompany" value={formData.contractorCompany || ''} onChange={handleChange}>
            <option value="">Seleccione...</option>
            {contractorCompanies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>CANCELAR</button>
        <button type="submit" className="btn-submit">GUARDAR</button>
      </div>
    </form>
  );
};