/**
 * Componente NewEmployeeForm (moved to features/RRHH)
 * Formulario de mÃºltiples pasos para registro de empleados
 */

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Select } from '@shared/ui/input';
import { FlatpickrDateInput } from '@shared/ui/date-picker';
import {
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
  OrigenEnum,
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
  const distritoOptions = enumToOptions(DistritoEnum);
  const regimenOptions = enumToOptions(RegimenEnum);
  const seguroOptions = enumToOptions(SeguroSaludEnum);
  const pensionOptions = enumToOptions(SistemaPensionesEnum);
  const modalidadOptions = enumToOptions(ModalidadEnum);
  const bancoOptions = enumToOptions(BancoEnum);
  const parentescoOptions = enumToOptions(ParentescoEnum);
  const puestoOptions = enumToOptions(PuestoTrabajoEnum);

  const origenOptions = Object.values(OrigenEnum).map((value) => ({
    value,
    label: formatEnumLabel(value),
  }));

  const empresaContratistaOptions = Object.values(EmpresaContratistaEnum).map((value, index) => ({
    value: String(index + 1),
    label: formatEnumLabel(value),
  }));

  const yesNoOptions = [
    { value: 'SI', label: 'Sí' },
    { value: 'NO', label: 'No' },
  ];

  const [formData, setFormData] = useState<NewEmployeeFormData>({
    nombres: '',
    apellidos: '',
    tipoDocumento: 'DNI',
    numeroDocumento: '',
    nacionalidad: 'PERUANO',
    fechaNacimiento: '',
    estadoCivil: 'SOLTERO',
    tieneHijos: false,
    celularPersonal: '',
    correoPersonal: '',
    origen: 'COMPUTRABAJO',
    distrito: '',
    direccion: '',
    banco: 'BCP',
    cuentaBancaria: '',
    cuentaInterbancaria: '',
    cuentaPropia: false,
    parentesco: '',
    celularTransferencia: '',
    idEmpresaContratista: '',
    idPostulacion: '',
    puestoTrabajo: '',
    regimen: 'RECIBO_POR_HONORARIOS',
    modalidad: 'PART_TIME',
    seguroSalud: 'SIS',
    sistemaPensiones: 'ONP',
    sueldoBase: '',
    fechaInicio: '',
    fechaFin: '',
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newVal: string | boolean | number = value;

    if (name === 'tieneHijos' || name === 'cuentaPropia') {
      newVal = value === 'SI';
    }

    if (name === 'idEmpresaContratista' || name === 'sueldoBase') {
      newVal = value === '' ? '' : Number(value);
    }

    if (
      name === 'numeroDocumento' ||
      name === 'celularPersonal' ||
      name === 'cuentaBancaria' ||
      name === 'cuentaInterbancaria' ||
      name === 'celularTransferencia'
    ) {
      newVal = String(value).replace(/\D/g, '');
      if (name === 'celularPersonal' || name === 'celularTransferencia') {
        newVal = newVal.slice(0, 9);
      }
      if (name === 'cuentaBancaria') {
        const limits: Record<string, number> = {
          BCP: 14,
          BBVA: 18,
          INTERBANK: 13,
          SCOTIABANK: 10,
        };
        const limit = limits[formData.banco] ?? Infinity;
        newVal = newVal.slice(0, limit);
      }
      if (name === 'cuentaInterbancaria') {
        newVal = newVal.slice(0, 20);
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newVal,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const len = formData.numeroDocumento?.length ?? 0;
    if (formData.tipoDocumento === 'DNI' && len !== 8) {
      alert('DNI debe tener 8 dígitos');
      return;
    }
    if (formData.tipoDocumento === 'CE' && len !== 9) {
      alert('CE debe tener 9 dígitos');
      return;
    }

    if (!formData.nombres || !formData.apellidos) {
      alert('Nombres y apellidos son obligatorios.');
      return;
    }

    if (!formData.idEmpresaContratista || Number(formData.idEmpresaContratista) <= 0) {
      alert('Empresa contratista es obligatoria.');
      return;
    }

    if (!formData.celularTransferencia?.trim()) {
      alert('Por favor ingrese el celular de transferencia');
      return;
    }

    onSubmit(formData);
  };

  // Validar que Paso 1 (EMPLEADO) esté completo
  const isStep1Complete = () => {
    return Boolean(formData.nombres && formData.apellidos && formData.tipoDocumento && formData.numeroDocumento);
  };

  // Validar que Paso 2 (DATOS PERSONALES & CONTACTO) esté completo
  const isStep2Complete = () => {
    return Boolean(
      formData.nacionalidad &&
      formData.fechaNacimiento &&
      formData.estadoCivil !== undefined &&
      (formData.tieneHijos === true || formData.tieneHijos === false) &&
      formData.celularPersonal &&
      formData.correoPersonal &&
      formData.distrito &&
      formData.direccion &&
      formData.origen
    );
  };

  // Validar que Paso 3 (INFORMACIÓN BANCARIA & TRANSFERENCIA) esté completo
  const isStep3Complete = () => {
    return Boolean(formData.banco && formData.cuentaBancaria && formData.cuentaInterbancaria && formData.idEmpresaContratista);
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
              value={formData.tipoDocumento || ''}
              onChange={(value) => setFormData((prev) => ({ ...prev, tipoDocumento: value as NewEmployeeFormData['tipoDocumento'] }))}
              required
            />
            <label>N°Doc</label>
            <input
              name="numeroDocumento"
              value={formData.numeroDocumento}
              onChange={handleChange}
              maxLength={formData.tipoDocumento === 'CE' ? 9 : 8}
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
              options={[{ value: '', label: 'Seleccione...' }, ...nacionalidadOptions]}
              value={formData.nacionalidad || ''}
              onChange={(value) => setFormData((prev) => ({ ...prev, nacionalidad: value as NewEmployeeFormData['nacionalidad'] }))}
              required
            />
            <label>Fecha Nac.</label>
            <FlatpickrDateInput
              name="fechaNacimiento"
              value={formData.fechaNacimiento}
              onChange={(value) => setFormData((prev) => ({ ...prev, fechaNacimiento: value }))}
            />
            <Select
              label="Estado Civil"
              options={[{ value: '', label: 'Seleccione...' }, ...civilStatusOptions]}
              value={formData.estadoCivil || ''}
              onChange={(value) => setFormData((prev) => ({ ...prev, estadoCivil: value as NewEmployeeFormData['estadoCivil'] }))}
              required
            />
            <label>¿Hijos?</label>
            <select name="tieneHijos" value={formData.tieneHijos ? 'SI' : 'NO'} onChange={handleChange}>
              <option value="">Seleccione...</option>
              {yesNoOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <label>Celular</label>
            <input
              name="celularPersonal"
              value={formData.celularPersonal}
              onChange={handleChange}
              pattern="\d*"
              inputMode="numeric"
              maxLength={9}
            />
            <label>Email</label>
            <input name="correoPersonal" value={formData.correoPersonal} onChange={handleChange} />
            <label>Distrito</label>
            <select name="distrito" value={formData.distrito} onChange={handleChange}>
              <option value="">Seleccione...</option>
              {distritoOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <label>Dirección</label>
            <input name="direccion" value={formData.direccion} onChange={handleChange} />
            <label>Origen</label>
            <select name="origen" value={formData.origen || ''} onChange={handleChange}>
              <option value="">Seleccionar origen</option>
              {origenOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* PASO 3: INFORMACIÃ“N BANCARIA & TRANSFERENCIA */}
        {currentStep === 3 && (
          <div className="section-group">
            <h3 className="new-employee-section-title">INFORMACIÓN BANCARIA & TRANSFERENCIA</h3>
            <label>Banco</label>
            <select name="banco" value={formData.banco} onChange={handleChange}>
              <option value="">Seleccione...</option>
              {bancoOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <label>Cuenta</label>
            <input
              name="cuentaBancaria"
              value={formData.cuentaBancaria}
              onChange={handleChange}
              pattern="\d*"
              inputMode="numeric"
            />
            <label>Interbancaria</label>
            <input
              name="cuentaInterbancaria"
              value={formData.cuentaInterbancaria}
              onChange={handleChange}
              pattern="\d*"
              inputMode="numeric"
            />
            <label>Cuenta propia?</label>
            <select name="cuentaPropia" value={formData.cuentaPropia ? 'SI' : 'NO'} onChange={handleChange}>
              <option value="">Seleccione...</option>
              {yesNoOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <label>Parentesco</label>
            <select name="parentesco" value={formData.parentesco || ''} onChange={handleChange}>
              <option value="">Seleccione...</option>
              {parentescoOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <label>Celular Transferencia</label>
            <input
              name="celularTransferencia"
              value={formData.celularTransferencia}
              onChange={handleChange}
              pattern="\d*"
              inputMode="numeric"
            />
            <label>Empresa Contratista</label>
            <select name="idEmpresaContratista" value={String(formData.idEmpresaContratista || '')} onChange={handleChange}>
              <option value="">Seleccione...</option>
              {empresaContratistaOptions.map((opt) => (
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
                  name="seguroSalud"
                  value={formData.seguroSalud || ''}
                  onChange={handleChange}
                >
                  <option value="">Seleccione...</option>
                  {seguroOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <label>Pensión</label>
                <select
                  name="sistemaPensiones"
                  value={formData.sistemaPensiones || ''}
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
              name="modalidad"
              value={formData.modalidad || ''}
              onChange={handleChange}
            >
              <option value="">Seleccione...</option>
              {modalidadOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <label>Puesto</label>
            <select name="puestoTrabajo" value={formData.puestoTrabajo || ''} onChange={handleChange}>
              <option value="">Seleccione...</option>
              {puestoOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <label>Sueldo</label>
            <input
              type="number"
              name="sueldoBase"
              value={formData.sueldoBase || ''}
              onChange={handleChange}
            />
            <label>Inicio</label>
            <FlatpickrDateInput
              name="fechaInicio"
              value={formData.fechaInicio || ''}
              onChange={(value) => setFormData((prev) => ({ ...prev, fechaInicio: value }))}
            />
            <label>Fin</label>
            <FlatpickrDateInput
              name="fechaFin"
              value={formData.fechaFin || ''}
              onChange={(value) => setFormData((prev) => ({ ...prev, fechaFin: value }))}
              minDate={formData.fechaInicio || undefined}
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


