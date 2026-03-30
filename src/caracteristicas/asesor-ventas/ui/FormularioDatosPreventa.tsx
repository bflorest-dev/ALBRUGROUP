import React, { FormEvent, useState } from 'react';
import { useActualizarDatosPreventaMutation } from '../hooks';

interface FormularioDatosPreventaProps {
  idLead: number;
  onSuccess: () => void;
}

/**
 * Formulario para actualizar datos de preventa (información personal del cliente)
 * Endpoint: PATCH /leads/{idLead}/datos-preventa
 */
export const FormularioDatosPreventa: React.FC<FormularioDatosPreventaProps> = ({
  idLead,
  onSuccess,
}) => {
  const [form, setForm] = useState({
    nombreTitular: '',
    apellidoTitular: '',
    tipoDocumento: 'CC',
    numeroDocumento: '',
    celularRegistro: '',
    celularReferencia: '',
    correo: '',
    fechaNacimiento: '',
  });

  const { mutate, isPending, error } = useActualizarDatosPreventaMutation();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (
      !form.nombreTitular ||
      !form.apellidoTitular ||
      !form.numeroDocumento ||
      !form.celularRegistro ||
      !form.correo
    ) {
      alert('Completa los campos requeridos');
      return;
    }

    const payload = {
      nombreTitular: form.nombreTitular,
      apellidoTitular: form.apellidoTitular,
      tipoDocumento: form.tipoDocumento,
      numeroDocumento: form.numeroDocumento,
      celularRegistro: form.celularRegistro,
      correo: form.correo,
      ...(form.celularReferencia && { celularReferencia: form.celularReferencia }),
      ...(form.fechaNacimiento && { fechaNacimiento: form.fechaNacimiento }),
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label>
          <input
            type="text"
            value={form.nombreTitular}
            onChange={(e) => setForm({ ...form, nombreTitular: e.target.value })}
            placeholder="Nombre"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Apellido</label>
          <input
            type="text"
            value={form.apellidoTitular}
            onChange={(e) => setForm({ ...form, apellidoTitular: e.target.value })}
            placeholder="Apellido"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Tipo de Documento
          </label>
          <select
            value={form.tipoDocumento}
            onChange={(e) => setForm({ ...form, tipoDocumento: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="CC">Cédula de Ciudadanía</option>
            <option value="CE">Cédula de Extranjería</option>
            <option value="PP">Pasaporte</option>
            <option value="TI">Tarjeta de Identidad</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Número de Documento
          </label>
          <input
            type="text"
            value={form.numeroDocumento}
            onChange={(e) => setForm({ ...form, numeroDocumento: e.target.value })}
            placeholder="Ej: 1234567890"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Celular Registro
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

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Correo</label>
        <input
          type="email"
          value={form.correo}
          onChange={(e) => setForm({ ...form, correo: e.target.value })}
          placeholder="correo@ejemplo.com"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Fecha de Nacimiento (opcional)
        </label>
        <input
          type="date"
          value={form.fechaNacimiento}
          onChange={(e) => setForm({ ...form, fechaNacimiento: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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