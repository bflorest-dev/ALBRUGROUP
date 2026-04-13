import React, { FormEvent, useState } from 'react';
import { useTipificarLeadMutation } from '../hooks';

interface FormularioTipificacionProps {
  idLead: number;
  onSuccess: () => void;
}

/**
 * Formulario para tipificar lead
 * Endpoint: POST /leads/{idLead}/tipificacion
 */
export const FormularioTipificacion: React.FC<FormularioTipificacionProps> = ({
  idLead,
  onSuccess,
}) => {
  const [form, setForm] = useState({
    codigoTipificacion: '',
    codigoSubtipificacion: '',
    motivo: '',
  });

  const { mutate, isPending, error } = useTipificarLeadMutation();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.codigoTipificacion) {
      alert('Seleccione una tipificación');
      return;
    }
    mutate(
      { idLead, payload: form },
      {
        onSuccess: () => {
          alert('Lead tipificado exitosamente');
          onSuccess();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Tipificación Principal
        </label>
        <select
          value={form.codigoTipificacion}
          onChange={(e) => setForm({ ...form, codigoTipificacion: e.target.value })}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Seleccione --</option>
          <option value="VENTA">Venta</option>
          <option value="NO_VENTA">No Venta</option>
          <option value="SEGUIMIENTO">Seguimiento</option>
          <option value="DESCARTADO">Descartado</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Subtipificación (opcional)
        </label>
        <input
          type="text"
          value={form.codigoSubtipificacion}
          onChange={(e) => setForm({ ...form, codigoSubtipificacion: e.target.value })}
          placeholder="Código de subtipificación"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Motivo</label>
        <textarea
          value={form.motivo}
          onChange={(e) => setForm({ ...form, motivo: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Motivo de la tipificación..."
        />
      </div>

      {error && <div className="text-red-600 text-sm">Error al tipificar lead</div>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-medium transition"
      >
        {isPending ? 'Guardando...' : 'Tipificar Lead'}
      </button>
    </form>
  );
};