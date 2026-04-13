import React, { FormEvent, useState } from 'react';
import { useActualizarDatosPreventaMutation } from '../hooks';
import { DocumentoEnum, DistritoEnum } from '@shared/types/backendEnums';
import { enumToOptions } from '@shared/utils/enumToOptions';

interface FormularioDatosPreventaProps {
  idLead: number;
  onSuccess: () => void;
}

/**
 * Formulario para actualizar datos de preventa (información personal del cliente)
 * Endpoint: PATCH /leads/{idLead}/datos-preventa
 * 
 * FSD: caracteristicas/asesor-ventas/ui
 * Contrato: LeadDatosPreventaRequest
 */
export const FormularioDatosPreventa: React.FC<FormularioDatosPreventaProps> = ({
  idLead,
  onSuccess,
}) => {
  const [form, setForm] = useState({
    tipoDocumento: 'DNI',
    numeroDocumentoTitularServicio: '',
    nombreTitularServicio: '',
    ubigeoNacimiento: '',
    celularRegistro: '',
    celularReferencia: '',
    correo: '',
    numeroDocumentoTitularCelularRegistro: '',
    nombreTitularCelularRegistro: '',
  });

  const { mutate, isPending, error } = useActualizarDatosPreventaMutation();

  // Generar opciones desde enums
  const tipoDocumentoOptions = enumToOptions(DocumentoEnum);
  const ubigeoNacimientoOptions = enumToOptions(DistritoEnum);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (
      !form.numeroDocumentoTitularServicio ||
      !form.nombreTitularServicio ||
      !form.celularRegistro ||
      !form.correo
    ) {
      alert('Completa los campos requeridos');
      return;
    }

    const payload = {
      tipoDocumento: form.tipoDocumento,
      numeroDocumentoTitularServicio: form.numeroDocumentoTitularServicio,
      nombreTitularServicio: form.nombreTitularServicio,
      celularRegistro: form.celularRegistro,
      correo: form.correo,
      ...(form.ubigeoNacimiento && { ubigeoNacimiento: form.ubigeoNacimiento }),
      ...(form.celularReferencia && { celularReferencia: form.celularReferencia }),
      ...(form.numeroDocumentoTitularCelularRegistro && { numeroDocumentoTitularCelularRegistro: form.numeroDocumentoTitularCelularRegistro }),
      ...(form.nombreTitularCelularRegistro && { nombreTitularCelularRegistro: form.nombreTitularCelularRegistro }),
    };

    mutate(
      { idLead, payload },
      {
        onSuccess: () => {
          alert('Datos de preventa actualizados exitosamente');
          onSuccess();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tipo de Documento + Número */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Tipo de Documento <span className="text-red-500">*</span>
          </label>
          <select
            value={form.tipoDocumento}
            onChange={(e) => setForm({ ...form, tipoDocumento: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {tipoDocumentoOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Número de Documento <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.numeroDocumentoTitularServicio}
            onChange={(e) => setForm({ ...form, numeroDocumentoTitularServicio: e.target.value })}
            placeholder="Ej: 1234567890"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Nombre Titular */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Nombre Titular <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.nombreTitularServicio}
          onChange={(e) => setForm({ ...form, nombreTitularServicio: e.target.value })}
          placeholder="Nombre completo del titular"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Ubicación Nacimiento - SELECT */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Lugar de Nacimiento (opcional)
        </label>
        <select
          value={form.ubigeoNacimiento}
          onChange={(e) => setForm({ ...form, ubigeoNacimiento: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Seleccione distrito --</option>
          {ubigeoNacimientoOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Celulares */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Celular Registro <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={form.celularRegistro}
            onChange={(e) => setForm({ ...form, celularRegistro: e.target.value })}
            placeholder="Ej: 3101234567"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Celular Referencia (opcional)
          </label>
          <input
            type="tel"
            value={form.celularReferencia}
            onChange={(e) => setForm({ ...form, celularReferencia: e.target.value })}
            placeholder="Ej: 3109876543"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Correo */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Correo <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={form.correo}
          onChange={(e) => setForm({ ...form, correo: e.target.value })}
          placeholder="correo@ejemplo.com"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Campos adicionales: Documento y Nombre del titular del celular de registro */}
      <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Documento Titular Celular Registro (opcional)
          </label>
          <input
            type="text"
            value={form.numeroDocumentoTitularCelularRegistro}
            onChange={(e) => setForm({ ...form, numeroDocumentoTitularCelularRegistro: e.target.value })}
            placeholder="Ej: 1234567890"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Nombre Titular Celular Registro (opcional)
          </label>
          <input
            type="text"
            value={form.nombreTitularCelularRegistro}
            onChange={(e) => setForm({ ...form, nombreTitularCelularRegistro: e.target.value })}
            placeholder="Nombre del titular"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {error && <div className="text-red-600 text-sm">Error al actualizar datos de preventa</div>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 font-medium transition"
      >
        {isPending ? 'Guardando...' : 'Guardar Datos Preventa'}
      </button>
    </form>
  );
};