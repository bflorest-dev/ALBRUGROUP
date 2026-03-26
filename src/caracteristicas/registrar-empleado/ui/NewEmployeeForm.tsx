/**
 * Componente NewEmployeeForm (moved to features/RRHH)
 * Formulario de mÃºltiples pasos para registro de empleados
 */

import { useState } from 'react';
import { Select } from '@shared/ui/entrada';
import {
  CompaniaEnum,
  DocumentoEnum,
  NacionalidadEnum,
  EstadoCivilEnum,
  DistritoEnum,
  RegimenEnum,
  SeguroSaludEnum,
  SistemaPensionesEnum,
  ModalidadEnum,
  BancoEnum,
  ParentescoEnum,
  EmpresaContratistaEnum,
  PuestoTrabajoEnum,
} from '@shared/types';
import type { NewEmployeeFormData } from '@shared/types';
import { enumToOptions, formatEnumLabel } from '@shared/utils/enumToOptions';
import './NewEmployeeForm.css';

interface NewEmployeeFormProps {
  onSubmit: (formData: NewEmployeeFormData) => void;
  onCancel: () => void;
}

export const NewEmployeeForm = ({ onSubmit, onCancel }: NewEmployeeFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Generate options from enums using the helper
  const documentoOptions = enumToOptions(DocumentoEnum);
  const nacionalidadOptions = enumToOptions(NacionalidadEnum);
  const civilStatusOptions = enumToOptions(EstadoCivilEnum);
  const companyOptions = enumToOptions(CompaniaEnum);
  const distritoOptions = enumToOptions(DistritoEnum);
  const regimenOptions = enumToOptions(RegimenEnum);
  const seguroOptions = enumToOptions(SeguroSaludEnum);
  const pensionOptions = enumToOptions(SistemaPensionesEnum);
  const modalidadOptions = enumToOptions(ModalidadEnum);
  const bancoOptions = enumToOptions(BancoEnum);
  const parentescoOptions = enumToOptions(ParentescoEnum);
  const empresaContratistaOptions = enumToOptions(EmpresaContratistaEnum);
  const puestoOptions = enumToOptions(PuestoTrabajoEnum);

  // Additional options (não são enums)
  const campaigns = [
    { value: 'COMPUTRABAJO', label: 'Computrabajo' },
    { value: 'INDEED', label: 'Indeed' },
    { value: 'REFERIDO', label: 'Referido' },
    { value: 'TIKTOK', label: 'TikTok' },
    { value: 'FACEBOOK', label: 'Facebook' },
    { value: 'LINKEDIN', label: 'LinkedIn' },
  ];

  const yesNoOptions = [
    { value: 'SI', label: 'Sí' },
    { value: 'NO', label: 'No' },
  ];

  const [formData, setFormData] = useState<NewEmployeeFormData>({
    nombres: '',
    apellidos: '',
    documentType: 'DNI',
    numeroDocumento: '',
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
    puesto: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target as any;
    let newVal: any = value;
    if (name === 'hasChildren') {
      // convert select value to boolean
      newVal = value === 'SI';
    } else if (name === 'puesto') {
      newVal = value;
      if (value === 'DESARROLLADOR' || value === 'CONTABILIDAD') {
        // auto assign ALBRU and clear any previous selection
        setFormData(prev => ({...prev, puesto: newVal, compania: 'ALBRU'}));
        return;
      } else {
        // selecting other puesto: clear empresa para obligar selección
        setFormData(prev => ({...prev, puesto: newVal, compania: ''}));
        return;
      }
    } else if (name === 'company' || name === 'compania') {
      newVal = value;
    } else if (name === 'numeroDocumento' ||
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
    const len = formData.numeroDocumento?.length ?? 0;
    if (formData.documentType === 'DNI' && len !== 8) {
      alert('DNI debe tener 8 dígitos');
      return;
    }
    if (formData.documentType === 'CE' && len !== 9) {
      alert('CE debe tener 9 dígitos');
      return;
    }
    // company required for puestos other than DESARROLLADOR/CONTABILIDAD
    if (formData.puesto && formData.puesto !== 'DESARROLLADOR' && formData.puesto !== 'CONTABILIDAD') {
      if (!formData.compania) {
        alert('Debe seleccionar una compañía');
        return;
      }
    }
    onSubmit(formData);
  };

  // Validar que Paso 1 (EMPLEADO) estÃ© completo
  const isStep1Complete = () => {
    return formData.nombres && formData.apellidos && formData.documentType && formData.numeroDocumento;
  };

  // Validar que Paso 2 (DATOS PERSONALES & CONTACTO) estÃ© completo
  const isStep2Complete = () => {
    return formData.nationality && formData.birthDate && formData.civilStatus !== undefined &&
           formData.phoneMobile && formData.personalEmail && formData.district && formData.address;
  };

  // Validar que Paso 3 (INFORMACIÃ“N BANCARIA & TRANSFERENCIA) estÃ© completo
  const isStep3Complete = () => {
    return formData.bank && formData.accountNumber && formData.interbankNumber;
  };

  // Verificar si puede avanzar a Paso 4
  const canAdvanceToStep4 = () => {
    return isStep1Complete() && isStep2Complete() && isStep3Complete();
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !isStep1Complete()) {
      alert('Por favor completa todos los campos de EMPLEADO');
      return;
    }
    if (currentStep === 2 && !isStep2Complete()) {
      alert('Por favor completa todos los campos de DATOS PERSONALES & CONTACTO');
      return;
    }
    if (currentStep === 3 && !isStep3Complete()) {
      alert('Por favor completa todos los campos de INFORMACIÃ“N BANCARIA & TRANSFERENCIA');
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <form className="employee-form contract-form" onSubmit={handleSubmit}>
      {/* Indicador de pasos */}
      <div className="form-steps-indicator">
        <div className={`step ${currentStep >= 1 ? 'active' : ''} ${isStep1Complete() ? 'complete' : ''}`}>1</div>
        <div className={`step-line ${currentStep > 1 ? 'active' : ''}`}></div>
        <div className={`step ${currentStep >= 2 ? 'active' : ''} ${isStep2Complete() ? 'complete' : ''}`}>2</div>
        <div className={`step-line ${currentStep > 2 ? 'active' : ''}`}></div>
        <div className={`step ${currentStep >= 3 ? 'active' : ''} ${isStep3Complete() ? 'complete' : ''}`}>3</div>
        <div className={`step-line ${currentStep > 3 ? 'active' : ''}`}></div>
        <div className={`step ${currentStep >= 4 ? 'active' : ''} ${canAdvanceToStep4() ? '' : 'disabled'}`}>4</div>
      </div>

      <div className="form-sections-contract">
        {/* PASO 1: EMPLEADO */}
        {currentStep === 1 && (
          <div className="section-group">
            <h3 className="new-employee-section-title">EMPLEADO</h3>
            <label>Nombres</label>
            <input name="nombres" value={formData.nombres} onChange={handleChange} />
            <label>Apellidos</label>
            <input name="apellidos" value={formData.apellidos} onChange={handleChange} />
            <Select
              label="Doc."
              options={documentoOptions}
              value={formData.documentType || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, documentType: value }))}
              required
            />
            <label>N°Doc</label>
            <input
              name="numeroDocumento"
              value={formData.numeroDocumento}
              onChange={handleChange}
              maxLength={formData.documentType === 'CE' ? 9 : 8}
              pattern="\d*"
              inputMode="numeric"
            />
          </div>
        )}

        {/* PASO 2: DATOS PERSONALES & CONTACTO */}
        {currentStep === 2 && (
          <div className="section-group">
            <h3 className="new-employee-section-title">DATOS PERSONALES & CONTACTO</h3>
            <Select
              label="Nacionalidad"
              options={[{ value: '', label: 'Seleccione...' }, ...nacionalidadOptions] as any}
              value={formData.nationality || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, nationality: value }))}
              required
            />
            <label>Fecha Nac.</label>
            <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} />
            <Select
              label="Estado Civil"
              options={[{ value: '', label: 'Seleccione...' }, ...civilStatusOptions] as any}
              value={formData.civilStatus || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, civilStatus: value }))}
              required
            />
            <label>Â¿Hijos?</label>
            <select name="hasChildren" value={formData.hasChildren ? 'SI' : 'NO'} onChange={handleChange}>
              <option value="">Seleccione...</option>
              {yesNoOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
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
              {distritoOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <label>Dirección</label>
            <input name="address" value={formData.address} onChange={handleChange} />
            <label>Campaña</label>
            <select name="campaign" value={formData.campaign || ''} onChange={handleChange}>
              <option value="">Seleccionar campaña</option>
              {campaigns.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        )}

        {/* PASO 3: INFORMACIÃ“N BANCARIA & TRANSFERENCIA */}
        {currentStep === 3 && (
          <div className="section-group">
            <h3 className="new-employee-section-title">INFORMACIÓN BANCARIA & TRANSFERENCIA</h3>
            <label>Banco</label>
            <select name="bank" value={formData.bank} onChange={handleChange}>
              <option value="">Seleccione...</option>
              {bancoOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
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
              {yesNoOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <label>Parentesco</label>
            <select name="contractKinship" value={formData.contractKinship || ''} onChange={handleChange}>
              <option value="">Seleccione...</option>
              {parentescoOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
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
              {empresaContratistaOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* PASO 4: INFORMACIÃ“N LABORAL (disponible solo despuÃ©s de completar los primeros 3 pasos) */}
        {currentStep === 4 && (
          <div className="section-group">
            <h3 className="new-employee-section-title">INFORMACIÓN LABORAL</h3>
            <label>Regimen</label>
            <select
              name="regimen"
              value={formData.regimen || ''}
              onChange={handleChange}
            >
              <option value="">Seleccione...</option>
              {regimenOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {formData.regimen === RegimenEnum.PLANILLA && (
              <>
                <label>Seguro</label>
                <select
                  name="seguro"
                  value={formData.seguro || ''}
                  onChange={handleChange}
                >
                  <option value="">Seleccione...</option>
                  {seguroOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <label>Pensión</label>
                <select
                  name="pension"
                  value={formData.pension || ''}
                  onChange={handleChange}
                >
                  <option value="">Seleccione...</option>
                  {pensionOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
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
              {modalidadOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <label>Puesto</label>
            <select name="puesto" value={formData.puesto} onChange={handleChange}>
              <option value="">Seleccione...</option>
              {puestoOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {formData.puesto && formData.puesto !== PuestoTrabajoEnum.DESARROLLADOR && formData.puesto !== 'CONTADOR' ? (
              <>
                <label>Compañía</label>
                <select name="compania" value={formData.compania || ''} onChange={handleChange}>
                  <option value="">Seleccione...</option>
                  {companyOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </>
            ) : (
              (formData.puesto === PuestoTrabajoEnum.DESARROLLADOR || formData.puesto === 'CONTADOR') ? (
                <input type="hidden" name="compania" value={CompaniaEnum.ALBRU} />
              ) : null
            )}
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
        )}
      </div>

      {/* Botones de navegaciÃ³n */}
      <div className="modal-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>CANCELAR</button>
        
        {/* Botones de paso */}
        {currentStep > 1 && (
          <button type="button" className="btn-previous" onClick={handlePreviousStep}>
            â† ANTERIOR
          </button>
        )}
        
        {currentStep < 4 && (
          <button type="button" className="btn-next" onClick={handleNextStep}>
            SIGUIENTE â†’
          </button>
        )}
        
        {currentStep === 4 && (
          <button type="submit" className="btn-submit">GUARDAR</button>
        )}
      </div>
    </form>
  );
};

