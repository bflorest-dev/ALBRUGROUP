import React, { useEffect, useMemo, useState } from 'react';
import { LeadsRepository } from '@shared/api/repositories/leads.repository';
import type { AdicionalResponse, PlanRequest, ProveedorResponse } from '@shared/types';
import { FlatpickrDateInput } from '@shared/ui/date-picker';

interface AdicionalInput {
  idAdicional: number | '';
  cantidadIncluida: string;
  permiteCompraAdicional: boolean;
  cantidadMaximaAdicional: string;
  precioUnitarioAdicional: string;
}

interface PlanFormProps {
  proveedores: ProveedorResponse[];
  onCreatePlan: (payload: PlanRequest) => Promise<unknown>;
  onCreated?: () => void;
}

export const PlanForm: React.FC<PlanFormProps> = ({ proveedores, onCreatePlan, onCreated }) => {
  const [idProveedor, setIdProveedor] = useState<number | ''>('');
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [vigenciaDesde, setVigenciaDesde] = useState('');
  const [vigenciaHasta, setVigenciaHasta] = useState('');

  const [internetEnabled, setInternetEnabled] = useState(false);
  const [internetVelocidad, setInternetVelocidad] = useState('');
  const [internetUnidad, setInternetUnidad] = useState<'MBPS' | 'GBPS'>('MBPS');
  const [internetTecnologia, setInternetTecnologia] = useState<'HFC' | 'FTTH' | 'ADSL'>('HFC');

  const [televisionEnabled, setTelevisionEnabled] = useState(false);
  const [televisionNombre, setTelevisionNombre] = useState('');
  const [televisionCantidadCanales, setTelevisionCantidadCanales] = useState('');

  const [telefonoEnabled, setTelefonoEnabled] = useState(false);
  const [telefonoMinutos, setTelefonoMinutos] = useState('');
  const [telefonoDescripcion, setTelefonoDescripcion] = useState('');

  const [adicionalesOpciones, setAdicionalesOpciones] = useState<AdicionalResponse[]>([]);
  const [adicionales, setAdicionales] = useState<AdicionalInput[]>([]);

  const [loading, setLoading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedProveedor = useMemo(
    () => proveedores.find((p) => p.id === idProveedor) ?? null,
    [idProveedor, proveedores],
  );

  useEffect(() => {
    if (idProveedor === '') {
      setAdicionalesOpciones([]);
      return;
    }

    const loadAdicionales = async () => {
      try {
        const data = await LeadsRepository.getAdicionales(idProveedor as number);
        setAdicionalesOpciones(data || []);
      } catch (err) {
        console.error('[PlanForm] Error fetching adicionales:', err);
        setAdicionalesOpciones([]);
      }
    };

    const handleAdicionalCreado = (event: Event) => {
      const detail = (event as CustomEvent).detail as AdicionalResponse | undefined;
      if (detail?.idProveedor === idProveedor) {
        void loadAdicionales();
      }
    };

    loadAdicionales();
    window.addEventListener('adicional-creado', handleAdicionalCreado as EventListener);
    return () => {
      window.removeEventListener('adicional-creado', handleAdicionalCreado as EventListener);
    };
  }, [idProveedor]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!idProveedor) {
      newErrors.idProveedor = 'Proveedor es requerido';
    }

    if (!nombre.trim()) newErrors.nombre = 'Nombre es requerido';

    const precioNum = Number(precio);
    if (!precio.trim()) {
      newErrors.precio = 'Precio es requerido';
    } else if (Number.isNaN(precioNum) || precioNum <= 0) {
      newErrors.precio = 'Precio debe ser un número mayor a 0';
    }

    if (!vigenciaDesde) newErrors.vigenciaDesde = 'Fecha desde es requerida';
    if (vigenciaDesde && vigenciaHasta && vigenciaDesde > vigenciaHasta) {
      newErrors.vigenciaHasta = 'Fecha hasta debe ser mayor o igual a vigencia desde';
    }

    if (internetEnabled) {
      const velocidadNum = Number(internetVelocidad);
      if (!internetVelocidad.trim()) newErrors.internetVelocidad = 'Velocidad internet requerida';
      else if (Number.isNaN(velocidadNum) || velocidadNum <= 0) newErrors.internetVelocidad = 'Velocidad debe ser un número mayor a 0';
    }

    if (televisionEnabled) {
      if (!televisionNombre.trim()) newErrors.televisionNombre = 'Nombre TV requerido';
      const canalesNum = Number(televisionCantidadCanales);
      if (!televisionCantidadCanales.trim()) newErrors.televisionCantidadCanales = 'Cantidad de canales requerida';
      else if (Number.isNaN(canalesNum) || canalesNum <= 0) newErrors.televisionCantidadCanales = 'Cantidad de canales debe ser un número mayor a 0';
    }

    if (telefonoEnabled) {
      const minutosNum = Number(telefonoMinutos);
      if (!telefonoMinutos.trim()) newErrors.telefonoMinutos = 'Minutos requeridos';
      else if (Number.isNaN(minutosNum) || minutosNum < 0) newErrors.telefonoMinutos = 'Minutos debe ser un número válido';
      if (!telefonoDescripcion.trim()) newErrors.telefonoDescripcion = 'Descripción requerida';
    }

    adicionales.forEach((item, index) => {
      if (!item.idAdicional) {
        newErrors[`adicionales.${index}.idAdicional`] = 'Adicional requerido';
      }
      const cantidadIncluidaNum = Number(item.cantidadIncluida);
      if (!item.cantidadIncluida.trim() || Number.isNaN(cantidadIncluidaNum) || cantidadIncluidaNum < 0) {
        newErrors[`adicionales.${index}.cantidadIncluida`] = 'Cantidad incluida inválida';
      }
      const cantidadMaximaNum = Number(item.cantidadMaximaAdicional);
      if (!item.cantidadMaximaAdicional.trim() || Number.isNaN(cantidadMaximaNum) || cantidadMaximaNum < 0) {
        newErrors[`adicionales.${index}.cantidadMaximaAdicional`] = 'Cantidad máxima inválida';
      } else if (cantidadMaximaNum < cantidadIncluidaNum) {
        newErrors[`adicionales.${index}.cantidadMaximaAdicional`] = 'Cantidad máxima debe ser >= cantidad incluida';
      }
      const precioUnitNum = Number(item.precioUnitarioAdicional);
      if (!item.precioUnitarioAdicional.trim() || Number.isNaN(precioUnitNum) || precioUnitNum < 0) {
        newErrors[`adicionales.${index}.precioUnitarioAdicional`] = 'Precio unitario inválido';
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setGlobalMessage('❌ Por favor corrige los errores del formulario.');
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setIdProveedor('');
    setNombre('');
    setPrecio('');
    setVigenciaDesde('');
    setVigenciaHasta('');
    setInternetEnabled(false);
    setInternetVelocidad('');
    setInternetUnidad('MBPS');
    setInternetTecnologia('HFC');
    setTelevisionEnabled(false);
    setTelevisionNombre('');
    setTelevisionCantidadCanales('');
    setTelefonoEnabled(false);
    setTelefonoMinutos('');
    setTelefonoDescripcion('');
    setAdicionales([]);
    setErrors({});
    setGlobalMessage('');
  };

  const handleAddAdicional = () => {
    setAdicionales((prev) => [
      ...prev,
      {
        idAdicional: '',
        cantidadIncluida: '',
        permiteCompraAdicional: false,
        cantidadMaximaAdicional: '',
        precioUnitarioAdicional: '',
      },
    ]);
  };

  const handleRemoveAdicional = (index: number) => {
    setAdicionales((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAdicionalChange = (
    index: number,
    field: keyof AdicionalInput,
    value: string | boolean | number,
  ) => {
    setAdicionales((prev) =>
      prev.map((item, idx) =>
        idx !== index
          ? item
          : {
              ...item,
              [field]: value,
            },
      ),
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) return;

    const payload: PlanRequest = {
      idProveedor: Number(idProveedor),
      nombre: nombre.trim(),
      precio: Number(precio),
      vigenciaDesde,
      vigenciaHasta,
      ...(internetEnabled
        ? {
            internet: {
              velocidad: Number(internetVelocidad),
              unidad: internetUnidad,
              tecnologia: internetTecnologia,
            },
          }
        : {}),
      ...(televisionEnabled
        ? {
            television: {
              nombre: televisionNombre.trim(),
              cantidadCanales: Number(televisionCantidadCanales),
            },
          }
        : {}),
      ...(telefonoEnabled
        ? {
            telefono: {
              minutos: Number(telefonoMinutos),
              descripcion: telefonoDescripcion.trim(),
            },
          }
        : {}),
      adicionales: adicionales.length
        ? adicionales.map((item) => ({
            idAdicional: Number(item.idAdicional),
            cantidadIncluida: Number(item.cantidadIncluida),
            permiteCompraAdicional: item.permiteCompraAdicional,
            cantidadMaximaAdicional: Number(item.cantidadMaximaAdicional),
            precioUnitarioAdicional: Number(item.precioUnitarioAdicional),
          }))
        : undefined,
    };

    setLoading(true);
    setGlobalMessage('');
    try {
      await onCreatePlan(payload);
      setGlobalMessage('✅ Plan creado correctamente');
      resetForm();
    } catch (error: any) {
      console.error('[PlanForm] create plan error', error);
      if (error?.message?.includes('401')) {
        setGlobalMessage('🔐 Token inválido o expirado');
      } else if (error?.message?.includes('400')) {
        setGlobalMessage('⚠️ Error de validación desde el servidor');
      } else if (error?.message?.includes('403')) {
        setGlobalMessage('🚫 Permiso denegado');
      } else {
        setGlobalMessage('💥 Error al crear el plan. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="community-form">
      <h3>Crear Plan</h3>

      {globalMessage && (
        <div className={`${globalMessage.startsWith('✅') ? 'community-alert' : 'community-error'} community-message`}>
          {globalMessage}
        </div>
      )}

      <div className="community-field">
        <label>Proveedor*</label>
        <select
          value={idProveedor}
          onChange={(e) => setIdProveedor(Number(e.target.value) as number | '')}
          disabled={loading}
        >
          <option value="">Selecciona proveedor</option>
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
        {errors.idProveedor && <small>{errors.idProveedor}</small>}
      </div>

      <div className="community-field">
        <label>Nombre*</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          disabled={loading}
        />
        {errors.nombre && <small>{errors.nombre}</small>}
      </div>

      <div className="community-field">
        <label>Precio*</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          disabled={loading}
        />
        {errors.precio && <small>{errors.precio}</small>}
      </div>

      <div className="community-grid-2">
        <div className="community-field">
          <label>Vigencia Desde*</label>
          <FlatpickrDateInput
            value={vigenciaDesde}
            onChange={setVigenciaDesde}
            disabled={loading}
            required
            hasError={Boolean(errors.vigenciaDesde)}
            showRequiredMessage={false}
          />
          {errors.vigenciaDesde && <small>{errors.vigenciaDesde}</small>}
        </div>
        <div className="community-field">
          <label>Vigencia Hasta</label>
          <FlatpickrDateInput
            value={vigenciaHasta}
            onChange={setVigenciaHasta}
            minDate={vigenciaDesde || undefined}
            disabled={loading}
            hasError={Boolean(errors.vigenciaHasta)}
            showRequiredMessage={false}
          />
          {errors.vigenciaHasta && <small>{errors.vigenciaHasta}</small>}
        </div>
      </div>

      <div>
        <label className="community-check-row">
          <input
            type="checkbox"
            checked={internetEnabled}
            onChange={(e) => setInternetEnabled(e.target.checked)}
            disabled={loading}
          />
          Incluir Internet
        </label>
      </div>
      {internetEnabled && (
        <div className="community-subcard muted">
          <div className="community-field">
            <label>Velocidad*</label>
            <input
              type="number"
              min="0"
              value={internetVelocidad}
              onChange={(e) => setInternetVelocidad(e.target.value)}
              disabled={loading}
            />
            {errors.internetVelocidad && <small>{errors.internetVelocidad}</small>}
          </div>

          <div className="community-grid-2">
            <div className="community-field">
              <label>Unidad*</label>
              <select
                value={internetUnidad}
                onChange={(e) => setInternetUnidad(e.target.value as 'MBPS' | 'GBPS')}
                disabled={loading}
              >
                <option value="MBPS">MBPS</option>
                <option value="GBPS">GBPS</option>
              </select>
            </div>
            <div className="community-field">
              <label>Tecnología*</label>
              <select
                value={internetTecnologia}
                onChange={(e) =>
                  setInternetTecnologia(e.target.value as 'HFC' | 'FTTH' | 'ADSL')
                }
                disabled={loading}
              >
                <option value="HFC">HFC</option>
                <option value="FTTH">FTTH</option>
                <option value="ADSL">ADSL</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="community-check-row">
          <input
            type="checkbox"
            checked={televisionEnabled}
            onChange={(e) => setTelevisionEnabled(e.target.checked)}
            disabled={loading}
          />
          Incluir Televisión
        </label>
      </div>
      {televisionEnabled && (
        <div className="community-subcard muted">
          <div className="community-field">
            <label>Nombre del paquete*</label>
            <input
              type="text"
              value={televisionNombre}
              onChange={(e) => setTelevisionNombre(e.target.value)}
              disabled={loading}
            />
            {errors.televisionNombre && <small>{errors.televisionNombre}</small>}
          </div>
          <div className="community-field">
            <label>Cantidad de canales*</label>
            <input
              type="number"
              min="0"
              value={televisionCantidadCanales}
              onChange={(e) => setTelevisionCantidadCanales(e.target.value)}
              disabled={loading}
            />
            {errors.televisionCantidadCanales && (
              <small>{errors.televisionCantidadCanales}</small>
            )}
          </div>
        </div>
      )}

      <div>
        <label className="community-check-row">
          <input
            type="checkbox"
            checked={telefonoEnabled}
            onChange={(e) => setTelefonoEnabled(e.target.checked)}
            disabled={loading}
          />
          Incluir Teléfono
        </label>
      </div>
      {telefonoEnabled && (
        <div className="community-subcard muted">
          <div className="community-field">
            <label>Minutos*</label>
            <input
              type="number"
              min="0"
              value={telefonoMinutos}
              onChange={(e) => setTelefonoMinutos(e.target.value)}
              disabled={loading}
            />
            {errors.telefonoMinutos && <small>{errors.telefonoMinutos}</small>}
          </div>
          <div className="community-field">
            <label>Descripción*</label>
            <input
              type="text"
              value={telefonoDescripcion}
              onChange={(e) => setTelefonoDescripcion(e.target.value)}
              disabled={loading}
            />
            {errors.telefonoDescripcion && <small>{errors.telefonoDescripcion}</small>}
          </div>
        </div>
      )}

      <div>
        <h4>Adicionales</h4>
        <button type="button" className="community-btn ghost community-block-bottom-sm" onClick={handleAddAdicional} disabled={loading}>
          + Agregar adicional
        </button>

        {adicionales.map((item, index) => (
          <div key={`adicional-${index}`} className="community-subcard community-subcard-stack">
            <div className="community-grid-3">
              <div className="community-field">
                <label>Adicional*</label>
                <select
                  value={item.idAdicional}
                  onChange={(e) => handleAdicionalChange(index, 'idAdicional', Number(e.target.value))}
                  disabled={loading}
                >
                  <option value="">Selecciona</option>
                  {adicionalesOpciones.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.nombre}
                    </option>
                  ))}
                </select>
                {errors[`adicionales.${index}.idAdicional`] && (
                  <small>{errors[`adicionales.${index}.idAdicional`]}</small>
                )}
              </div>

              <div className="community-field">
                <label>Cantidad incluida*</label>
                <input
                  type="number"
                  min="0"
                  value={item.cantidadIncluida}
                  onChange={(e) => handleAdicionalChange(index, 'cantidadIncluida', e.target.value)}
                  disabled={loading}
                />
                {errors[`adicionales.${index}.cantidadIncluida`] && (
                  <small>{errors[`adicionales.${index}.cantidadIncluida`]}</small>
                )}
              </div>

              <div className="community-field">
                <label className="community-check-row">Permite compra adicional</label>
                <input
                  type="checkbox"
                  checked={item.permiteCompraAdicional}
                  onChange={(e) => handleAdicionalChange(index, 'permiteCompraAdicional', e.target.checked)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="community-grid-2 community-block-top-sm">
              <div className="community-field">
                <label>Cantidad máxima*</label>
                <input
                  type="number"
                  min="0"
                  value={item.cantidadMaximaAdicional}
                  onChange={(e) => handleAdicionalChange(index, 'cantidadMaximaAdicional', e.target.value)}
                  disabled={loading}
                />
                {errors[`adicionales.${index}.cantidadMaximaAdicional`] && (
                  <small>{errors[`adicionales.${index}.cantidadMaximaAdicional`]}</small>
                )}
              </div>
              <div className="community-field">
                <label>Precio unitario*</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.precioUnitarioAdicional}
                  onChange={(e) => handleAdicionalChange(index, 'precioUnitarioAdicional', e.target.value)}
                  disabled={loading}
                />
                {errors[`adicionales.${index}.precioUnitarioAdicional`] && (
                  <small>{errors[`adicionales.${index}.precioUnitarioAdicional`]}</small>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleRemoveAdicional(index)}
              disabled={loading}
              className="community-btn ghost danger"
            >
              Eliminar adicional
            </button>
          </div>
        ))}
      </div>

      <div className="community-actions">
        <button type="submit" className="community-btn primary" disabled={loading}>
          {loading ? '⏳ Enviando...' : 'Crear Plan'}
        </button>
      </div>
    </form>
  );
};
