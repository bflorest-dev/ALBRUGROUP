import { useEffect, useState, type FormEvent } from 'react';
import { getEmpresasContratistas, EmpresaContratista } from '@features/admin/api/adminManagementApi';
import { FlatpickrDateInput } from '@shared/ui/date-picker';
import type { NewEmployeeFormData } from '@shared/types';
import './NewEmployeeForm.css';

interface NewEmployeeFormProps {
  onSubmit: (formData: NewEmployeeFormData) => void;
  onCancel: () => void;
}

type FormSection = 'empleado' | 'contrato';

const DOCUMENTO_OPTIONS: Array<NewEmployeeFormData['tipoDocumento']> = ['DNI', 'CE'];
const NACIONALIDAD_OPTIONS: Array<NewEmployeeFormData['nacionalidad']> = ['PERUANO', 'EXTRANJERO'];
const ESTADO_CIVIL_OPTIONS: Array<NewEmployeeFormData['estadoCivil']> = ['SOLTERO', 'CASADO', 'VIUDO', 'DIVORCIADO'];
const ORIGEN_OPTIONS: Array<NewEmployeeFormData['origen']> = ['COMPUTRABAJO', 'INDEED', 'TIKTOK', 'FACEBOOK', 'LINKEDIN', 'REFERIDO'];
const DISTRITO_OPTIONS: string[] = [
  'ANCON',
  'ATE',
  'BARRANCO',
  'BELLAVISTA',
  'BRENA',
  'CALLAO',
  'CARABAYLLO',
  'CARMEN_DE_LA_LEGUA',
  'CERCADO_DE_LIMA',
  'CHACLACAYO',
  'CHORRILLOS',
  'CIENEGUILLA',
  'COMAS',
  'EL_AGUSTINO',
  'INDEPENDENCIA',
  'JESUS_MARIA',
  'LA_MOLINA',
  'LA_PUNTA',
  'LA_PERLA',
  'LA_VICTORIA',
  'LINCE',
  'LOS_OLIVOS',
  'LURIN',
  'LURIGANCHO',
  'MAGDALENA_DEL_MAR',
  'MIRAFLORES',
  'MI_PERU',
  'PACHACAMAC',
  'PUCUSANA',
  'PUEBLO_LIBRE',
  'PUENTE_PIEDRA',
  'PUNTA_HERMOSA',
  'PUNTA_NEGRA',
  'RIMAC',
  'SAN_BARTOLO',
  'SAN_BORJA',
  'SAN_ISIDRO',
  'SAN_JUAN_DE_LURIGANCHO',
  'SAN_JUAN_DE_MIRAFLORES',
  'SAN_LUIS',
  'SAN_MARTIN_DE_PORRES',
  'SAN_MIGUEL',
  'SANTA_ANITA',
  'SANTA_MARIA_DEL_MAR',
  'SANTA_ROSA',
  'SANTIAGO_DE_SURCO',
  'SURQUILLO',
  'VENTANILLA',
  'VILLA_EL_SALVADOR',
  'VILLA_MARIA_DEL_TRIUNFO',
];
const BANCO_OPTIONS: Array<NewEmployeeFormData['banco']> = [
  'BCP',
  'BBVA',
  'INTERBANK',
  'SCOTIABANK',
  'BANCO_DE_LA_NACION',
];
const PARENTESCO_OPTIONS: Array<NewEmployeeFormData['parentesco']> = [
  'PADRE',
  'MADRE',
  'TIO',
  'ESPOSO',
  'HERMANO',
  'ABUELO',
  'PAREJA',
  'OTRO',
];

const PUESTO_TRABAJO_OPTIONS: string[] = [
  'ADMINISTRADOR',
  'RRHH',
  'RECLUTADOR',
  'CAPACITADOR',
  'DESARROLLADOR',
  'CONTADOR',
  'COMMUNITY',
  'MONITOR',
  'SUPERVISOR_VENTAS',
  'ASESOR_VENTAS',
  'SUPERVISOR_BACKOFFICE',
  'ASESOR_BACKOFFICE',
  'SUPERVISOR_GTR',
  'ASESOR_GTR',
  'SUPERVISOR_POSTVENTA',
  'ASESOR_POSTVENTA',
];

