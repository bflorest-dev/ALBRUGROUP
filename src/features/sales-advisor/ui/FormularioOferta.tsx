import React, { FormEvent, useState } from 'react';
import { useActualizarOfertaMutation } from '../hooks';

interface FormularioOfertaProps {
  idLead: number;
  onSuccess: () => void;
}

/**
 * Formulario para actualizar oferta comercial
 * Endpoint: PATCH /leads/{idLead}/oferta-comercial
 */
export const FormularioOferta: React.FC<FormularioOfertaProps> = ({ idLead, onSuccess }) => {
  const [form, setForm] = useState({
    idPlan: '',
    idPromocion: '',
    precioNegoziado: '',
    condiciones: '',
  });

  const { mutate, isPending, error } = useActualizarOfertaMutation();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.idPlan) {
      alert('Seleccione un plan');
      return;
    }

    const payload = {
      idPlan: Number(form.idPlan),
      ...(form.idPromocion && { idPromocion: Number(form.idPromocion) }),
      ...(form.precioNegoziado && { precioNegoziado: Number(form.precioNegoziado) }),
      ...(form.condiciones && { condiciones: form.condiciones }),
    };

    mutate(
      { idLead, payload },
      {
        onSuccess: () => {
          alert('Oferta actualizada exitosamente');
          onSuccess();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Plan Comercial</label>
        <select
          value={form.idPlan}
          onChange={(e) => setForm({ ...form, idPlan: e.target.value })}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Seleccione Plan --</option>
          <option value="1">Plan Básico - $99/mes</option>
          <option value="2">Plan Plus - $199/mes</option>
          <option value="3">Plan Premium - $299/mes</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Promoción (opcional)
        </label>
        <select
          value={form.idPromocion}
          onChange={(e) => setForm({ ...form, idPromocion: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Sin Promoción --</option>
          <option value="1">Descuento 10%</option>
          <option value="2">Descuento 20%</option>
          <option value="3">Primer mes gratis</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Precio Negociado (opcional)
        </label>
        <input
          type="number"
          step="0.01"
          value={form.precioNegoziado}
          onChange={(e) => setForm({ ...form, precioNegoziado: e.target.value })}
          placeholder="0.00"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Condiciones (opcional)
        </label>
        <textarea
          value={form.condiciones}
          onChange={(e) => setForm({ ...form, condiciones: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Términos y condiciones especiales..."
        />
      </div>

      {error && <div className="text-red-600 text-sm">Error al actualizar oferta</div>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium transition"
      >
        {isPending ? 'Guardando...' : 'Actualizar Oferta'}
      </button>
    </form>
  );
};