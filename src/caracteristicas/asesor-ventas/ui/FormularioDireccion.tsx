import React, { FormEvent, useState } from 'react';
import { useActualizarDireccionMutation } from '../hooks';

interface FormularioDireccionProps {
  idLead: number;
  onSuccess: () => void;
}

/**
 * Formulario para actualizar dirección del cliente
 * Endpoint: PATCH /leads/{idLead}/direccion
 */
export const FormularioDireccion: React.FC<FormularioDireccionProps> = ({ idLead, onSuccess }) => {
  const [form, setForm] = useState({
    tipoVia: '',
    via: '',
    numero: '',
    departamento: '',
    ciudad: '',
    codigoPostal: '',
  });

  const { mutate, isPending, error } = useActualizarDireccionMutation();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.tipoVia || !form.via || !form.numero || !form.ciudad) {
      alert('Completa los campos requeridos');
      return;
    }

    const payload = {
      tipoVia: form.tipoVia,
      via: form.via,
      numero: form.numero,
      ciudad: form.ciudad,
      ...(form.departamento && { departamento: form.departamento }),
      ...(form.codigoPostal && { codigoPostal: form.codigoPostal }),
    };

    mutate(
      { idLead, payload },
      {
        onSuccess: () => {
          alert('Dirección actualizada exitosamente');
          onSuccess();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Vía</label>
        <select
          value={form.tipoVia}
          onChange={(e) => setForm({ ...form, tipoVia: e.target.value })}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Seleccione --</option>
          <option value="Calle">Calle</option>
          <option value="Carrera">Carrera</option>
          <option value="Avenida">Avenida</option>
          <option value="Transversal">Transversal</option>
          <option value="Diagonal">Diagonal</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Vía</label>
        <input
          type="text"
          value={form.via}
          onChange={(e) => setForm({ ...form, via: e.target.value })}
          placeholder="Ej: 5"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Número</label>
        <input
          type="text"
          value={form.numero}
          onChange={(e) => setForm({ ...form, numero: e.target.value })}
          placeholder="Ej: 45"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Departamento (opcional)
        </label>
        <input
          type="text"
          value={form.departamento}
          onChange={(e) => setForm({ ...form, departamento: e.target.value })}
          placeholder="Ej: 304"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Ciudad</label>
        <input
          type="text"
          value={form.ciudad}
          onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
          placeholder="Ej: Bogotá"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Código Postal (opcional)
        </label>
        <input
          type="text"
          value={form.codigoPostal}
          onChange={(e) => setForm({ ...form, codigoPostal: e.target.value })}
          placeholder="Ej: 110111"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && <div className="text-red-600 text-sm">Error al actualizar dirección</div>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-medium transition"
      >
        {isPending ? 'Guardando...' : 'Actualizar Dirección'}
      </button>
    </form>
  );
};