const REGIMEN_OPTIONS: Array<NewEmployeeFormData['regimen']> = ['RECIBO_POR_HONORARIOS', 'PLANILLA'];
const MODALIDAD_OPTIONS: Array<NewEmployeeFormData['modalidad']> = ['PART_TIME', 'FULL_TIME', 'SEMI_FULL', 'SUPER_FULL'];
const SEGURO_OPTIONS: Array<NewEmployeeFormData['seguroSalud']> = ['SIS', 'ESSALUD'];
const PENSION_OPTIONS: Array<NewEmployeeFormData['sistemaPensiones']> = [
  'ONP',
  'AFP_INTEGRA',
  'AFP_PROFUTURO',
  'AFP_HABITAT',
  'PRIMA_AFP',
];

const initialFormData: NewEmployeeFormData = {
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
  cuentaPropia: true,
  parentesco: 'OTRO',
  celularTransferencia: '',
  idEmpresaContratista: '',
  idPostulacion: '',
  puestoTrabajo: '',
  regimen: 'PLANILLA',
  modalidad: 'FULL_TIME',
  seguroSalud: 'ESSALUD',
  sistemaPensiones: 'ONP',
  sueldoBase: '',
  fechaInicio: '',
  fechaFin: '',
};

const formatEnumLabel = (value: string): string =>
  value
    .toLowerCase()
    .split('_')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');

const normalizeDigits = (value: string): string => value.replace(/\D/g, '');

const parseIntegerField = (value: string): number | '' => {
  const normalized = normalizeDigits(value);
  if (!normalized) {
    return '';
  }
  return Number(normalized);
};

