import React, { FormEvent, useState } from 'react';
import { useRegistrarContactoMutation } from '../hooks';
import type { ContactoRequest } from '../model';
import { FlatpickrDateInput } from '@shared/ui/date-picker';

interface FormularioContactoProps {
  idLead: number;
  onSuccess: () => void;
}

/**
 * Formulario para registrar contacto
 * Endpoint: POST /leads/{idLead}/contacto
 */
export const FormularioContacto: React.FC<FormularioContactoProps> = ({ idLead, onSuccess }) => {
  const [form, setForm] = useState<ContactoRequest>({
    fecha: new Date().toISOString().split('T')[0] as string,
    hora: '09:00',
    resultado: 'EXITOSO',
    notas: '',
  });

  const { mutate, isPending, error } = useRegistrarContactoMutation();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload: ContactoRequest = {
      fecha: form.fecha,
      hora: form.hora,
      resultado: form.resultado,
      notas: form.notas,
    };
    mutate(
      { idLead, payload },
      {
        onSuccess: () => {
          alert('Contacto registrado exitosamente');
          onSuccess();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha</label>
        <FlatpickrDateInput
          value={form.fecha}
          onChange={(value) => setForm({ ...form, fecha: value })}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Hora</label>
        <input
          type="time"
          value={form.hora}
          onChange={(e) => setForm({ ...form, hora: e.target.value })}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Resultado</label>
        <select
          value={form.resultado}
          onChange={(e) => {
            const value = e.target.value as 'EXITOSO' | 'NO_CONTESTO' | 'OCUPADO' | 'OTRO';
            setForm({ ...form, resultado: value });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="EXITOSO">Exitoso</option>
          <option value="NO_CONTESTO">No Contestó</option>
          <option value="OCUPADO">Ocupado</option>
          <option value="OTRO">Otro</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Notas</label>
        <textarea
          value={form.notas}
          onChange={(e) => setForm({ ...form, notas: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Detalles del contacto..."
        />
      </div>

      {error && <div className="text-red-600 text-sm">Error al registrar contacto</div>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition"
      >
        {isPending ? 'Guardando...' : 'Registrar Contacto'}
      </button>
    </form>
  );
};