const parseDecimalField = (value: string): number | '' => {
  if (!value.trim()) {
    return '';
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? '' : parsed;
};

export const NewEmployeeForm = ({ onSubmit, onCancel }: NewEmployeeFormProps) => {
  const [activeSection, setActiveSection] = useState<FormSection>('empleado');
  const [formData, setFormData] = useState<NewEmployeeFormData>(initialFormData);
  const [formError, setFormError] = useState<string | null>(null);
  const [empresasContratistas, setEmpresasContratistas] = useState<EmpresaContratista[]>([]);
  const [empresasError, setEmpresasError] = useState<string | null>(null);

  useEffect(() => {
    const loadEmpresas = async () => {
      try {
        const empresas = await getEmpresasContratistas();
        const activas = empresas.filter((empresa) => empresa.activo);
        setEmpresasContratistas(activas);
        setFormData((prev) => {
          if (prev.idEmpresaContratista !== '' || activas.length === 0) return prev;
          const firstEmpresaId = activas[0]?.id ?? prev.idEmpresaContratista;
          return { ...prev, idEmpresaContratista: Number(firstEmpresaId) };
        });
      } catch {
        setEmpresasError('No se pudieron cargar las empresas contratistas.');
      }
    };

    loadEmpresas();
  }, []);

  const updateField = <K extends keyof NewEmployeeFormData>(field: K, value: NewEmployeeFormData[K]) => {
    setFormData((prev) => {
      if (field === 'cuentaPropia') {
        return {
          ...prev,
          cuentaPropia: value as boolean,
          // Si cuenta propia = true, parentesco no aplica → omitir del payload
          parentesco: value === true ? 'OTRO' : prev.parentesco,
        } as NewEmployeeFormData;
      }
      return { ...prev, [field]: value };
    });
  };

  const validateEmpleadoRequest = (): string | null => {
    if (!formData.nombres?.trim()) return 'nombres es obligatorio';
    if (!formData.apellidos?.trim()) return 'apellidos es obligatorio';
    if (!formData.tipoDocumento) return 'tipoDocumento es obligatorio';
    if (!formData.numeroDocumento?.trim()) return 'numeroDocumento es obligatorio';
    if (!formData.nacionalidad) return 'nacionalidad es obligatorio';
    if (!formData.fechaNacimiento) return 'fechaNacimiento es obligatorio';
    if (!formData.estadoCivil) return 'estadoCivil es obligatorio';
    if (!formData.celularPersonal.trim()) return 'celularPersonal es obligatorio';
    if (!formData.correoPersonal.trim()) return 'correoPersonal es obligatorio';
    if (!formData.origen) return 'origen es obligatorio';
    if (!formData.distrito) return 'distrito es obligatorio';
    if (!formData.direccion.trim()) return 'direccion es obligatorio';
    if (!formData.banco) return 'banco es obligatorio';
    if (!formData.cuentaBancaria.trim()) return 'cuentaBancaria es obligatorio';
    if (!formData.cuentaInterbancaria.trim()) return 'cuentaInterbancaria es obligatorio';
    if (formData.idEmpresaContratista === '' || Number(formData.idEmpresaContratista) <= 0) {
      return 'idEmpresaContratista debe ser mayor a 0';
    }
    return null;
  };

  const validateContratoRequest = (): string | null => {
    if (!formData.puestoTrabajo) return 'puestoTrabajo es obligatorio';
    if (!formData.regimen) return 'regimen es obligatorio';
    if (!formData.modalidad) return 'modalidad es obligatorio';
    if (formData.regimen !== 'RECIBO_POR_HONORARIOS') {
      if (!formData.seguroSalud) return 'seguroSalud es obligatorio';
      if (!formData.sistemaPensiones) return 'sistemaPensiones es obligatorio';
    }
    if (formData.sueldoBase === '' || Number(formData.sueldoBase) < 0) {
      return 'sueldoBase debe ser mayor o igual a 0';
    }
    if (!formData.fechaInicio) return 'fechaInicio es obligatorio';
    if (formData.fechaFin && formData.fechaFin < formData.fechaInicio) {
      return 'fechaFin no puede ser menor que fechaInicio';
    }
    return null;
  };

  const handleGoToContrato = () => {
    const error = validateEmpleadoRequest();
    if (error) {
      setFormError(error);
      return;
    }
    setFormError(null);
    setActiveSection('contrato');
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const employeeError = validateEmpleadoRequest();
    if (employeeError) {
      setFormError(employeeError);
      setActiveSection('empleado');
      return;
    }

    const contractError = validateContratoRequest();
    if (contractError) {
      setFormError(contractError);
      setActiveSection('contrato');
      return;
    }

    setFormError(null);
    onSubmit(formData);
  };

  return (
    <form className="admin-employee-modal-form" onSubmit={handleSubmit}>
      <div className="admin-employee-modal-tabs" role="tablist" aria-label="Esquemas de registro">
        <button
          type="button"
          role="tab"
          aria-selected={activeSection === 'empleado'}
          className={`admin-employee-tab ${activeSection === 'empleado' ? 'active' : ''}`}
          onClick={() => setActiveSection('empleado')}
        >
          1. Registrar Empleado
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeSection === 'contrato'}
          className={`admin-employee-tab ${activeSection === 'contrato' ? 'active' : ''}`}
          onClick={() => setActiveSection('contrato')}
        >
          2. Registrar Contrato
        </button>
      </div>

      {activeSection === 'empleado' && (
        <section className="admin-employee-section" role="tabpanel">
          <div className="admin-employee-section-head">
            <h4>Registrar Empleado</h4>
          </div>

          <div className="admin-employee-grid">
            <div className="admin-employee-field">
              <label>nombres</label>
              <input value={formData.nombres} onChange={(event) => updateField('nombres', event.target.value)} />
            </div>

            <div className="admin-employee-field">
              <label>apellidos</label>
              <input value={formData.apellidos} onChange={(event) => updateField('apellidos', event.target.value)} />
            </div>

            <div className="admin-employee-field">
              <label>TIPO DE DOCUMENTO</label>
              <select value={formData.tipoDocumento} onChange={(event) => updateField('tipoDocumento', event.target.value as NewEmployeeFormData['tipoDocumento'])}>
                {DOCUMENTO_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="admin-employee-field">
              <label>NÚMERO DE DOCUMENTO</label>
              <input value={formData.numeroDocumento} onChange={(event) => updateField('numeroDocumento', normalizeDigits(event.target.value))} inputMode="numeric" />
            </div>

            <div className="admin-employee-field">
              <label>nacionalidad</label>
              <select value={formData.nacionalidad} onChange={(event) => updateField('nacionalidad', event.target.value as NewEmployeeFormData['nacionalidad'])}>
                {NACIONALIDAD_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="admin-employee-field">
              <label>FECHA DE NACIMIENTO</label>
              <FlatpickrDateInput
                value={formData.fechaNacimiento}
                onChange={(value) => updateField('fechaNacimiento', value)}
                placeholder="dd/mm/aaaa"
                maxDate={new Date()}
              />
            </div>

            <div className="admin-employee-field">
              <label>ESTADO CIVIL</label>
              <select value={formData.estadoCivil} onChange={(event) => updateField('estadoCivil', event.target.value as NewEmployeeFormData['estadoCivil'])}>
                {ESTADO_CIVIL_OPTIONS.map((option) => (
                  <option key={option} value={option}>{formatEnumLabel(option)}</option>
                ))}
              </select>
            </div>

            <div className="admin-employee-field">
              <label>¿TIENE HIJOS?</label>
              <select value={String(formData.tieneHijos)} onChange={(event) => updateField('tieneHijos', event.target.value === 'true')}>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>

            <div className="admin-employee-field">
              <label>CELULAR PERSONAL</label>
              <input value={formData.celularPersonal} onChange={(event) => updateField('celularPersonal', normalizeDigits(event.target.value))} inputMode="numeric" />
            </div>

            <div className="admin-employee-field">
              <label>CORREO PERSONAL</label>
              <input type="email" value={formData.correoPersonal} onChange={(event) => updateField('correoPersonal', event.target.value)} />
            </div>

            <div className="admin-employee-field">
              <label>origen</label>
              <select value={formData.origen} onChange={(event) => updateField('origen', event.target.value as NewEmployeeFormData['origen'])}>
                {ORIGEN_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="admin-employee-field">
              <label>distrito</label>
              <select value={formData.distrito} onChange={(event) => updateField('distrito', event.target.value)}>
                <option value="">Selecciona distrito</option>
                {DISTRITO_OPTIONS.map((option) => (
                  <option key={option} value={option}>{formatEnumLabel(option)}</option>
                ))}
              </select>
            </div>

            <div className="admin-employee-field admin-employee-field-full">
              <label>direccion</label>
              <input value={formData.direccion} onChange={(event) => updateField('direccion', event.target.value)} />
            </div>

            <div className="admin-employee-field">
              <label>banco</label>
              <select value={formData.banco} onChange={(event) => updateField('banco', event.target.value as NewEmployeeFormData['banco'])}>
                {BANCO_OPTIONS.map((option) => (
                  <option key={option} value={option}>{formatEnumLabel(option)}</option>
                ))}
              </select>
            </div>

            <div className="admin-employee-field">
              <label>cuenta Bancaria</label>
              <input value={formData.cuentaBancaria} onChange={(event) => updateField('cuentaBancaria', normalizeDigits(event.target.value))} inputMode="numeric" />
            </div>

            <div className="admin-employee-field">
              <label>cuenta Interbancaria</label>
              <input value={formData.cuentaInterbancaria} onChange={(event) => updateField('cuentaInterbancaria', normalizeDigits(event.target.value))} inputMode="numeric" />
            </div>

            <div className="admin-employee-field">
              <label>cuenta Propia</label>
              <select value={String(formData.cuentaPropia)} onChange={(event) => updateField('cuentaPropia', event.target.value === 'true')}>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>

            {!formData.cuentaPropia && (
              <div className="admin-employee-field">
                <label>parentesco</label>
                <select value={formData.parentesco} onChange={(event) => updateField('parentesco', event.target.value as NewEmployeeFormData['parentesco'])}>
                  {PARENTESCO_OPTIONS.map((option) => (
                    <option key={option} value={option}>{formatEnumLabel(option)}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="admin-employee-field">
              <label>celular de Transferencia</label>
              <input value={formData.celularTransferencia} onChange={(event) => updateField('celularTransferencia', normalizeDigits(event.target.value))} inputMode="numeric" />
            </div>

            <div className="admin-employee-field">
              <label>Empresa Contratista</label>
              <select
                value={formData.idEmpresaContratista}
                disabled={empresasContratistas.length === 0}
                onChange={(event) => updateField('idEmpresaContratista', parseIntegerField(event.target.value))}
              >
                <option value="">Selecciona empresa contratista</option>
                {empresasContratistas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nombre}
                  </option>
                ))}
              </select>
              {empresasError && <span className="admin-employee-error">{empresasError}</span>}
            </div>
          </div>
        </section>
      )}

      {activeSection === 'contrato' && (
        <section className="admin-employee-section" role="tabpanel">
          <div className="admin-employee-section-head">
            <h4>Registrar Contrato</h4>
          </div>

          <div className="admin-employee-grid">

            <div className="admin-employee-field">
              <label>PUESTO DE TRABAJO</label>
              <select value={formData.puestoTrabajo} onChange={(event) => updateField('puestoTrabajo', event.target.value)}>
                <option value="">Selecciona puesto</option>
                {PUESTO_TRABAJO_OPTIONS.map((option) => (
                  <option key={option} value={option}>{formatEnumLabel(option)}</option>
                ))}
              </select>
            </div>

            <div className="admin-employee-field">
              <label>REGIMEN</label>
              <select value={formData.regimen} onChange={(event) => updateField('regimen', event.target.value as NewEmployeeFormData['regimen'])}>
                {REGIMEN_OPTIONS.map((option) => (
                  <option key={option} value={option}>{formatEnumLabel(option)}</option>
                ))}
              </select>
            </div>

            <div className="admin-employee-field">
              <label>MODALIDAD</label>
              <select value={formData.modalidad} onChange={(event) => updateField('modalidad', event.target.value as NewEmployeeFormData['modalidad'])}>
                {MODALIDAD_OPTIONS.map((option) => (
                  <option key={option} value={option}>{formatEnumLabel(option)}</option>
                ))}
              </select>
            </div>

            {formData.regimen !== 'RECIBO_POR_HONORARIOS' && (
              <>
                <div className="admin-employee-field">
                  <label>SEGURO DE SALUD</label>
                  <select value={formData.seguroSalud} onChange={(event) => updateField('seguroSalud', event.target.value as NewEmployeeFormData['seguroSalud'])}>
                    {SEGURO_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="admin-employee-field">
                  <label>SISTEMA DE PENSIÓN</label>
                  <select value={formData.sistemaPensiones} onChange={(event) => updateField('sistemaPensiones', event.target.value as NewEmployeeFormData['sistemaPensiones'])}>
                    {PENSION_OPTIONS.map((option) => (
                      <option key={option} value={option}>{formatEnumLabel(option)}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="admin-employee-field">
              <label>SUELDO BASE</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={formData.sueldoBase}
                onChange={(event) => updateField('sueldoBase', parseDecimalField(event.target.value))}
              />
            </div>

            <div className="admin-employee-field">
              <label>FECHA INICIO</label>
              <FlatpickrDateInput
                value={formData.fechaInicio}
                onChange={(value) => updateField('fechaInicio', value)}
                placeholder="dd/mm/aaaa"
              />
            </div>

            <div className="admin-employee-field">
              <label>FECHA FIN</label>
              <FlatpickrDateInput
                value={formData.fechaFin}
                onChange={(value) => updateField('fechaFin', value)}
                minDate={formData.fechaInicio || undefined}
                placeholder="dd/mm/aaaa"
              />
            </div>
          </div>
        </section>
      )}

      {formError && <div className="admin-employee-error">{formError}</div>}

      <div className="admin-employee-actions">
        <button type="button" className="admin-employee-btn secondary" onClick={onCancel}>Cancelar</button>

        {activeSection === 'contrato' && (
          <button type="button" className="admin-employee-btn ghost" onClick={() => setActiveSection('empleado')}>
            Volver
          </button>
        )}

        {activeSection === 'empleado' ? (
          <button type="button" className="admin-employee-btn primary" onClick={handleGoToContrato}>
            Siguiente: Contrato
          </button>
        ) : (
          <button type="submit" className="admin-employee-btn primary">
            Registrar empleado y contrato
          </button>
        )}
      </div>
    </form>
  );
};
